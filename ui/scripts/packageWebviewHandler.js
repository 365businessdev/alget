// Acquire VSCode API to communicate with the extension
const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', function() {
    // Receive messages from VSCode
    window.addEventListener('message', function(event) {
        // get the message from the event
        const message = event.data;

        switch (message.type) {
            case 'showPackage':
                this.document.body.innerHTML = message.value;

                const tabArea = document.getElementById('tab-area');
                Array.from(tabArea.children).forEach(tab => {
                    tab.addEventListener('click', function() {
                        showTab(tab.id.replace('-tab', ''));
                    });
                });
                break;
            case 'setContentArea':
                if (message.value.tab === 'developer') {
                    const pre = document.createElement('pre');
                    pre.innerHTML = jsonToHtml(message.value.data);
                    document.getElementById('content-area').appendChild(pre);
                } else {
                    document.getElementById('content-area').innerHTML = message.value.data;
                }
                break;
        }

        // Set state for restoring the webview
        vscode.setState({
            body: this.document.body.innerHTML
        });
    });

    // Restore the webview state
    const previousState = vscode.getState();
    if (previousState) {
        document.body.innerHTML = previousState.body;
    }
});

/// <summary>
/// Converts a JSON object to HTML
/// </summary>
/// <param name="json">The JSON object to convert</param>
/// <returns>The HTML representation of the JSON object</returns>
function jsonToHtml(json) {
    const jsonString = JSON.stringify(json, null, 2); // Pretty print JSON with 2 spaces
    const escapedJson = jsonString.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Escape HTML tags
    return `<pre>${escapedJson}</pre>`;
}

/// <summary>
/// Toggles the collapse of an element
/// </summary>
/// <param name="id">The ID of the element to toggle</param>
function toggleCollapse(id) {
    const element = document.getElementById(id);
    const header = element.previousElementSibling;
    const isCollapsed = element.style.display === 'none';

    element.style.display = isCollapsed ? 'flex' : 'none';
    header.style.borderBottom = isCollapsed ? '1px solid #414141' : 'none';
    header.style.paddingBottom = isCollapsed ? '10px' : '0px';
}

/// <summary>
/// Shows the specified tab
/// </summary>
/// <param name="tab">The tab to show</param>
function showTab(tab) {
    // If the tab is already active, do nothing
    const activeTab = document.querySelector('.tab-area > div.active');
    if (activeTab && activeTab.id === `${tab}-tab`) {
        return;
    }

    // Set the tab to bold and the others to normal
    const tabElements = document.getElementById('tab-area').children;
    const tabUnderline = document.getElementById('tab-underline');

    const tabElementsArray = Array.from(tabElements);
    for (tabElement of tabElementsArray) {
        const id = tabElement.getAttribute('id');
        tabElement.classList.toggle('active', id === `${tab}-tab`);

        if (tabElement.id.replace("-tab","") === tab) {
            tabUnderline.style.marginLeft = `${tabElementsArray.indexOf(tabElement) * 200}px`; // TODO: Make this work
        }
    }

    // Show the loading bar
    document.getElementById('content-area').innerHTML = `<div class="loading-bar">
        <div class="loading-progress" style="display: block;"></div>
    </div>`;

    // Send the selected tab to the extension
    vscode.postMessage({
        type: 'onSelectContentArea',
        value: tab
    });
}