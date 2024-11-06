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
    if (packageSource.authorizationHeader !== undefined) {
        requestConfig.headers = {
            'Authorization': packageSource.authorizationHeader
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