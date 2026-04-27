// popup.js

// Simple SHA-256 hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Extract base hostname
function getBaseHostname(url) {
  try {
    const hostname = new URL(url).hostname;
    // Strip 'www.' if present
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Inject show/hide toggle into all password fields
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'toggle-password-btn';
    toggleBtn.innerHTML = `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    
    input.style.paddingRight = '40px';
    
    toggleBtn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? 
        `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>` : 
        `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    });
    
    input.parentElement.appendChild(toggleBtn);
  });

  const setupView = document.getElementById('setup-view');
  const mainView = document.getElementById('main-view');
  const changePasswordView = document.getElementById('change-password-view');
  
  const focusModeToggle = document.getElementById('focus-mode-toggle');
  
  // Setup elements
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const saveSetupBtn = document.getElementById('save-setup-btn');
  const setupError = document.getElementById('setup-error');
  
  // Main elements
  const currentHostnameEl = document.getElementById('current-hostname');
  const toggleCurrentSiteBtn = document.getElementById('toggle-current-site-btn');
  const manualSiteInput = document.getElementById('manual-site-input');
  const addManualSiteBtn = document.getElementById('add-manual-site-btn');
  const lockedSitesList = document.getElementById('locked-sites-list');
  const resetPasswordBtn = document.getElementById('reset-password-btn');

  // Change password elements
  const oldPasswordInput = document.getElementById('old-password');
  const changeNewPasswordInput = document.getElementById('change-new-password');
  const changeConfirmPasswordInput = document.getElementById('change-confirm-password');
  const saveChangePwdBtn = document.getElementById('save-change-pwd-btn');
  const cancelChangePwdBtn = document.getElementById('cancel-change-pwd-btn');
  const changePwdError = document.getElementById('change-pwd-error');

  // State
  let currentTabUrl = '';
  let currentHostname = '';
  let lockedSites = [];

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      currentTabUrl = tabs[0].url;
      currentHostname = getBaseHostname(currentTabUrl);
      
      if (currentHostname) {
        currentHostnameEl.textContent = currentHostname;
      } else {
        currentHostnameEl.textContent = 'Invalid URL';
        toggleCurrentSiteBtn.style.display = 'none';
      }
      
      updateCurrentSiteButton();
    }
  });

  // Load state from storage
  chrome.storage.local.get(['passwordHash', 'lockedSites', 'isFocusMode'], (data) => {
    lockedSites = data.lockedSites || [];
    
    // Set focus mode toggle
    if (data.isFocusMode !== undefined) {
      focusModeToggle.checked = data.isFocusMode;
    }

    if (data.passwordHash) {
      // Password is set, show main view
      setupView.classList.add('hidden');
      mainView.classList.remove('hidden');
      renderLockedSites();
      updateCurrentSiteButton();
    } else {
      // No password, show setup
      setupView.classList.remove('hidden');
      mainView.classList.add('hidden');
    }
  });

  // Toggle Focus Mode
  focusModeToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ isFocusMode: e.target.checked });
  });

  // Save Password Setup
  saveSetupBtn.addEventListener('click', async () => {
    const pwd1 = newPasswordInput.value;
    const pwd2 = confirmPasswordInput.value;

    if (!pwd1) {
      setupError.textContent = 'Password cannot be empty.';
      return;
    }

    if (pwd1 !== pwd2) {
      setupError.textContent = 'Passwords do not match.';
      return;
    }

    const hash = await sha256(pwd1);
    chrome.storage.local.set({ passwordHash: hash }, () => {
      setupView.classList.add('hidden');
      mainView.classList.remove('hidden');
      renderLockedSites();
    });
  });

  // Toggle Current Site
  toggleCurrentSiteBtn.addEventListener('click', () => {
    if (!currentHostname) return;

    if (lockedSites.includes(currentHostname)) {
      // Remove
      lockedSites = lockedSites.filter(site => site !== currentHostname);
    } else {
      // Add
      lockedSites.push(currentHostname);
    }

    saveLockedSites();
    updateCurrentSiteButton();
  });

  // Add Manual Site
  addManualSiteBtn.addEventListener('click', () => {
    let site = manualSiteInput.value.trim().toLowerCase();
    
    // basic cleanup
    site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    if (site && !lockedSites.includes(site)) {
      lockedSites.push(site);
      saveLockedSites();
      manualSiteInput.value = '';
      if (site === currentHostname) {
        updateCurrentSiteButton();
      }
    }
  });

  // Show Change Password View
  resetPasswordBtn.addEventListener('click', () => {
    mainView.classList.add('hidden');
    changePasswordView.classList.remove('hidden');
    oldPasswordInput.value = '';
    changeNewPasswordInput.value = '';
    changeConfirmPasswordInput.value = '';
    changePwdError.textContent = '';
  });

  // Cancel Change Password
  cancelChangePwdBtn.addEventListener('click', () => {
    changePasswordView.classList.add('hidden');
    mainView.classList.remove('hidden');
  });

  // Save Change Password
  saveChangePwdBtn.addEventListener('click', async () => {
    const oldPwd = oldPasswordInput.value;
    const newPwd1 = changeNewPasswordInput.value;
    const newPwd2 = changeConfirmPasswordInput.value;

    if (!oldPwd) {
      changePwdError.textContent = 'Current password is required.';
      return;
    }

    if (!newPwd1) {
      changePwdError.textContent = 'New password cannot be empty.';
      return;
    }

    if (newPwd1 !== newPwd2) {
      changePwdError.textContent = 'New passwords do not match.';
      return;
    }

    chrome.storage.local.get(['passwordHash'], async (data) => {
      const oldHashAttempt = await sha256(oldPwd);
      
      if (oldHashAttempt !== data.passwordHash) {
        changePwdError.textContent = 'Incorrect current password.';
        return;
      }

      // Password is correct, update it
      const newHash = await sha256(newPwd1);
      chrome.storage.local.set({ passwordHash: newHash }, () => {
        changePasswordView.classList.add('hidden');
        mainView.classList.remove('hidden');
      });
    });
  });

  // Helper: Save and Render
  function saveLockedSites() {
    chrome.storage.local.set({ lockedSites }, () => {
      renderLockedSites();
    });
  }

  // Helper: Update UI for current site
  function updateCurrentSiteButton() {
    if (!currentHostname) return;
    
    if (lockedSites.includes(currentHostname)) {
      toggleCurrentSiteBtn.textContent = 'Unlock This Site';
      toggleCurrentSiteBtn.className = 'secondary-btn danger';
    } else {
      toggleCurrentSiteBtn.textContent = 'Lock This Site';
      toggleCurrentSiteBtn.className = 'secondary-btn';
    }
  }

  // Helper: Render List
  function renderLockedSites() {
    lockedSitesList.innerHTML = '';
    
    if (lockedSites.length === 0) {
      const li = document.createElement('li');
      li.className = 'site-item';
      li.style.justifyContent = 'center';
      li.style.color = 'var(--text-muted)';
      li.textContent = 'No sites locked yet.';
      lockedSitesList.appendChild(li);
      return;
    }

    lockedSites.forEach(site => {
      const li = document.createElement('li');
      li.className = 'site-item';
      
      const span = document.createElement('span');
      span.textContent = site;
      
      const btn = document.createElement('button');
      btn.className = 'remove-btn';
      btn.title = 'Remove';
      btn.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      
      btn.addEventListener('click', () => {
        lockedSites = lockedSites.filter(s => s !== site);
        saveLockedSites();
        if (site === currentHostname) {
          updateCurrentSiteButton();
        }
      });

      li.appendChild(span);
      li.appendChild(btn);
      lockedSitesList.appendChild(li);
    });
  }
});
