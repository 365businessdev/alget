import * as vscode from "vscode";
import { fetchPackagesFromFeed } from "./NuGet/fetchPackages";
import * as settings from "./Common/settings";
import PackageManager from "./UI/packageManager";
import * as workspaceSelection from "./UI/workspaceSelection";
import * as output from "./output";

export function activate(context: vscode.ExtensionContext) {
  const extensionVersion = context.extension.packageJSON.version || 'unknown';
  const vscodeVersion = vscode.version;
  output.log(`ALGet Package Manager v${extensionVersion} activating in Visual Studio Code (${vscodeVersion})`);

  context.subscriptions.push(
    vscode.commands.registerCommand("365businessdev.alget.helloWorld", () => {
      vscode.window.showInformationMessage("Hello from ALGet 😊!");
      fetchPackagesFromFeed(
        settings.AppSourceSymbolsFeedUrl,
        "365 business development.365 business Print Agent.symbols.6fb30c19-f5d6-4e4c-b006-18fba4de1898",
        false
      );
    }),
    vscode.commands.registerCommand(
      "365businessdev.alget.managePackagesFromCmdPalette",
      async (uri: vscode.Uri) => {
        let workspaceFolder: vscode.WorkspaceFolder | undefined = await workspaceSelection.getWorkspaceFolder(uri);
        if (workspaceFolder === undefined) {
          return;
        }
        PackageManager.createOrShow(context.extensionPath, workspaceFolder);
      }
    ),
    vscode.commands.registerCommand(
      "365businessdev.alget.managePackages",
      (uri: vscode.Uri) => {
        let workspaceFolder: vscode.WorkspaceFolder | undefined =  workspaceSelection.getWorkspaceFolderFromManifest(uri);
        if (workspaceFolder === undefined) {
          return;
        }
        PackageManager.createOrShow(context.extensionPath, workspaceFolder);
      }
    ),
    vscode.commands.registerCommand("365businessdev.alget.restore", () => {
      vscode.window.showInformationMessage("Restoring packages for project");
      // TODO: Implement restore packages
    }),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
