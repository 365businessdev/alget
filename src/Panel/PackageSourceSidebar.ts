import * as vscode from "vscode";

import { getNonce } from "./getNonce";

/// <summary>
/// ALGet package source sidebar webview
/// </summary>
export class PackageSourceSidebar implements vscode.WebviewViewProvider {

  /// <summary>
  /// Specifies the ID of the webview.
  /// </summary>
  /// <remarks>
  /// This property must match the ID in the package.json file.
  /// </remarks>
  public ViewId: string = "alget-packagesource-sidebar";

  public webview?: vscode.WebviewView;
  
  public document?: vscode.TextDocument;

  private Data: string = "";

  constructor(private readonly extensionUri: vscode.Uri) {}

  /// <summary>
  /// Update the package source list in the webview.
  /// </summary>
  public updatePackageSourceList(data: string) {
    this.Data = data;

    this.webview?.webview.postMessage({
      type: "setPackageSourceList",
      data: this.Data
    });
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webview = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    /// <summary>
    /// Handle messages from the webview
    /// </summary>
    webviewView.webview.onDidReceiveMessage(async (receivedMessage) => {
      switch (receivedMessage.type) {
        case "initialize": {
          if (!this.Data) {
            return;
          }
          this.webview!.webview.postMessage({
            type: "setPackageSourceList",
            data: this.Data
          });
          break;
        }
        case "onInfo": {
          if (!receivedMessage.data) {
            return;
          }
          vscode.window.showInformationMessage(receivedMessage.value);
          break;
        }
        case "onError": {
          if (!receivedMessage.data) {
            return;
          }
          vscode.window.showErrorMessage(receivedMessage.value);
          break;
        }
        default: {
          vscode.window.showErrorMessage(`Unknown message type '${receivedMessage.type}' received from webview. Please report this issue.`);
        }
      }
    });
  }

  /// <summary>
  /// Revive the sidebar
  /// </summary>
  public revive(panel: vscode.WebviewView) {
    this.webview = panel;
  }

  /// <summary>
  /// Get HTML for the webview
  /// </summary>
  /// <param name="webview">Webview</param>
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(this.extensionUri, "ui", "css", "reset.css");
    const stylesVSCodePath = vscode.Uri.joinPath(this.extensionUri, "ui", "css", "vscode.css");

    const styleResetUri = webview.asWebviewUri(styleResetPath);
    const styleVSCodeUri = webview.asWebviewUri(stylesVSCodePath);

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "ui", "scripts", "packageSourceWebviewHandler.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "ui", "css", "alget.css")
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
        <!--
        TODO: Enable CSP for webview, but make sure to allow the font-awesome icons to load
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
        -->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleUri}" rel="stylesheet">
        <script nonce="${nonce}" src="${scriptUri}"></script>
        <script nonce="${nonce}" src="https://kit.fontawesome.com/f76ceefbc3.js" crossorigin="anonymous"></script>
			</head>
      <body>
        <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i></div>
			</body>
			</html>`;
  }
}