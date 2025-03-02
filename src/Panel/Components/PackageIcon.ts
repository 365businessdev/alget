import * as vscode from "vscode";

import { Package } from "../../Package/Package";

export class PackageIcon {
    /// <summary>
    /// Get the icon for a package.
    /// </summary>
    /// <param name="pkg">The package to get the icon for.</param>
    /// <param name="extensionUri">The URI of the extension.</param>
    /// <returns>The URI of the package icon.</returns>
    public static getPackageIcon(pkg: Package, extensionUri: vscode.Uri): vscode.Uri {
        let packageIcon = "nuget-icon.svg";
        
        switch (pkg.Publisher.toLowerCase()) {
            case "microsoft":
                packageIcon = "microsoft-icon.png";
                break;
            case "365 business development":
                packageIcon = "365businessdev-icon.png";
        }
        
        return (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark) ? 
            vscode.Uri.joinPath(extensionUri, "media", "dark", packageIcon)
            :
            vscode.Uri.joinPath(extensionUri, "media", "light", packageIcon);
    }
}