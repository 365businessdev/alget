import { invokePackageAPIRequestAsync } from "./invokePackageAPIRequest";
import { getServiceUrl } from "./packageIndex";
import { PackageSource } from "../Models/package-source";

/// <summary>
/// Downloads the nupkg package from the feed.
/// </summary>
export async function downloadPackage(packageName: string, version: string, packageSource: PackageSource): Promise<string> {
    try {
        const downloadUrl = await getServiceUrl(packageSource, 'PackageBaseAddress') + `/${packageName}/${version}/${packageName}.${version}.nupkg`;

        const downloadResponse = await invokePackageAPIRequestAsync(downloadUrl, packageSource, 'arraybuffer');
        const downloadData = Buffer.from(downloadResponse, 'binary').toString('base64');
        return downloadData;
    } catch (error) {
        console.error('Error downloading package:', error);
        return '';
    }
}