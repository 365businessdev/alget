/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { IPackageSource } from "../IPackageSource";
import { Package } from "../../Package";
import { PackageSourceType } from "../PackageSourceType";
import { NuGetClient } from "./NuGetClient";
import { OutputChannel } from "../../../Common/OutputChannel";

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
    /// Specifies the description of the package source.
    /// </summary>
    public Description: string = 'Custom feed, configured by the user.';

    /// <summary>
    /// Specifies the publisher of the package source.
    /// </summary>
    public Publisher: string | undefined = undefined;

    /// <summary>
    /// Specifies the URL of the package source.
    /// </summary>
    public Url: string;

    /// <summary>
    /// Specifies the URL of the AppSource artifacts website.
    /// </summary>
    WebsiteUrl: string | undefined = undefined;

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
        this.WebsiteUrl = this.parseWebsiteUrl(this.Url);
        if (authenticationHeader) {
            this.AuthenticationHeader = authenticationHeader;
        }
        if (packageIdSchema) {
            this.PackageIdSchema = packageIdSchema;
        }

        this.Client = new NuGetClient(this.Url, this.AuthenticationHeader);
    }

    /// <summary>
    /// Parse the website URL from the feed URL.
    /// </summary>
    /// <param name="url">The feed URL.</param>
    /// <returns>The website URL.</returns
    /// <remarks>
    /// Currently only supports Azure DevOps feeds.
    /// </remarks>
    private parseWebsiteUrl(url: string): string | undefined{
        if ((url.indexOf('dev.azure.com') <= 0) && (url.indexOf('visualstudio.com') <= 0)) {
            OutputChannel.logWarning(`Could not parse website URL from feed URL: '${url}'. Please report this issue.`);

            return undefined;
        }
        // Regex to parse the organization, project and feed from the URL.
        // Example URL: https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feed}/nuget/v3/index.json
        // Example URL: https://pkgs.dev.azure.com/{organization}/_packaging/{feed}/nuget/v3/index.json
        // Example URL: https://{organization}.pkgs.visualstudio.com/{project}/_packaging/{feed}/nuget/v3/index.json
        const regex = /https:\/\/pkgs\.dev\.azure\.com\/([a-zA-Z0-9]*)(?:\/(.*))?\/_packaging\/([^/]+)\/nuget\/v3\/index\.json|https:\/\/([^/]+)\.pkgs\.visualstudio\.com\/([^/]+)\/_packaging\/([^/]+)\/nuget\/v3\/index\.json/;

        const match = url.match(regex);
        if (match) {
            const organization = match[1] || match[4];  // Get the organization from the URL
            const project = match[2] || match[5] || ""; // Get the project from the URL (optional)
            const feed = match[3] || match[6];          // Get the feed from the URL
            console.log(`Parsed URL: '${url}' results in organization: '${organization}', project: '${project}', feed: '${feed}'.`);

            return `https://dev.azure.com/${organization}${project === "" ? "" : `/${project}`}/_artifacts/feed/${feed}`.replace(/\/$/, '');
        }
        OutputChannel.logWarning(`Could not parse website URL from feed URL: '${url}'. Please report this issue.`);

        return undefined;
    }
    
    /// <summary>
    /// Converts the package source response to Package.
    /// </summary>
    toPackage(data: any): Package {
        const pkg = this.Client.toPackage(data);

        // Extract the package ID from the feed response.
        const regex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g;
        try {
            pkg.Id = regex.exec(data.id)![0];
        } catch {
            throw new Error('Failed to extract package ID from the feed response.');
        }

        return pkg;
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