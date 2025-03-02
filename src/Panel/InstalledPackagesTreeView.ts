import * as vscode from 'vscode';
import * as path from 'path';
import { ALProject } from '../AL/ALProject';
import { Package } from '../Package/Package';

/// <summary>
/// Represents the tree view that displays installed packages.
/// </summary>
export class InstalledPackagesTreeView implements vscode.TreeDataProvider<InstalledPackageTreeItem> {

    /// <summary>
    /// Specifies the ID of the tree view.
    /// </summary>
    /// <remarks>
    /// This property must match the ID in the package.json file.
    /// </remarks>
    public ViewId: string = "alget-installed-package-treeview";

    /// <summary>
    /// Currently available package sources.
    /// </summary>
    public ALProject: ALProject | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<InstalledPackageTreeItem | undefined | void> = new vscode.EventEmitter<InstalledPackageTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<InstalledPackageTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private readonly ExtensionUri: vscode.Uri) { }

    /// <summary>
    /// Refreshes the tree view.
    /// </summary>
    /// <param name="packageSources">Package sources to display in the tree view.</param>
    public refresh(alProject: ALProject): void {
        this.ALProject = alProject;

        this._onDidChangeTreeData.fire();
    }
    
    /// <summary>
    /// Returns the tree item for the given element.
    /// </summary>
    /// <param name="element">Element for which to return the tree item.</param>
    /// <returns>Tree item for the given element.</returns>
    public getTreeItem(element: InstalledPackageTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    /// <summary>
    /// Returns the children of the given element.
    /// </summary>
    /// <param name="element">Element for which to return the children. Root element if not specified.</param>
    /// <returns>Children of the given element.</returns>
    public getChildren(element?: InstalledPackageTreeItem): Thenable<InstalledPackageTreeItem[]> {
        if (this.ALProject?.Package === undefined) {
            return Promise.resolve([]);
        }

        // return the AL application package as root element
        if (element === undefined) {
            return Promise.resolve([new InstalledPackageTreeItem(this.ALProject.Package, vscode.TreeItemCollapsibleState.Expanded, 'al-icon.svg')]);
        }

        // return the dependencies of the package
        let packageDependencies: InstalledPackageTreeItem[] = [];
        for (const dependency of element.Package.Dependencies) {
            packageDependencies.push(new InstalledPackageTreeItem(dependency, vscode.TreeItemCollapsibleState.None));
        }
        return Promise.resolve(packageDependencies);
    }

    // getParent?(element: PackageSourceTreeItem): vscode.ProviderResult<PackageSourceTreeItem> {
    //     throw new Error('Method not implemented.');
    // }

    // resolveTreeItem?(item: vscode.TreeItem, element: PackageSourceTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }

}

/// <summary>
/// Represents a installed package tree item.
/// </summary>
export class InstalledPackageTreeItem extends vscode.TreeItem {

    constructor(
        public readonly Package: Package,
        public readonly CollapsibleState: vscode.TreeItemCollapsibleState,
        private readonly IconName: string = 'nuget-icon.svg',
        public readonly Command?: vscode.Command
    ) {
        super(Package.Name, CollapsibleState);

        if (Package.BriefDescription !== undefined) {
            this.tooltip = `${Package.BriefDescription}`;
        } else {
            this.tooltip = `${Package.Name}`;
        }
        this.description = `by ${this.Package.Publisher} ${this.Package.Version !== undefined ? `- version ${this.Package.Version}` : ''}`;

        this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'light', this.getIconPath()),
            dark: path.join(__filename, '..', '..', 'media', 'dark', this.getIconPath())
        };
    }

    /// <summary>
    /// Gets the path to the icon.
    /// </summary>
    /// <returns>Path to the icon.</returns>
    /// <remarks>
    /// If the predefined icon is not used, the icon is returned as is.
    /// If the package is from Microsoft, the icon is changed to the Microsoft icon.
    /// If the package is from 365 business development, the icon is changed to the 365 business development icon.
    /// If the package has an update available, the icon is changed to the update icon.
    /// </remarks>
    private getIconPath(): string {
        if (this.IconName !== 'nuget-icon.svg') {
            return this.IconName;
        }

        if (this.Package.Publisher.toLowerCase() === 'microsoft') {
            return 'microsoft-icon.png';
        }
        if (this.Package.Publisher.toLowerCase() === '365 business development') {
            return '365businessdev-icon.png';
        }
        if ((this.Package.isUpdateAvailable()) && (this.IconName === 'nuget-icon.svg')) {
            return 'nuget-icon-update.svg';
        }

        return this.IconName;
    }
}  