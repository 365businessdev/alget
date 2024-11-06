import { getServiceUrl } from "./packageIndex";
import { invokePackageAPIRequestAsync } from "./invokePackageAPIRequest";
import { PackageSource } from "../Models/package-source";

const xml2js = require('xml2js');

/// <summary>
/// Downloads the package manifest from the feed.
/// </summary>
export async function downloadPackageManifest(packageName: string, version: string, packageSource: PackageSource): Promise<any> {
    try {
        const downloadUrl = await getServiceUrl(packageSource, 'PackageBaseAddress') + `/${packageName}/${version}/${packageName}.nuspec`.toLowerCase();

        const searchResponse = await invokePackageAPIRequestAsync(downloadUrl, packageSource);
        
        const parser = new xml2js.Parser();
        const result = (await parser.parseStringPromise(searchResponse)).package;
        return result;
    } catch (error) {
        console.error('Error downloading package manfest:', error);
        return '';
    }
}
    