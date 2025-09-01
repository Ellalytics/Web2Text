document.addEventListener('DOMContentLoaded', () => {
  const tabsListElement = document.getElementById('tabsList');
  const tabContentContainerElement = document.getElementById('tabContentContainer');
  const copyButton = document.getElementById('copyButton');
  const aiConvertBtn = document.getElementById('aiConvertBtn');
  const viewToggleButton = document.getElementById('viewToggleButton');
  const emailButton = document.getElementById('emailButton');
  const emailStatus = document.getElementById('emailStatus');
  const errorDisplay = document.getElementById('errorDisplay');
 
   // Settings elements
   const settingsToggle = document.getElementById('settingsToggle');
  const settingsContent = document.getElementById('settingsContent');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const llmApiEndpointInput = document.getElementById('llmApiEndpointInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const versionInfo = document.getElementById('versionInfo');
  const signInButton = document.getElementById('signInButton');
  const authStatus = document.getElementById('authStatus');
  const signOutButton = document.getElementById('signOutButton');
  const clearStorageBtn = document.getElementById('clearStorageBtn');
  const clearStorageStatus = document.getElementById('clearStorageStatus');
 
  const addPromptBtn = document.getElementById('addPromptBtn');
  const customPromptsList = document.getElementById('customPromptsList');
  const customPromptStatus = document.getElementById('customPromptStatus');
  const customPromptSelect = document.getElementById('customPromptSelect');

   // State variables
   let currentRawText = '';
  let currentMarkdownText = '';
  let isMarkdownView = false;
  let llmApiKey = null;
  let llmApiEndpoint = null;
  let customPrompts = [];
  let isLoading = false;
  let isConverting = false;
  let currentTabId = null;
  let currentTabUrl = '';

  // Initialize the extension
  initializeExtension();
  checkAuthStatus();

  async function initializeExtension() {
    try {
      // Load saved API key
      // Load saved API key
      llmApiKey = await getApiKey();
      if (llmApiKey) {
        apiKeyInput.value = llmApiKey;
        showStatus('API key loaded', 'success');
      }

      // Load saved LLM API Endpoint
      llmApiEndpoint = await getLlmApiEndpoint();
      if (llmApiEndpoint) {
        llmApiEndpointInput.value = llmApiEndpoint;
      }

      // Load custom prompts
      customPrompts = await getCustomPrompts();
      renderCustomPrompts();

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

  // Clear storage button: this will not clear saved API key or prompts as they are in chrome.store.sync.
  clearStorageBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        showClearStorageStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showClearStorageStatus('Storage cleared successfully!', 'success');
        // Optionally, refresh the view
        currentRawText = '';
        currentMarkdownText = '';
        displayContent();
        updateControlsVisibility();
      }
    });
  });


  // Custom prompt management
  addPromptBtn.addEventListener('click', async () => {
    const name = document.getElementById('promptNameInput').value.trim();
    const content = document.getElementById('promptContentInput').value.trim();

    if (!name || !content) {
      showCustomPromptStatus('Prompt name and content are required', 'error');
      return;
    }

    customPrompts.push({ name, content });
    await saveCustomPrompts(customPrompts);
    showCustomPromptStatus('Prompt added successfully', 'success');
    renderCustomPrompts();
    document.getElementById('promptNameInput').value = '';
    document.getElementById('promptContentInput').value = '';
  });

  async function deletePrompt(index) {
    customPrompts.splice(index, 1);
    await saveCustomPrompts(customPrompts);
    showCustomPromptStatus('Prompt deleted successfully', 'success');
    renderCustomPrompts();
  }

  function renderCustomPrompts() {
    customPromptsList.innerHTML = '';
    customPromptSelect.innerHTML = '<option value="default">Default</option>';

    if (customPrompts.length === 0) {
      customPromptsList.innerHTML = '<p>No custom prompts saved.</p>';
      customPromptSelect.style.display = 'block'; // Always show with default
      aiConvertBtn.style.display = 'block';
      return;
    }

    customPrompts.forEach((prompt, index) => {
      const promptContainer = document.createElement('div');
      promptContainer.className = 'prompt-item';

      const promptName = document.createElement('h4');
      promptName.textContent = prompt.name;
      promptContainer.appendChild(promptName);

      const promptContent = document.createElement('p');
      promptContent.textContent = prompt.content;
      promptContainer.appendChild(promptContent);

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => showEditPrompt(index));
      promptContainer.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deletePrompt(index));
      promptContainer.appendChild(deleteBtn);

      customPromptsList.appendChild(promptContainer);

      const option = document.createElement('option');
      option.value = index; // The index will be a string here
      option.textContent = prompt.name;
      customPromptSelect.appendChild(option);
    });

    customPromptSelect.style.display = 'block';
    aiConvertBtn.style.display = 'block';
  }

  function showEditPrompt(index) {
    const prompt = customPrompts[index];
    const promptContainer = customPromptsList.children[index];
    promptContainer.innerHTML = `
      <input type="text" value="${prompt.name}" style="width: 100%; margin-bottom: 4px;">
      <textarea style="width: 100%; min-height: 60px; font-size: 12px;">${prompt.content}</textarea>
      <button>Save</button>
      <button>Cancel</button>
    `;
    promptContainer.querySelector('button').addEventListener('click', () => {
      const newName = promptContainer.querySelector('input').value.trim();
      const newContent = promptContainer.querySelector('textarea').value.trim();
      if (newName && newContent) {
        customPrompts[index] = { name: newName, content: newContent };
        saveCustomPrompts(customPrompts);
        renderCustomPrompts();
      }
    });
    promptContainer.querySelectorAll('button')[1].addEventListener('click', renderCustomPrompts);
  }

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
    const llmApiEndpoint = llmApiEndpointInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    try {
      await saveApiKey(apiKey);
      llmApiKey = apiKey;
      if (llmApiEndpoint) {
        await saveLlmApiEndpoint(llmApiEndpoint);
      }
      showStatus('Settings saved successfully', 'success');
      updateControlsVisibility();
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
    }
  });

  // Test API key
  testApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const llmApiEndpoint = llmApiEndpointInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter an API key to test', 'error');
      return;
    }

    showStatus('Testing connection...', 'success');
    testApiKeyBtn.disabled = true;

    try {
      const isValid = await testApiKey(apiKey, llmApiEndpoint);
      if (isValid) {
        showStatus('Connection successful!', 'success');
      } else {
        showStatus('Connection test failed. Please check your key and endpoint.', 'error');
      }
    } catch (error) {
      showStatus('Error testing connection: ' + error.message, 'error');
    } finally {
      testApiKeyBtn.disabled = false;
    }
  });

  // Copy button functionality
  copyButton.addEventListener('click', () => {
    const textContent = isMarkdownView ? currentMarkdownText : currentRawText;
    navigator.clipboard.writeText(textContent).then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = '✅ Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Error copying text: ', err);
      showStatus('Error copying text', 'error');
    });
  });

  // AI Convert button
  aiConvertBtn.addEventListener('click', async () => {
    if (!llmApiKey) {
      showStatus('Please save a valid API key first', 'error');
      return;
    }

    // Fetch the latest raw text directly from the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showStatus('No active tab found', 'error');
      return;
    }
    const activeTab = tabs[0];

    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => document.body.innerText,
    });

    if (chrome.runtime.lastError || !injectionResults || !injectionResults[0] || !injectionResults[0].result) {
      showStatus('Could not retrieve content from the page.', 'error');
      return;
    }

    const latestRawText = `Source URL: ${activeTab.url}\n\n${injectionResults[0].result}`;
    currentRawText = latestRawText; // Update state just in case

    if (!latestRawText) {
      showStatus('No content to convert', 'error');
      return;
    }

    const selectedPromptValue = customPromptSelect.value;
    let customPrompt = null;

    if (selectedPromptValue !== 'default') {
      const selectedPromptIndex = parseInt(selectedPromptValue, 10);
      if (selectedPromptIndex >= 0 && selectedPromptIndex < customPrompts.length) {
        customPrompt = customPrompts[selectedPromptIndex].content;
      } else {
        showStatus('Please select a valid prompt', 'error');
        return;
      }
    }

    isConverting = true;
    aiConvertBtn.disabled = true;
    aiConvertBtn.textContent = '✨ Converting...';
    const conversionTabId = currentTabId; // Capture the tab ID at the start of conversion
    const conversionTabUrl = currentTabUrl; // Capture the tab URL at the start of conversion

    try {
      currentMarkdownText = await convertTextToMarkdown(latestRawText, llmApiKey, llmApiEndpoint, customPrompt);
      showStatus('Content converted to markdown successfully', 'success');
      // Save only the new markdown content, not the raw text
      await savePageContent(conversionTabUrl, {
        markdownText: currentMarkdownText
      });

      // Only update the view if the user is still on the same tab
      if (conversionTabId === currentTabId) {
        isMarkdownView = true;
        displayContent();
        updateControlsVisibility();
      }

    } catch (error) {
      console.error('Error converting to markdown:', error);
      showGlobalError('Error converting to markdown: ' + error.message);
    } finally {
      isConverting = false;
      // The button state will be updated in updateControlsVisibility
      updateControlsVisibility();
    }
  });

  // View toggle button
  viewToggleButton.addEventListener('click', () => {
    isMarkdownView = !isMarkdownView;
    displayContent();
    updateControlsVisibility();
  });

  // Email button
  emailButton.addEventListener('click', async () => {
    const textContent = isMarkdownView ? currentMarkdownText : currentRawText;
    if (!textContent) {
      showStatus('No content to email', 'error');
      return;
    }

    emailButton.disabled = true;
    emailButton.textContent = '✉️ Sending...';

    try {
      // 1. Get auth token
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          showStatus('Could not get auth token.', 'error');
          emailButton.disabled = false;
          emailButton.textContent = isMarkdownView ? '✉️ Email Markdown' : '✉️ Email Raw Text';
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
            emailButton.disabled = false;
            emailButton.textContent = isMarkdownView ? '✉️ Email Markdown' : '✉️ Email Raw Text';
            return;
        }

        // 3. Send email
        const subjectMatch = isMarkdownView ? currentMarkdownText.match(/^# (.*)/m) : currentRawText.match(/^Source URL: (.*)/m);
        const subjectTitle = subjectMatch ? subjectMatch[1] : 'Untitled Content';
        
        // Extract hostname from URL
        const hostname = currentTabUrl ? new URL(currentTabUrl).hostname : '';
        const subject = hostname ? `[${hostname}] ${subjectTitle}` : subjectTitle;

        const emailData = {
          to: userEmail,
          subject: subject,
          body: textContent
        };

        chrome.runtime.sendMessage({ action: 'sendEmail', emailData, token }, (response) => {
          if (response.success) {
            showEmailStatus('Email sent successfully!', 'success');
          } else {
            showEmailStatus(`Error sending email: ${response.error}`, 'error');
          }
          emailButton.disabled = false;
          emailButton.textContent = isMarkdownView ? '✉️ Email Markdown' : '✉️ Email Raw Text';
        });
      });
    } catch (error) {
      showEmailStatus(`Error: ${error.message}`, 'error');
      emailButton.disabled = false;
      emailButton.textContent = isMarkdownView ? '✉️ Email Markdown' : '✉️ Email Raw Text';
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
 
   function showGlobalError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
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

  function showClearStorageStatus(message, type) {
    clearStorageStatus.textContent = message;
    clearStorageStatus.className = `status-message status-${type}`;

    setTimeout(() => {
      clearStorageStatus.textContent = '';
      clearStorageStatus.className = 'status-message';
    }, 3000);
  }

  function checkAuthStatus() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.json())
        .then(userInfo => {
          signInButton.style.display = 'none';
          signOutButton.style.display = 'block';
          showAuthStatus(`Signed in. Email will be sent to: ${userInfo.email}`, 'success');
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          showAuthStatus('Signed in, but could not fetch email.', 'warning');
        });
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
      viewToggleButton.style.display = 'none';
      emailButton.style.display = 'none';
      aiConvertBtn.style.display = 'none';
      customPromptSelect.style.display = 'none';
      return;
    }

    const hasContent = currentRawText.length > 0;
    const hasMarkdown = currentMarkdownText && currentMarkdownText.length > 0;
    const hasApiKey = llmApiKey && llmApiKey.length > 0;

    // Row 1
    viewToggleButton.style.display = hasContent ? 'block' : 'none';
    copyButton.style.display = hasContent ? 'block' : 'none';
    emailButton.style.display = hasContent ? 'block' : 'none';

    // Row 2
    const showAiControls = hasContent && hasApiKey;
    aiConvertBtn.style.display = showAiControls ? 'block' : 'none';
    customPromptSelect.style.display = showAiControls ? 'block' : 'none';

    // Update button text and states
    if (isMarkdownView) {
      viewToggleButton.textContent = '📄 View Raw Text';
      copyButton.textContent = '📋 Copy Markdown';
      emailButton.textContent = '✉️ Email Markdown';
    } else {
      viewToggleButton.textContent = '📄 View Markdown';
      copyButton.textContent = '📋 Copy Raw Text';
      emailButton.textContent = '✉️ Email Raw Text';
    }

    viewToggleButton.disabled = !hasMarkdown;
    aiConvertBtn.disabled = isConverting;
    if (!isConverting) {
      aiConvertBtn.textContent = '✨ AI Convert';
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

  async function updateTabsList() {
    // Save the current scroll position
    const scrollPosition = tabsListElement.scrollTop;

    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
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
  
      // Fetch saved content for all tabs in parallel to check for markdown
      const contentChecks = tabs.map(tab => getPageContent(tab.url));
      const savedContents = await Promise.all(contentChecks);
  
      tabs.forEach((tab, index) => {
        const savedContent = savedContents[index];
        const hasMarkdown = savedContent && savedContent.markdownText;
  
        const listItem = document.createElement('li');
        listItem.dataset.tabId = tab.id;
  
        if (tab.active) {
          listItem.style.color = 'red';
          listItem.style.fontWeight = 'bold';
        }
  
        const titleElement = document.createElement('span');
        titleElement.className = 'tab-title';
        titleElement.textContent = `${tab.title || 'Untitled Tab'}${hasMarkdown ? ' ✨' : ''}`;
  
        const urlElement = document.createElement('span');
        urlElement.className = 'tab-url';
        urlElement.textContent = tab.url || 'No URL';
  
        listItem.appendChild(titleElement);
        listItem.appendChild(urlElement);
  
        listItem.addEventListener('click', async () => {
          const tabId = parseInt(listItem.dataset.tabId, 10);
          currentTabId = tabId;
  
          chrome.tabs.update(tabId, { active: true });
  
          document.querySelectorAll('#tabsList li').forEach(item => {
            const itemId = parseInt(item.dataset.tabId, 10);
            item.style.color = itemId === tabId ? 'red' : '';
            item.style.fontWeight = itemId === tabId ? 'bold' : '';
          });
  
          isLoading = true;
          updateControlsVisibility();
          tabContentContainerElement.innerHTML = '<p>Loading content...</p>';
  
          const clickedTab = tabs.find(t => t.id === tabId);
          const tabUrl = clickedTab ? clickedTab.url : '';
          currentTabUrl = tabUrl;
  
          const latestSavedContent = await getPageContent(tabUrl);
  
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: () => document.body.innerText,
            },
            (injectionResults) => {
              if (tabId !== currentTabId) return;
  
              isLoading = false;
              if (chrome.runtime.lastError) {
                tabContentContainerElement.innerHTML = `<p>Error: Could not retrieve content. It might be a restricted page.</p>`;
                currentRawText = '';
                currentMarkdownText = (latestSavedContent && latestSavedContent.markdownText) || '';
              } else if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
                const pageText = injectionResults[0].result;
                currentRawText = `Source URL: ${tabUrl}\n\n${pageText}`;
                currentMarkdownText = (latestSavedContent && latestSavedContent.markdownText) || '';
                isMarkdownView = !!currentMarkdownText;
                displayContent();
              } else {
                tabContentContainerElement.innerHTML = '<p>Could not retrieve content from this tab.</p>';
                currentRawText = '';
                currentMarkdownText = (latestSavedContent && latestSavedContent.markdownText) || '';
              }
              updateControlsVisibility();
              updateTabsList();
            }
          );
        });
        tabsListElement.appendChild(listItem);
      });

      // Restore the scroll position
      tabsListElement.scrollTop = scrollPosition;
    });
  }

  // Initial load of the tabs list
  updateTabsList();

  // Listen for tab events to keep the list up-to-date
  chrome.tabs.onCreated.addListener(updateTabsList);
  chrome.tabs.onRemoved.addListener(updateTabsList);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Update the list if the title, URL, or status changes.
    // 'status' change often indicates content has loaded.
    if (changeInfo.title || changeInfo.url || changeInfo.status === 'complete') {
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
  // These functions are no longer needed as their logic is replaced by
  // savePageContent and getPageContent from storage-utils.js
