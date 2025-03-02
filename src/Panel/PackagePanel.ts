import * as vscode from "vscode";
import * as path from "path";

import { getNonce } from "./getNonce";
import { Package } from "../Package/Package";
import { PackageComponent } from "./Components/PackageComponent";

/// <summary>
/// Class to manage the package source panel webview.
/// </summary>
export class PackagePanel {

    /// <summary>
    /// Specifies the ID of the tree view.
    /// </summary>
    /// <remarks>
    /// This property must match the ID in the package.json file.
    /// </remarks>
    public ViewId: string = "alget-package";

    /// <summary>
    /// The current panel.
    /// </summary>
    /// <remarks>
    /// Only one panel can exist at a time.
    /// </remarks>
    public static currentPanel: PackagePanel | undefined;

    public static readonly viewType = "swiper";

    private Package: Package;
    private PackageManifest: any;

    private readonly panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    /// <summary>
    /// Create a new package source panel or show the existing one.
    /// </summary>
    /// <param name="extensionUri">The extension URI.</param>
    /// <param name="pkg">The package to display.</param>
    public static createOrShow(extensionUri: vscode.Uri, pkg: Package): PackagePanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Reuse the current panel if it exists.
        if (PackagePanel.currentPanel) {
            PackagePanel.currentPanel.panel.title = `ALGet: ${pkg.Name}`;
            PackagePanel.currentPanel.panel.reveal(column);
            PackagePanel.currentPanel.updatePanel(pkg);

            return PackagePanel.currentPanel;
        }

        // Create a new panel.
        const panel = vscode.window.createWebviewPanel(
            PackagePanel.viewType,
            `ALGet: ${pkg.Name}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                        extensionUri,
                        vscode.Uri.file(path.join(extensionUri.fsPath, "ui"))
                ],
            }
        );

        PackagePanel.currentPanel = new PackagePanel(panel, extensionUri, pkg);
        return PackagePanel.currentPanel;
    }

    /// <summary>
    /// Close the current panel.
    /// </summary>
    public static kill() {
        PackagePanel.currentPanel?.dispose();
        PackagePanel.currentPanel = undefined;
    }

    /// <summary>
    /// Revive the current panel.
    /// </summary>
    /// <param name="panel">The webview panel.</param>
    /// <param name="extensionUri">The extension URI.</param>
    // public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    //     PackagePanel.currentPanel = new PackagePanel(panel, extensionUri);
    // }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, pkg: Package) {
        this.panel = panel;
        this._extensionUri = extensionUri;
        this.Package = pkg;

        // Set the webview's initial html content
        this.updatePanel(this.Package);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public setManifest(manifest: any) {
        this.PackageManifest = manifest;
    }

    public updateContentArea(tab: string, data: any) {
        switch (tab) {
            case "details":
                data = PackageComponent.getPackageDetailsComponent(data);
                break;
            case "dependencies":
            case "sources":
                data = "<p>Not implemented yet.</p>";
                break;
            case "developer":
                this.panel.webview.postMessage({
                    type: "setContentArea",
                    value: {
                        tab: tab,
                        data: this.PackageManifest
                    }
                });


                this.panel.webview.postMessage({
                    type: "setContentArea",
                    value: {
                        tab: tab,
                        data: this.Package
                    }
                });
                return;
        } 

        this.panel.webview.postMessage({
            type: "setContentArea",
            value: {
                tab: tab,
                data: data
            }
        });
    }

    /// <summary>
    /// Dispose the panel.
    /// </summary>
    public dispose() {
        PackagePanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async updatePanel(pkg: Package) {
        const webview = this.panel.webview;

        this.panel.webview.html = this.getHtmlForWebview(webview);

        this.panel.webview.postMessage({
            type: "showPackage",
            value: PackageComponent.getPackageHeaderComponent(
                    pkg, 
                    this.panel.webview.asWebviewUri(this._extensionUri))
        });

        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onSelectContentArea": {
                    if (!data.value) {
                        return;
                    }
                    if (data.value === "details") {
                        this.panel.title = `ALGet: ${pkg.Name}`;
                    } else {
                        this.panel.title = `ALGet: ${pkg.Name} - ${data.value.toUpperCase()}`;
                    }

                    this.updateContentArea(data.value, pkg);
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
            }
        });

        this.updateContentArea('details', pkg);
    }

    /// <summary>
    /// Get the HTML content for the webview.
    /// </summary>
    /// <param name="webview">The webview.</param>
    /// <returns>The HTML content for the webview.</returns>
    private getHtmlForWebview(webview: vscode.Webview) {
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "ui", "css", "reset.css");
        const stylesVSCodePath = vscode.Uri.joinPath(this._extensionUri, "ui", "css", "vscode.css");
    
        const styleResetUri = webview.asWebviewUri(styleResetPath);
        const styleVSCodeUri = webview.asWebviewUri(stylesVSCodePath);
        
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "ui", "scripts", "packageWebviewHandler.js")
        );
        const styleALGetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "ui", "css", "alget-webview.css")
        );
        const styleALGetLoadingUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "ui", "css", "alget-loading.css")
        );

        // Use a nonce to only allow specific scripts to be run
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
            <body style="margin: 20px;">
                <div class="loading-bar">
                    <div class="loading-progress" style="display: block;"></div>
                </div>
			</body>
			</html>`;
    }
}