import * as vscode from "vscode";
import { PackageSourceSidebar } from '../Panel/PackageSourceSidebar';
import { Package } from '../Package/Package';
import { ALProject } from '../AL/ALProject';
import { PackageSourceListComponent } from "../Panel/Components/PackageSourceListComponent";

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
    /// Specifies the package source sidebar webview.
    /// </summary>
    public PackageSourceSidebar: PackageSourceSidebar;

    constructor(private readonly ExtensionContext: vscode.ExtensionContext) {
        // initialize panels and views
        this.PackageSourceSidebar = new PackageSourceSidebar(this.ExtensionContext.extensionUri);
        // TODO: add packageSidebar

        // register webview view provider
        this.registerWebviewViewProvider();

        this.ActiveWorkspaceFolder = this.getActiveWorkspaceFolder();
    }

    /// <summary>
    /// Register the webview view provider.
    /// </summary>
    private registerWebviewViewProvider() {
        this.ExtensionContext.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                this.PackageSourceSidebar.ViewId,
                this.PackageSourceSidebar
            )
        );
    }

    /// <summary>
    /// Update the views with the specified AL project.
    /// </summary>
    public updateViews(alProject: ALProject) {
        this.ALProject = alProject;

        // update the package source sidebar
        this.PackageSourceSidebar.updatePackageSourceList(
            PackageSourceListComponent.getPackageSourceListHtml(
                this.ALProject.PackageSources, 
                this.PackageSourceSidebar.webview?.webview.asWebviewUri(this.ExtensionContext.extensionUri)    
            )
        );
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