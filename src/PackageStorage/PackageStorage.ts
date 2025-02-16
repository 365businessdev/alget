/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { Package } from "../Package/Package";

/// <summary>
/// Represents the package storage.
/// </summary>
export class PackageStorage {
    private static Packages: Package[] = [];

    /// <summary>
    /// Resets the storage.
    /// </summary>
    public static resetStorage() {
        this.Packages = [];
    }

    /// <summary>
    /// Gets the number of packages in the storage.
    /// </summary>
    public static getNumberOfPackages(): number {
        return this.Packages.length;
    }

    /// <summary>
    /// Adds the specified package to the storage.
    /// </summary>
    public static addPackage(pkg: Package) {
        this.Packages.push(pkg);
    }

    /// <summary>
    /// Gets the packages from the storage.
    /// </summary>
    public static getPackages(): Package[] {
        return this.Packages;
    }

    /// <summary>
    /// Finds the package by the specified ID.
    /// </summary>
    public static findPackageById(id: string): Package | undefined {
        return this.Packages.find(p => p.Id === id);
    }

    /// <summary>
    /// Finds the package by the specified name.
    /// </summary>
    public static findPackageByName(name: string): Package | undefined {
        return this.Packages.find(p => p.Name === name);
    }

    /// <summary>
    /// Finds the package by the specified ID and minimum required version.
    /// </summary>
    public static findPackageByRequiredVersion(id: string, version: string): Package | undefined {
        return this.Packages.find(p => p.Id === id && p.RequiredVersion.Version >= version);
    }
}