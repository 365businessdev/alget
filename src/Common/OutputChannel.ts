/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
import { window } from "vscode";

export class OutputChannel {
    /// <summary>
    /// ALGet output channel in VS Code.
    /// </summary>
    private static OutputChannel = window.createOutputChannel('ALGet');

    /// <summary>
    /// Logs a message to the output channel.
    /// </summary>
    /// <param name="message">The message to log.</param>
    public static log(message: string) {
        if (message === "") {
            return;
        }

        if (!message.startsWith("[")) {
            message = `[INFO] ${message}`;
        }

        const timestamp = new Date().toISOString();
        this.OutputChannel.appendLine(`${timestamp} ${message}`);
        this.OutputChannel.show(true);
    }

    /// <summary>
    /// Logs a warning message to the output channel.
    /// </summary>
    public static logWarning(message: string) {
        if (message === "") {
            return;
        }

        this.log(`[WARNING] ${message}`);
    }

    /// <summary>
    /// Logs an error message to the output channel.
    /// </summary>
    /// <param name="message">The error message to log.</param>
    public static logError(message: string) {
        if (message === "") {
            return;
        }

        this.log(`[ERROR] ${message}`);
    }

    /// <summary>
    /// Clears the output channel.
    /// </summary>
    public static clearOutput() {
        this.OutputChannel.clear();
    }
}