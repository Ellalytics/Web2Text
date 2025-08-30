document.addEventListener('DOMContentLoaded', () => {
  const tabsListElement = document.getElementById('tabsList');
  const tabContentContainerElement = document.getElementById('tabContentContainer');
  const copyButton = document.getElementById('copyButton');
  const convertToMarkdownBtn = document.getElementById('convertToMarkdownBtn');
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  const emailMarkdownBtn = document.getElementById('emailMarkdownBtn');
  const emailRawTextBtn = document.getElementById('emailRawTextBtn');
  const emailStatus = document.getElementById('emailStatus');

  // Settings elements
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsContent = document.getElementById('settingsContent');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const versionInfo = document.getElementById('versionInfo');
  const signInButton = document.getElementById('signInButton');
  const authStatus = document.getElementById('authStatus');
  const signOutButton = document.getElementById('signOutButton');
 
  const customPromptInput = document.getElementById('customPromptInput');
  const saveCustomPromptBtn = document.getElementById('saveCustomPromptBtn');
  const customPromptStatus = document.getElementById('customPromptStatus');

   // State variables
   let currentRawText = '';
  let currentMarkdownText = '';
  let isMarkdownView = false;
  let llmApiKey = null;
  let currentTabUrl = '';
  let customPrompt = '';
  let isLoading = false;

  // Initialize the extension
  initializeExtension();
  checkAuthStatus();

  async function initializeExtension() {
    try {
      // Load saved API key
      llmApiKey = await getApiKey();
      if (llmApiKey) {
        apiKeyInput.value = llmApiKey;
        showStatus('API key loaded', 'success');
      }

      // Load last content
      chrome.storage.local.get(['lastRawText', 'lastTabUrl', 'isMarkdownView'], (result) => {
        if (result.lastRawText) {
          currentRawText = result.lastRawText;
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

  // Display extension version
  const manifest = chrome.runtime.getManifest();
  versionInfo.textContent = `Version: ${manifest.version}`;
  
   // Settings toggle
   settingsToggle.addEventListener('click', () => {
    settingsContent.classList.toggle('hidden');
  });

  // Save custom prompt
  saveCustomPromptBtn.addEventListener('click', async () => {
    const prompt = customPromptInput.value.trim();
    try {
      await saveCustomPrompt(prompt);
      customPrompt = prompt;
      showCustomPromptStatus('Prompt saved successfully', 'success');
    } catch (error) {
      showCustomPromptStatus('Error saving prompt: ' + error.message, 'error');
    }
  });

  // Sign in button
  signInButton.addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        showAuthStatus(`Sign-in error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      if (token) {
        showAuthStatus('Signed in successfully!', 'success');
        checkAuthStatus();
      }
    });
  });

  // Sign out button
  signOutButton.addEventListener('click', () => {
    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
        if (chrome.runtime.lastError || !token) {
            showAuthStatus('Not signed in.', 'error');
            return;
        }

        // Revoke the token
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then(() => {
                chrome.identity.removeCachedAuthToken({ token: token }, () => {
                    showAuthStatus('Signed out successfully.', 'success');
                    checkAuthStatus();
                });
            });
    });
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
      llmApiKey = apiKey;
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
    if (!llmApiKey) {
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
      const customPrompt = await getCustomPrompt();
      currentMarkdownText = await convertTextToMarkdown(currentRawText, llmApiKey, customPrompt);
      showStatus('Content converted to markdown successfully', 'success');

      // Switch to markdown view
      isMarkdownView = true;
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await saveMarkdownForTab(activeTab.id, currentMarkdownText);
      chrome.storage.local.set({ isMarkdownView: isMarkdownView });
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

  // Email markdown button
  emailMarkdownBtn.addEventListener('click', async () => {
    if (!currentMarkdownText) {
      showStatus('No markdown content to email', 'error');
      return;
    }

    emailMarkdownBtn.disabled = true;
    emailMarkdownBtn.textContent = 'Sending...';

    try {
      // 1. Get auth token
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          showStatus('Could not get auth token.', 'error');
          emailMarkdownBtn.disabled = false;
          emailMarkdownBtn.textContent = 'Email markdown to myself';
          return;
        }

        // 2. Get user's email
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userInfo = await response.json();
        const userEmail = userInfo.email;

        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            showStatus('Could not retrieve a valid email address.', 'error');
            emailMarkdownBtn.disabled = false;
            emailMarkdownBtn.textContent = 'Email markdown to myself';
            return;
        }

        // 3. Send email
        const subjectMatch = currentMarkdownText.match(/^# (.*)/m);
        const subjectTitle = subjectMatch ? subjectMatch[1] : 'Untitled Content';
        
        // Extract hostname from URL
        const hostname = currentTabUrl ? new URL(currentTabUrl).hostname : '';
        const subject = hostname ? `[${hostname}] ${subjectTitle}` : subjectTitle;

        const emailData = {
          to: userEmail,
          subject: subject,
          body: currentMarkdownText
        };

        chrome.runtime.sendMessage({ action: 'sendEmail', emailData, token }, (response) => {
          if (response.success) {
            showEmailStatus('Email sent successfully!', 'success');
          } else {
            showEmailStatus(`Error sending email: ${response.error}`, 'error');
          }
          emailMarkdownBtn.disabled = false;
          emailMarkdownBtn.textContent = 'Email markdown to myself';
        });
      });
    } catch (error) {
      showEmailStatus(`Error: ${error.message}`, 'error');
      emailMarkdownBtn.disabled = false;
      emailMarkdownBtn.textContent = 'Email markdown to myself';
    }
  });

  // Email raw text button
  emailRawTextBtn.addEventListener('click', async () => {
    if (!currentRawText) {
      showStatus('No raw text to email', 'error');
      return;
    }

    emailRawTextBtn.disabled = true;
    emailRawTextBtn.textContent = 'Sending...';

    try {
      // 1. Get auth token
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          showStatus('Could not get auth token.', 'error');
          emailRawTextBtn.disabled = false;
          emailRawTextBtn.textContent = 'Email Raw Text';
          return;
        }

        // 2. Get user's email
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userInfo = await response.json();
        const userEmail = userInfo.email;

        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            showStatus('Could not retrieve a valid email address.', 'error');
            emailRawTextBtn.disabled = false;
            emailRawTextBtn.textContent = 'Email Raw Text';
            return;
        }

        // 3. Send email
        const subjectMatch = currentRawText.match(/^Source URL: (.*)/m);
        const subjectTitle = subjectMatch ? subjectMatch[1] : 'Untitled Content';
        
        // Extract hostname from URL
        const hostname = currentTabUrl ? new URL(currentTabUrl).hostname : '';
        const subject = hostname ? `[${hostname}] ${subjectTitle}` : subjectTitle;

        const emailData = {
          to: userEmail,
          subject: subject,
          body: currentRawText
        };

        chrome.runtime.sendMessage({ action: 'sendEmail', emailData, token }, (response) => {
          if (response.success) {
            showEmailStatus('Email sent successfully!', 'success');
          } else {
            showEmailStatus(`Error sending email: ${response.error}`, 'error');
          }
          emailRawTextBtn.disabled = false;
          emailRawTextBtn.textContent = 'Email Raw Text';
        });
      });
    } catch (error) {
      showEmailStatus(`Error: ${error.message}`, 'error');
      emailRawTextBtn.disabled = false;
      emailRawTextBtn.textContent = 'Email Raw Text';
    }
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

  function showAuthStatus(message, type) {
    authStatus.textContent = message;
    authStatus.className = `status-message status-${type}`;
  }

  function showCustomPromptStatus(message, type) {
    customPromptStatus.textContent = message;
    customPromptStatus.className = `status-message status-${type}`;

    if (type === 'success') {
      setTimeout(() => {
        customPromptStatus.textContent = '';
        customPromptStatus.className = '';
      }, 3000);
    }
  }

  function showEmailStatus(message, type) {
    emailStatus.textContent = message;
    emailStatus.className = `status-message status-${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        emailStatus.textContent = '';
        emailStatus.className = '';
      }, 3000);
    }
  }

  function checkAuthStatus() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        signInButton.style.display = 'none';
        signOutButton.style.display = 'block';
        showAuthStatus('Signed in.', 'success');
      } else {
        signInButton.style.display = 'block';
        signOutButton.style.display = 'none';
        showAuthStatus('Not signed in.', 'error');
      }
    });
  }

  function updateControlsVisibility() {
    if (isLoading) {
      copyButton.style.display = 'none';
      viewToggleBtn.style.display = 'none';
      emailMarkdownBtn.style.display = 'none';
      emailRawTextBtn.style.display = 'none';
      convertToMarkdownBtn.style.display = 'none';
      return;
    }

    const hasContent = currentRawText.length > 0;
    const hasMarkdown = currentMarkdownText && currentMarkdownText.length > 0;
    const hasApiKey = llmApiKey && llmApiKey.length > 0;

    copyButton.style.display = hasContent ? 'block' : 'none';
    viewToggleBtn.style.display = hasMarkdown ? 'block' : 'none';
    emailMarkdownBtn.style.display = hasMarkdown ? 'block' : 'none';
    emailRawTextBtn.style.display = hasContent ? 'block' : 'none';
    convertToMarkdownBtn.style.display = (hasContent && hasApiKey) ? 'block' : 'none';

    if (hasMarkdown) {
      copyButton.textContent = isMarkdownView ? 'Copy Markdown' : 'Copy Raw Text';
      viewToggleBtn.textContent = isMarkdownView ? 'View Raw Text' : 'View Markdown';
    } else {
      copyButton.textContent = 'Copy Raw Text';
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

  function updateTabsList() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error querying tabs:", chrome.runtime.lastError.message);
        tabsListElement.innerHTML = '<li>Error loading tabs.</li>';
        return;
      }

      tabsListElement.innerHTML = '';

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
          listItem.style.fontWeight = 'bold';
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
        listItem.addEventListener('click', async () => {
          const tabId = parseInt(listItem.dataset.tabId, 10);

          // Make the clicked tab active
          chrome.tabs.update(tabId, { active: true });

          // Update the styling of the tabs in the list
          document.querySelectorAll('#tabsList li').forEach(item => {
            if (parseInt(item.dataset.tabId, 10) === tabId) {
              item.style.color = 'red';
              item.style.fontWeight = 'bold';
            } else {
              item.style.color = '';
              item.style.fontWeight = '';
            }
          });

          // Set loading state and update UI
          isLoading = true;
          updateControlsVisibility();
          tabContentContainerElement.innerHTML = '<p>Loading content...</p>';

          const clickedTab = tabs.find(t => t.id === tabId);
          currentTabUrl = clickedTab ? clickedTab.url : '';
          currentMarkdownText = await getMarkdownForTab(tabId);

          // Check if tabId is valid
          if (isNaN(tabId)) {
            console.error("Invalid tab ID:", listItem.dataset.tabId);
            tabContentContainerElement.innerHTML = '<p>Error: Invalid tab ID.</p>';
            isLoading = false;
            updateControlsVisibility();
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
              isLoading = false; // Reset loading state
              if (chrome.runtime.lastError) {
                tabContentContainerElement.innerHTML = `<p>Error: Could not retrieve content from this tab. It might be a restricted page (e.g., chrome:// pages) or the extension lacks permission. Ensure 'host_permissions' in manifest.json includes this URL or is set to '<all_urls>'.</p>`;
                updateControlsVisibility();
                return;
              }

              if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
                // 4. Store and display the retrieved text content
                const pageText = injectionResults[0].result;
                currentRawText = `Source URL: ${currentTabUrl}\n\n${pageText}`;
                isMarkdownView = !!currentMarkdownText;

                // Save to local storage
                chrome.storage.local.set({
                  lastRawText: currentRawText,
                  lastTabUrl: currentTabUrl,
                  isMarkdownView: isMarkdownView
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
  }

  // Initial load of the tabs list
  updateTabsList();

  // Listen for tab events to keep the list up-to-date
  chrome.tabs.onCreated.addListener(updateTabsList);
  chrome.tabs.onRemoved.addListener(updateTabsList);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.title || changeInfo.url) {
      updateTabsList();
    }
  });

  // When a tab is activated, update the list and click the active tab
  chrome.tabs.onActivated.addListener(activeInfo => {
    updateTabsList();
    // Use a short timeout to ensure the DOM is updated before clicking
    setTimeout(() => {
      const listItem = document.querySelector(`li[data-tab-id='${activeInfo.tabId}']`);
      if (listItem) {
        listItem.click();
      }
    }, 100);
  });
});
  // Store and retrieve markdown for a specific tab
  async function saveMarkdownForTab(tabId, markdown) {
    return new Promise((resolve) => {
      const key = `markdown_${tabId}`;
      chrome.storage.local.set({ [key]: markdown }, () => {
        resolve();
      });
    });
  }

  async function getMarkdownForTab(tabId) {
    return new Promise((resolve) => {
      const key = `markdown_${tabId}`;
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }
