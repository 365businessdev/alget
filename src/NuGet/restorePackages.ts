import * as vscode from 'vscode';
import path from 'path';
import fs = require('fs');
import * as workspaceSelection from "../UI/workspaceSelection";
import * as output from '../output';
import { ALManifest } from '../Common/manifest';
import { PackageManager } from '../Package/packageManager';
import { Package } from '../Models/package';

/// <summary>
/// Restores the NuGet packages in the workspace.
/// </summary>
export async function RestoreNuGetPackages() {
    output.clearOutput();

    if (vscode.workspace.workspaceFolders === undefined) {
        vscode.window.showErrorMessage('No workspace is opened.');

        return;
    }

    output.log('Restoring packages...');

    try
    {   
        let success: boolean = true;
        for (const folder of vscode.workspace.workspaceFolders) {
            success = success && await restorePackagesFromWorkspaceFolder(folder);
        }
        if (success) {
            // TODO: Find a way to invoke AL language extension to reload, without reloading the window
            // vscode.workspace.workspaceFolders.forEach((folder) => {
            //     const manifestPath = path.join(folder.uri.fsPath, 'app.json');
            //     if (!fs.existsSync(manifestPath)) {
            //         output.log('Touch manifest file to invoke AL language extension to reload.');
            //         alManifest.touchManifestFile(manifestPath);
            //     }
            // });

            output.log('Packages restored successfully.');

            // Restart AL language extension
            const alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
            if (alExtension) {
                await alExtension.activate();
                vscode.window.showInformationMessage(`Packages restored successfully. Please reload the window to apply changes.`, 'Reload')
                    .then(selection => {
                        if (selection === 'Reload') {
                            vscode.commands.executeCommand('workbench.action.reloadWindow');
                        }
                    });
            }
        } else {
            vscode.window.showWarningMessage('Restoring packages failed. Some or all packages could not be restored. Please check the output for more information.');
            output.log('Some or all packages could not be restored. Please check the output for more information.');
        }
    } catch (error: any) {
        output.log(error.message);
    }
}

/// <summary>
/// Restores the NuGet packages in the workspace folder.
/// </summary>
async function restorePackagesFromWorkspaceFolder(folder: vscode.WorkspaceFolder) : Promise<boolean> {
    let workspacePath = folder.uri.fsPath;
    output.log(`Restoring packages in ${workspacePath}...`);

    let manifestPath = path.join(workspacePath, 'app.json');
    if (!fs.existsSync(manifestPath)) {
        output.log(`${manifestPath} is no AL project folder. Skipping...`);

        return false;
    }

    output.log(`Reading AL project manifest from ${manifestPath}...`);
    try 
    {
        const manifest = new ALManifest(manifestPath);
        
        // create package manager instance
        const packageManager = new PackageManager(
            workspaceSelection.getWorkspaceFolderFromManifest(
                vscode.Uri.file(manifestPath)
            )!
        );

        // get packages from manifest
        const packages: Package[] = await manifest.getPackagesAsync();

        // set the package cache
        packageManager.setPackageCache(packages);

        // restore packages (only those that are not installed and not from local source)
        for (const pkg of (packages.filter((pkg) => (pkg.PackageID !== null) && (!pkg.IsInstalled) && (pkg.Source.name !== "Local")))) {
            output.log(`Restoring package ${pkg.Name} (ID: ${pkg.PackageID}) version ${pkg.Version} or newer...`);

            // Restore the package
            await packageManager.installPackageAsync(pkg.PackageID!, undefined);
        }
        // await alManifest.getPackageCacheFromManifest(manifestPath, manifest).then(async (packages) => {
        //     const pkgsToRestore = packages.filter((pkg) => (pkg.PackageID !== null) && (!pkg.IsInstalled) && (pkg.Source.name !== "Local"));
        //     await pkgsToRestore.forEach(async (pkg) => {
        //             output.log(`Restoring package ${pkg.Name} (ID: ${pkg.PackageID}) version ${pkg.Version} or newer...`);
        //             // Restore the package
        //             const packageManager = new PackageManager(workspaceSelection.getWorkspaceFolderFromManifest(vscode.Uri.file(manifestPath))!);
        //             await packageManager.install(pkg.PackageID!, undefined);
        //     });
        // });
    } catch (error: any) {
        output.log(`Error reading AL project manifest: ${error.message}`);

        return false;
    }

    return true;
}