// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const tabsListElement = document.getElementById('tabsList');
  const tabContentContainerElement = document.getElementById('tabContentContainer');
  const copyButton = document.getElementById('copyButton');

  copyButton.addEventListener('click', () => {
    const textContent = tabContentContainerElement.textContent;
    navigator.clipboard.writeText(textContent).then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy Text';
      }, 2000);
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  });

  // 1. Get and display all tabs in the current window
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("Error querying tabs:", chrome.runtime.lastError.message);
      tabsListElement.innerHTML = '<li>Error loading tabs.</li>';
      return;
    }

    if (tabs.length === 0) {
      tabsListElement.innerHTML = '<li>No tabs open in the current window.</li>';
      return;
    }

    // Move the active tab to the top of the list
    const activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex > 0) {
      const [activeTab] = tabs.splice(activeTabIndex, 1);
      tabs.unshift(activeTab);
    }

    tabs.forEach((tab) => {
      // Create a list item for each tab
      const listItem = document.createElement('li');
      listItem.dataset.tabId = tab.id; // Store tabId for later use

      if (tab.active) {
        listItem.style.color = 'red';
      }

      // Create an element to display the title
      const titleElement = document.createElement('span');
      titleElement.className = 'tab-title';
      titleElement.textContent = tab.title || 'Untitled Tab';

      // Create an element to display the URL
      const urlElement = document.createElement('span');
      urlElement.className = 'tab-url';
      urlElement.textContent = tab.url || 'No URL';

      listItem.appendChild(titleElement);
      listItem.appendChild(urlElement);

      // 2. Add a click event listener to each tab item
      listItem.addEventListener('click', () => {
        // Clear previous content and show loading message
        tabContentContainerElement.innerHTML = '<p>Loading content...</p>';
        copyButton.style.display = 'none'; // Hide button while loading

        const tabId = parseInt(listItem.dataset.tabId, 10);

        // Check if tabId is valid
        if (isNaN(tabId)) {
            console.error("Invalid tab ID:", listItem.dataset.tabId);
            tabContentContainerElement.innerHTML = '<p>Error: Invalid tab ID.</p>';
            return;
        }

        // 3. Inject a function to get the text content into the selected tab
        // Manifest V3 uses chrome.scripting.executeScript
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: () => document.body.innerText,
          },
          (injectionResults) => {
            if (chrome.runtime.lastError) {
              console.error(`Error injecting script into tab ${tabId}:`, chrome.runtime.lastError.message);
              tabContentContainerElement.innerHTML = `<p>Error: Could not retrieve content from this tab. It might be a restricted page (e.g., chrome:// pages) or the extension lacks permission. Ensure 'host_permissions' in manifest.json includes this URL or is set to '<all_urls>'.</p>`;
              copyButton.style.display = 'none';
              return;
            }

            if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
              // 4. Display the retrieved text content
              const pageText = injectionResults[0].result;
              tabContentContainerElement.textContent = pageText;
              copyButton.style.display = 'block'; // Show the copy button

            } else {
              console.warn("Script injected, but no result received from content script.", injectionResults);
              tabContentContainerElement.innerHTML = '<p>Could not retrieve content. The content script might not have executed correctly or returned no data.</p>';
              copyButton.style.display = 'none';
            }
          }
        );
      });
      tabsListElement.appendChild(listItem);
    });
  });
});