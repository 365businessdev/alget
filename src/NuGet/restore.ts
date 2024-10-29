import * as vscode from 'vscode';
import * as output from '../output';
import * as alManifest from '../Common/manifest';
import path from 'path';
import fs = require('fs');

/// <summary>
/// Restores the NuGet packages in the workspace.
/// </summary>
export function restore() {
    output.clearOutput();

    if (vscode.workspace.workspaceFolders === undefined) {
        vscode.window.showErrorMessage('No workspace is opened.');

        return;
    }

    output.log('Restoring packages...');

    try
    {   
        let success: boolean = true;
        vscode.workspace.workspaceFolders.forEach(folder => {
            success = ((success) && (restorePackagesFromWorkspaceFolder(folder)));
        });

        if (success) {
            output.log('Packages restored.');
        } else {
            output.log('Some packages could not be restored. See the output for more information.');
        }
    } catch (error: any) {
        output.log(error.message);
    }
}

function restorePackagesFromWorkspaceFolder(folder: vscode.WorkspaceFolder) : boolean {
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
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        alManifest.getPackageCacheFromManifest(manifestPath, manifest);
    } catch (error: any) {
        output.log(`Error reading AL project manifest: ${error.message}`);

        return false;
    }

    return true;
}