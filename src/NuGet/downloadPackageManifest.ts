import axios from "axios";
import { getServiceUrl } from "./packageIndex";
const xml2js = require('xml2js');

/// <summary>
/// Downloads the package manifest from the feed.
/// </summary>
export async function downloadPackageManifest(packageName: string, version: string, feedUrl: string): Promise<any> {
    try {
        const downloadUrl = await getServiceUrl(feedUrl, 'PackageBaseAddress') + `/${packageName}/${version}/${packageName}.nuspec`.toLowerCase();
        const searchResponse = await axios.get(downloadUrl);
        
        const parser = new xml2js.Parser();
        const result = (await parser.parseStringPromise(searchResponse.data)).package;
        return result;
    } catch (error) {
        console.error('Error downloading package manfest:', error);
        return '';
    }
}
    