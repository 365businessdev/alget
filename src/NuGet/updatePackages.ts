import * as vscode from 'vscode';
import * as workspaceSelection from "../UI/workspaceSelection";
import * as output from '../output';
import * as alManifest from '../Common/manifest';
import path from 'path';
import PackageManager from '../Package/packageManager';
import fs = require('fs');

/// <summary>
/// Updates the NuGet packages in the workspace.
/// </summary>
export async function UpdateNuGetPackages() {
    output.clearOutput();

    if (vscode.workspace.workspaceFolders === undefined) {
        vscode.window.showErrorMessage('No workspace is opened.');

        return;
    }

    output.log('Update packages to latest version...');

    try
    {   
        let success: boolean = true;
        for (const folder of vscode.workspace.workspaceFolders) {
            success = success && await updatePackagesFromWorkspaceFolder(folder);
        }
        if (success) {
            // vscode.workspace.workspaceFolders.forEach((folder) => {
            //     const manifestPath = path.join(folder.uri.fsPath, 'app.json');
            //     if (!fs.existsSync(manifestPath)) {
            //         output.log('Touch manifest file to invoke AL language extension to reload.');
            //         alManifest.touchManifestFile(manifestPath);
            //     }
            // });

            output.log('Packages updated successfully.');

            // Restart AL language extension
            const alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
            if (alExtension) {
                await alExtension.activate();
                vscode.window.showInformationMessage(`Packages updated successfully. Please reload the window to apply changes.`, 'Reload')
                    .then(selection => {
                        if (selection === 'Reload') {
                            vscode.commands.executeCommand('workbench.action.reloadWindow');
                        }
                    });
            }
        } else {
            vscode.window.showWarningMessage('Updating packages failed. Some or all packages could not be updated. Please check the output for more information.');
            output.log('Some or all packages could not be updated. Please check the output for more information.');
        }
    } catch (error: any) {
        output.log(error.message);
    }
}

/// <summary>
/// Update the NuGet packages in the workspace folder.
/// </summary>
async function updatePackagesFromWorkspaceFolder(folder: vscode.WorkspaceFolder) : Promise<boolean> {
    let workspacePath = folder.uri.fsPath;
    output.log(`Updating packages in ${workspacePath}...`);

    let manifestPath = path.join(workspacePath, 'app.json');
    if (!fs.existsSync(manifestPath)) {
        output.log(`${manifestPath} is no AL project folder. Skipping...`);

        return false;
    }

    output.log(`Reading AL project manifest from ${manifestPath}...`);
    try 
    {        
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        await alManifest.getPackageCacheFromManifest(manifestPath, manifest).then(async (packages) => {
            const pkgsToRestore = packages.filter((pkg) => (pkg.PackageID !== null) && (pkg.UpdateVersion) && (pkg.IsInstalled) && (pkg.Source.name !== "Local"));
            await pkgsToRestore.forEach(async (pkg) => {
                    output.log(`Updating package ${pkg.Name} (ID: ${pkg.PackageID}) to latest version...`);
                    // Restore the package
                    const packageManager = new PackageManager(workspaceSelection.getWorkspaceFolderFromManifest(vscode.Uri.file(manifestPath))!);
                    await packageManager.install(pkg.PackageID!, undefined);
            });
        });
    } catch (error: any) {
        output.log(`Error reading AL project manifest: ${error.message}`);

        return false;
    }

    return true;
}