# GTM & GA4 Assistant for Firefox

A Firefox extension to detect and debug **Google Tag Manager (GTM)** and **Google Analytics 4 (GA4)** on any website. Built for marketing analysts, developers, and QA engineers who need to validate tracking implementations without leaving the browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Features

- **Automatic detection** of GTM containers and GA4 Measurement IDs on the active page
- **Real-time network hit interception**:
  - GTM container loads (`gtm.js`, `gtag/js`)
  - GA4 hits (`/g/collect`) with `event name`, `measurement id`, `client id`, `session id`
  - Legacy Universal Analytics hits (`/collect`)
- **Popup** with a quick summary for the active tab
- **Dedicated DevTools panel** for detailed inspection
- Automatic data cleanup on page reload or tab close

## Installation

### End users

> Coming soon on [addons.mozilla.org](https://addons.mozilla.org). In the meantime, use developer mode.

### Developer mode (temporary)

1. Clone the repository:
   ```bash
   git clone https://github.com/AxelTinoco/tag-assistant-firefox.git
   cd tag-assistant-firefox
   ```
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Select the `manifest.json` file from the repository
5. The extension will appear in the toolbar

> Note: temporary add-ons are removed when Firefox is closed.

## Usage

1. Visit any website that uses GTM or GA4
2. Click the extension icon to open the popup, which shows:
   - Detected GTM/GA4 IDs
   - Summary of captured hits
3. Open **DevTools** (`F12`) and go to the **GTM & GA4 Assistant** tab for:
   - Full list of hits with parameters
   - Event details (`en`, `tid`, `cid`, `sid`, etc.)

## Project structure

```
├── manifest.json       # Extension Manifest V2
├── background.js       # Intercepts webRequests, keeps per-tab state
├── content.js          # Content script (page ↔ extension bridge)
├── injected.js         # Injected into the page context
├── popup.html/.js      # Popup UI
├── devtools/           # DevTools panel
│   ├── devtools.html
│   ├── panel.html
│   └── panel.js
└── icons/              # 48x48 and 96x96 icons
```

## Required permissions

- `activeTab`, `tabs` — read the active tab
- `webRequest` — intercept Google Analytics / Tag Manager requests
- `storage` — persist configuration
- `<all_urls>` — the extension needs to operate on any site that loads GTM/GA4

No data is sent to external servers. All processing happens locally in your browser.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on the workflow.

Report bugs or request features via [Issues](https://github.com/AxelTinoco/tag-assistant-firefox/issues).

## Roadmap

- [ ] Migrate to Manifest V3
- [ ] Chrome/Edge support
- [ ] Publish on AMO (addons.mozilla.org)
- [ ] Advanced hit filters
- [ ] Export hits to JSON/CSV
- [ ] GTM "preview" mode

## License

[MIT](./LICENSE) © 2026 Axel Tinoco
