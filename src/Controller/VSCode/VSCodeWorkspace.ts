/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import * as vscode from "vscode";

/// <summary>
/// Represents a Visual Studio Code workspace.
/// </summary>
export class VSCodeWorkspace {

    /// <summary>
    /// Workspace URI
    /// </summary>
    public Uri: vscode.Uri;

    /// <summary>
    /// Workspace Folder
    /// </summary>
    public Folder: vscode.WorkspaceFolder | undefined;

    /// <summary>
    /// Constructor
    /// </summary>
    constructor(uri: vscode.Uri) {
        this.Uri = uri;

        this.getWorkspaceFolder(this.Uri).then(folder => {
            this.Folder = folder;
        });
    }

    /// <summary>
    /// Gets the workspace folder.
    /// </summary>
    public async getWorkspaceFolder(uri: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {
        return await this.getWorkspaceFolderAsync(uri);
    }

    /// <summary>
    /// Gets the workspace folder.
    /// </summary>
    public async getWorkspaceFolderAsync(uri: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showErrorMessage("No workspace is opened.");

            return undefined;
        }

        let workspaceFolder: vscode.WorkspaceFolder | undefined | null = null;
        if (uri !== undefined) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        } else {
            if (vscode.window.activeTextEditor !== undefined) {
                workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
            }
        }

        if ((workspaceFolder === null || undefined)) {
            let workspaceFoldersSelection: vscode.QuickPickItem[] = [];
            vscode.workspace.workspaceFolders.forEach((folder) => {
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
            if (workspaceFolder === null) {
                console.log(
                    `Selection ${selectedItem.label} could not be applied. Please try again.`
                );

                return undefined;
            }
        }

        return workspaceFolder;
    }
}