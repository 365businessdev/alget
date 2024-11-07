import { Settings } from '../Common/settings';
import { getServiceUrl } from './packageIndex';
import { Package } from '../Models/package';
import { PackageSource } from '../Models/package-source';
import { invokePackageAPIRequestAsync } from './invokePackageAPIRequest';
import * as output from "../output";

/// <summary>
/// Fetches the packages from the NuGet.org feed
/// </summary>
export async function fetchPackages(packageName: string, prerelease: boolean) {
    fetchPackagesFromFeed(
        new PackageSource(
            Settings.NuGetOrgFeedName,
            Settings.NuGetOrgFeedUrl
        ),
        packageName,
        prerelease
    );
}

/// <summary>
/// Fetches the packages from the feed
/// </summary>
export async function fetchPackagesFromFeed(packageSource: PackageSource, packageName: string, prerelease: boolean): Promise<Package[]> {
    try {
        if (!packageSource.url) {
            throw new Error('The feed URL is not defined.');
        }

        packageName = packageName.replaceAll(' ', '');

        // Get the search URL for the feed
        const searchUrl = await getServiceUrl(packageSource, 'SearchQueryService') + `?q=${packageName}&prerelease=${prerelease}`;
        // Fetch packages using the search URL
        const searchResponse = await invokePackageAPIRequestAsync(searchUrl, packageSource);
        const nugetPackages = searchResponse.data;

        let configCountryCode = Settings.getCountryCode().toLowerCase();
        let result: Package[] = [];
        
        nugetPackages.forEach((nugetPackage: any) => {
            let countryCode = '';
            try {
                countryCode = (nugetPackage.id as string).split('.')[2].toLowerCase();
                if (countryCode.length !== 2) {
                    countryCode = '';
                }            

                if ((configCountryCode !== 'w1') && (countryCode !== '') && (configCountryCode !== countryCode)) {
                    return; // Skip packages that are not for the configured country
                }    
            } catch {
                countryCode = '';
            }

            let appId : string | undefined = undefined;
            try {
                const nugetPackageIdParts: string[] = (nugetPackage.id as string).split('.');
                appId = nugetPackageIdParts[nugetPackageIdParts.length - 1];
                if (!isGuid(appId)) {
                    appId = undefined;
                }
            } catch {
                appId = undefined;
            }

            result.push(
                new Package(
                    nugetPackage.id,
                    appId,
                    null,
                    nugetPackage.version,
                    nugetPackage.title,
                    nugetPackage.description,
                    nugetPackage.authors[0],
                    countryCode,
                    packageSource,
                    nugetPackage
                )
            );
        });
        return result;
    } catch (error) {
        console.error('Error fetching packages:', error);
        output.logError(`Fetching packages from ${packageSource.name} failed: ${error}`.replace("AxiosError: ",""));
        return [];
    }
}

/// <summary>
/// Checks if a string is a valid GUID
/// </summary>
function isGuid(value: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}