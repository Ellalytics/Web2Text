chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  // Selectively remove only markdown data to ensure no persistence
  chrome.storage.local.get(null, (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving local storage:', chrome.runtime.lastError);
      return;
    }

    const keysToRemove = Object.keys(items).filter(key => key.startsWith('markdown_'));

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing markdown from local storage:', chrome.runtime.lastError);
        } else {
          console.log('Cleared stale markdown from previous session.');
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendEmail') {
    const { emailData, token } = request;

    const email = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      emailData.body.replace(/\n/g, '<br>')
    ].join('\n');

    fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: btoa(unescape(encodeURIComponent(email)))
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        sendResponse({ success: false, error: data.error.message });
      } else {
        sendResponse({ success: true });
      }
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });

    return true; // Indicates that the response is sent asynchronously
  }
});
