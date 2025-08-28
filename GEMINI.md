# GEMINI.md

## Project Overview

This project is a Chrome extension called "Text Reveal". It allows users to view the text content of any open tab, and convert that content into Markdown format using the Gemini API. The extension features a side panel that lists all open tabs. Users can select a tab to view its content, and then trigger a conversion to Markdown. The extension also allows users to manage their Gemini API key, sign in with their Google account to email the markdown to themselves, and toggle between raw text and rendered Markdown views.

The core technologies used are JavaScript for the extension logic, HTML for the side panel structure, and the Gemini API for the text-to-Markdown conversion.

## Building and Running

This is a Chrome extension. To run this project, you need to load it as an unpacked extension in Google Chrome.

1.  Open Google Chrome.
2.  Navigate to `chrome://extensions`.
3.  Enable "Developer mode" in the top right corner.
4.  Click on "Load unpacked".
5.  Select the directory where this project is located.

The extension's icon should appear in the Chrome toolbar. Clicking it will open the side panel.

## Development Conventions

*   **Code Style:** The JavaScript code follows a procedural style with event listeners for UI interactions. Functions are used to encapsulate specific functionalities.
*   **API Interaction:** The `llm-markdown.js` file encapsulates all interactions with the Gemini API. The `sidepanel.js` file handles the user interface and calls the functions in `llm-markdown.js`.
*   **Storage:** The extension uses `chrome.storage.local` to store the user's Gemini API key and other extension-related data.
*   **Modularity:** The code is organized into separate files based on functionality:
    *   `sidepanel.js`: Core UI and extension logic.
    *   `llm-markdown.js`: Gemini API interaction.
    *   `storage-utils.js`: Utilities for local storage.
    *   `markdown-renderer.js`: Renders markdown to HTML.
    *   `background.js`: Service worker for background tasks.
*   **Error Handling:** The code includes `try...catch` blocks for handling errors, especially for API requests and Chrome extension API calls.
