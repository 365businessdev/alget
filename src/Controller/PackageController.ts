/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */

import * as vscode from 'vscode';

import { ALProject } from '../AL/ALProject';
import { OutputChannel } from '../Common/OutputChannel';
import { ALGetController } from './ALGetController';

import { IPackageSource } from '../Package/PackageSource/IPackageSource';
import { WorkspaceClient } from '../Package/PackageSource/Workspace/WorkspaceClient';
import { CustomFeed } from '../Package/PackageSource/NuGet/CustomFeed';
import { AppSourcePackageSource } from '../Package/PackageSource/NuGet/MSFT/AppSourcePackageSource';
import { MSAppsPackageSource } from '../Package/PackageSource/NuGet/MSFT/MSAppsPackageSource';
import { MSSymbolsPackageSource } from '../Package/PackageSource/NuGet/MSFT/MSSymbolsPackageSource';
import { NuGetOrgPackageSource } from '../Package/PackageSource/NuGet/NuGetOrgPackageSource';

import { Package } from '../Package/Package';
import { PackageVersion } from '../Package/PackageVersion';

/// <summary>
/// Controller for the package manager.
/// </summary>
export class PackageController {
    /// <summary>
    /// Currently opened workspace folders, including their uri.
    /// </summary>
    private WorkspaceFolders: { name: string, uri: vscode.Uri } [] = [];

    /// <summary>
    /// The list of AL projects in the workspace.
    /// </summary>
    public ALProjects: ALProject[] = [];

    constructor(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined) {
        if (workspaceFolders === undefined) {
            throw new Error('No folders found in the workspace.');
        }

        // Add the workspace folders to the list.
        for (const workspaceFolderIdx in workspaceFolders) {
            this.WorkspaceFolders.push(
                {
                    name: workspaceFolders[workspaceFolderIdx].name,
                    uri: workspaceFolders[workspaceFolderIdx].uri
                }
            );
        }
    }

