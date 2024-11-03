import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as projectManifest from '../Common/manifest';
import * as output from '../output';
import { Project } from "../Models/project";

export default class ProjectLoader {
    /// <summary>
    /// Loads the AL project from the specified workspace folder
    /// </summary>
    public async loadProjectAsync(folder: vscode.WorkspaceFolder): Promise<Project | null> {
        let projectFolder = folder.uri.fsPath;

        let manifestPath = path.join(projectFolder, 'app.json');
        if (!fs.existsSync(manifestPath)) {
            output.log(`${manifestPath} is no AL project folder. Skipping...`);
    
            return null;
        }

        try 
        {
            let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            let packages = await projectManifest.getPackageCacheFromManifest(manifestPath, manifest);
        
            return {
                id: manifest.id,
                publisher: manifest.publisher,
                name: manifest.name,
                version: manifest.version,
                fsPath: projectFolder,
                packages: packages,
            };
        } catch (error: any) {
            output.log(`Error reading AL project manifest: ${error.message}`);

            return null;
        }
    }
}