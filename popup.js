document.getElementById('data').contentEditable = false;

let port = chrome.runtime.connect({ name: "DisplayResult" });
port.onMessage.addListener((data) => {
    document.getElementById('data').value = data.body;
});

document.getElementById('start').addEventListener('click', function () {
    chrome.tabs.query({ currentWindow: true, active: true }, ([tab]) => {
        if (!tab.id) {
            alert("attach failed");
        }
        port.postMessage({ id: tab.id });
        document.getElementById('data').value = "attach success";
    });

});