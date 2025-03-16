/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import fs = require("fs");

import { ALGetController } from "../../../Controller/ALGetController";
import { IPackageSource } from "../IPackageSource";
import { Package } from '../../Package';
import { PackageSourceType } from "../PackageSourceType";
import * as glob from 'glob';
import { OutputChannel } from '../../../Common/OutputChannel';

export class WorkspaceClient implements IPackageSource {
    Type: PackageSourceType = PackageSourceType.Workspace;
    Name: string = 'Workspace';
    Description: string = 'Local workspace';
    Publisher: string | undefined = undefined;
    Url: string | undefined = undefined;
    WebsiteUrl: string | undefined = undefined;
    PackageIdSchema: string = '{publisher}_{name}_{version}.app';
    AuthenticationHeader: string | undefined = undefined;

    private Workspace: vscode.WorkspaceFolder;
    private PackageCachePath: string[];

    constructor(workspace: vscode.WorkspaceFolder) {
        this.Workspace = workspace;
        this.PackageCachePath = this.getALPackageCachePath();
    }

    /// <summary>
    /// Converts the package source response to Package.
    /// </summary>
    public toPackage(): Package {
        throw new Error("Not supported for local workspaces");
    }
    
    /// <summary>
    /// Check if the feed contains packages from a specific publisher.
    /// </summary>
    /// <returns>Always returns true, as a workspace can contain packages from multiple publishers.</returns>
    public isPublisherFeed(): boolean {
        return true;
    }

    /// <summary>
    /// Get the package ID of the AL package.
    /// </summary>
    /// <param name="pkg">The package to get the package ID for.</param>
    /// <param name="countryCode">The country code of the package.</param>
    /// <returns>The package ID of the AL package.</returns
    public getPackageIdFromPackage(pkg: Package, countryCode: string): string {
        return this.getPackageId(pkg.Publisher, pkg.Name, pkg.Id, countryCode);
    }

    /// <summary>
    /// Get the package ID of the AL package.
    /// </summary>
    /// <param name="publisher">The publisher of the package.</param>
    /// <param name="name">The name of the package.</param>
    /// <param name="id">The ID of the package.</param>
    /// <param name="countryCode">The country code of the package.</param>
    /// <returns>The package ID of the AL package.</returns>
    public getPackageId(publisher: string, name: string, id: string, countryCode: string): string {
        return this.getPackageFileName(publisher, name, id).replace('{countryCode}', countryCode);
    }

    /// <summary>
    /// Get the file name of the AL package.
    /// </summary>
    /// <param name="publisher">The publisher of the package.</param>
    /// <param name="name">The name of the package.</param>
    /// <param name="version">The version of the package or undefined.</param>
    /// <returns>The file name of the AL package.</returns>
    /// <remarks>
    /// The file name contains the {version} placeholder, which needs to be replaced with the actual version of the package.
    /// </remarks>
    public getPackageFileName(publisher: string, name: string, version: string | undefined = undefined): string {
        // Special case for Microsoft Platform package, as the package name is 'System' instead of 'Platform'
        if ((publisher.toLowerCase() === 'microsoft') && (name.toLowerCase() === 'platform')) {
            name = 'System';
        }
        
        let packageId = this.PackageIdSchema
                            .replace('{publisher}', publisher)
                            .replace('{name}', name);
        if (version) {
            packageId = packageId.replace('{version}', version);
        }
        return packageId;
    }

    // @ts-ignore
    public getPackageByName(packageName: string, prerelease: boolean): Promise<any> {
        throw new Error("Not supported for local workspaces");
    }

    /// <summary>
    /// Get package from AL package cache by package ID.
    /// </summary>
    /// <param name="packageId">The package ID to search for.</param>
    /// <returns>The package files found in the AL package cache.</returns>
    async getPackageById(packageId: string): Promise<any> {
        const packageFiles = await this.searchPackage(packageId.replace("{version}", "*"), this.PackageCachePath);
        if (!packageFiles) {
            return [];
        }
        return this.parsePackageFiles(packageFiles);
    }

    /// <summary>
    /// Parse the package files to extract the version and file system path.
    /// </summary>
    /// <param name="packageFiles">The package files to parse.</param>
    /// <returns>The parsed package files.</returns>
    private parsePackageFiles(packageFiles: string[]): any {
        let pkgs: { version: string, fsPath: string }[] = [];

        for (const packageFile of packageFiles) {
            // assume package file name schema: {publisher}_{name}_{version}.app
            const version = packageFile.split('_')[2].replace('.app', '');

            pkgs.push({
                version: version,
                fsPath: packageFile
            });
        }

        return pkgs;
    }