    /// <summary>
    /// Loads the AL projects.
    /// </summary>
    public async loadALProjects() {
        // Load the AL projects from the workspace folders.
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "ALGet: Loading AL projects",
            cancellable: false
        }, () => {
			const p = new Promise<void>(async resolve => {
                // Load the AL projects.
                this.loadALProjectsFromWorkspaceFolders();
        
                // Resolve the AL projects.
                resolve(await this.resolveALProjects());
			});

			return p;
        });
    }

    /// <summary>
    /// Loads the AL projects from the workspace folders.
    /// </summary>
    private loadALProjectsFromWorkspaceFolders() {
        OutputChannel.log('Loading AL projects from workspace folders.');

        // Load the AL projects from the workspace folders.
        for (const workspaceFolder of this.WorkspaceFolders) {
            OutputChannel.log(`Loading AL project from workspace folder '${workspaceFolder.name}' ...`);

            const alProject = new ALProject(workspaceFolder as vscode.WorkspaceFolder);
            alProject.PackageSources = PackageController.getPackageSources(workspaceFolder.uri);
            this.ALProjects.push(alProject);

            OutputChannel.log(`AL project '${alProject.Package?.Name}' from workspace folder '${workspaceFolder.name}' loaded.`);
        }

        OutputChannel.log(`${this.WorkspaceFolders.length} AL projects loaded successfully.`);
    }

    private async resolveALProjects() {
        OutputChannel.log('Resolve dependencies in AL projects.');

        for (const alProject of this.ALProjects) {
            if (alProject.Package === undefined) {
                OutputChannel.log(`Skipping workspace folder '${alProject.Workspace.name}' as it is not an AL project.`);

                continue;
            }
            OutputChannel.log(`Resolve dependencies in AL project '${alProject.Package.Name}' ...`);

            await Promise.all(alProject.Package.Dependencies.map(async (dependency) => {
                // check if package exists in any of the package sources
                await Promise.all(alProject.PackageSources.map(async (packageSource) => {
                    if (packageSource === undefined) {
                        return;
                    }

                    // get the package ID, based on the actual package id schema from the package source
                    const pgkSourcePkgId = packageSource.getPackageId(
                        dependency.Publisher,
                        dependency.Name,
                        dependency.Id,
                        ALGetController.getExtensionConfiguration(alProject.Workspace.uri)["countryCode"]
                    );

                    // if the package ID is empty, assume the package does not exist in the package source
                    if (!pgkSourcePkgId) {
                        return;
                    }

                    // check whether the package source serves the publisher of the dependency
                    if (!packageSource.isPublisherFeed(dependency.Publisher)) {
                        return;
                    }

                    OutputChannel.log(`Looking up for package '${pgkSourcePkgId}' in package source '${packageSource.Name}' ...`);

                    // check if the package exists in the package source
                    const pkgResponse = await packageSource.getPackageById(pgkSourcePkgId, false);
                    if (pkgResponse.length > 0) {
                        dependency.PackageSources.push(packageSource);

                        for (const pkg of pkgResponse) {
                            // add the available package versions to the dependency
                            for (const pkgVersion of pkg.versions) {
                                const version = new PackageVersion(pkgVersion.version);
                                const existingVersion = dependency.PackageVersions.find(v => v.Version === version.Version);
                                if (!existingVersion) {
                                    version.PackageSources.push(packageSource);
                                    dependency.PackageVersions.push(version);
                                } else {
                                    existingVersion.PackageSources.push(packageSource);
                                }
                            }                            
                        }
                    }
                }));

                // check if the package exists in .alpackages already
                const workspaceClient = new WorkspaceClient(alProject.Workspace);
                const workspacePkgId = workspaceClient.getPackageId(dependency.Publisher, dependency.Name);

                const workspacePkgs = await workspaceClient.getPackageById(workspacePkgId);
                if (workspacePkgs.length > 0) {
                    dependency.PackageSources.push(workspaceClient);

                    for (const workspacePkg of workspacePkgs) {
                        const version = new PackageVersion(workspacePkg.version);
                        const existingVersion = dependency.PackageVersions.find(v => v.Version === version.Version);
                        if (!existingVersion) {
                            version.PackageSources.push(workspaceClient);
                            dependency.PackageVersions.push(version);
                        } else {
                            existingVersion.PackageSources.push(workspaceClient);
                        }
                    }

                    // Find the highest version in workspacePkg and set dependency.Version
                    const highestVersion = workspacePkgs.reduce((prev: any, curr: any) => {
                        return (prev.version > curr.version) ? prev : curr;
                    });
                    dependency.Version = new PackageVersion(highestVersion.version);
                }
            }));            

            OutputChannel.log(`Dependencies in AL project '${alProject.Package.Name}' resolved.`);
        };

        OutputChannel.log('Dependencies in AL projects resolved.');
    }

    /// <summary>
    /// Get the package sources enabled for the given workspace folder.
    /// </summary>
    /// <param name="uri">The workspace folder uri.</param>
    /// <param name="suppressOutput">Whether to suppress output to the output channel.</param>
    /// <returns>The package sources enabled for the workspace folder.</returns>
    public static getPackageSources(uri: vscode.Uri | undefined, suppressOutput: boolean = false): IPackageSource[] {
        let packageSources: IPackageSource[] = [];

        if (ALGetController.getExtensionConfiguration(uri)["enableNuGetOrgFeed"]) {
            if (!suppressOutput) {
                OutputChannel.log("Registering NuGet.org package source.");
            }
            packageSources.push(new NuGetOrgPackageSource());
        }

        // Register MSFT default package sources
        if (ALGetController.getExtensionConfiguration(uri)["enableMSSymbolsFeed"]) {
            if (!suppressOutput) {
                OutputChannel.log("Registering Microsoft symbols package source.");
            }
            packageSources.push(new MSSymbolsPackageSource());
        }
        if (ALGetController.getExtensionConfiguration(uri)["enableMSAppsFeed"]) {
            if (!suppressOutput) {
                OutputChannel.log("Registering Microsoft apps package source.");
            }
            packageSources.push(new MSAppsPackageSource());
        }
        if (ALGetController.getExtensionConfiguration(uri)["enableAppSourceSymbolsFeed"]) {
            if (!suppressOutput) {
                OutputChannel.log("Registering AppSource symbols package source.");
            }
            packageSources.push(new AppSourcePackageSource());
        }

        // Register custom package sources, if any
        const customPackageSources = ALGetController.getExtensionConfiguration(uri)["nugetFeeds"];
        for (const customPackageSource of customPackageSources) {
            if (!suppressOutput) {
                OutputChannel.log(`Registering ${customPackageSource.name} package source.`);
            }
            packageSources.push(
                new CustomFeed(
                    customPackageSource.name,
                    customPackageSource.url,
                    customPackageSource.packageIDSchema,
                    customPackageSource.apiKey
                )
            );
        }

        if ((packageSources.length === 0) && (!suppressOutput)) {
            OutputChannel.logWarning("No package sources registered. This may lead to issues when resolving dependencies.");
        }

        return packageSources;
    }

    /// <summary>
    /// Search for packages, by ID, in the package sources.
    /// </summary>
    /// <param name="packageId">Package ID to search for.</param>
    /// <param name="workspaceFolder">The workspace folder the search has been performed from.</param>
    public async getPackageById(packageId: string, workspaceFolder: vscode.WorkspaceFolder | undefined): Promise<Package> {
        const pkgSources: IPackageSource[] = PackageController.getPackageSources(workspaceFolder?.uri, true);
        if (pkgSources.length === 0) {
            OutputChannel.logError('No package sources found to search for packages.');
            vscode.window.showErrorMessage('We\'re sorry, but no package sources were found to search for packages. Please review the extension settings and try again.');
            return Promise.reject(new Error('No package sources found.'));
        }

        let packages: Package[] = [];
        for (const pkgSource of pkgSources) {
            const pktSourceResult = await pkgSource.getPackageById(packageId, false); // TODO: implement pre-release flag

            for (const pkgMetadata of pktSourceResult) {
                const pkg = pkgSource.toPackage(pkgMetadata);
                packages = this.addOrUpdatePackages(packages, pkg, pkgSource, pkgMetadata);
            }
        }

        if (packages.length === 0) {
            OutputChannel.logError(`No packages found for ID '${packageId}'.`);
            vscode.window.showErrorMessage(`We're sorry, but no package with ID '${packageId}' was found. Please review the package sources configuration and try again.`);
            return Promise.reject(new Error(`No packages found for ID '${packageId}'.`));
        }
        if (packages.length > 1) {
            OutputChannel.logWarning(`Multiple packages found for ID '${packageId}'. Returning the first package found.`);
        };
        return Promise.resolve(packages[0]);
    }

    public async getPackageManifestById(packageSource: IPackageSource, packageId: string, packageVersion: PackageVersion): Promise<any> {
        OutputChannel.log(`Getting package manifest for package '${packageId}' version '${packageVersion}' from package source '${packageSource.Name}' ...`);
        const pkgManifest = await packageSource.getPackageManifestById(packageId, packageVersion.toString());
        if (pkgManifest === '') {
            throw new Error(`Package manifest for package '${packageId}' version '${packageVersion}' from package source '${packageSource.Name}' has been retrieved, but is empty. Please consult with package source provider.`);
        }
        OutputChannel.log(`Package manifest for package '${packageId}' version '${packageVersion}' from package source '${packageSource.Name}' retrieved.`);

        return Promise.resolve(pkgManifest);
    }

    public async downloadPackageById(packageSource: IPackageSource, packageId: string, packageVersion: PackageVersion): Promise<string> {
        OutputChannel.log(`Downloading package '${packageId}' version '${packageVersion}' from package source '${packageSource.Name}' ...`);
        const packageFile = await packageSource.downloadPackageById(packageId, packageVersion.toString());
        OutputChannel.log(`Package '${packageId}' version '${packageVersion}' from package source '${packageSource.Name}' downloaded.`);

        return Promise.resolve(packageFile);
    }

    /// <summary>
    /// Searches for packages in the package sources.
    /// </summary>
    /// <param name="searchQuery">The search query.</param>
    /// <param name="workspaceFolder">The workspace folder the search has been performed from.</param>
    /// <returns>The packages found in the package sources.</returns>
    public async searchPackages(searchQuery: string, workspaceFolder: vscode.WorkspaceFolder | undefined): Promise<Package[]> {
        const pkgSources: IPackageSource[] = PackageController.getPackageSources(workspaceFolder?.uri, true);
        if (pkgSources.length === 0) {
            vscode.window.showErrorMessage('We\'re sorry, but no package sources were found to search for packages. Please review the extension settings and try again.');
            return Promise.resolve([]);
        }

        let packages: Package[] = [];

        for (const pkgSource of pkgSources) {
            const pkgSourceResult = await pkgSource.getPackageByName(searchQuery, false); // TODO: implement pre-release flag
            
            for (const pkgMetadata of pkgSourceResult) {
                const pkg = pkgSource.toPackage(pkgMetadata);
                packages = this.addOrUpdatePackages(packages, pkg, pkgSource, pkgMetadata);
            }
        }

        if (workspaceFolder !== undefined) {
            for (const pkg of packages) {
                const workspaceClient = new WorkspaceClient(workspaceFolder);
                const workspacePkgId = workspaceClient.getPackageId(pkg.Publisher, pkg.Name);
                const workspacePkgs = await workspaceClient.getPackageById(workspacePkgId);
                if (workspacePkgs.length > 0) {
                    pkg.PackageSources.push(workspaceClient);

                    for (const workspacePkg of workspacePkgs) {
                        const version = new PackageVersion(workspacePkg.version);
                        const existingVersion = pkg.PackageVersions.find(v => v.Version === version.Version);
                        if (!existingVersion) {
                            version.PackageSources.push(workspaceClient);
                            pkg.PackageVersions.push(version);
                        } else {
                            existingVersion.PackageSources.push(workspaceClient);
                        }
                    }

                    // Find the highest version in workspacePkg and set dependency.Version
                    const highestVersion = workspacePkgs.reduce((prev: any, curr: any) => {
                        return (prev.version > curr.version) ? prev : curr;
                    });
                    pkg.Version = new PackageVersion(highestVersion.version);
                }
            }
        }
        return Promise.resolve(packages);
    }

    /// <summary>
    /// Get the latest version of the package.
    /// </summary>
    /// <param name="pkg">The package to get the latest version for.</param>
    /// <returns>The latest version of the package.</returns>
    public getLatestVersion(pkg: Package): PackageVersion {
        const latestVersion = pkg.PackageVersions.reduce((prev: any, curr: any) => {
            return (prev.Version > curr.Version) ? prev : curr;
        });
        return latestVersion;
    }

    /// <summary>
    /// Adds or updates the packages list with the given package.
    /// </summary>
    /// <param name="packages">The packages list.</param>
    /// <param name="pkg">The package to add or update.</param>
    /// <param name="pkgSource">The package source the package was found in.</param>
    /// <param name="pkgMetadata">The package metadata.</param>
    /// <returns>The updated packages list.</returns>
    private addOrUpdatePackages(packages: Package[], pkg: Package, pkgSource: IPackageSource, pkgMetadata: any): Package[] {
        const existingPkg = packages.find(p => p.Id === pkg.Id);
        if (existingPkg) {
            this.addOrUpdatePackageSources(existingPkg, pkgSource);
            this.addOrUpdatePackageVersions(existingPkg, pkgSource, pkgMetadata);
        } else {
            this.addOrUpdatePackageSources(pkg, pkgSource);
            this.addOrUpdatePackageVersions(pkg, pkgSource, pkgMetadata);
            packages.push(pkg);
        }
        return packages;
    }

    private addOrUpdatePackageSources(pkg: Package, pkgSource: IPackageSource): Package {
        const existingPkgSource = pkg.PackageSources.find(p => p.Name === pkgSource.Name);
        if (!existingPkgSource) {
            pkg.PackageSources.push(pkgSource);
        }
        return pkg;
    }

    /// <summary>
    /// Adds or updates the package versions of the given package.
    /// </summary>
    /// <param name="pkg">The package to add or update the versions for.</param>
    /// <param name="pkgSource">The package source the package was found in.</param>
    /// <param name="pkgMetadata">The package metadata.</param>
    /// <returns>The updated package.</returns>
    private addOrUpdatePackageVersions(pkg: Package, pkgSource: IPackageSource, pkgMetadata: any): Package {
        if (!pkgMetadata.versions) {
            return pkg;
        }
        for (const pkgVersion of pkgMetadata.versions) {
            const version = new PackageVersion(pkgVersion.version);
            const existingVersion = pkg.PackageVersions.find(v => v.Version === version.Version);
            if (!existingVersion) {
                version.PackageSources.push(pkgSource);
                pkg.PackageVersions.push(version);
            } else {
                existingVersion.PackageSources.push(pkgSource);
            }
        }

        return pkg;
    }
}