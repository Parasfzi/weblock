# 🛡️ Site Locker

A premium, privacy-focused Chrome Extension that allows you to lock specific websites with a secure password. Perfect for maintaining focus and protecting your privacy.

![Site Locker Banner](https://img.shields.io/badge/Theme-Black_%26_Gold-D4AF37?style=for-the-badge)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-000000?style=for-the-badge&logo=google-chrome&logoColor=white)

## ✨ Features

- **🔐 Robust Website Locking:** Blocks access to specified websites immediately upon loading.
- **🖤 Premium Aesthetics:** A sleek black and gold luxury theme with modern typography.
- **🎬 Cinematic Animations:** Smooth, spring-based entrance animations and interactive micro-transitions.
- **🛡️ Secure Hashing:** Passwords are never stored in plain text; they are hashed using the **SHA-256** algorithm.
- **⏳ Temporary Unlock:** Unlock a site once and enjoy unrestricted access for 15 minutes before the lock re-engages.
- **👁️ Password Visibility:** Toggle show/hide for password fields for better accuracy.
- **🚀 One-Click Control:** Easily lock/unlock the current site directly from the extension popup.

## 🛠️ Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** (toggle in the top right corner).
4. Click the **"Load unpacked"** button and select the folder where you saved the extension files.
5. Pin **Site Locker** to your toolbar for easy access!

## 🚀 How to Use

1. **Setup:** On the first run, set your master password.
2. **Locking a Site:** Navigate to any website you want to restrict and click the **"Lock This Site"** button in the popup.
3. **Unlocking:** When you visit a locked site, you'll see a premium lock screen. Enter your master password to gain temporary access.
4. **Focus Mode:** Use the toggle at the top of the popup to enable or disable locking globally.
5. **Managing Sites:** Manually add or remove websites from your "Locked Sites" list directly in the popup.

## 🎨 Design Philosophy

Site Locker was built with a "Luxury Utility" mindset. 
- **Typography:** Uses *Inter* for a clean, modern look.
- **Color Palette:** A deep `#0d0d0d` black paired with a rich `#d4af37` gold.
- **Animations:** Custom `cubic-bezier` curves for that high-end, responsive feel.

## 🔒 Security

- **Web Crypto API:** Utilizes the browser's native cryptographic functions for secure hashing.
- **Shadow DOM:** The lock screen is injected into a closed Shadow DOM, making it isolated from the host page's scripts and styles.
- **Background Persistence:** Temporary unlock states are managed securely in-memory using `chrome.storage.session`.

---

Developed with ❤️ for Privacy and Focus.