    /// <summary>
    /// Search for a package in the AL package cache.
    /// </summary>
    /// <param name="packageId">The package ID to search for.</param>
    /// <param name="paths">The paths to search for the package.</param>
    /// <returns>The package files found in the AL package cache.</returns>
    private async searchPackage(packageId: string, paths: string[]): Promise<any> {
        let packageFiles = [];
        for (const packagePath of paths) {
            // Check if the package cache path exists
            if (!fs.existsSync(packagePath)) {
                continue;
            }
            // Search for the package in the package cache path
            try {
                const files = glob.sync(`${packagePath}/${packageId}`);
                packageFiles.push(...files);
            } catch (err) {
                console.debug(`Error while searching for package ${packageId} in ${packagePath}: ${err}`);

                continue; // silently continue if file not found
            }
        }
        return packageFiles;
    }

    // @ts-ignore
    public getPackageManifestById(packageId: string, packageVersion: string): Promise<any> {
        throw new Error("Not supported for local workspaces");
    }

    // @ts-ignore
    public downloadPackageById(packageId: string, packageVersion: string): Promise<string> {
        throw new Error("Not supported for local workspaces");
    }

    /// <summary>
    /// Save the AL app file to the package cache.
    /// </summary>
    /// <param name="pkg">The package to save.</param>
    /// <param name="appFile">The AL app file to save as a base64 string.</param>
    public saveApp(pkg: Package, appFile: string): void {
        // Create the package cache path if it does not exist
        const packagePath = this.PackageCachePath[0];
        if (!fs.existsSync(packagePath)) {
            fs.mkdirSync(packagePath);
        }

        // Set app file name
        let appFileName = this.getPackageFileName(pkg.Publisher, pkg.Name, pkg.Version!.toString());
        if ((pkg.Publisher === "Microsoft") && (pkg.Name === "Platform")) {
            appFileName = this.getPackageFileName(pkg.Publisher, 'System', pkg.Version!.toString());
        }

        // Save the app file to the package cache
        fs.writeFileSync(
            path.join(packagePath, appFileName),
            appFile
        );

        // Remove other versions of the package
        this.getPackageById(this.getPackageFileName(pkg.Publisher, pkg.Name)).then((alPackagePkgs) => {
            for (const alPackagePkg of alPackagePkgs) {
                if (alPackagePkg.version !== pkg.Version!.toString()) {
                    OutputChannel.log(`Removing version '${alPackagePkg.version}' of package '${alPackagePkg.fsPath}' from package cache.`);
                    this.removeApp(alPackagePkg.fsPath);
                }
            }
        });
    }

    /// <summary>
    /// Remove the AL app file from the package cache.
    /// </summary>
    /// <param name="appFile">The AL app file to remove.</param>
    public removeApp(appFile: string) {
        if (!fs.existsSync(appFile)) {
            return;
        }
        fs.unlinkSync(appFile);
    }

    /// <summary>
    /// Get the path of the AL package cache.
    /// </summary>
    /// <remarks>
    /// The package cache path is determined by the configuration of the AL Language extension.
    /// If the configuration is not set, the default path is used.
    /// </remarks>
    public getALPackageCachePath(): string[] {
        return WorkspaceClient.getALPackageCachePath(this.Workspace);
    }

    /// <summary>
    /// Get the path of the AL package cache.
    /// </summary>
    /// <param name="workspace">The workspace to get the package cache path for.</param>
    /// <remarks>
    /// The package cache path is determined by the configuration of the AL Language extension.
    /// If the configuration is not set, the default path is used.
    /// </remarks>
    public static getALPackageCachePath(workspace: vscode.WorkspaceFolder): string[] {
        const alLanguageExtConfiguration = ALGetController.getExtensionConfiguration(workspace.uri, 'al');
        if (!alLanguageExtConfiguration) {
            return [`${workspace.uri.fsPath}/.alpackages`]; // default, just use the .alpackages folder in the workspace
        }

        let packageCachePaths : string[] = [];
        for (const alPackagePath of alLanguageExtConfiguration.get('packageCachePath') as string[]) {
            packageCachePaths.push(
                path.join(workspace.uri.fsPath, alPackagePath)
            );
        }
        return packageCachePaths;
    }

}