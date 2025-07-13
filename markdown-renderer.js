// markdown-renderer.js - Simple markdown renderer for displaying converted content

/**
 * Convert markdown text to HTML for display
 * @param {string} markdown - The markdown text to convert
 * @returns {string} HTML string
 */
function renderMarkdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Convert bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Convert unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Convert ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive list items in ul/ol tags
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });

  // Convert line breaks to paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Fix nested tags
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');

  return html;
}

/**
 * Apply styling to the markdown content container
 * @param {HTMLElement} container - The container element to style
 */
function applyMarkdownStyling(container) {
  if (!container) return;

  // Add CSS classes for markdown styling
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.lineHeight = '1.6';
  container.style.color = '#333';

  // Style headers
  const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headers.forEach(header => {
    header.style.marginTop = '1.5em';
    header.style.marginBottom = '0.5em';
    header.style.fontWeight = 'bold';
    header.style.color = '#2c3e50';
  });

  // Style h1
  const h1s = container.querySelectorAll('h1');
  h1s.forEach(h1 => {
    h1.style.fontSize = '1.8em';
    h1.style.borderBottom = '2px solid #eee';
    h1.style.paddingBottom = '0.3em';
  });

  // Style h2
  const h2s = container.querySelectorAll('h2');
  h2s.forEach(h2 => {
    h2.style.fontSize = '1.5em';
    h2.style.borderBottom = '1px solid #eee';
    h2.style.paddingBottom = '0.2em';
  });

  // Style h3
  const h3s = container.querySelectorAll('h3');
  h3s.forEach(h3 => {
    h3.style.fontSize = '1.3em';
  });

  // Style paragraphs
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach(p => {
    p.style.marginBottom = '1em';
  });

  // Style links
  const links = container.querySelectorAll('a');
  links.forEach(link => {
    link.style.color = '#3498db';
    link.style.textDecoration = 'none';
  });

  // Style code
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach(code => {
    code.parentElement.style.backgroundColor = '#f8f9fa';
    code.parentElement.style.border = '1px solid #e9ecef';
    code.parentElement.style.borderRadius = '4px';
    code.parentElement.style.padding = '1em';
    code.parentElement.style.overflow = 'auto';
    code.style.fontFamily = 'Monaco, Consolas, monospace';
    code.style.fontSize = '0.9em';
  });

  const inlineCodes = container.querySelectorAll('code:not(pre code)');
  inlineCodes.forEach(code => {
    code.style.backgroundColor = '#f8f9fa';
    code.style.padding = '0.2em 0.4em';
    code.style.borderRadius = '3px';
    code.style.fontFamily = 'Monaco, Consolas, monospace';
    code.style.fontSize = '0.9em';
  });

  // Style blockquotes
  const blockquotes = container.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    quote.style.borderLeft = '4px solid #ddd';
    quote.style.paddingLeft = '1em';
    quote.style.margin = '1em 0';
    quote.style.fontStyle = 'italic';
    quote.style.color = '#666';
  });

  // Style lists
  const lists = container.querySelectorAll('ul, ol');
  lists.forEach(list => {
    list.style.paddingLeft = '2em';
    list.style.marginBottom = '1em';
  });

  const listItems = container.querySelectorAll('li');
  listItems.forEach(item => {
    item.style.marginBottom = '0.5em';
  });
}
