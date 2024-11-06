import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as output from "../output";
import { Settings } from "../Common/settings";
import WebviewMessageHandler from "../Services/webviewMessageHandler";

export default class PackageManager {
  public static currentPanels: Record<string, PackageManager | undefined> = {};

  private static readonly viewType = "html";

  private readonly panel: vscode.WebviewPanel;
  private readonly projectWorkspaceFolder: vscode.WorkspaceFolder;
  private readonly extensionPath: string;
  private readonly webviewMessageHandler: WebviewMessageHandler;
  private disposables: vscode.Disposable[] = [];

  /// <summary>
  /// Creates a new instance of the Package Manager or shows an existing one
  /// </summary>
  public static createOrShow(
    extensionPath: string,
    projectWorkspaceFolder: vscode.WorkspaceFolder
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const projectFilePath = projectWorkspaceFolder.uri.fsPath;
    output.log(`Loading AL project from '${projectFilePath}'`);
    const existingPanel = PackageManager.currentPanels[projectFilePath];

    if (existingPanel) {
      existingPanel.panel.reveal(column);
    } else {
      PackageManager.currentPanels[projectFilePath] = new PackageManager(
        extensionPath,
        column || vscode.ViewColumn.One,
        projectWorkspaceFolder
      );
    }
    return PackageManager.currentPanels;
  }

  /// <summary>
  /// Creates a new instance of the PackageManager class
  /// </summary>
  private constructor(
    extensionPath: string,
    column: vscode.ViewColumn,
    projectWorkspaceFolder: vscode.WorkspaceFolder
  ) {
    this.projectWorkspaceFolder = projectWorkspaceFolder;
    this.extensionPath = extensionPath;

    Settings.setExtensionConfigurationScope(projectWorkspaceFolder.uri);

    const projectName = path.basename(projectWorkspaceFolder.uri.fsPath);
    output.log(`Loading AL project '${projectName}'`);
    
    this.panel = vscode.window.createWebviewPanel(
      PackageManager.viewType,
      `${Settings.ExtensionWebviewName}: ${projectName}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.extensionPath, "src/UI/Html")),
        ],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getHtmlForWebview();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // initialize the message handler for the communication between the webview and the extension
    this.webviewMessageHandler = new WebviewMessageHandler(
      this.panel.webview,
      this.projectWorkspaceFolder
    );

    // load packages from feeds
    this.webviewMessageHandler.loadPackages();
  }

  /// <summary>
  /// Disposes the Package Manager instance
  /// </summary>
  private dispose() {
    PackageManager.currentPanels[this.projectWorkspaceFolder.uri.fsPath] =
      undefined;

    this.webviewMessageHandler.dispose();

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /// <summary>
  /// Gets the HTML content for the webview
  /// </summary>
  private getHtmlForWebview() {
    // path to dist folder
    const appDistPath = path.join(this.extensionPath, "src/UI/Html");
    const appDistPathUri = vscode.Uri.file(appDistPath);

    // path as uri
    const baseUri = this.panel.webview.asWebviewUri(appDistPathUri);

    // get path to index.html file from dist folder
    const indexPath = path.join(appDistPath, "index.html");

    // read index file from file system
    let indexHtml = fs.readFileSync(indexPath, { encoding: "utf8" });

    indexHtml = indexHtml.replace(
      '<<NUGET_ICON>>',
      `${this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, "src/UI/Html/nuget-icon.png")))}`
    );

    indexHtml = indexHtml.replace(
      '<<MICROSOFT_ICON>>',
      `${this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, "src/UI/Html/microsoft-icon.png")))}`
    );

    // update the base URI tag
    indexHtml = indexHtml.replace(
      '<base href="/">',
      `<base href="${String(baseUri)}/">`
    );

    return indexHtml;
  }
}
