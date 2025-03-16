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
import { WorkspaceClient } from '../Package/PackageSource/Workspace/WorkspaceClient';
import { PackageVersion } from '../Package/PackageVersion';
import { PackageSourceType } from "../Package/PackageSource/PackageSourceType";

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
    /// Registers the "Restore Packages" action.
    /// </summary>
    private registerRestorePackagesAction() {
        if (this.ExtensionContext === undefined) {
            return;
        }
        this.ExtensionContext.subscriptions.push(
            vscode.commands.registerCommand(
                "365businessdev.alget.restorePackagesFromCmdPalette",
                () => {
                    if (!this.PackageController) {
                        vscode.window.showErrorMessage("ALGet package controller not initialized yet. Please try again later.");
                        return;
                    }
                    this.PackageController.restoreALProjects();
                }
            ),
            vscode.commands.registerCommand(
                "365businessdev.alget.restorePackages",
                async (uri: vscode.Uri) => {
                    this.VSCodeWorkspace = new VSCodeWorkspace(uri);
                    if (this.VSCodeWorkspace === undefined) {
                        return;
                    }

                    if (!this.PackageController) {
                        vscode.window.showErrorMessage("ALGet package controller not initialized yet. Please try again later.");
                        return;
                    }

                    const alProject = this.PackageController.ALProjects.find(
                        alProject => alProject.Workspace.uri.fsPath === uri.fsPath
                    );

                    if (!alProject) {
                        vscode.window.showErrorMessage(`Uri ${uri.fsPath} is not part of an AL project.`);
                        return;
                    }

                    this.PackageController.restoreALProject(alProject);
                }
            )
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
            vscode.commands.registerCommand(
                "365businessdev.alget.updatePackagesFromCmdPalette",
                () => {
                    if (!this.PackageController) {
                        vscode.window.showErrorMessage("ALGet package controller not initialized yet. Please try again later.");
                        return;
                    }
                    this.PackageController.updateALProjects();
                }
            ),
            vscode.commands.registerCommand(
                "365businessdev.alget.updatePackages",
                async (uri: vscode.Uri) => {
                    this.VSCodeWorkspace = new VSCodeWorkspace(uri);
                    if (this.VSCodeWorkspace === undefined) {
                        return;
                    }

                    if (!this.PackageController) {
                        vscode.window.showErrorMessage("ALGet package controller not initialized yet. Please try again later.");
                        return;
                    }

                    const alProject = this.PackageController.ALProjects.find(
                        alProject => alProject.Workspace.uri.fsPath === uri.fsPath
                    );

                    if (!alProject) {
                        vscode.window.showErrorMessage(`Uri ${uri.fsPath} is not part of an AL project.`);
                        return;
                    }

                    this.PackageController.updateALProject(alProject);
                }
            )
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
                    OutputChannel.logError(error as string);
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
            }),
            vscode.commands.registerCommand("alget.installPackage", async (pkg: Package, version?: string) => {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `ALGet: Installing '${pkg.Name}'`,
                    cancellable: false
                }, async () => {
                    if (!this.PackageController) {
                        vscode.window.showErrorMessage("ALGet package controller not initialized. Please report this issue.");
                        return;
                    }
                    const alProject = this.PackageController.ALProjects.find(
                        alProject => alProject.Workspace.uri.fsPath === this.UIController!.getActiveWorkspaceFolder()!.uri.fsPath
                    );
                    if (!alProject) {
                        vscode.window.showErrorMessage("No AL project found for the active workspace. Please open an AL project and try again.");
                        return;
                    }

                    try {
                        const pkgVersion = pkg.PackageVersions.find(v => v.Version === version);
                        if ((version) && (!pkgVersion)) {
                            OutputChannel.logWarning(`Could not find package source for version '${version}'. Falling back to latest version.`);
                        }

                        const result : { client: WorkspaceClient, version: PackageVersion } = await this.PackageController.downloadApp(
                            alProject.Workspace,
                            pkg,
                            pkgVersion
                        );

                        const alProjectDependency = alProject.Package!.Dependencies.find(d => d.Id === pkg.Id);
                        if (alProjectDependency) {
                            alProjectDependency.PackageSources.push(result.client);
                            alProjectDependency.PackageVersions.push(result.version);
                            alProjectDependency.Version = result.version;

                            pkg.Version = alProjectDependency.Version;
                        } else {
                            const alProjectDependency = pkg;
                            alProjectDependency.PackageSources.push(result.client);
                            alProjectDependency.Version = result.version;

                            pkg = alProjectDependency;
                        }

                        alProject.addOrUpdateDependency(pkg);

                        if (this.UIController) {
                            this.UIController.PackageSidebar.updatePackageItem(pkg);
                            if (PackagePanel.currentPanel) {
                                PackagePanel.currentPanel.updatePanel(pkg);
                            }
                        }
                        vscode.window.showInformationMessage(`Package '${pkg.Name}' installed successfully.`);
            
                        return Promise.resolve();
                    } catch (error) {
                        console.error(error);
                        OutputChannel.logError(error as string);
                        vscode.window.showErrorMessage(`Unable to install package '${pkg.Name}'. Please report this issue.`);
                    }
                });
            }),
            vscode.commands.registerCommand("alget.uninstallPackage", async (pkg: Package) => {
                if (!this.PackageController) {
                    vscode.window.showErrorMessage("ALGet package controller not initialized. Please report this issue.");
                    return;
                }
                const alProject = this.PackageController.ALProjects.find(
                    alProject => alProject.Workspace.uri.fsPath === this.UIController!.getActiveWorkspaceFolder()!.uri.fsPath
                );
                if (!alProject) {
                    vscode.window.showErrorMessage("No AL project found for the active workspace. Please open an AL project and try again.");
                    return;
                }

                // Remove the symbol files from the package cache
                const alProjectDependency = alProject.Package!.Dependencies.find(d => d.Id === pkg.Id);
                if (alProjectDependency && alProjectDependency.PackageSources.some(ps => ps.Type === PackageSourceType.Workspace)) {
                    const workspaceClient = new WorkspaceClient(alProject.Workspace);
                    const workspacePkgId = workspaceClient.getPackageFileName(alProjectDependency.Publisher, alProjectDependency.Name);
                    const alPackagePkgs = await workspaceClient.getPackageById(workspacePkgId);
                    for (const alPackagePkg of alPackagePkgs) {
                        OutputChannel.log(`Removing symbol files of package '${alPackagePkg.fsPath}' from package cache.`);
                        workspaceClient.removeApp(alPackagePkg.fsPath);
                    }
                }
                // Remove the package from the AL projects dependencies
                alProject.Package!.Dependencies = alProject.Package!.Dependencies.filter(
                  d => d.Id !== pkg.Id
                );
                // Remove the dependency from the AL project manifest
                alProject.removeDependency(pkg);

                // Reset the package version
                pkg.Version = undefined;
                
                if (this.UIController) {
                    this.UIController.PackageSidebar.updatePackageItem(pkg);
                    if (PackagePanel.currentPanel) {
                        PackagePanel.currentPanel.updatePanel(pkg);
                    }
                }
                vscode.window.showInformationMessage(`Package '${pkg.Name}' uninstalled successfully.`);
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