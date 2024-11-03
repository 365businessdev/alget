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

        packageName = packageName.replaceAll(' ', '');

        // Get the search URL for the feed
        const searchUrl = await getServiceUrl(packageSource.url, 'SearchQueryService') + `?q=${packageName}&prerelease=${prerelease}`;
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