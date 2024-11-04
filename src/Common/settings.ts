import * as vscode from 'vscode';

/// <summary>
/// The name of the extension.
/// </summary>
export const ExtensionName = "365businessdev-alget";

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
/// Gets the Microsoft Apps feed name.
/// </summary>
export const MSAppsFeedName = "MSApps";

/// <summary>
/// Gets the Microsoft Apps feed URL.
/// </summary>
export const MSAppsFeedUrl = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/MSApps/nuget/v3/index.json";

/// <summary>
/// Gets the AppSource Symbols feed name.
/// </summary>
export const AppSourceSymbolsFeedName = "AppSourceSymbols";

/// <summary>
/// Gets the AppSource Symbols feed URL.
/// </summary>
export const AppSourceSymbolsFeedUrl = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/AppSourceSymbols/nuget/v3/index.json";

/// <summary>
/// Returns the extension configuration.
/// </summary>
function getExtensionConfiguration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration("365businessdev.alget");
}

/// <summary>
/// Returns the country code for packages from the settings.
/// </summary>
export function getCountryCode(): string {
    try {
        return getExtensionConfiguration()["countryCode"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return "";
    }
}

/// <summary>
/// Specifies whether the Microsoft Symbols feed is enabled.
/// </summary>
export function preferMSAppsOverSymbols(): boolean {
    try {
        return getExtensionConfiguration()["preferMSAppsOverSymbols"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return false;
    }
}

/// <summary>
/// Specifies whether the Microsoft Apps and Symbols feed are enabled.
/// </summary>
export function isMicrosoftFeedsEnabled(): boolean {
    try {
        return getExtensionConfiguration()["enableMicrosoftFeeds"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return false;
    }
}

/// <summary>
/// Specifies whether the AppSource Symbols feed is enabled.
/// </summary>
export function isAppSourceSymbolsFeedEnabled(): boolean {
    try {
        return getExtensionConfiguration()["enableAppSourceSymbolsFeed"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return false;
    }
}

/// <summary>
/// Returns the custom feeds from the settings.
/// </summary>
export function getCustomFeeds(): any[] {
    try {
        return getExtensionConfiguration()["nugetFeeds"];
    } catch (error) {
        vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
        return [];
    }
}