/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { IPackageSource } from "./PackageSource/IPackageSource";

/// <summary>
/// Represents a package version.
/// </summary>
export class PackageVersion {
    /// <summary>
    /// The version string.
    /// </summary>
    public Version: string;

    /// <summary>
    /// The major version number.
    /// </summary>
    public Major: number;

    /// <summary>
    /// The minor version number.
    /// </summary>
    public Minor: number;

    /// <summary>
    /// The patch version number.
    /// </summary>
    public Patch: number;

    /// <summary>
    /// The build or revision version number.
    /// </summary>
    public Build: number;

    /// <summary>
    /// Specifies the packages sources, that the package version is available from.
    /// </summary>
    public PackageSources: IPackageSource[] = [];

    constructor(version: string) {
        this.Major = 0;
        this.Minor = 0;
        this.Patch = 0;
        this.Build = 0;

        const versionParts = version.split(".");
        for (let i: number = 0; i < versionParts.length; i++) {
            switch (i) {
                case 0:
                    this.Major = parseInt(versionParts[i]);
                    break;
                case 1:
                    this.Minor = parseInt(versionParts[i]);
                    break;
                case 2:
                    this.Patch = parseInt(versionParts[i]);
                    break;
                case 3:
                    this.Build = parseInt(versionParts[i]);
                    break;
            }
        }
        this.Version = this.toString();
    }

    /// <summary>
    /// Returns the version as a string.
    /// </summary>
    public toString(): string {
        return `${this.Major}.${this.Minor}.${this.Patch}.${this.Build}`;
    }
}