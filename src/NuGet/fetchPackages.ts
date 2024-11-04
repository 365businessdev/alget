import axios from 'axios';
import * as settings from '../Common/settings';
import { getServiceUrl } from './packageIndex';
import { Package } from '../Models/package';
import { PackageSource } from '../Models/package-source';

/// <summary>
/// Fetches the packages from the NuGet.org feed
/// </summary>
export async function fetchPackages(packageName: string, prerelease: boolean) {
    fetchPackagesFromFeed(
        new PackageSource(
            settings.NuGetOrgFeedName,
            settings.NuGetOrgFeedUrl
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

        // Remove spaces and special characters from the package name
        packageName = packageName.replaceAll(' ', '').replace(/[/\\?%*:|"<>]/g, '');;

        let nugetPackages: any[] = [];
        if ((packageSource.name === settings.MSSymbolsFeedName) && (settings.preferMSAppsOverSymbols())) {
            try {
                // Fetch packages from both Microsoft feeds
                const [msAppsResponse, msSymbolsResponse] = await Promise.allSettled([
                    axios.get(await getServiceUrl(settings.MSAppsFeedUrl, 'SearchQueryService') + `?q=${packageName.replace('.symbols','')}&prerelease=${prerelease}`),
                    axios.get(await getServiceUrl(packageSource.url, 'SearchQueryService') + `?q=${packageName}&prerelease=${prerelease}`)
                ]);

                if (msAppsResponse.status === 'fulfilled' && msAppsResponse.value.data.data.length > 0) {
                    nugetPackages = msAppsResponse.value.data.data;

                    // change the package source to MS Apps feed
                    packageSource = new PackageSource(
                        settings.MSAppsFeedName,
                        settings.MSAppsFeedUrl
                    );
                } else if (msSymbolsResponse.status === 'fulfilled') {
                    nugetPackages = msSymbolsResponse.value.data.data;
                }
            } catch (error) {
                console.error('Error fetching packages from feeds:', error);
            }
        } 
        
        if (nugetPackages.length === 0) {
            // Get the search URL for the feed
            const searchUrl = await getServiceUrl(packageSource.url!, 'SearchQueryService') + `?q=${packageName}&prerelease=${prerelease}`;
            // Fetch packages using the search URL
            const searchResponse = await axios.get(searchUrl);
            nugetPackages = searchResponse.data.data;
        }

        let configCountryCode = settings.getCountryCode().toLowerCase();
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