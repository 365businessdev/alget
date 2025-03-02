import { Package } from "../../Package";
import { PackageVersion } from '../../PackageVersion';

/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
const xml2js = require('xml2js');

export class NuGetClient {
    /// <summary>
    /// Specifies the base URL to the NuGet feed.
    /// </summary>
    private baseUrl: string;

    /// <summary>
    /// Specifies the authentication header, if required.
    /// </summary>
    private authenticationHeader: string | undefined;

    /// <summary>
    /// Initializes a new instance of the NuGetClient class.
    /// </summary>
    /// <param name="baseUrl">The base URL to the NuGet feed.</param>
    /// <param name="authenticationHeader">The authentication header, if required.</param>
    constructor(baseUrl: string, authenticationHeader?: string) {
        this.baseUrl = baseUrl;
        this.authenticationHeader = authenticationHeader;
    }

    /// <summary>
    /// Normalizes the given string, to be used in package ID.
    /// </summary>
    /// <param name="string">The string to normalize.</param>
    /// <returns>The normalized string.</returns>
    /// <remarks>
    /// The normalization process removes all non-alphanumeric characters from the string.
    /// This is typically used to normalize publisher and package names.
    /// </remarks>
    public normalize(string: string): string {
        return string.replace(/[^a-zA-Z0-9]/g, '');
    }

    /// <summary>
    /// Fetches the package by name.
    /// </summary>
    /// <param name="packageName">The package name to fetch.</param>
    /// <param name="prerelease">Specifies if prerelease packages should be included.</param>
    /// <returns>The package details.</returns>
    public async getPackageByName(packageName: string, prerelease: boolean = true): Promise<any> {
        packageName = packageName.replaceAll(' ', '');

        return await this.getPackageById(packageName, prerelease);
    }

    /// <summary>
    /// Fetches the package by ID.
    /// </summary>
    /// <param name="packageId">The package ID to fetch.</param>
    /// <returns>The package details.</returns>
    public async getPackageById(packageId: string, prerelease: boolean = true): Promise<any> {
        // Fetch the service URL for the search query service
        const serviceUrl = await this.getServiceUrl('SearchQueryService');

        // Fetch the package by Id
        const url = `${serviceUrl}?q=${packageId}&prerelease=${prerelease}`;

        // Fetch the package by Id
        const response = await this.invokeAPIRequest(url);
        const responseData = (await response.json()) as any;


        return responseData.data;
    }

    /// <summary>
    /// Get the package manifest by ID and version.
    /// </summary>
    public async getPackageManifestById(packageId: string, packageVersion: string): Promise<any> {
        // Fetch the service URL for the package base address
        const serviceUrl = await this.getServiceUrl('PackageBaseAddress');
        
        try {
            // Download the package manifest
            const url = `${serviceUrl}/${packageId}/${packageVersion}/${packageId}.nuspec`.toLowerCase();
            const response = await this.invokeAPIRequest(url);

            const nugetResponse = await response.text();
            
            // Parse the package manifest
            const parser = new xml2js.Parser();
            const result = (await parser.parseStringPromise(nugetResponse)).package;

            return result;
        } catch (error) {
            console.error('Error downloading package manfest:', error);
            return '';
        }
    }

    /// <summary>
    /// Downloads the package by ID and version.
    /// </summary>
    /// <param name="packageId">The package ID to download.</param>
    /// <param name="packageVersion">The package version to download.</param>
    /// <returns>The package as a base64 string.</returns>
    public async downloadPackageById(packageId: string, packageVersion: string): Promise<string> {
        // Fetch the service URL for the package base address
        const serviceUrl = await this.getServiceUrl('PackageBaseAddress');

        try {
            // Download the package
            const url = `${serviceUrl}/${packageId}/${packageVersion}/${packageId}.${packageVersion}.nupkg`;
            const response = await this.invokeAPIRequest(url);

            if (!response.ok) {
                throw new Error(`Failed to download package: ${response.statusText}`);
            }

            // Convert the response to a base64 string
            const buffer = await response.arrayBuffer();
            const result = Buffer.from(buffer).toString("base64");

            return result;
        } catch (error) {
            console.error('Error downloading package:', error);
            return '';
        }
    }

    /// <summary>
    /// Reads the actual service URL from the NuGet feed index.
    /// </summary>
    /// <param name="serviceName">The name of the service to read the URL for.</param>
    /// <returns>The URL of the service.</returns>
    private async getServiceUrl(serviceName: string): Promise<string>
    {
        // Fetch the service index
        const httpResponse : Response = await this.invokeAPIRequest(this.baseUrl);
        const response: any = await httpResponse.json();
        const resources = response.resources;
    
        // Find the service URL for the given service name
        const service = resources.find((resource: any) => resource['@type'].startsWith(serviceName));
        if (!service) {
            throw new Error(`${serviceName} not found in NuGet API response`);
        }
    
        // Remove trailing slash from the service URL if it exists
        let serviceUrl = service['@id'];
        if (serviceUrl.endsWith('/')) {
            serviceUrl = serviceUrl.slice(0, -1);
        }
        return serviceUrl;
    }

    /// <summary>
    /// Invokes the API request to the given URL.
    /// </summary>
    private async invokeAPIRequest(url: string): Promise<Response>  {
        const request: Request = new Request(url);
        if (this.authenticationHeader) {
            request.headers.append('Authorization', this.authenticationHeader);
        }

        const response = await fetch(request);
        if (response.status !== 200) {
            switch (response.status) {
                case 401:
                    throw new Error('Unauthorized attempt to access the resource');
                case 404:
                    throw new Error(`Resource not found: ${url}`);
                case 500:
                    throw new Error('Internal server error, please try again later');
                default:
                    throw new Error(`Failed to fetch URL: ${url}`);
            }
        }
        return response;
    }

    /// <summary>
    /// Converts the NuGet package metadata (nuspec) to a Package object.
    /// </summary>
    /// <param name="nuSpec">The NuGet response, typically the nuspec package metadata.</param>
    /// <returns>Package object.</returns>
    /// <seealso cref="https://docs.microsoft.com/en-us/nuget/reference/nuspec"/>
    public toPackage(nuspec: any): Package {
        const pkg = new Package('', nuspec.title, nuspec.authors[0]);
        pkg.Description = nuspec.description;
        
        for (const nuGetVersion of nuspec.versions) {
            pkg.PackageVersions.push(new PackageVersion(nuGetVersion.version));
        }

        return pkg;
    }
}