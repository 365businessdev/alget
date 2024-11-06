import * as vscode from 'vscode';

export class Settings {

    private static ExtensionConfigurationScope: vscode.ConfigurationScope | null = null;

    /// <summary>
    /// The name of the extension.
    /// </summary>
    public static ExtensionName: string = "365businessdev-alget";

    /// <summary>
    /// The prefix for the output channel.
    /// </summary>
    public static ExtensionOutputPrefix: string = "ALGet: ";

    /// <summary>
    /// The name of the webview.
    /// </summary>
    public static ExtensionWebviewName: string = "ALGet Package Manager";

    /// <summary>
    /// The title of the webview.
    /// </summary>
    public static NuGetOrgFeedName: string = "NuGet.org";

    /// <summary>
    /// Gets the NuGet.org feed URL.
    /// </summary>
    public static NuGetOrgFeedUrl: string = "https://api.nuget.org/v3/index.json";

    /// <summary>
    /// Gets the Microsoft Symbols feed name.
    /// </summary>
    public static MSSymbolsFeedName: string = "MSSymbols";

    /// <summary>
    /// Gets the Microsoft Symbols feed URL.
    /// </summary>
    public static MSSymbolsFeedUrl: string = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/MSSymbols/nuget/v3/index.json";

    /// <summary>
    /// Gets the AppSource Symbols feed name.
    /// </summary>
    public static AppSourceSymbolsFeedName: string = "AppSourceSymbols";

    /// <summary>
    /// Gets the AppSource Symbols feed URL.
    /// </summary>
    public static AppSourceSymbolsFeedUrl: string = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/AppSourceSymbols/nuget/v3/index.json";

    /// <summary>
    /// Sets the extension configuration scope.
    /// </summary>
    public static setExtensionConfigurationScope(uri: vscode.Uri) {
        this.ExtensionConfigurationScope = uri;
    }

    /// <summary>
    /// Returns the extension configuration.
    /// </summary>
    public static getExtensionConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("365businessdev.alget", this.ExtensionConfigurationScope);
    }

    /// <summary>
    /// Returns the country code for packages from the settings.
    /// </summary>
    public static getCountryCode(): string {
        try {
            return this.getExtensionConfiguration()["countryCode"];
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
            return "w1";
        }
    }

    /// <summary>
    /// Specifies whether the Microsoft Symbols feed is enabled.
    /// </summary>
    public static isMSSymbolsFeedEnabled(): boolean {
        try {
            return this.getExtensionConfiguration()["enableMSSymbolsFeed"];
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
            return false;
        }
    }

    /// <summary>
    /// Specifies whether the AppSource Symbols feed is enabled.
    /// </summary>
    public static isAppSourceSymbolsFeedEnabled(): boolean {
        try {
            return this.getExtensionConfiguration()["enableAppSourceSymbolsFeed"];
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
            return false;
        }
    }

    /// <summary>
    /// Returns the custom feeds from the settings.
    /// </summary>
    public static getCustomFeeds(): any[] {
        try {
            return this.getExtensionConfiguration()["nugetFeeds"];
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing ALGet settings: ${error}`);
            return [];
        }
    }
}