import * as vscode from "vscode";
import * as settings from "../Common/settings";
import { ExtensionMessage } from "../Models/extension-message";
import { DataMessage, InstallMessage, UIMessage } from "../Models/ui-message";

import ProjectLoader from "./projectLoader";
import * as output from "../output";
import { Package } from "../Models/package";
import PackageManager from "../Package/packageManager";

export default class WebviewMessageHandler {
  private packages: Package[] = [];
  private readonly disposables: vscode.Disposable[] = [];
  private readonly projectLoader: ProjectLoader;
  private packageManager: PackageManager;

  /// <summary>
  /// Initializes a new instance of the WebviewMessageHandler class
  /// </summary>
  public constructor(
    private readonly webview: vscode.Webview,
    private readonly projectWorkspaceFolder: vscode.WorkspaceFolder
  ) {
    output.log("Initializing project loader");
    this.projectLoader = new ProjectLoader();

    output.log("Loading project");
    this.loadProject(); 

    this.packageManager = new PackageManager(this.projectWorkspaceFolder);

    this.webview.onDidReceiveMessage((message: UIMessage) => {
        this.handleMessage(message);
      }, null, this.disposables
    );

    vscode.workspace.onDidChangeConfiguration(() => {
        this.loadConfiguration();
      }, null,this.disposables
    );
  }

  /// <summary>
  /// Loads the packages from the configured feeds
  /// </summary>
  public async loadPackages(filterString: string | undefined = undefined): Promise<void> {
    this.webview.postMessage({ command: "initPackageList", data: "browse" });

    await this.packageManager.loadPackages(filterString).then((packages) => {
      this.packages = packages;

      this.webview.postMessage({
        command: "packages",
        data: packages,
      });
    });
  }

  /// <summary>
  /// Handles the incoming messages from the webview
  /// </summary>
  private handleMessage(message: UIMessage): void {
    switch (message.command) {
      case "add-package":
        this.addPackage(message as InstallMessage);
        return;
      case "remove-package":
        throw "Not implemented"; // TODO: Implement remove package
        //this.removePackage(message as UninstallMessage);
        return;
      case "load-project":
        this.loadProject();
        this.loadConfiguration();
        return;
      case "open-settings":
        this.openSettings();
        break;
      case "search-packages":
        this.loadPackages((message as DataMessage).data);
        break;
      case "get-package-dependencies":
        this.getPackageDependencies(message as InstallMessage);
        break;
    }
  }

  /// <summary>
  /// Adds a package to the project
  /// </summary>
  private addPackage(message: InstallMessage): void {
    this.packageManager.setPackageCache(this.packages);
    this.packageManager.install(message.packageId, message.packageVersion).then(() => {    
      // reset package list and reload project
      this.packages = [];
      this.loadProject();
    });
  }

  /// <summary>
  /// Gets the dependencies of a package
  /// </summary>
  private getPackageDependencies(message: InstallMessage): void {
    this.packageManager.setPackageCache(this.packages);
    this.packageManager.getPackageDependencies(
      message.packageId,
      message.packageVersion
    ).then((dependencies) => {
      this.webview.postMessage({
        command: "package-dependencies",
        data: dependencies,
      });
    });
  }

  /// <summary>
  /// Loads the project
  /// </summary>
  private loadProject(): void {
    this.projectLoader
      .loadProjectAsync(this.projectWorkspaceFolder)
      .then((project) => {
        if (project === null) {
          return;
        }
        this.webview.postMessage({ command: "initPackageList", data: "installed" });
        this.webview.postMessage({ command: "initPackageList", data: "updates" });

        this.packages.push(...project.packages);

        let message: ExtensionMessage = { command: "project", data: project };
        this.webview.postMessage(message);

        const updatePackages: Package[] = project.packages.filter(
          (p) => (p.UpdateVersion !== undefined) && (p.IsInstalled)
        );
        message = { command: "update", data: updatePackages };
        this.webview.postMessage(message);
      });
  }

  /// <summary>
  /// Opens the settings
  /// </summary>
  private openSettings(): void {
    vscode.commands.executeCommand(
      "workbench.action.openSettings",
      `@ext:${settings.ExtensionName}`
    );
  }

  /// <summary>
  /// Loads the configuration
  /// </summary>
  /// <remarks>Currenly not implemented</remarks>
  private loadConfiguration(): void {
  }

  /// <summary>
  /// Disposes the WebviewMessageHandler instance
  /// </summary>
  public dispose(): void {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
