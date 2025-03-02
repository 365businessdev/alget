// Acquire VSCode API to communicate with the extension
const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to the search input
    let searchTimeout;
    document.querySelector('input[name="q"]').addEventListener('input', function(event) {
        const input = event.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            if (input.length > 3) {
                searchPackage(input);
            }
        }, 1500);
    });

    document.querySelector('input[name="q"]').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            clearTimeout(searchTimeout);
            const input = event.target.value;
            if (input.length > 1) {
                searchPackage(input);
            }
        }
    });

    // Receive messages from VSCode
    window.addEventListener('message', function(event) {
        // get the message from the event
        const message = event.data;

        switch (message.type) {
            case 'onRestoredState':
                restoreState(
                    message.value.searchQuery,
                    message.value.packages
                );
                break;
            case 'onPackagesLoaded':
                setPackageList(message.value);

                // Set state for restoring the webview
                vscode.setState({
                    searchQuery: document.querySelector('input[name="q"]').value
                });
                break;
        }
    });

    // Restore the webview state
    const previousState = vscode.getState();
    if (previousState) {
        document.getElementById('loading-progress').style.display = 'block';

        vscode.postMessage({
            type: 'onRestoreState',
            value: previousState.searchQuery
        });

        document.getElementById('loading-progress').style.display = 'none';
    }
});

function searchPackage(searchQuery) {
    // Show loading bar
    document.getElementById('loading-progress').style.display = 'block';
    document.getElementById('results').innerHTML = '';

    vscode.postMessage({
        type: 'onSearchPackages',
        value: searchQuery
    });
}

function restoreState(searchQuery, packageList) {
    document.querySelector('input[name="q"]').value = searchQuery;
    setPackageList(packageList);
}

/// <summary>
/// Set the package list in the webview
/// </summary>
/// <param name="packageList">The package list to set</param>
function setPackageList(packageList) {
    this.document.getElementById('results').innerHTML = packageList;
    bindEventListeners();
    
    // Hide loading bar
    document.getElementById('loading-progress').style.display = 'none';
}

/// <summary>
/// Bind event listeners to interact with the extension
/// </summary>
function bindEventListeners() {
    // Add event listener to select package
    document.querySelectorAll('.packageItem').forEach(function(packageItem) {
        packageItem.addEventListener('click', function() {
            vscode.postMessage({
                type: 'onSelectPackage',
                value: packageItem.getAttribute('id')
            });
        });
    });

    // Add event listener to gear icon
    document.querySelectorAll('.packageItem img[settings]').forEach(function(gearIcon) {
        gearIcon.addEventListener('click', function(event) {
            const packageItem = event.target.closest('.packageItem');
            if (packageItem) {
                vscode.postMessage({
                    type: 'onSettings',
                    value: packageItem.getAttribute('id')
                });
            }
        });
    });

    // Add event listener to install button
    document.querySelectorAll('.packageItem button[install]').forEach(function(installButton) {
        installButton.addEventListener('click', function(event) {
            const packageItem = event.target.closest('.packageItem');
            if (packageItem) {
                vscode.postMessage({
                    type: 'onInstall',
                    value: packageItem.getAttribute('id')
                });
            }
        });
    });

    // Add event listener to update button
    document.querySelectorAll('.packageItem button[update]').forEach(function(updateButton) {
        updateButton.addEventListener('click', function(event) {
            const packageItem = event.target.closest('.packageItem');
            if (packageItem) {
                vscode.postMessage({
                    type: 'onUpdate',
                    value: packageItem.getAttribute('id')
                });
            }
        });
    });
}