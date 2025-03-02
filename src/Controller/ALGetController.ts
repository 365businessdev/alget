/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import * as vscode from "vscode";

import { OutputChannel } from "../Common/OutputChannel";
import { VSCodeWorkspace } from './VSCode/VSCodeWorkspace';
import { PackageController } from "./PackageController";
import { UIController } from './UIController';
import { ALProject } from "../AL/ALProject";
import { PackagePanel } from "../Panel/PackagePanel";
import { Package } from "../Package/Package";

/// <summary>
/// Controller for the ALGet extension.
/// </summary>
export class ALGetController {

    /// <summary>
    /// Version of the ALGet extension.
    /// </summary>
    private ALGetVersion : any;

    /// <summary>
    /// Version of Visual Studio Code.
    /// </summary>
    private VSCodeVersion : string;

    /// <summary>
    /// The ALGet extension context.
    /// </summary>
    private ExtensionContext: vscode.ExtensionContext | undefined;

    /// <summary>
    /// Visual Studio Code workspace.
    /// </summary>
    public VSCodeWorkspace: VSCodeWorkspace | undefined;

    /// <summary>
    /// Package controller.
    /// </summary>
    public PackageController: PackageController | undefined;

    /// <summary>
    /// User interface controller.
    /// </summary>
    public UIController: UIController | undefined;

    /// <summary>
    /// Initializes a new instance of the ALGetController class.
    /// </summary>
    constructor(context: vscode.ExtensionContext | undefined) {
        if (context !== undefined) {
            this.ALGetVersion = context.extension.packageJSON.version || 'unknown';
        } else{
            OutputChannel.logWarning("ALGetController initialized without a context.");
            this.ALGetVersion = 'unknown';
        }
        this.VSCodeVersion = vscode.version;
        this.ExtensionContext = context;

        OutputChannel.log(`ALGet Package Manager v${this.ALGetVersion} activating in Visual Studio Code (${this.VSCodeVersion})`);

        // Get the workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder !== undefined) {
            this.VSCodeWorkspace = new VSCodeWorkspace(workspaceFolder.uri);
        }

        // Register the actions
        this.registerManagePackagesAction();
        this.registerRestorePackagesAction();
        this.registerUpdatePackagesAction();

        // Register event listeners
        this.registerEventListeners();

        // Register commands
        this.registerCommands();

        // Initialize the user interface controller
        if (!this.ExtensionContext) {
            OutputChannel.logError("Something went wrong while initializing the ALGet extension. Could not access the extension context.");

            return;
        }
        this.UIController = new UIController(this.ExtensionContext!);

