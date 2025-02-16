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
            alProject.PackageSources = this.registerPackageSources(workspaceFolder.uri);
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
                    dependency.Version = highestVersion.version;
                }
            }));            

            OutputChannel.log(`Dependencies in AL project '${alProject.Package.Name}' resolved.`);
        };

        OutputChannel.log('Dependencies in AL projects resolved.');
    }

    /// <summary>
    /// Registers the package sources.
    /// </summary>
    private registerPackageSources(uri: vscode.Uri) : IPackageSource[] {
        let packageSources: IPackageSource[] = [];

        if (ALGetController.getExtensionConfiguration(uri)["enableNuGetOrgFeed"]) {
            OutputChannel.log("Registering NuGet.org package source.");
            packageSources.push(new NuGetOrgPackageSource());
        }

        // Register MSFT default package sources
        if (ALGetController.getExtensionConfiguration(uri)["enableMSSymbolsFeed"]) {
            OutputChannel.log("Registering Microsoft symbols package source.");
            packageSources.push(new MSSymbolsPackageSource());
        }
        if (ALGetController.getExtensionConfiguration(uri)["enableMSAppsFeed"]) {
            OutputChannel.log("Registering Microsoft apps package source.");
            packageSources.push(new MSAppsPackageSource());
        }
        if (ALGetController.getExtensionConfiguration(uri)["enableAppSourceSymbolsFeed"]) {
            OutputChannel.log("Registering AppSource symbols package source.");
            packageSources.push(new AppSourcePackageSource());
        }

        // Register custom package sources, if any
        const customPackageSources = ALGetController.getExtensionConfiguration(uri)["nugetFeeds"];
        for (const customPackageSource of customPackageSources) {
            OutputChannel.log(`Registering ${customPackageSource.name} package source.`);
            packageSources.push(
                new CustomFeed(
                    customPackageSource.name,
                    customPackageSource.url,
                    customPackageSource.packageIDSchema,
                    customPackageSource.apiKey
                )
            );
        }

        if (packageSources.length === 0) {
            OutputChannel.logWarning("No package sources registered. This may lead to issues when resolving dependencies.");
        }

        return packageSources;
    }
}