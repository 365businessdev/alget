/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { IPackageSource } from "../../IPackageSource";
import { Package } from "../../../Package";
import { PackageSourceType } from "../../PackageSourceType";
import { NuGetClient } from "../NuGetClient";

export class MSAppsPackageSource implements IPackageSource {
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
    public Name: string = 'MS Apps';

    /// <summary>
    /// Specifies the description of the package source.
    /// </summary>
    public Description: string = 'The MS Apps feed contains Microsoft packages, including source code, for Microsoft Dynamics 365 Business Central.';

    /// <summary>
    /// Specifies the publisher of the package source. AppSource feed contains packages from multiple publishers.
    /// </summary>
    public Publisher: string | undefined = "Microsoft";

    /// <summary>
    /// Specifies the URL of the package source.
    /// </summary>
    public Url: string = 'https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/MSApps/nuget/v3/index.json';

    /// <summary>
    /// Specifies the URL of the AppSource artifacts website.
    /// </summary>
    public WebsiteUrl: string = 'https://dev.azure.com/dynamicssmb2/DynamicsBCPublicFeeds/_artifacts/feed/MSApps';

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
    /// Converts the package source response to Package.
    /// </summary>
    public toPackage(data: any): Package {
        const pkg = this.Client.toPackage(data);
        pkg.Id = (data.id.split('.')).pop() || '';

        return pkg;
    }

    /// <summary>
    /// Check if the contains packages from a specific publisher.
    /// </summary>
    /// <param name="publisher">The publisher to check for.</param>
    /// <returns>True if the feed contains packages from the specified publisher.</returns>
    public isPublisherFeed(publisher: string): boolean {
        return (publisher.toLowerCase() === 'microsoft');
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
    /// Get package ID by publisher, name, id and country code.
    /// </summary>
    public getPackageId(publisher: string, name: string, id: string, countryCode?: string): string {
        let packageId = this.PackageIdSchema
            .replace('{publisher}', this.Client.normalize(publisher))
            .replace('{name}', this.Client.normalize(name))
            .replace('{id}', id === '00000000-0000-0000-0000-00000000000' ? '' : id)
            .replace('{countryCode}', countryCode ?? '')
            .replace('..','.')
            .replace(/\.+$/, ''); // Trim ending dots

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
    public getPackageByName(packageName: string, prerelease: boolean): Promise<any> {
        return this.Client.getPackageByName(packageName, prerelease);
    }

    /// <summary>
    /// Get package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    public getPackageById(packageId: string, prerelease: boolean): Promise<any> {
        return this.Client.getPackageById(packageId, prerelease);
    }

    /// <summary>
    /// Get package manifest by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    public getPackageManifestById(packageId: string, packageVersion: string): Promise<any> {
        return this.Client.getPackageManifestById(packageId, packageVersion);
    }

    /// <summary>
    /// Download package by Id.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <param name="packageVersion">The package version to fetch.</param>
    /// <returns>The package as a base64 string.</returns>
    public downloadPackageById(packageId: string, packageVersion: string): Promise<string> {
        return this.Client.downloadPackageById(packageId, packageVersion);
    }
}