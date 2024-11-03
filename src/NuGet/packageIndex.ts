import axios from 'axios';

/// <summary>
/// Fetches the service URL for the given service name from the NuGet feed.
/// </summary>
export async function getServiceUrl(feedUrl: string, serviceName: string): Promise<string>
{
    // Fetch the service index
    const response = await axios.get(feedUrl);
    const resources = response.data.resources;

    // Find the service URL for the given service name
    const service = resources.find((resource: any) => resource['@type'].startsWith(serviceName));
    if (!service) {
        throw new Error(`${serviceName} not found in NuGet API response`);
    }

    // Remove trailing slash from the service URL if it exists
    let serviceUrl = service['@id'];
    if (serviceUrl.endsWith('/')) {
        serviceUrl = serviceUrl.slice(0, -1);
    }
    return serviceUrl;
}