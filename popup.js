document.addEventListener('DOMContentLoaded', () => {
  const tabsListElement = document.getElementById('tabsList');
  const tabContentContainerElement = document.getElementById('tabContentContainer');
  const copyButton = document.getElementById('copyButton');
  const convertToMarkdownBtn = document.getElementById('convertToMarkdownBtn');
  const viewToggleBtn = document.getElementById('viewToggleBtn');

  // Settings elements
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsContent = document.getElementById('settingsContent');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const apiKeyStatus = document.getElementById('apiKeyStatus');

  // State variables
  let currentRawText = '';
  let currentMarkdownText = '';
  let isMarkdownView = false;
  let currentApiKey = null;
  let currentTabUrl = '';

  // Initialize the extension
  initializeExtension();

  async function initializeExtension() {
    try {
      // Load saved API key
      currentApiKey = await getApiKey();
      if (currentApiKey) {
        apiKeyInput.value = currentApiKey;
        showStatus('API key loaded', 'success');
      }

      // Load last content
      chrome.storage.local.get(['lastRawText', 'lastMarkdownText', 'lastTabUrl', 'isMarkdownView'], (result) => {
        if (result.lastRawText) {
          currentRawText = result.lastRawText;
          currentMarkdownText = result.lastMarkdownText || '';
          currentTabUrl = result.lastTabUrl || '';
          isMarkdownView = result.isMarkdownView || false;
          displayContent();
          updateControlsVisibility();
        }
      });
    } catch (error) {
      console.error('Error initializing extension:', error);
    }
  }

  // Settings toggle
  settingsToggle.addEventListener('click', () => {
    settingsContent.classList.toggle('hidden');
  });

  // Save API key
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    if (!validateApiKeyFormat(apiKey)) {
      showStatus('Invalid API key format. Should start with "AIza" and be at least 35 characters.', 'error');
      return;
    }

    try {
      await saveApiKey(apiKey);
      currentApiKey = apiKey;
      showStatus('API key saved successfully', 'success');
      updateControlsVisibility();
    } catch (error) {
      showStatus('Error saving API key: ' + error.message, 'error');
    }
  });

  // Test API key
  testApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key to test', 'error');
      return;
    }

    showStatus('Testing API key...', 'success');
    testApiKeyBtn.disabled = true;

    try {
      const isValid = await testApiKey(apiKey);
      if (isValid) {
        showStatus('API key is valid!', 'success');
      } else {
        showStatus('API key test failed. Please check your key.', 'error');
      }
    } catch (error) {
      showStatus('Error testing API key: ' + error.message, 'error');
    } finally {
      testApiKeyBtn.disabled = false;
    }
  });

  // Copy button functionality
  copyButton.addEventListener('click', () => {
    const textContent = isMarkdownView ? currentMarkdownText : currentRawText;
    navigator.clipboard.writeText(textContent).then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Error copying text: ', err);
      showStatus('Error copying text', 'error');
    });
  });

  // Convert to markdown button
  convertToMarkdownBtn.addEventListener('click', async () => {
    if (!currentApiKey) {
      showStatus('Please save a valid API key first', 'error');
      return;
    }

    if (!currentRawText) {
      showStatus('No content to convert', 'error');
      return;
    }

    convertToMarkdownBtn.disabled = true;
    convertToMarkdownBtn.textContent = 'Converting...';

    try {
      currentMarkdownText = await convertTextToMarkdown(currentRawText, currentApiKey);
      showStatus('Content converted to markdown successfully', 'success');

      // Switch to markdown view
      isMarkdownView = true;
      chrome.storage.local.set({ lastMarkdownText: currentMarkdownText, isMarkdownView: isMarkdownView });
      displayContent();
      updateControlsVisibility();

    } catch (error) {
      console.error('Error converting to markdown:', error);
      showStatus('Error converting to markdown: ' + error.message, 'error');
    } finally {
      convertToMarkdownBtn.disabled = false;
      convertToMarkdownBtn.textContent = 'Convert to Markdown';
    }
  });

  // View toggle button
  viewToggleBtn.addEventListener('click', () => {
    isMarkdownView = !isMarkdownView;
    displayContent();
    updateControlsVisibility();
  });

  function showStatus(message, type) {
    apiKeyStatus.textContent = message;
    apiKeyStatus.className = `status-message status-${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        apiKeyStatus.textContent = '';
        apiKeyStatus.className = '';
      }, 3000);
    }
  }

  function updateControlsVisibility() {
    const hasContent = currentRawText.length > 0;
    const hasMarkdown = currentMarkdownText.length > 0;
    const hasApiKey = currentApiKey && currentApiKey.length > 0;

    copyButton.style.display = hasContent ? 'block' : 'none';
    convertToMarkdownBtn.style.display = (hasContent && hasApiKey) ? 'block' : 'none';
    viewToggleBtn.style.display = hasMarkdown ? 'block' : 'none';

    // Update view toggle button text
    if (hasMarkdown) {
      viewToggleBtn.textContent = isMarkdownView ? 'View: Markdown' : 'View: Raw Text';
    }

    // Update copy button text
    if (hasContent) {
      copyButton.textContent = isMarkdownView && hasMarkdown ? 'Copy Markdown' : 'Copy Text';
    }
  }

  function displayContent() {
    if (isMarkdownView && currentMarkdownText) {
      // Display markdown content
      const htmlContent = renderMarkdownToHtml(currentMarkdownText);
      tabContentContainerElement.innerHTML = htmlContent;
      tabContentContainerElement.classList.add('markdown-view');
      applyMarkdownStyling(tabContentContainerElement);
    } else if (currentRawText) {
      // Display raw text content
      tabContentContainerElement.textContent = currentRawText;
      tabContentContainerElement.classList.remove('markdown-view');
    } else {
      tabContentContainerElement.innerHTML = '<p>Select a tab from the list above to view its content.</p>';
      tabContentContainerElement.classList.remove('markdown-view');
    }
  }

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
        const clickedTab = tabs.find(t => t.id === tabId);
        currentTabUrl = clickedTab ? clickedTab.url : '';

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
              // 4. Store and display the retrieved text content
              const pageText = injectionResults[0].result;
              currentRawText = `Source URL: ${currentTabUrl}\n\n${pageText}`;
              currentMarkdownText = ''; // Reset markdown content
              isMarkdownView = false; // Reset to raw text view

              // Save to local storage
              chrome.storage.local.set({
                lastRawText: currentRawText,
                lastMarkdownText: '',
                lastTabUrl: currentTabUrl,
                isMarkdownView: false
              });

              displayContent();
              updateControlsVisibility();

            } else {
              console.warn("Script injected, but no result received from content script.", injectionResults);
              tabContentContainerElement.innerHTML = '<p>Could not retrieve content. The content script might not have executed correctly or returned no data.</p>';
              currentRawText = '';
              currentMarkdownText = '';
              updateControlsVisibility();
            }
          }
        );
      });
      tabsListElement.appendChild(listItem);
    });
  });
});
