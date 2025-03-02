import * as vscode from "vscode";

export class ThemeHelper {
    /// <summary>
    /// Check if the active theme in VS Code is dark.
    /// </summary>
    /// <returns>True if the active theme is dark.</returns>
    public static isVSCodeDarkTheme(): boolean {
        return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
    }
}