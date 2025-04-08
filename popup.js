document.getElementById('addBtn').addEventListener('click', function() {
    let domain = document.getElementById('domainInput').value;

    // Validate if domain is not empty and is not already in the list
    if (domain.trim() !== '') {
      // Save the new site to local storage
      chrome.storage.local.get("trackedSites", function(data) {
        let sites = data.trackedSites || [];

        // Avoid adding duplicate domains
        if (!sites.includes(domain)) {
          sites.push(domain);

          chrome.storage.local.set({ "trackedSites": sites }, function() {
            console.log(`${domain} added to the tracked list`);
            updateSiteList(); // Update the list after adding a new site
            clearError();
          });
        } else {
          showError("This site is already in the list.");
        }
      });
    } else {
        showError("Please enter a valid domain.");
    }
  });
  
  // Update the site list in the popup, adding "X" buttons
  function updateSiteList() {
    chrome.storage.local.get("trackedSites", function(data) {
      let siteList = document.getElementById('siteList');
      siteList.innerHTML = ""; // Clear the current list

      // Populate the list with tracked sites
      data.trackedSites.forEach(function(domain) {
        let li = document.createElement("li");
        li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
        li.textContent = domain;
        let removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-sm");
        removeButton.textContent = "❌";
        removeButton.addEventListener('click', function() {
          removeSite(domain); // Remove site when "X" button is clicked
        });  
        // Append the button and site to the list item
        li.appendChild(removeButton);
        siteList.appendChild(li);
      });
    });
  }

  function showError(message) {
    let errorMessageDiv = document.getElementById('error-message');
    let errorMessageText = document.getElementById('error-message-text');
    
    errorMessageText.textContent = message;
    errorMessageDiv.classList.remove('d-none');
    
    // Add event listener to the close button
    errorMessageDiv.querySelector('.btn-close').addEventListener('click', function() {
      clearError(); // Hide the error message when close button is clicked
    });
  }
  
  // Hide the error message
  function clearError() {
    let errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.classList.add('d-none');
  }
  

  // Remove a site from the tracked list
  function removeSite(domain) {
    chrome.storage.local.get("trackedSites", function(data) {
      let sites = data.trackedSites || [];
      sites = sites.filter(function(site) {
        return site !== domain; // Filter out the site to be removed
      });

      // Update the tracked sites in local storage
      chrome.storage.local.set({ "trackedSites": sites }, function() {
        console.log(`${domain} removed from the tracked list`);
        updateSiteList(); // Re-update the list
      });
    });
  }

  // Initial load
  updateSiteList(); // Load and display the tracked sites on popup open
