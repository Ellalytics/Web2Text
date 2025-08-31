// llm-markdown.js - Gemini API service for text-to-markdown conversion

const DEFAULT_LLM_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Convert plain text to structured markdown using Gemini API
 * @param {string} text - The plain text content to convert
 * @param {string} apiKey - The Gemini API key
 * @param {string} llmApiEndpoint - The LLM API Endpoint
 * @param {string} [customPrompt] - An optional custom prompt to append
 * @returns {Promise<string>} The converted markdown content
 */
async function convertTextToMarkdown(text, apiKey, llmApiEndpoint, customPrompt = null) {
  if (!text || !apiKey) {
    throw new Error('Text content and API key are required');
  }

  const prompt = createMarkdownConversionPrompt(text, customPrompt);
  const url = llmApiEndpoint || DEFAULT_LLM_API_ENDPOINT;

  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          // temperature: 0.1, // a lower temperature (closer to 0) makes the model more deterministic and focused
          topK: 1,  // A topK of 1 is the most restrictive setting possible. It forces the model to always select the single most probable token, resulting in a highly deterministic and predictable output. This setting will override the creative effect of temperature
          topP: 0.8, //  A value of 0.8 means the model considers the smallest possible set of the most likely tokens whose combined probability is 80% or greater. However, when both topK and topP are set, the model's behavior is governed by the more restrictive of the two.
          maxOutputTokens: 81920,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const markdownContent = data.candidates[0].content.parts[0].text;
    return markdownContent.trim();

  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to convert text to markdown: ${error.message}`);
  }
}

/**
 * Create a well-crafted prompt for text-to-markdown conversion
 * @param {string} text - The input text to convert
 * @param {string} [customPrompt] - An optional custom prompt to append
 * @returns {string} The formatted prompt
 */
function createMarkdownConversionPrompt(text, customPrompt = null) {
  let systemPrompt = `You are an expert content processor. Your task is to convert the following web page text into clean, structured markdown format.

INSTRUCTIONS:
1. Output the source URL in the beginning as a markdown link "[Source URL](<URL>)"
2. Remove all navigation menus, headers, footers, advertisements
3. Extract all meaningful content from the text
4. Structure the content with appropriate markdown headers (# ## ###)
5. Format lists, quotes, and code blocks appropriately
6. Remove repetitive or boilerplate text
7. Maintain logical flow and readability
8. If there are multiple articles or sections, separate them clearly
9. Remove social media buttons, "share this" links, and similar UI elements
10. Keep only the essential, valuable content that a reader would want
11. In the end, add a "CTA in this page" section to include important call to actions, such as "View Fees", "Enroll Now", "Read More", etc.`;

  let prompt;
  if (customPrompt && customPrompt.trim().length > 0) {
    prompt = customPrompt;
  } else {
    prompt = systemPrompt;
  }

  prompt += `

INPUT TEXT:
${text}

OUTPUT:
Please provide only the clean markdown content without any explanations or meta-commentary.`;

  return prompt;
}

/**
 * Test API key validity by making a simple request
 * @param {string} apiKey - The API key to test
 * @param {string} llmApiEndpoint - The LLM API Endpoint
 * @returns {Promise<boolean>} True if the API key is valid
 */
async function testApiKey(apiKey, llmApiEndpoint) {
  const url = llmApiEndpoint || DEFAULT_LLM_API_ENDPOINT;
  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Test message. Please respond with "OK".'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
}
