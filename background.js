let currentTabId = null;
let result_buffer = null;

function isValidUrl(url) {
    return (url.includes("/course/materials/detail?id=") || url.includes("/course/materials/replay?"));
}

chrome.runtime.onConnect.addListener((port) => {
    if (result_buffer) {
        port.postMessage({ body: result_buffer });
        result_buffer = null;
        return;
    }
    port.onMessage.addListener((request) => {
        if (currentTabId) {
            return;
        }
        currentTabId = request.id;
        if (currentTabId < 0) {
            return;
        }
        chrome.debugger.attach({
            tabId: currentTabId
        }, "1.0", () => {
            chrome.debugger.sendCommand({ //first enable the Network
                tabId: currentTabId
            }, "Network.enable");

            chrome.debugger.onEvent.addListener((debuggeeId, message, params) => {
                if (currentTabId != debuggeeId.tabId) {
                    return;
                }

                if (message === "Network.responseReceived") {
                    if (!isValidUrl(params.response.url) || params.type !== "XHR") return;
                    let requestId = params.requestId;
                    chrome.debugger.sendCommand({
                        tabId: debuggeeId.tabId
                    }, "Network.getResponseBody", {
                        requestId
                    }, (response) => {
                        if (!response.body) return;
                        try {
                            port.postMessage({ body: response.body });
                        }
                        catch (e) {
                            result_buffer = response.body;
                        }
                    });
                }
            });
        });
        chrome.debugger.onDetach.addListener(() => {
            console.log("detach");
            currentTabId = null;
        });
        console.log("attach");
    });
});
