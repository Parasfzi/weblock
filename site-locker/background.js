// background.js

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'temporaryUnlock') {
    // Store temporary unlock in memory
    // Since Service Workers can sleep, we should use chrome.storage.session
    // available in Manifest V3 (requires "storage" permission, but session storage is included there)
    
    // Default unlock duration: 15 minutes
    const unlockDuration = 15 * 60 * 1000; 
    const expiryTime = Date.now() + unlockDuration;
    
    chrome.storage.session.set({ [`unlocked_${request.hostname}`]: expiryTime })
      .then(() => {
        sendResponse({ success: true });
      });
      
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'checkUnlock') {
    chrome.storage.session.get([`unlocked_${request.hostname}`])
      .then((result) => {
        const expiryTime = result[`unlocked_${request.hostname}`];
        if (expiryTime && Date.now() < expiryTime) {
          sendResponse({ isUnlocked: true });
        } else {
          sendResponse({ isUnlocked: false });
        }
      });
      
    return true;
  }
});
