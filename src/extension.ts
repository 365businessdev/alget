import * as vscode from "vscode";
import PackageManager from "./UI/packageManager";
import * as workspaceSelection from "./UI/workspaceSelection";
import * as output from "./output";
import { RestoreNuGetPackages } from "./NuGet/restorePackages";
import { UpdateNuGetPackages } from "./NuGet/updatePackages";

export function activate(context: vscode.ExtensionContext) {
  const extensionVersion = context.extension.packageJSON.version || 'unknown';
  const vscodeVersion = vscode.version;
  output.log(`ALGet Package Manager v${extensionVersion} activating in Visual Studio Code (${vscodeVersion})`);

  context.subscriptions.push(
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
    vscode.commands.registerCommand("365businessdev.alget.restorePackages", () => {
      RestoreNuGetPackages();
    }),
    vscode.commands.registerCommand("365businessdev.alget.updatePackages", () => {
      UpdateNuGetPackages();
    }),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
