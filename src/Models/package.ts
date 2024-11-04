import { NuSpec } from "./nuspec";
import { PackageSource } from "./package-source";
import * as vscode from 'vscode';
import fs = require("fs");
import path from "path";

/// <summary>
/// Represents a AL package.
/// </summary>
export class Package {
    /// <summary>
    /// The ID of the package.
    /// </summary>
    public PackageID: string | null;

    /// <summary>
    /// Application ID.
    /// </summary>
    public ID: string | undefined;

    /// <summary>
    /// Flag indicating if the package is installed.
    /// </summary>
    public IsInstalled: boolean = false;

    /// <summary>
    /// Minimum required version of the package.
    /// </summary>
    public MinimumVersion: string | null;

    /// <summary>
    /// Version of the package.
    /// </summary>
    public Version: string;

    /// <summary>
    /// Newer version of the package available for update.
    /// </summary>
    public UpdateVersion: string | undefined;

    /// <summary>
    /// Name of the package.
    /// </summary>
    public Name: string;

    /// <summary>
    /// Description of the package.
    /// </summary>
    public Description: string;

    /// <summary>
    /// Publisher of the package.
    /// </summary>
    public Publisher: string;

    /// <summary>
    /// Country code of the package.
    /// </summary>
    public CountryCode: string;

    /// <summary>
    /// The package source.
    /// </summary>
    public Source: PackageSource;

    /// <summary>
    /// Package metadata (NuSpec).
    /// </summary>
    public PackageMetadata: NuSpec | null;

    constructor(
        PackageID: string | null = null,
        ID: string | undefined,
        MinimumVersion: string | null = null,
        Version: string,
        Name: string,
        Description: string,
        Publisher: string,
        CountryCode: string,
        Source: PackageSource,
        PackageMetadata: NuSpec | null = null,
        alPackagesPath: string = ""
    ) {
        if (PackageID === null) {
            PackageID = `${Publisher}.${Name}.symbols.${ID}`.replaceAll(" ", "");

            if (PackageID.length > 100) {
                PackageID = `${Publisher}.${Name}`
                    .replaceAll(" ", "")
                    .substring(0, 100 - 36 - 9);
                PackageID += `.symbols.${ID}`;
            }
        }
        this.PackageID = PackageID;
        this.ID = ID;
        this.MinimumVersion = MinimumVersion;
        this.Version = Version;
        this.Name = Name;
        this.Description = Description;
        this.Publisher = Publisher;
        this.CountryCode = CountryCode;
        this.Source = Source;
        this.PackageMetadata = PackageMetadata;

        this.tryFindPackageInALPackagesPath(alPackagesPath);
    }

    private tryFindPackageInALPackagesPath(alPackagesPath: string) {
        if (alPackagesPath === "") {
            return;
        }

        this.Version = this.MinimumVersion || "0.0.0.0";

        let searchFileName = `${this.Publisher}_${this.Name}`;
        if ((this.Publisher === "Microsoft") && (this.Name === "Platform")) {
            searchFileName = `${this.Publisher}_System_`;
        }
        searchFileName = searchFileName.replace(/[/\\?%*:|"<>]/g, '-');

        try {
            fs.readdirSync(alPackagesPath).forEach((file) => {
            if (
                file
                .toLowerCase()
                .startsWith(searchFileName.toLowerCase())
            ) {
                this.Version = file.split("_")[2].replaceAll(".app", "");
                this.IsInstalled = true;
                return;
            }
            });

            if (!this.IsInstalled) {
            // lookup in the VS Code workspace
            this.tryFindPackageInVSCodeWorkspace();
            }
        } catch (error) {
            console.log(error);
            // lookup in the VS Code workspace
            this.tryFindPackageInVSCodeWorkspace();
        }
    }

    private tryFindPackageInVSCodeWorkspace() {
        if (vscode.workspace.workspaceFolders === undefined) {
            return;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const manifestPath = path.join(folder.uri.fsPath, "app.json");
            if (!fs.existsSync(manifestPath)) {
                continue;
            }
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
            if (manifest.id === this.ID) {
                this.IsInstalled = true;
                this.Version = manifest.version;

                return;
            }
        }
    }
}