        // Initialize the package controller
        this.PackageController = new PackageController(vscode.workspace.workspaceFolders);
        this.PackageController.loadALProjects().then(() => {
            if (this.PackageController?.ALProjects) {
                this.updateUI();
            } else {
                // TODO: Show "Please open AL workspace..." message in the webview
                OutputChannel.logError("No AL projects found.");
            }
        });
    }

    /// <summary>
    /// Updates the user interface.
    /// </summary>
    /// <param name="activeEditor">The active editor. If not provided, the active editor is used.</param>
    private updateUI(activeEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor) {
        if (!this.UIController) {
            return;
        }
        this.UIController.setActiveWorkspaceFolderFromEditorOrFirst(activeEditor);

        // Get the AL project for the active editor
        const alProject : ALProject | undefined = 
            this.PackageController?.ALProjects.find(
                alProject => 
                    alProject.Workspace.uri.fsPath === this.UIController?.getActiveWorkspaceFolder()!.uri.fsPath);

        // if no matching AL project is found, stop here
        if (!alProject) {
            console.error("No matching AL project found for the active editor.");

            return;
        }

        this.UIController.updateViews(alProject);
    }

    /// <summary>
    /// Registers the "Manage Packages" action.
    /// </summary>
    private registerManagePackagesAction() {
        if (this.ExtensionContext === undefined) {
            return;
        }
        this.ExtensionContext.subscriptions.push(
            vscode.commands.registerCommand(
                "365businessdev.alget.managePackagesFromCmdPalette",
                async (uri: vscode.Uri) => {
                    this.VSCodeWorkspace = new VSCodeWorkspace(uri);
                    if (this.VSCodeWorkspace === undefined) {
                        return;
                    }

                    //PackageSourcePanel.createOrShow(this.ExtensionContext!.extensionUri);

                    // TODO: Implement the package manager
                    // PackageManager.createOrShow(context.extensionPath, workspaceFolder);
                }
            ),
            vscode.commands.registerCommand(
                "365businessdev.alget.managePackages",
                (uri: vscode.Uri) => {
                    this.VSCodeWorkspace = new VSCodeWorkspace(uri);
                    if (this.VSCodeWorkspace === undefined) {
                        return;
                    }
                    
                    // TODO: Implement the package manager
                    // PackageManager.createOrShow(context.extensionPath, workspaceFolder);
                }
            )
        );
    }

    /// <summary>
    /// Registers the "Restore Packages" action.
    /// </summary>
    private registerRestorePackagesAction() {
        if (this.ExtensionContext === undefined) {
            return;
        }
        this.ExtensionContext.subscriptions.push(
            vscode.commands.registerCommand("365businessdev.alget.restorePackages", () => {
                // TODO: Implement the package restore
                // RestoreNuGetPackages();
            })
        );
    }

    /// <summary>
    /// Registers the "Update Packages" action.
    /// </summary>
    private registerUpdatePackagesAction() {
        if (this.ExtensionContext === undefined) {
            return;
        }
        this.ExtensionContext.subscriptions.push(
            vscode.commands.registerCommand("365businessdev.alget.updatePackages", () => {
                // TODO: Implement the package update
                // UpdateNuGetPackages();
            })
        );
    }
    
    /// <summary>
    /// Register event listeners.
    /// </summary>
    private registerEventListeners() {
        // Listen to active editor changes, to update webviews
        vscode.window.onDidChangeActiveTextEditor(activeEditor => {
            this.updateUI(activeEditor);
        });

        // TODO: Listen to changes in app.json files, to update PackageController
    }

    private registerCommands() {
        if (!this.ExtensionContext) {
            OutputChannel.logError("Something went wrong while initializing the ALGet extension. Could not access the extension context.");
            return;
        }

        // Register the search packages command
        this.ExtensionContext.subscriptions.push(
            vscode.commands.registerCommand("alget.selectPackage", async (pkg: Package) => {
                if (!this.PackageController) {
                    vscode.window.showErrorMessage("ALGet package controller not initialized. Please report this issue.");
                    return;
                }
                if (!this.UIController) {
                    vscode.window.showErrorMessage("ALGet UI controller not initialized. Please report this issue.");
                    return;
                }

                // Open package panel webview
                const panel = PackagePanel.createOrShow(this.ExtensionContext!.extensionUri, pkg);

                // Load package manifest
                this.PackageController.getPackageManifestById(
                    pkg.PackageSources[0],
                    pkg.PackageSources[0].getPackageId(
                        pkg.Publisher,
                        pkg.Name,
                        pkg.Id,
                        '' // TODO: Country Code
                    ),
                    pkg.Version ?
                        pkg.Version :
                        this.PackageController.getLatestVersion(pkg) // select the latest version if no version is specified
                ).then(manifest => {
                    // Set package manifest in the panel
                    panel.setManifest(manifest);
                }).catch(error => {
                    OutputChannel.logError(error);
                    vscode.window.showErrorMessage(`Unable to load package manifest for package with ID '${pkg.Id}'. Please report this issue.`);
                });
            }),
            vscode.commands.registerCommand("alget.searchPackages", async (query: string) => {
                if (!this.PackageController) {
                    vscode.window.showErrorMessage("ALGet package controller not initialized. Please report this issue.");
                    return;
                }
                this.PackageController.searchPackages(query, this.UIController?.getActiveWorkspaceFolder()).then(packages => {
                    if (!this.UIController) {
                        vscode.window.showErrorMessage("ALGet UI controller not initialized. Please report this issue.");
                        return;
                    }
                    this.UIController.PackageSidebar.updatePackageList(packages);
                });
                // NOTE: Not sure, if I like this, but maybe it's a good idea to show progress notification instead. Some feeds might take a while to respond.
                // await vscode.window.withProgress({
                //     location: vscode.ProgressLocation.Notification,
                //     title: `ALGet: Searching for package '${query}'`,
                //     cancellable: false
                // }, () => {
                //     const p = new Promise<void>(async resolve => {
                //         if (!this.PackageController) {
                //             vscode.window.showErrorMessage("ALGet package controller not initialized. Please report this issue.");
                //             return;
                //         }

                //         const packages = await this.PackageController.searchPackages(query, this.UIController?.getActiveWorkspaceFolder());
                        
                //         if (!this.UIController) {
                //             vscode.window.showErrorMessage("ALGet UI controller not initialized. Please report this issue.");
                //             return;
                //         }
                //         resolve(this.UIController.PackageSidebar.updatePackageList(packages));
                //     });
        
                //     return p;
                // });
            })
        );
    }

    /// <summary>
    /// Returns the extension configuration.
    /// </summary>
    public static getExtensionConfiguration(workspaceUri: vscode.Uri | undefined, section: string = "365businessdev.alget"): vscode.WorkspaceConfiguration {
        if (workspaceUri === undefined) {
            OutputChannel.logWarning("No workspace is opened. Read the extension configuration from the global scope.");
            return vscode.workspace.getConfiguration(section, null);
        }
        const configuration : vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(section, workspaceUri);
        
        return configuration;
    }
}