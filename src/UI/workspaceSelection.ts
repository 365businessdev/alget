import * as vscode from "vscode";

/// <summary>
/// Gets the workspace folder from the manifest file.
/// </summary>
export function getWorkspaceFolderFromManifest(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
    if (!uri.fsPath.endsWith("app.json")) {
      return undefined;
    }

    return vscode.workspace.getWorkspaceFolder(uri);
}

/// <summary>
/// Gets the workspace folder.
/// </summary>
export async function getWorkspaceFolder(uri: vscode.Uri) : Promise<vscode.WorkspaceFolder | undefined> {
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage("No workspace is opened.");

      return undefined;
    }

    // get workspace folder
    let workspaceFolder: vscode.WorkspaceFolder | undefined | null = null;
    if (uri !== undefined) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    } else {
        if (vscode.window.activeTextEditor !== undefined) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
    }

    if ((workspaceFolder === null) || (workspaceFolder === undefined)) {
      let workspaceFoldersSelection: vscode.QuickPickItem[] = [];
      vscode.workspace.workspaceFolders.forEach((folder) => {
        // TODO: Check if app.json exists
        workspaceFoldersSelection.push({
          label: folder.uri.fsPath,
        });
      });
      const selectedItem = await vscode.window.showQuickPick(
        workspaceFoldersSelection,
        {
          placeHolder: "Please select workspace folder",
        }
      );
      if (!selectedItem) {
        return undefined;
      }
      vscode.workspace.workspaceFolders.forEach((folder) => {
        if (folder.uri.fsPath === selectedItem.label) {
          workspaceFolder = folder;
        }
      });
      if (workspaceFolder == null) {
        console.log(
          `Selection ${selectedItem.label} could not be applied. Please try again.`
        );

        return undefined;
      }
    }

    return workspaceFolder;
}