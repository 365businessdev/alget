function helloWorld() {
  alert("Hello World");
}

// TODO: Implement vscode.GetState() / vscode.SetState() to store the state of the webview

// Acquire VSCode API to communicate with the extension
const vscode = acquireVsCodeApi();

vscode.postMessage({
  type: "initialize"
});

// Listen for messages from the extension
window.addEventListener("message", (event) => {
  console.log(event);

  const message = event.data;

  switch (message.type) {
    case "setPackageSourceList":
      document.body.innerHTML = message.data;
      break;
  }
});
