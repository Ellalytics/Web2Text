# Tab Content Viewer

A browser extension that lists all open tabs and displays the content of the selected tab. It can also convert the content of a web page to Markdown format using the Gemini API.

## Features

- **List Open Tabs**: Displays a list of all open tabs in the current window.
- **View Tab Content**: Shows the text content of any selected tab.
- **Convert to Markdown**: Converts the text content of a webpage to Markdown format using the Gemini API.
- **Copy to Clipboard**: Easily copy the raw text or the converted Markdown to your clipboard.
- **Markdown/Raw Text View**: Toggle between the rendered Markdown and the raw text.
- **API Key Management**: Securely save and test your Gemini API key.

## How to Use

1.  **Open the Extension**: Click on the extension icon in your browser to open the side panel.
2.  **Select a Tab**: The side panel will display a list of your open tabs. Click on any tab to view its content.
3.  **Convert to Markdown**: If you have configured your Gemini API key, you can click the "Convert to Markdown" button to transform the page's content into Markdown.
4.  **Toggle Views**: Use the "View Markdown" / "View Raw Text" button to switch between the formatted Markdown and the original text.
5.  **Copy Content**: Click the "Copy Text" or "Copy Markdown" button to copy the content to your clipboard.

## Configuration

To use the Markdown conversion feature, you need to configure your Gemini API key.

1.  **Get an API Key**: Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Open API Settings**: In the extension's side panel, click on the "⚙️ API Settings" button.
3.  **Enter and Save Key**: Paste your API key into the input field and click "Save".
4.  **Test Key**: You can click the "Test" button to verify that your API key is working correctly.

## Project Files

-   `manifest.json`: The manifest file for the Chrome extension. It defines the extension's properties, permissions, and functionalities.
-   `sidepanel.html`: The HTML structure for the extension's side panel.
-   `sidepanel.js`: The core JavaScript file that handles the extension's logic, including fetching tab content, interacting with the Gemini API, and managing the user interface.
-   `storage-utils.js`: A utility file for managing the extension's data in Chrome's local storage.
-   `llm-markdown.js`: This file contains the logic for interacting with the Gemini API to convert text to Markdown.
-   `markdown-renderer.js`: A utility file for rendering Markdown content as HTML.
-   `background.js`: The service worker for the extension.
-   `images/`: A directory containing the extension's icons.