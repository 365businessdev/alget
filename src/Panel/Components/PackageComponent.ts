import * as vscode from "vscode";

import { Package } from "../../Package/Package";
import { PackageIcon } from "./PackageIcon";
import { ThemeHelper } from "./ThemeHelper";
import { PackageSourceType } from "../../Package/PackageSource/PackageSourceType";

export class PackageComponent {

    public static getPackageHeaderComponent(pkg: Package, extensionUri: vscode.Uri): string {
        return `<header>
    <img src="${PackageIcon.getPackageIcon(pkg, extensionUri)}" alt="icon">
    <div>
        <div class="header-line1">
            <span>
                <h1>${pkg.Name}</h1>
            </span>
            <span class="tags">
                ${
                    pkg.isApp() ?
                        '<span class="app" title="This package is available as an app including source code.">app</span>'
                        :
                        ''
                }
                ${
                    pkg.isSymbol() ?
                        '<span class="symbols" title="This package includes symbols for debugging.">symbols</span>'
                        :
                        ''
                }
                ${
                    pkg.isRuntimePackage() ?
                        '<span class="runtime" title="This package can be used as a runtime package for Dynamics 365 Business Central On-Premise.">runtime</span>'
                        :
                        ''
                }
            </span>
        </div>

        <div class="header-line2">
            <div class="publisher">
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
            </div>
            <div>1234 Downloads</div>
            <div>Rating: ★★★★☆</div>
        </div>
        <div class="header-line3">
            ${pkg.BriefDescription ? pkg.BriefDescription : pkg.Description}
        </div>
        <div class="header-action-line">
            ${
                !pkg.isInstalled() ?
                    `<button id="install">Install</button>`
                    :
                    ''
            }
            ${
                pkg.isUpdateAvailable() ?
                    `<button id="update">Update</button>`
                    :
                    ''
            }
            ${
                pkg.isInstalled() ?
                    `<button id="uninstall">Uninstall</button>`
                    :
                    ''
            }
            <!--
            // TODO: Add prerelease support
            <label>
                <input type="checkbox"> Prerelease
            </label>
            -->
            <img src="${
                ThemeHelper.isVSCodeDarkTheme() ?
                    vscode.Uri.joinPath(extensionUri, "media", "dark", "settings-gear.svg")
                    :
                    vscode.Uri.joinPath(extensionUri, "media", "light", "settings-gear.svg")
            }" alt="settings">
        </div>
    </div>
</header>
<!-- Tabs -->
<div class="tab-area" id="tab-area">
    <div id="details-tab" class="active">Details</div>
    <div id="dependencies-tab">Dependencies</div>
    <div id="sources-tab">Sources</div>
    <div id="developer-tab">Developer</div>
</div>
<hr id="tab-underline" class="tab-underline">
<!-- Content -->
<div class="content-area" id="content-area">
    <div class="loading-bar">
        <div class="loading-progress" style="display: block;"></div>
    </div>
</div>`;
    }

    public static getPackageDetailsComponent(pkg: Package): string {
        const pkgId = pkg.PackageSources[0].getPackageId(pkg.Publisher, pkg.Name, pkg.Id, '' /** TODO: Implement Country Code **/);
        const pkgUrl = `${pkg.PackageSources[0].WebsiteUrl}/NuGet/${pkgId}`;

        let pkgVersions = '';
        let optionSelected: boolean = false;
        pkg.PackageVersions.sort((a, b) => a.Version.localeCompare(b.Version));
        
        const pkgVersionsCount = pkg.PackageVersions.length;
        for (let i = 0; i < pkgVersionsCount; i++) {
            const pkgVersion = pkg.PackageVersions[i];

            if (pkgVersion === pkg.Version) {
                optionSelected = true;
            }

            pkgVersions += `<option value="${pkgVersion.Version}" ${(pkgVersion === pkg.Version) || (!optionSelected && i === pkgVersionsCount - 1) ? 'selected' : ''}>`;
            pkgVersions += pkgVersion.Version;
            pkgVersions += `</option>`;
        }

        return `<div id="tab-details" class="tab">
    <h1>${pkg.Name}</h1>
    <hr>
    <div class="version-selector">
        <label for="version-select">Version:</label>
        <select id="version-select">
            ${pkgVersions}
        </select>
    </div>
    <hr>
    <h2>Description</h2>
    <p>
        ${pkg.Description}
    </p>
    <h2>Package Information</h2>
    <div class="properties">
        <div>
            <strong>Publisher:</strong>
            <span>${pkg.Publisher}</span>
        </div>
        <div>
            <strong>Package ID:</strong>
            <span id="package-id">${pkgId}</span>
        </div>
        <div>
            <strong>ID:</strong>
            <span>${pkg.Id}</span>
        </div>
        <!--
        <div>
            <strong>License:</strong>
            <span></span>
        </div>
        <div>
            <strong>Tags:</strong>
            <span>print, agent, business</span>
        </div>
        -->
        <div>
            <strong>Package URL:</strong>
            <span><a href="${pkgUrl}" target="_blank">${pkgUrl}</a></span>
        </div>
    </div>
    <h2>Dependency</h2>
    <pre>
        {
            "dependencies": [
                {
                    "id": "${pkg.Id}",
                    "name": "${pkg.Name}",
                    "publisher": "${pkg.Publisher}",
                    "version": "1.0.0.0"
                }
            ]
        }
    </pre>
</div>`;
    }

    public static getPackageDependenciesComponent(pkgManifest: any): string {
        let html = `<div id="tab-details" class="tab">
            <h1>Package Dependencies</h1>
            <hr>`;
        
        if (pkgManifest.metadata[0].dependencies) {
            const manifestDependencies = pkgManifest.metadata[0].dependencies[0].dependency;
            for (const dependency of manifestDependencies) {
                html += `<h2>${dependency.$.id}</h2>
    <div id="${dependency.$.id}" class="dependency">
        <div class="properties">
            <div>
                <strong>Package ID:</strong>
                <span>${dependency.$.id}</span>
            </div>
            <div>
                <strong>Version:</strong>
                <span>${dependency.$.version}</span>
            </div>
        </div>
    </div>`;
            }
        }

        return html;
    }

    public static getPackageSourcesComponent(pkg: Package): string {
        let html = `<div id="tab-details" class="tab">
            <h1>Package Sources</h1>
            <hr>`;

        const sources = pkg.PackageSources.filter(ps => ps.Type !== PackageSourceType.Workspace);
        for (const source of sources) {
            const pkgId = source.getPackageId(pkg.Publisher, pkg.Name, pkg.Id, '' /** TODO: Implement Country Code **/);

            html += `<h2>${source.Name}</h2>
    <div id="${source.Name}" class="source">
        <div class="properties">
            <div>
                <strong>Source:</strong>
                <span>${source.Description}</span>
            </div>
            ${ source.WebsiteUrl ? `<div>
                <strong>Website:</strong>
                <span><a href="${source.WebsiteUrl}/NuGet/${pkgId}" target="_blank">${source.WebsiteUrl}/NuGet/${pkgId}</a></span>
            </div>` : '' }
        </div>
    </div>`;
        }

        return html;
    }
   
}