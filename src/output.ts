import { window } from "vscode";

// create an ALGet output channel
let outputChannel = window.createOutputChannel('ALGet');

/// <summary>
/// Logs a message to the output channel.
/// </summary>
/// <param name="message">The message to log.</param>
export function log(message: string) {
    if (message === "") {
        return;
    }

    if (!message.startsWith("[")) {
        message = `[INFO] ${message}`;
    }

    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`${timestamp} ${message}`);
    outputChannel.show(true);
}

export function logError(message: string) {
    if (message === "") {
        return;
    }

    log(`[ERROR] ${message}`);
}

/// <summary>
/// Clears the output channel.
/// </summary>
export function clearOutput() {
    outputChannel.clear();
}