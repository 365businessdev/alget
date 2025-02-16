/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { IPackageSource } from "../IPackageSource";
import { PackageSourceType } from "../PackageSourceType";
import { NuGetClient } from "./NuGetClient";

export class CustomFeed implements IPackageSource {
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
    public Name: string;

    /// <summary>
    /// Specifies the URL of the package source.
    /// </summary>
    public Url: string;

    /// <summary>
    /// Specifies the schema package Ids are expected to follow.
    /// </summary>
    public PackageIdSchema: string = '{publisher}.{name}.{id}';

    /// <summary>
    /// No authentication header is required for AppSource feed.
    /// </summary>
    public AuthenticationHeader: string | undefined = undefined;

    /// <summary>
    /// Get the authentication header from a personal access token (PAT).
    /// </summary>
    public static getAuthenticationHeaderFromPAT(pat: string): string {
        return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
    }

    constructor(name: string, url: string, authenticationHeader?: string, packageIdSchema?: string) {
        this.Name = name;
        this.Url = url;
        if (authenticationHeader) {
            this.AuthenticationHeader = authenticationHeader;
        }
        if (packageIdSchema) {
            this.PackageIdSchema = packageIdSchema;
        }

        this.Client = new NuGetClient(this.Url, this.AuthenticationHeader);
    }

    /// <summary>
    /// Check if the contains packages from a specific publisher.
    /// </summary>
    /// <returns>True if the feed contains packages from the specified publisher.</returns>
    isPublisherFeed(): boolean {
        return true; // Custom feeds can contain packages from multiple publishers
    }

    /// <summary>
    /// Get package ID by publisher, name, id and country code.
    /// </summary>
    getPackageId(publisher: string, name: string, id: string, countryCode?: string): string {
        // If the package ID is empty, return an empty string.
        if (id === '00000000-0000-0000-0000-00000000000') {
            return '';
        }
        let packageId = this.PackageIdSchema
            .replace('{publisher}', this.Client.normalize(publisher))
            .replace('{name}', this.Client.normalize(name))
            .replace('{id}', id)
            .replace('{countryCode}', countryCode ?? '')
            .replace('..','.')
            .replace(/\.+$/, ''); // Trim ending dots

        return packageId;
    }

    /// <summary>
    /// Get package by name.
    /// </summary>
    /// <param name="packageName">The package name to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    getPackageByName(packageName: string, prerelease: boolean): Promise<any> {
        return this.Client.getPackageByName(packageName, prerelease);
    }

    /// <summary>
    /// Get package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    getPackageById(packageId: string, prerelease: boolean): Promise<any> {
        return this.Client.getPackageById(packageId, prerelease);
    }

    /// <summary>
    /// Get package manifest by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    getPackageManifestById(packageId: string, packageVersion: string): Promise<any> {
        return this.Client.getPackageManifestById(packageId, packageVersion);
    }

    /// <summary>
    /// Download package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    downloadPackageById(packageId: string, packageVersion: string): Promise<string> {
        return this.Client.downloadPackageById(packageId, packageVersion);
    }
}