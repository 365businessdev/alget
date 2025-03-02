/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { IPackageSource } from './PackageSource/IPackageSource';
import { PackageVersion } from './PackageVersion';

/// <summary>
/// Represents a package.
/// </summary>
export class Package {
    /// <summary>
    /// Represents the ID of the AL application, matching the app.json file.
    /// </summary>
    public Id: string;

    /// <summary>
    /// Represents the name of the AL application, matching the app.json file.
    /// </summary>
    public Name: string;

    /// <summary>
    /// Represents the publisher of the AL application, matching the app.json file.
    /// </summary>
    public Publisher: string;

    /// <summary>
    /// Specifies the current version of the AL application.
    /// </summary>
    public Version: PackageVersion | undefined;

    /// <summary>
    /// Brief description of the AL application.
    /// </summary>
    public BriefDescription: string | undefined;

    /// <summary>
    /// Detailed description of the AL application.
    /// </summary>
    public Description: string | undefined;

    /// <summary>
    /// Specifies the minimum required version of the AL application.
    /// </summary>
    public RequiredVersion: PackageVersion;

    /// <summary>
    /// Specifies the dependencies of the AL application.
    /// </summary>
    public Dependencies: Package[] = [];
    
    /// <summary>
    /// Specifies the packages sources, that the package version is available from.
    /// </summary>
    public PackageSources: IPackageSource[] = [];

    /// <summary>
    /// List of versions of the AL application, available from the package sources.
    /// </summary>
    public PackageVersions: PackageVersion[] = [];

    /// <summary>
    /// Constructor to create a new package.
    /// </summary>
    constructor(id: string, name: string, publisher: string, version: PackageVersion = new PackageVersion('1.0.0.0')) {
        this.Id = id;
        this.Name = name;
        this.Publisher = publisher;
        this.RequiredVersion = version;
    }

    /// <summary>
    /// Specifies whether the package is available.
    /// </summary>
    public isAvailable(): boolean {
        return (this.PackageSources.length > 0);
    }

    /// <summary>
    /// Specifies whether the package is installed.
    /// </summary>
    public isInstalled(): boolean {
        return (this.Version !== undefined);
    }

    /// <summary>
    /// Specifies whether a newer version of the package is available in a package source.
    /// </summary>
    public isUpdateAvailable(): boolean {
        if (!this.isInstalled()) {
            return false;
        }

        // Installed, but a newer version is available
        if (this.Version !== undefined) {
            for (const version of this.PackageVersions) {
                if (version.Major > this.Version.Major) {
                    return true;
                }
                if (version.Major === this.Version.Major) {
                    if (version.Minor > this.Version.Minor) {
                        return true;
                    }
                    if (version.Minor === this.Version.Minor) {
                        if (version.Patch > this.Version.Patch) {
                            return true;
                        }
                        if (version.Patch === this.Version.Patch) {
                            if (version.Build > this.Version.Build) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    /// <summary>
    /// Specifies whether the package is available as an app.
    /// </summary>
    /// <returns>True if the package is available as an app.</returns>
    public isApp(): boolean {
        if (this.PackageSources.length === 0) {
            return false;
        }

        for (const packageSource of this.PackageSources) {
            if ((packageSource.PackageIdSchema.includes('.symbols') || packageSource.PackageIdSchema.includes('.runtime'))) {
                continue;
            }
            return true;
        }
        return false;
    }

    /// <summary>
    /// Specifies whether the package is available as a symbol package.
    /// </summary>
    /// <returns>True if the package is available as a symbol package.</returns>
    public isSymbol(): boolean {
        for (const packageSource of this.PackageSources) {
            if (packageSource.PackageIdSchema.includes('.symbols')) {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Specifies whether the package is available as a runtime package.
    /// </summary>
    /// <returns>True if the package is available as a runtime package.</returns>
    public isRuntimePackage(): boolean {
        for (const packageSource of this.PackageSources) {
            if (packageSource.PackageIdSchema.includes('.runtime')) {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Specifies whether the package is available as a localized package.
    /// </summary>
    /// <returns>True if the package is available as a localized package.</returns>
    public isLocalizedPackage(): boolean {
        // TODO: This will not work, at least for MSFT package sources
        for (const packageSource of this.PackageSources) {
            if (packageSource.PackageIdSchema.includes('.countryCode')) {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Gets the latest available version of the package.
    /// </summary>
    public getLatestVersion(): PackageVersion | undefined {
        if (this.PackageVersions.length === 0) {
            return undefined;
        }

        let latestVersion: PackageVersion | undefined = undefined;
        if (this.Version === undefined) {
            latestVersion = this.PackageVersions.reduce((prev, current) => {
                return (prev.Version > current.Version) ? prev : current;
            });
        } else {
            latestVersion = this.PackageVersions.find((version) => version.Version > this.Version!.Version);
            if (latestVersion === undefined) {
                latestVersion = this.Version;
            }
        }
        
        return latestVersion;
    }
}