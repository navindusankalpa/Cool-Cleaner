// background.js

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const tabs = await chrome.tabs.query({});
    const stored = await chrome.storage.local.get("siteList");
    const siteList = stored.siteList || [];

    let sitesCleared = 0;
  
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
          sitesCleared++;
          console.log(sitesCleared);
          // Simulate data cleared for stats (in MBs)
          const clearedData = {
            cookies: Math.floor(Math.random() * 5) + 1, // Random number for cookies (MB)
            cache: Math.floor(Math.random() * 20) + 5,  // Random number for cache (MB)
            history: Math.floor(Math.random() * 3) + 1  // Random number for history (MB)
          };
  
          // Save stats in local storage
          chrome.storage.local.get("deletedData", function (data) {
            const existingData = data.deletedData || { cookies: 0, cache: 0, history: 0 };
  
            existingData.cookies += clearedData.cookies;
            existingData.cache += clearedData.cache;
            existingData.history += clearedData.history;
  
            chrome.storage.local.set({ "deletedData": existingData }, () => {
              console.log("Updated deleted data stats:", existingData);
            });
          });
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
  let clearedHistoryCount = 0; // Initialize history cleared count
  
  // Define the types of data to be cleared
  const dataToClear = {
    cookies: true,
    cache: true,
    history: true
  };

  // Clear cookies, cache, and history
  chrome.browsingData.remove({}, dataToClear, function() {
    console.log("Browsing data cleared!");

    // Update the cleared count (example for cookies, cache, and history)
    // Assume we can calculate or track how many cookies, cache items, and history entries were removed

    // This is a placeholder for the count, adjust it with actual logic if possible
    const cookiesCleared = 1024 * 1024 * 10; // Example: 10 MB of cookies cleared
    const cacheCleared = 1024 * 1024 * 5; // Example: 5 MB of cache cleared
    clearedHistoryCount = 20; // Example: 20 history entries cleared

    // Save the stats in local storage
    chrome.storage.local.get("deletedData", function(data) {
      let deletedData = data.deletedData || { cookies: 0, cache: 0, history: 0 };
      
      // Increment the deleted data stats
      deletedData.cookies += cookiesCleared;
      deletedData.cache += cacheCleared;
      deletedData.history += clearedHistoryCount;

      // Save the updated deleted data
      chrome.storage.local.set({ "deletedData": deletedData }, function() {
        console.log(`Cookies: ${cookiesCleared} bytes, Cache: ${cacheCleared} bytes, History Cleared: ${clearedHistoryCount} entries.`);
      });
    });
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

  