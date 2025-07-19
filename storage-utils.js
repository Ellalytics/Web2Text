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
 * Save custom prompt to Chrome storage
 * @param {string} prompt - The custom prompt to store
 * @returns {Promise<void>}
 */
async function saveCustomPrompt(prompt) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ customPrompt: prompt }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieve custom prompt from Chrome storage
 * @returns {Promise<string|null>} The stored custom prompt or null if not found
 */
async function getCustomPrompt() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['customPrompt'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result.customPrompt || null);
      }
    });
  });
}
