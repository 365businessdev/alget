/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import * as vscode from "vscode";
import { ALGetController } from './Controller/ALGetController';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  new ALGetController(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
