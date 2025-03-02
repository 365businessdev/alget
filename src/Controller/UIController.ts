import * as vscode from "vscode";
import { Package } from '../Package/Package';
import { ALProject } from '../AL/ALProject';
import { PackageSourceTreeView } from "../Panel/PackageSourceTreeView";
import { InstalledPackagesTreeView } from "../Panel/InstalledPackagesTreeView";
import { PackageSidebar } from "../Panel/PackageSidebar";
import { PackagePanel } from "../Panel/PackagePanel";

/// <summary>
/// ALGet user interface controller.
/// </summary>
export class UIController {

    /// <summary>
    /// Specifies the active workspace folder.
    /// </summary>
    /// <remarks>
    /// This property is used to determine the active workspace folder.
    /// </remarks>
    private ActiveWorkspaceFolder: vscode.WorkspaceFolder | undefined;

    /// <summary>
    /// Specifies the active AL project.
    /// </summary>
    private ALProject: ALProject | undefined;

    /// <summary>
    /// Specifies the package sidebar.
    /// </summary>
    public PackageSidebar: PackageSidebar;

    /// <summary>
    /// Specifies the package source tree view.
    /// </summary>
    public PackageSourceTreeView: PackageSourceTreeView;

    /// <summary>
    /// Specifies the installed packages tree view.
    /// </summary>
    public InstalledPackagesTreeView: InstalledPackagesTreeView;

    constructor(private readonly ExtensionContext: vscode.ExtensionContext) {
        this.ActiveWorkspaceFolder = this.getActiveWorkspaceFolder();

        // TODO: add packageSidebar
        this.PackageSidebar = new PackageSidebar(this.ExtensionContext.extensionUri);
        this.PackageSourceTreeView = new PackageSourceTreeView(this.ExtensionContext.extensionUri, this.ActiveWorkspaceFolder);
        this.InstalledPackagesTreeView = new InstalledPackagesTreeView(this.ExtensionContext.extensionUri);

        // register webview view provider
        this.registerWebviewViewProvider();
    }

    /// <summary>
    /// Register the webview view provider.
    /// </summary>
    private registerWebviewViewProvider() {
        this.ExtensionContext.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                this.PackageSidebar.ViewId,
                this.PackageSidebar
            ),
            vscode.window.registerTreeDataProvider(
                this.PackageSourceTreeView.ViewId,
                this.PackageSourceTreeView
            ),
            vscode.window.registerTreeDataProvider(
                this.InstalledPackagesTreeView.ViewId,
                this.InstalledPackagesTreeView
            )
        );
    }

    /// <summary>
    /// Update the views with the specified AL project.
    /// </summary>
    public updateViews(alProject: ALProject) {
        this.ALProject = alProject;

        // update the package source tree view
        this.PackageSourceTreeView.refresh(this.ALProject.Workspace);
        this.InstalledPackagesTreeView.refresh(this.ALProject);
    } 

    /// <summary>
    /// Get the active workspace folder, based on the active text editor or the first workspace folder.
    /// </summary>
    /// <returns>The active workspace folder or the first workspace folder.</returns>
    public getActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        this.setActiveWorkspaceFolderFromEditorOrFirst(activeEditor);

        return this.ActiveWorkspaceFolder;
    }

    /// <summary>
    /// Set the active workspace folder based on specified active text editor or the first workspace folder.
    /// </summary>
    public setActiveWorkspaceFolderFromEditorOrFirst(editor: vscode.TextEditor | undefined) {
        if (editor) {
            this.ActiveWorkspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

            return;
        }
        // if no editor is open, keep the current active workspace folder
        if (this.ActiveWorkspaceFolder) {
            return;
        }
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage("Sorry, but you need to open a folder first.");
            return;
        }
        this.ActiveWorkspaceFolder = vscode.workspace.workspaceFolders[0]; // return the first workspace folder
    }

}