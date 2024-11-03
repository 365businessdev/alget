import * as vscode from 'vscode';

/// <summary>
/// The name of the extension.
/// </summary>
export const ExtensionName = "365businessdev.alget";

/// <summary>
/// The prefix for the output channel.
/// </summary>
export const ExtensionOutputPrefix = "ALGet: ";

/// <summary>
/// The name of the webview.
/// </summary>
export const ExtensionWebviewName = "ALGet Package Manager";

/// <summary>
/// The title of the webview.
/// </summary>
export const NuGetOrgFeedName = "NuGet.org";

/// <summary>
/// Gets the NuGet.org feed URL.
/// </summary>
export const NuGetOrgFeedUrl = "https://api.nuget.org/v3/index.json";

/// <summary>
/// Gets the Microsoft Symbols feed name.
/// </summary>
export const MSSymbolsFeedName = "MSSymbols";

/// <summary>
/// Gets the Microsoft Symbols feed URL.
/// </summary>
export const MSSymbolsFeedUrl = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/MSSymbols/nuget/v3/index.json";

/// <summary>
/// Gets the AppSource Symbols feed name.
/// </summary>
export const AppSourceSymbolsFeedName = "AppSourceSymbols";

/// <summary>
/// Gets the AppSource Symbols feed URL.
/// </summary>
export const AppSourceSymbolsFeedUrl = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/AppSourceSymbols/nuget/v3/index.json";

/// <summary>
/// Returns the country code for packages from the settings.
/// </summary>
export function getCountryCode(): string {
    const configuration = vscode.workspace.getConfiguration(ExtensionName);

    try {
        return configuration["countryCode"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return "";
    }
} 