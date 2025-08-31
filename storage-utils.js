// storage-utils.js - Chrome storage utilities for API key management

/**
 * Save API key to Chrome storage
 * @param {string} apiKey - The Gemini API key to store
 * @returns {Promise<void>}
 */
async function saveApiKey(apiKey) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieve API key from Chrome storage
 * @returns {Promise<string|null>} The stored API key or null if not found
 */
async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result.geminiApiKey || null);
      }
    });
  });
}

/**
 * Remove API key from Chrome storage
 * @returns {Promise<void>}
 */
async function removeApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(['geminiApiKey'], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Validate API key format (basic validation)
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the API key format appears valid
 */
function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Basic validation: should start with 'AIza' and be at least 35 characters
  return apiKey.startsWith('AIza') && apiKey.length >= 35;
}

/**
 * Save custom prompts to Chrome storage
 * @param {Array<Object>} prompts - The custom prompts to store
 * @returns {Promise<void>}
 */
async function saveCustomPrompts(prompts) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ customPrompts: prompts }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieve custom prompts from Chrome storage
 * @returns {Promise<Array<Object>>} The stored custom prompts or an empty array if not found
 */
async function getCustomPrompts() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['customPrompts'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result.customPrompts || []);
      }
    });
  });
}

/**
 * Save page content to Chrome local storage, keyed by URL
 * @param {string} url - The URL of the page
 * @param {object} content - The content to store (e.g., { rawText: '...', isMarkdown: false })
 * @returns {Promise<void>}
 */
async function savePageContent(url, content) {
  return new Promise((resolve, reject) => {
    const data = { [url]: content };
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieve page content from Chrome local storage by URL
 * @param {string} url - The URL of the page
 * @returns {Promise<object|null>} The stored content or null if not found
 */
async function getPageContent(url) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([url], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result[url] || null);
      }
    });
  });
}
