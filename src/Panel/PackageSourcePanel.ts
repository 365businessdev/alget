import * as vscode from "vscode";

import { getNonce } from "./getNonce";

/// <summary>
/// Class to manage the package source panel webview.
/// </summary>
export class PackageSourcePanel {

    /// <summary>
    /// The current panel.
    /// </summary>
    /// <remarks>
    /// Only one panel can exist at a time.
    /// </remarks>
    public static currentPanel: PackageSourcePanel | undefined;

    public static readonly viewType = "swiper";

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    /// <summary>
    /// Create a new package source panel or show the existing one.
    /// </summary>
    /// <param name="extensionUri">The extension URI.</param>
    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Reuse the current panel if it exists.
        if (PackageSourcePanel.currentPanel) {
            PackageSourcePanel.currentPanel.panel.reveal(column);
            PackageSourcePanel.currentPanel.updatePanel();
            return;
        }

        // Create a new panel.
        const panel = vscode.window.createWebviewPanel(
            PackageSourcePanel.viewType,
            "ALGetPackageSourcePanel",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.joinPath(extensionUri, "out/compiled"),
                ],
            }
        );

        PackageSourcePanel.currentPanel = new PackageSourcePanel(panel, extensionUri);
    }

    /// <summary>
    /// Close the current panel.
    /// </summary>
    public static kill() {
        PackageSourcePanel.currentPanel?.dispose();
        PackageSourcePanel.currentPanel = undefined;
    }

    /// <summary>
    /// Revive the current panel.
    /// </summary>
    /// <param name="panel">The webview panel.</param>
    /// <param name="extensionUri">The extension URI.</param>
    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        PackageSourcePanel.currentPanel = new PackageSourcePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // Set the webview's initial html content
        this.updatePanel();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    /// <summary>
    /// Dispose the panel.
    /// </summary>
    public dispose() {
        PackageSourcePanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async updatePanel() {
        const webview = this.panel.webview;

        this.panel.webview.html = this.getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
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
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        // const scriptUri = webview.asWebviewUri(
        //     vscode.Uri.joinPath(this.extensionUri, "out", "compiled/PackageSource.js")
        // );
        // const cssUri = webview.asWebviewUri(
        //     vscode.Uri.joinPath(this.extensionUri, "out", "compiled/swiper.css")
        // );

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this.extensionUri, "media", "reset.css");
        const stylesPathMainPath = vscode.Uri.joinPath(this.extensionUri, "media", "vscode.css");

        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

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
                    <link href="${stylesResetUri}" rel="stylesheet">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <script nonce="${nonce}">
                    </script>
                </head>
            <body>
                <h1>ALGet Package Source</h1>
			</body>
			</html>`;
    }
}