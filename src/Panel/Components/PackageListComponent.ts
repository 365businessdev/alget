import * as vscode from "vscode";

import { Package } from "../../Package/Package";
import { PackageIcon } from "./PackageIcon";
import { ThemeHelper } from "./ThemeHelper";

/// <summary>
/// UI component to create a list of packages.
/// </summary>
export class PackageListComponent {
    /// <summary>
    /// Get the HTML for the package list, based on the provided packages.
    /// </summary>
    /// <param name="packages">The packages to display.</param>
    /// <param name="extensionUri">The URI of the extension.</param>
    /// <returns>HTML for the package list.</returns>
    public static getPackageListHtml(packages: Package[], extensionUri: vscode.Uri): string {
        if (packages.length === 0) {
            return "<p>No packages found.<br>Please check package source configuration and try again.</p>";
        }

        let pkgListHtml = "";
        for (const pkg of packages) {
            pkgListHtml += this.getPackageItemHtml(pkg, extensionUri);
        }
        return pkgListHtml;
    }

    /// <summary>
    /// Get the HTML for a package item.
    /// </summary>
    /// <param name="pkg">The package to display.</param>
    /// <param name="extensionUri">The URI of the extension.</param>
    /// <returns>HTML for the package item.</returns>
    private static getPackageItemHtml(pkg: Package, extensionUri: vscode.Uri): string {
        return `<div class="packageItem" id="${pkg.Id}" >
            <div class="icon">
                <img src="${PackageIcon.getPackageIcon(pkg, extensionUri)}" alt="package icon">
            </div>
            <div class="details">
                <div class="header">
                    <span>${pkg.Name}</span>
                    <span>${
                        pkg.Version === undefined ?
                            pkg.PackageVersions ? pkg.PackageVersions.sort((a, b) => b.toString().localeCompare(a.toString(), undefined, { numeric: true }))[0] : "N/A"
                            :
                            pkg.Version
                    }</span>
                </div>
                <div>
                    ${pkg.Description}
                </div>
                <div class="footer">
                    <span>
                        ${
                            // Show the verified publisher icon if the publisher is Microsoft or 365 business development
                            // TODO: Add a check for verified publishers
                            pkg.Publisher.toLowerCase() === "microsoft" || pkg.Publisher.toLowerCase() === "365 business development" ?
                                `<img src="${
                                    ThemeHelper.isVSCodeDarkTheme() ?
                                        vscode.Uri.joinPath(extensionUri, "media", "dark", "verified.svg")
                                        :
                                        vscode.Uri.joinPath(extensionUri, "media", "light", "verified.svg")
                                }" alt="verified publisher">`
                                :
                                ''
                        }
                        ${pkg.Publisher}
                    </span>
                    ${
                        // Show Update button if the package is installed and an update is available
                        pkg.isUpdateAvailable() ?
                            `<button id="update">Update</button>`
                            :
                            ''
                    }
                    ${
                        // Show the settings gear icon if the package is installed
                        pkg.isInstalled() ?
                            `<img src="${
                                ThemeHelper.isVSCodeDarkTheme() ?
                                    vscode.Uri.joinPath(extensionUri, "media", "dark", "settings-gear.svg")
                                    :
                                    vscode.Uri.joinPath(extensionUri, "media", "light", "settings-gear.svg")
                            }" id="settings" alt="settings">`
                            :
                            `<button id="install">Install</button>`
                    }
                </div>
            </div>
        </div>`;
    }
}