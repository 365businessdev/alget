/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */

import { IPackageSource } from "../IPackageSource";
import { PackageSourceType } from "../PackageSourceType";
import { NuGetClient } from "./NuGetClient";

export class NuGetOrgPackageSource implements IPackageSource {
    /// <summary>
    /// NuGet client to interact with the feed.
    /// </summary>
    private Client: NuGetClient;

    /// <summary>
    /// Specifies the type of the package source.
    /// </summary>
    public Type: PackageSourceType = PackageSourceType.External;

    /// <summary>
    /// Specifies the name of the package source.
    /// </summary>
    public Name: string = 'NuGet.org';

    /// <summary>
    /// Specifies the URL of the package source.
    /// </summary>
    public Url: string = 'https://api.nuget.org/v3/index.json';

    /// <summary>
    /// Specifies the schema package Ids are expected to follow.
    /// </summary>
    public PackageIdSchema: string = '{publisher}.{name}.{id}';

    /// <summary>
    /// No authentication header is required for AppSource feed.
    /// </summary>
    public AuthenticationHeader: string | undefined = undefined;

    constructor() {
        this.Client = new NuGetClient(this.Url);
    }

    /// <summary>
    /// Check if the contains packages from a specific publisher.
    /// </summary>
    /// <returns>True if the feed contains packages from the specified publisher.</returns>
    isPublisherFeed(): boolean {
        return true; // NuGet.org contain packages from multiple publishers
    }

    /// <summary>
    /// Get package ID by publisher, name, id and country code.
    /// </summary>
    getPackageId(publisher: string, name: string, id: string, countryCode?: string): string {
        let packageId = this.PackageIdSchema
            .replace('{publisher}', publisher)
            .replace('{name}', name)
            .replace('{id}', id)
            .replace('{countryCode}', countryCode ?? '')
            .replace('..','.');

        // Package ID length is limited to 100 characters in NuGet, so we need to truncate it
        if (packageId.length > 100) {
            const offset = packageId.length - 100;

            name = this.Client.normalize(name);
            name = name.substring(0, name.length - offset); // Truncate the name, to match the package ID length limit
            packageId = this.PackageIdSchema
                .replace('{publisher}', this.Client.normalize(publisher))
                .replace('{name}', name)
                .replace('{id}', id === '00000000-0000-0000-0000-00000000000' ? '' : id)
                .replace('{countryCode}', countryCode ?? '')
                .replace('..','.')
                .replace(/\.+$/, ''); // Trim ending dots
        }

        return packageId;
    }

    /// <summary>
    /// Get package by name.
    /// </summary>
    /// <param name="packageName">The package name to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    async getPackageByName(packageName: string, prerelease: boolean): Promise<any> {
        return await this.Client.getPackageByName(packageName, prerelease);
    }

    /// <summary>
    /// Get package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    async getPackageById(packageId: string, prerelease: boolean): Promise<any> {
        return await this.Client.getPackageById(packageId, prerelease);
    }

    /// <summary>
    /// Get package manifest by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    async getPackageManifestById(packageId: string, packageVersion: string): Promise<any> {
        return await this.Client.getPackageManifestById(packageId, packageVersion);
    }

    /// <summary>
    /// Download package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    async downloadPackageById(packageId: string, packageVersion: string): Promise<string> {
        return await this.Client.downloadPackageById(packageId, packageVersion);
    }
}