// content.js

// CSS injected via string to avoid host page overriding styles or relying on external files
const LOCK_SCREEN_CSS = `
  :host {
    all: initial;
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #0d0d0d;
    z-index: 2147483647; /* Maximum z-index */
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #fff;
  }

  .container {
    text-align: center;
    background: linear-gradient(145deg, #1a1a1a, #000000);
    padding: 3rem 4rem;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(212, 175, 55, 0.2);
    border-top: 1px solid rgba(212, 175, 55, 0.4);
    animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.95);
      filter: blur(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    color: #d4af37; /* Gold */
  }

  h1 {
    font-size: 24px;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 14px;
    color: #888;
    margin: 0 0 2rem 0;
  }

  .input-group {
    position: relative;
    margin-bottom: 1.5rem;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    background: #111;
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  button {
    width: 100%;
    padding: 12px;
    background: #d4af37;
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  button:hover {
    background: #bfa030;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  button:active {
    transform: translateY(1px) scale(0.97);
    box-shadow: 0 2px 6px rgba(212, 175, 55, 0.2);
  }

  .error {
    color: #ff4c4c;
    font-size: 13px;
    margin-top: 8px;
    display: none;
    animation: shake 0.4s;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
  }

  .toggle-password-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #888;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }

  .toggle-password-btn:hover {
    color: #d4af37;
  }

  .eye-icon {
    width: 18px;
    height: 18px;
  }
`;

const LOCK_SCREEN_HTML = `
  <div class="container">
    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
    </svg>
    <h1>Site Locked</h1>
    <p>This website is restricted for your focus.</p>
    <form id="unlock-form">
      <div class="input-group">
        <input type="password" id="password" placeholder="Enter password" autocomplete="off" autofocus>
        <div class="error" id="error-msg">Incorrect password. Please try again.</div>
      </div>
      <button type="submit">Unlock Site</button>
    </form>
    <p style="margin-top: 16px; font-size: 12px; color: #888;">Made by Paras Pawar</p>
  </div>
`;

// Simple SHA-256 hash function using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 1. Hide the document immediately to prevent any flash of content
const rootHtml = document.documentElement;
const originalDisplay = rootHtml.style.display;
rootHtml.style.display = 'none';

function checkLockStatus() {
  const hostname = window.location.hostname;
  
  chrome.storage.local.get(['lockedSites', 'isFocusMode', 'passwordHash'], (data) => {
    const isFocusMode = data.isFocusMode !== false; // Default true
    const lockedSites = data.lockedSites || [];
    
    // Check if this site is in the blocked list
    const isLocked = lockedSites.some(site => hostname.includes(site));
    
    if (isLocked && isFocusMode) {
      // Check for temporary unlock
      chrome.runtime.sendMessage({ action: 'checkUnlock', hostname }, (response) => {
        if (response && response.isUnlocked) {
          // Temporarily unlocked, let it load
          rootHtml.style.display = originalDisplay;
        } else {
          // Block the page
          blockPage(data.passwordHash);
        }
      });
    } else {
      // Not locked, restore display
      rootHtml.style.display = originalDisplay;
    }
  });
}

function blockPage(storedHash) {
  // Stop the page from loading completely
  window.stop();
  
  // Clear out the HTML completely
  document.documentElement.innerHTML = '';
  document.documentElement.style.display = ''; // Make HTML visible again
  
  // Create our shadow DOM container
  const host = document.createElement('div');
  document.documentElement.appendChild(host);
  
  const shadow = host.attachShadow({ mode: 'closed' });
  
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = LOCK_SCREEN_CSS;
  shadow.appendChild(style);
  
  // Inject HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = LOCK_SCREEN_HTML;
  
  // Append form elements to shadow DOM
  while (wrapper.firstChild) {
    shadow.appendChild(wrapper.firstChild);
  }
  
  // Handle form submission
  const form = shadow.getElementById('unlock-form');
  const passwordInput = shadow.getElementById('password');
  const errorMsg = shadow.getElementById('error-msg');

  // Inject show/hide toggle
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'toggle-password-btn';
  toggleBtn.innerHTML = `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
  
  passwordInput.style.paddingRight = '40px';
  
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? 
      `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>` : 
      `<svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
  });
  
  passwordInput.parentElement.appendChild(toggleBtn);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const attempt = passwordInput.value;
    
    if (!storedHash) {
      // No password set, allow access
      grantAccess();
      return;
    }
    
    const attemptHash = await sha256(attempt);
    
    if (attemptHash === storedHash) {
      grantAccess();
    } else {
      errorMsg.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
  
  // Try to prevent right-click and keyboard shortcuts on the lock screen
  window.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    // Only allow typing, backspace, tab, enter
    if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'F12') {
      e.preventDefault();
    }
  });
}

function grantAccess() {
  const hostname = window.location.hostname;
  // Request a temporary unlock from background script
  chrome.runtime.sendMessage({ action: 'temporaryUnlock', hostname }, () => {
    // Reload the page to load the original content
    window.location.reload();
  });
}

// Run the check
checkLockStatus();
