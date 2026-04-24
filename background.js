// background.js - Script de fondo, intercepta requests de red

const tabData = {}; // { tabId: { gtmHits: [], ga4Hits: [], tagData: null } }

function initTabData(tabId) {
  if (!tabData[tabId]) {
    tabData[tabId] = {
      gtmHits: [],
      ga4Hits: [],
      tagData: null,
      url: '',
    };
  }
}

// Interceptar requests de red para detectar hits de GTM y GA4
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    const tabId = details.tabId;
    if (tabId < 0) return;

    initTabData(tabId);

    // GTM requests
    if (
      url.includes('googletagmanager.com/gtm.js') ||
      url.includes('googletagmanager.com/gtag/js')
    ) {
      const idMatch = url.match(/[?&]id=(GTM-[A-Z0-9]+|G-[A-Z0-9]+)/);
      tabData[tabId].gtmHits.push({
        type: url.includes('gtm.js') ? 'GTM Container Load' : 'GTAG Script Load',
        id: idMatch ? idMatch[1] : 'N/A',
        url: url,
        timestamp: Date.now(),
        method: details.method,
      });
    }

    // GA4 collect hits
    if (
      url.includes('google-analytics.com/g/collect') ||
      url.includes('analytics.google.com/g/collect')
    ) {
      const params = new URL(url).searchParams;
      tabData[tabId].ga4Hits.push({
        type: 'GA4 Hit',
        eventName: params.get('en') || 'N/A',
        measurementId: params.get('tid') || 'N/A',
        clientId: params.get('cid') || 'N/A',
        sessionId: params.get('sid') || 'N/A',
        url: url,
        timestamp: Date.now(),
      });
    }

    // Universal Analytics (legacy)
    if (url.includes('google-analytics.com/collect') && !url.includes('/g/collect')) {
      const params = new URL(url).searchParams;
      tabData[tabId].ga4Hits.push({
        type: 'UA Hit (Legacy)',
        eventName: params.get('ea') || params.get('t') || 'N/A',
        measurementId: params.get('tid') || 'N/A',
        clientId: params.get('cid') || 'N/A',
        url: url,
        timestamp: Date.now(),
      });
    }
  },
  {
    urls: [
      '*://www.googletagmanager.com/*',
      '*://googletagmanager.com/*',
      '*://www.google-analytics.com/*',
      '*://google-analytics.com/*',
      '*://analytics.google.com/*',
    ],
  },
  ['requestBody']
);

// Recibir mensajes del content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;

  if (message.type === 'TAG_DATA' && tabId) {
    initTabData(tabId);
    tabData[tabId].tagData = message.data;
    tabData[tabId].url = message.url;
  }

  if (message.type === 'PAGE_LOADED' && tabId) {
    // Reset hits on new page load
    if (tabData[tabId]) {
      tabData[tabId].gtmHits = [];
      tabData[tabId].ga4Hits = [];
    }
  }

  if (message.type === 'GET_ALL_DATA') {
    const tId = message.tabId;
    sendResponse(tabData[tId] || null);
    return true;
  }

  if (message.type === 'CLEAR_DATA') {
    const tId = message.tabId;
    if (tabData[tId]) {
      tabData[tId].gtmHits = [];
      tabData[tId].ga4Hits = [];
    }
    sendResponse({ ok: true });
    return true;
  }
});

// Limpiar datos al cerrar pestañas
browser.tabs.onRemoved.addListener((tabId) => {
  delete tabData[tabId];
});
