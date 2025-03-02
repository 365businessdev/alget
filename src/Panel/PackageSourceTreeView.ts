import * as vscode from 'vscode';
import { IPackageSource } from '../Package/PackageSource/IPackageSource';
import * as path from 'path';
import { PackageController } from '../Controller/PackageController';

/// <summary>
/// Represents the tree view that displays package sources.
/// </summary>
export class PackageSourceTreeView implements vscode.TreeDataProvider<PackageSourceTreeItem> {

    /// <summary>
    /// Specifies the ID of the tree view.
    /// </summary>
    /// <remarks>
    /// This property must match the ID in the package.json file.
    /// </remarks>
    public ViewId: string = "alget-packagesource-treeview";

    /// <summary>
    /// Specifies the currently active workspace folder.
    /// </summary>
    public WorkspaceFolder: vscode.WorkspaceFolder | undefined;

    /// <summary>
    /// Currently available package sources.
    /// </summary>
    public PackageSources: IPackageSource[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<PackageSourceTreeItem | undefined | void> = new vscode.EventEmitter<PackageSourceTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PackageSourceTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private readonly ExtensionUri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder | undefined) {
        this.WorkspaceFolder = workspaceFolder;
    }

    /// <summary>
    /// Refreshes the tree view.
    /// </summary>
    /// <param name="packageSources">Package sources to display in the tree view.</param>
    public refresh(workspaceFolder: vscode.WorkspaceFolder): void {
        this.WorkspaceFolder = workspaceFolder;

        this._onDidChangeTreeData.fire();
    }
    
    /// <summary>
    /// Returns the tree item for the given element.
    /// </summary>
    /// <param name="element">Element for which to return the tree item.</param>
    /// <returns>Tree item for the given element.</returns>
    public getTreeItem(element: PackageSourceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    /// <summary>
    /// Returns the children of the given element.
    /// </summary>
    /// <param name="element">Element for which to return the children. Root element if not specified.</param>
    /// <returns>Children of the given element.</returns>
    public getChildren(): vscode.ProviderResult<PackageSourceTreeItem[]> {
        if (this.WorkspaceFolder === undefined) {
            return Promise.resolve([]);
        }
        this.PackageSources = PackageController.getPackageSources(this.WorkspaceFolder.uri, true);

        let packageSourceTreeItems: PackageSourceTreeItem[] = [];
        for (const packageSource of this.PackageSources) {
            packageSourceTreeItems.push(
                new PackageSourceTreeItem(packageSource, vscode.TreeItemCollapsibleState.None)
            );
        }
        return Promise.resolve(packageSourceTreeItems);
    }

    // getParent?(element: PackageSourceTreeItem): vscode.ProviderResult<PackageSourceTreeItem> {
    //     throw new Error('Method not implemented.');
    // }

    // resolveTreeItem?(item: vscode.TreeItem, element: PackageSourceTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }

}

/// <summary>
/// Represents a package source tree item that represents a package source.
/// </summary>
export class PackageSourceTreeItem extends vscode.TreeItem {

    constructor(
        private readonly PackageSource: IPackageSource,
        public readonly CollapsibleState: vscode.TreeItemCollapsibleState,
        public readonly Command?: vscode.Command
    ) {
        super(PackageSource.Name);

        this.tooltip = this.PackageSource.Description;
        this.description = this.PackageSource.Url;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'media', 'light', 'nuget-icon.svg'),
        dark: path.join(__filename, '..', '..', 'media', 'dark', 'nuget-icon.svg')
    };
}  