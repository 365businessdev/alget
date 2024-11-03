import axios from 'axios';
import * as settings from '../Common/settings';
import { getServiceUrl } from './packageIndex';
import { Package } from '../Models/package';

/// <summary>
/// Fetches the packages from the NuGet.org feed
/// </summary>
export async function fetchPackages(packageName: string, prerelease: boolean) {
    fetchPackagesFromFeed(
        settings.NuGetOrgFeedName,
        settings.NuGetOrgFeedUrl,
        packageName,
        prerelease
    );
}

/// <summary>
/// Fetches the packages from the feed
/// </summary>
export async function fetchPackagesFromFeed(feedName: string, feedUrl: string, packageName: string, prerelease: boolean): Promise<Package[]> {
    try {
        packageName = packageName.replaceAll(' ', '');

        // Get the search URL for the feed
        const searchUrl = await getServiceUrl(feedUrl, 'SearchQueryService') + `?q=${packageName}&prerelease=${prerelease}`;
        console.log(`URL: ${searchUrl}`);
        // Fetch packages using the search URL
        const searchResponse = await axios.get(searchUrl);
        const nugetPackages = searchResponse.data.data;

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

            result.push(
                new Package(
                    nugetPackage.id,
                    (nugetPackage.id as string).split('.')[4],
                    null,
                    nugetPackage.version,
                    nugetPackage.title,
                    nugetPackage.description,
                    nugetPackage.authors[0],
                    countryCode,
                    {
                        name: feedName,
                        url: feedUrl
                    },
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