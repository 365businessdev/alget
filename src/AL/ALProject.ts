import * as vscode from 'vscode';
import * as path from 'path';
import fs = require("fs");

import { OutputChannel } from '../Common/OutputChannel';
import { Package } from '../Package/Package';
import { MSFT } from './MSFT';
import { PackageVersion } from '../Package/PackageVersion';
import { WorkspaceClient } from '../Package/PackageSource/Workspace/WorkspaceClient';
import { IPackageSource } from '../Package/PackageSource/IPackageSource';

/// <summary>
/// Class to load AL application projects.
/// </summary>
export class ALProject {

    /// <summary>
    /// The workspace folder of the AL application.
    /// </summary>
    public Workspace: vscode.WorkspaceFolder;

    /// <summary>
    /// The filename of the AL application manifest.
    /// </summary>
    private ManifestFilename: string = 'app.json';

    /// <summary>
    /// The full path of the AL application manifest.
    /// </summary>
    private ManifestFilePath: string;

    /// <summary>
    /// The AL application manifest.
    /// </summary>
    private Manifest: any;
    
    /// <summary>
    /// List of package sources.
    /// </summary>
    public PackageSources: IPackageSource[] = [];

    /// <summary>
    /// The package of the AL application or undefined if this is not an AL application.
    /// </summary>
    public Package: Package | undefined;

    /// <summary>
    /// Gets the content of the AL application manifest.
    /// </summary>
    public getContent(): any {
        return this.Manifest;
    }

    /// <summary>
    /// Sets the content of the AL application manifest.
    /// </summary>
    public setContent(manifest: any) {
        this.Manifest = manifest;
    }

    /// <summary>
    /// Writes the AL application manifest to the filesystem.
    /// </summary>
    public writeToFileSync(manifest?: any) {
        if (manifest !== undefined) {
            this.setContent(manifest);
        }

        const projectFsPath = this.Workspace.uri.fsPath;
        const alManifestPath = path.join(projectFsPath, this.ManifestFilename);

        fs.writeFileSync(
            alManifestPath,
            JSON.stringify(
                this.Manifest, null, 2
            )
        );
    }

    /// <summary>
    /// Reads the AL application manifest from the filesystem.
    /// </summary>
    public readFromFile(): any {
        this.Manifest = JSON.parse(fs.readFileSync(this.ManifestFilePath, 'utf8'));

        return this.Manifest;
    }

    /// <summary>
    /// Sets the package of the AL application.
    /// </summary>
    public setPackage(pkg: Package) {
        this.Package = pkg;
    }

    /// <summary>
    /// Gets the package of the AL application.
    /// </summary>
    public getPackage(): Package | undefined {
        return this.Package;
    }

    /// <summary>
    /// Constructor to load the AL application project.
    /// </summary>
    constructor(workspace: vscode.WorkspaceFolder) {
        this.Workspace = workspace;
        this.ManifestFilePath = path.join(this.Workspace.uri.fsPath, this.ManifestFilename);

        if (!fs.existsSync(this.ManifestFilePath)) {
            OutputChannel.log(`Could not find application manifest in ${this.Workspace.uri.fsPath}.`);

            return;
        }
        this.readFromFile();
        this.readPackageFromManifest();
    }

    /// <summary>
    /// Creates the package from the AL application manifest.
    /// </summary>
    private readPackageFromManifest(): Package {
        // Create a new package
        this.Package = new Package(
            this.Manifest.id, 
            this.Manifest.name, 
            this.Manifest.publisher,
            new PackageVersion(
                this.Manifest.version
            )
        );
        
        // add package details
        if (this.Manifest.brief) {
            this.Package.BriefDescription = this.Manifest.brief;
        }
        if (this.Manifest.description) {
            this.Package.Description = this.Manifest.description;
        }

        // add MSFT dependencies
        this.Package.Dependencies = MSFT.getDependencies(
            new PackageVersion(this.Manifest.platform),
            new PackageVersion(this.Manifest.application)
        );

        // add dependencies
        if (this.Manifest.dependencies) {
            for (const dependency of this.Manifest.dependencies) {
                const depPkg = new Package(dependency.id, dependency.name, dependency.publisher);
                this.Package.Dependencies.push(depPkg);
            }
        }

        // Add the AL project as a package source
        // TODO: Add the AL project .alpackages as a package source
        this.Package.PackageSources.push(
            new WorkspaceClient(this.Workspace)
        );

        return this.Package;
    }

}