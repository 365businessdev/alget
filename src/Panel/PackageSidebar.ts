import * as vscode from "vscode";
import * as path from "path";

import { getNonce } from "./getNonce";
import { Package } from "../Package/Package";
import { PackageListComponent } from "./Components/PackageListComponent";

/// <summary>
/// Class to manage the package sidebar webview.
/// </summary>
export class PackageSidebar implements vscode.WebviewViewProvider {

  /// <summary>
  /// Specifies the ID of the tree view.
  /// </summary>
  /// <remarks>
  /// This property must match the ID in the package.json file.
  /// </remarks>
  public ViewId: string = "alget-package-sidebar";

  /// <summary>
  /// The view to display.
  /// </summary>
  public View?: vscode.WebviewView;

  private SearchQuery: string = "";

  /// <summary>
  /// List of packages to display.
  /// </summary>
  public Packages: Package[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) { }

  /// <summary>
  /// Create the webview view.
  /// </summary>
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.View = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.file(path.join(this._extensionUri.fsPath, "ui"))
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInstall": {
          if (!data.value) {
            return;
          }

          const pkg = this.Packages.find((pkg) => pkg.Id === data.value.packageId);
          if (!pkg) {
            vscode.window.showErrorMessage(`Unable to find package with ID '${data.value.packageId}'. Please report this issue.`);
            return;
          }

          vscode.commands.executeCommand("alget.installPackage", pkg, data.value.version);
          break;
        }
        case "onUpdate": {
          if (!data.value) {
            return;
          }

          const pkg = this.Packages.find((pkg) => pkg.Id === data.value.packageId);
          if (!pkg) {
            vscode.window.showErrorMessage(`Unable to find package with ID '${data.value.packageId}'. Please report this issue.`);
            return;
          }

          vscode.commands.executeCommand("alget.updatePackage", pkg, data.value.version);
          break;
        }
        case "onSearchPackages": {
          if (!data.value) {
            return;
          }
          this.SearchQuery = data.value;
          vscode.commands.executeCommand("alget.searchPackages", this.SearchQuery);
          break;
        }
        case "onSelectPackage": {
          if (!data.value) {
            return;
          }

          const pkg = this.Packages.find((pkg) => pkg.Id === data.value.packageId);
          if (!pkg) {
            vscode.window.showErrorMessage(`Unable to find package with ID '${data.value.packageId}'. Please report this issue.`);
            return;
          }

          vscode.commands.executeCommand("alget.selectPackage", pkg);
          break;
        }
        case "onRestoreState": {
          if (this.SearchQuery === data.value) {
            this.restoreState(this.SearchQuery, this.Packages);
          }
          break;
        }
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        default: {
          vscode.window.showInformationMessage(`Message Type '${data.type}' with value '${data.value}' received.`);
          break;
        }
      }
    });
  }

  private restoreState(searchQuery: string, packages: Package[]) {
    this.View!.webview.postMessage({
      type: "onRestoredState",
      value: {
        searchQuery: searchQuery,
        packages: PackageListComponent.getPackageListHtml(
                    packages, 
                    this.View!.webview.asWebviewUri(this._extensionUri))
      }
    });
  }
  
  /// <summary>
  /// Updates the package list in the sidebar.
  /// </summary>
  /// <param name="packages">The packages to display.</param>
  public updatePackageList(packages: Package[]) {
    if (!this.View) {
      return; // TODO: Implement error handling
    }

    // Update the list of packages
    this.Packages = packages;

    this.View.webview.postMessage({
      type: "onPackagesLoaded",
      value: PackageListComponent.getPackageListHtml(this.Packages, this.View.webview.asWebviewUri(this._extensionUri))
    });
  }

  public updatePackageItem(pkg: Package) {
    if (!this.View) {
      return; // TODO: Implement error handling
    }

    // Update the package item
    const existingPkgIndex = this.Packages.findIndex((p) => p.Id === pkg.Id);
    if (existingPkgIndex === -1) {
      this.Packages.push(pkg);
    } else {
      this.Packages[existingPkgIndex] = pkg;
    }

    // Update UI
    this.View.webview.postMessage({
      type: "onPackageUpdated",
      value: {
        packageId: pkg.Id,
        packageItem: PackageListComponent.getPackageItemHtml(pkg, this.View.webview.asWebviewUri(this._extensionUri))
      }
    });
  }

  /// <summary>
  /// Revive the webview view.
  /// </summary>
  /// <param name="webviewView">The webview view to revive.</param>
  public revive(webviewView: vscode.WebviewView) {
    this.View = webviewView;
  }

  /// <summary>
  /// Get the HTML content for the webview.
  /// </summary>
  /// <param name="webview">The webview to get the HTML for.</param>
  /// <returns>The HTML content for the webview.</returns>
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "ui", "css", "reset.css");
    const stylesVSCodePath = vscode.Uri.joinPath(this._extensionUri, "ui", "css", "vscode.css");

    const styleResetUri = webview.asWebviewUri(styleResetPath);
    const styleVSCodeUri = webview.asWebviewUri(stylesVSCodePath);

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "ui", "scripts", "packageSidebarWebviewHandler.js")
    );
    const styleALGetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "ui", "css", "alget-sidebar.css")
    );
    const styleALGetLoadingUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "ui", "css", "alget-loading.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleALGetUri}" rel="stylesheet">
        <link href="${styleALGetLoadingUri}" rel="stylesheet">
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</head>
      <body>
        <div class="loading-bar" id="loading-bar">
            <div class="loading-progress" id="loading-progress"></div>
        </div>
        <div class="search-bar">
        <input type="text" name="q" placeholder="Search for packages..." aria-label="Enter packages to search" autocomplete="off" value autofocus>
        </div>
        <div id="results" class="packageList"></div>
			</body>
			</html>`;
  }
}