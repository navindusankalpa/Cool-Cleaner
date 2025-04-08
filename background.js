// background.js

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tabs = await chrome.tabs.query({});
  const stored = await chrome.storage.local.get("siteList");
  const siteList = stored.siteList || [];

  for (const domain of siteList) {
    const stillOpen = tabs.some(tab => {
      try {
        return tab.url.includes(domain);
      } catch {
        return false;
      }
    });

    if (!stillOpen) {
      const origin = `https://${domain}`;

      // Remove cookies, cache, localStorage, etc.
      chrome.browsingData.remove({
        origins: [origin]
      }, {
        cookies: true,
        cache: true,
        localStorage: true,
        indexedDB: true,
        serviceWorkers: true
      }, () => {
        console.log(`Browsing data cleared for ${domain}`);
      });

      // Remove history entries
      chrome.history.deleteUrl({ url: origin }, () => {
        console.log(`History deleted for ${origin}`);
      });

      // Optional: clear subpages too (like https://domain.com/page1)
      chrome.history.search({ text: domain, maxResults: 1000 }, (results) => {
        results.forEach(entry => {
          if (entry.url.includes(domain)) {
            chrome.history.deleteUrl({ url: entry.url });
          }
        });
      });
    }
  }
});

// Additional functionality to track active sites and save them to chrome storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ siteList: [] }, function () {
    console.log("Site list initialized.");
  });
});

// Example of adding a site to the list (call this from popup or elsewhere)
function addSiteToList(domain) {
  chrome.storage.local.get("siteList", function (data) {
    const siteList = data.siteList || [];
    if (!siteList.includes(domain)) {
      siteList.push(domain);
      chrome.storage.local.set({ siteList: siteList }, () => {
        console.log(`Site ${domain} added to list.`);
      });
    }
  });
}

// Exposing the function to be called by popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addSite") {
    addSiteToList(message.domain);
    sendResponse({ success: true });
  }
});

// Function to clear browsing data (cookies, cache, history)
function clearBrowsingData(sites) {
// Define the types of data to be cleared
const dataToClear = {
  cookies: true,
  cache: true,
  history: true
};

// Clear cookies, cache, and history
chrome.browsingData.remove({}, dataToClear, function() {
  console.log("Browsing data cleared!");
});
}

// Listen for tab closing or other events to trigger the data clearing
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
chrome.tabs.get(tabId, function(tab) {
  let siteDomain = new URL(tab.url).hostname;
  let sitesToClear = [];  // List of domains from your extension settings

  // Check if the closed tab matches a tracked site
  if (sitesToClear.includes(siteDomain)) {
    clearBrowsingData(sitesToClear);
  }
});
});
