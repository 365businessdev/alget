import axios from "axios";
import { getServiceUrl } from "./packageIndex";

export async function downloadPackage(packageName: string, version: string, feedUrl: string): Promise<string> {
    try {
        const downloadUrl = await getServiceUrl(feedUrl, 'PackageBaseAddress') + `/${packageName}/${version}/${packageName}.${version}.nupkg`;
        const downloadResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer'
        });
        const downloadData = Buffer.from(downloadResponse.data, 'binary').toString('base64');
        return downloadData;
    } catch (error) {
        console.error('Error downloading package:', error);
        return '';
    }
}
    