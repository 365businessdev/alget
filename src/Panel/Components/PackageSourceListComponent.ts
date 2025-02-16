import * as vscode from "vscode";

import { IPackageSource } from "../../Package/PackageSource/IPackageSource";

/// <summary>
/// UI component to create a list of package sources.
/// </summary>
export class PackageSourceListComponent {

    /// <summary>
    /// Get the HTML for the package source list.
    /// </summary>
    /// <param name="packageSources">The package sources to display.</param>
    /// <returns>HTML for the package source list.</returns>
    public static getPackageSourceListHtml(packageSources: IPackageSource[], extensionUri: vscode.Uri | undefined = undefined): string {
        let pkgSourceListHtml = "";
        if (!extensionUri) {
            pkgSourceListHtml = "<ul class=\"fa-ul\">";
            for (const packageSource of packageSources) {
                pkgSourceListHtml += `<li><span class="fa-li"><i class="fa-solid fa-cube"></i></span>${packageSource.Name}</li>`;
            }
            pkgSourceListHtml += "</ul>";
        } else {
            const packageImgSrc = vscode.Uri.joinPath(extensionUri, "media", "nuget-icon.png");

            pkgSourceListHtml = "<ul>";
            for (const packageSource of packageSources) {
                pkgSourceListHtml += `<li><img src="${packageImgSrc}" align="left">${packageSource.Name}</li>`;
            }
            pkgSourceListHtml += "</ul>";
        }

        return pkgSourceListHtml;
    }


}