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
                    tab.removeEventListener('click', handleTabClick); // Remove any existing event listener
                    tab.addEventListener('click', handleTabClick); // Add the event listener
                });

                function handleTabClick(event) {
                    showTab(event.currentTarget.id.replace('-tab', ''));
                }
                break;
            case 'setContentArea':
                document.getElementById('content-area').innerHTML = message.value.data;
                bindEventListeners();
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
        bindEventListeners();
    }
});

/// <summary>
/// Bind event listeners to interact with the extension
/// </summary>
function bindEventListeners() {
    // Add event listener to install button
    document.querySelectorAll('button#install').forEach(function(installButton) {
        installButton.removeEventListener('click', handleInstallClick); // Remove any existing event listener
        installButton.addEventListener('click', handleInstallClick); // Add the event listener
    });

    // Add event listener to update button
    document.querySelectorAll('button#update').forEach(function(updateButton) {
        updateButton.removeEventListener('click', handleUpdateClick); // Remove any existing event listener
        updateButton.addEventListener('click', handleUpdateClick); // Add the event listener
    });

    // Add event listener to uninstall button
    document.querySelectorAll('button#uninstall').forEach(function(uninstallButton) {
        uninstallButton.removeEventListener('click', handleUninstallClick); // Remove any existing event listener
        uninstallButton.addEventListener('click', handleUninstallClick); // Add the event listener
    });

    function handleInstallClick() {
        const versionSelect = document.querySelector('#version-select');
        const selectedVersion = versionSelect ? versionSelect.value : undefined;
        vscode.postMessage({
            type: 'onInstall',
            value: {
                version: selectedVersion
            }
        });
    }

    function handleUpdateClick() {
        vscode.postMessage({
            type: 'onInstall',
            value: {
                version: undefined
            }
        });
    }

    function handleUninstallClick() {
        vscode.postMessage({
            type: 'onUninstall'
        });
    }

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