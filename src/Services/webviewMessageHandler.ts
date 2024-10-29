import * as vscode from "vscode";
import * as settings from "../Common/settings";
import { ExtensionMessage } from "../Models/extension-message";
import { DataMessage, InstallMessage, UIMessage } from "../Models/ui-message";

import ProjectLoader from "./projectLoader";
import { fetchPackagesFromFeed } from "../NuGet/fetchPackages";
import * as output from "../output";
import { Package } from "../Models/package";
import PackageManager from "../Package/packageManager";

export default class WebviewMessageHandler {
  private packages: Package[] = [];
  private readonly disposables: vscode.Disposable[] = [];
  private readonly projectLoader: ProjectLoader;

  public constructor(
    private readonly webview: vscode.Webview,
    private readonly projectWorkspaceFolder: vscode.WorkspaceFolder
  ) {
    output.log("Initializing project loader");
    this.projectLoader = new ProjectLoader();

    output.log("Loading project");
    // TODO: This is a workaround to load the project when the webview is created
    this.loadProject(); 
    //this.taskManager = new TaskManager(() => this.loadProject());

    PackageManager.setProjectWorkspaceFolder(this.projectWorkspaceFolder);

    this.webview.onDidReceiveMessage(
      (message: UIMessage) => {
        this.handleMessage(message);
      },
      null,
      this.disposables
    );

    // vscode.workspace.onDidChangeConfiguration(
    //   () => {
    //     this.loadConfiguration();
    //   },
    //   null,
    //   this.disposables
    // );
  }

  public async loadPackages(filterString: string | undefined = undefined) {
    this.packages = [];

    output.log("Loading packages from feeds");
    this.webview.postMessage({ command: "initPackageList", data: "browse" });

    output.log(
      `Fetching packages from '${settings.MSSymbolsFeedUrl}' feed url`
    );
    let packages = await fetchPackagesFromFeed(
      settings.MSSymbolsFeedUrl,
      filterString === undefined ? `.${settings.getCountryCode().toUpperCase() || ""}.` : filterString,
      false
    );
    output.log(`${packages.length} packages received from feed`);
    this.packages.push(...packages);
    if (packages.length > 0)
      this.webview.postMessage({
        command: "packages",
        data: packages,
      });

    output.log(
      `Fetching packages from '${settings.AppSourceSymbolsFeedUrl}' feed url`
    );
    packages = await fetchPackagesFromFeed(
      settings.AppSourceSymbolsFeedUrl,
      filterString === undefined ? "" : filterString,
      false
    );
    output.log(`${packages.length} packages received from feed`);
    this.packages.push(...packages);
    this.webview.postMessage({
      command: "packages",
      data: packages,
    });

    // TODO: Implement fetching packages from other feeds
  }

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
        //this.loadConfiguration();
        return;
      case "open-settings":
        this.openSettings();
      case "search-packages":
        this.loadPackages((message as DataMessage).data);
        break;
      case "get-package-dependencies":
        this.getPackageDependencies(message as InstallMessage);
        break;
    }
  }

  private addPackage(message: InstallMessage): void {
    PackageManager.setPackageCache(this.packages);
    PackageManager.install(message.packageId, message.packageVersion);

    // TODO: Update view
  }

  private getPackageDependencies(message: InstallMessage): void {
    PackageManager.setPackageCache(this.packages);
    PackageManager.getPackageDependencies(
      message.packageId,
      message.packageVersion
    ).then((dependencies) => {
      this.webview.postMessage({
        command: "package-dependencies",
        data: dependencies,
      });
    });
  }

  private loadProject(): void {
    this.projectLoader
      .loadProjectAsync(this.projectWorkspaceFolder)
      .then((project) => {
        if (project === null) {
          return;
        }

        this.packages.push(...project.packages);

        let message: ExtensionMessage = { command: "project", data: project };
        this.webview.postMessage(message);

        const updatePackages: Package[] = project.packages.filter(
          (p) => p.UpdateVersion !== undefined
        );
        message = { command: "update", data: updatePackages };
        this.webview.postMessage(message);
      });
  }

  private openSettings(): void {
    vscode.commands.executeCommand(
      "workbench.action.openSettings",
      `@ext:${settings.ExtensionName}`
    );
  }

  public dispose(): void {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
