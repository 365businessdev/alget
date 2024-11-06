import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as output from '../output';
import { Project } from "../Models/project";
import { ALManifest } from '../Common/manifest';

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
            const manifest = new ALManifest(manifestPath);
            const packages = await manifest.getPackagesAsync();
        
            return {
                id: manifest.Content().id,
                publisher: manifest.Content().publisher,
                name: manifest.Content().name,
                version: manifest.Content().version,
                fsPath: projectFolder,
                packages: packages,
            };
        } catch (error: any) {
            output.log(`Error reading AL project manifest: ${error.message}`);

            return null;
        }
    }
}