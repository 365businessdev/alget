import axios from "axios";
import { PackageSource } from "../Models/package-source";

/// <summary>
/// Invokes a package API request.
/// </summary>
export async function invokePackageAPIRequestAsync(url: string, packageSource: PackageSource, responseType?: axios.ResponseType | undefined): Promise<any> {
    if (url === "") {
        throw new Error("The URL is not defined.");
    }
    console.log(`URL: ${url}`);

    let requestConfig : axios.AxiosRequestConfig = {};
    // add authorization if needed
    if (packageSource.apiKey !== undefined) {
        const encodedPAT = Buffer.from(`:${packageSource.apiKey}`).toString('base64');
        requestConfig.headers = {
            'Authorization': `Basic ${encodedPAT}`
        };
    }

    if (responseType !== undefined) {
        requestConfig.responseType = responseType;
    }

    const response = await axios.get(
        url,
        requestConfig
    );

    return response.data;
}