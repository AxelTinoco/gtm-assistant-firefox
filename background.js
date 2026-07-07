// background.js - Script de fondo, intercepta requests de red

const tabData = {}; // { tabId: { gtmHits: [], ga4Hits: [], tagData: null } }

// Bandera "Conservar al recargar" (Opción 1). Se cachea en memoria y se
// mantiene sincronizada con storage.local para poder consultarla de forma
// síncrona dentro del handler de PAGE_LOADED.
let preserveOnReload = false;

browser.storage.local
  .get('preserveOnReload')
  .then((result) => {
    preserveOnReload = Boolean(result.preserveOnReload);
  })
  .catch(() => {});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'preserveOnReload' in changes) {
    preserveOnReload = Boolean(changes.preserveOnReload.newValue);
  }
});

function initTabData(tabId) {
  if (!tabData[tabId]) {
    tabData[tabId] = {
      gtmHits: [],
      ga4Hits: [],
      tagData: null,
      // Snapshots del dataLayer de cargas de página anteriores. El dataLayer
      // se lee en vivo de la página, así que para conservarlo entre recargas
      // guardamos aquí lo que había justo antes de recargar.
      dataLayerHistory: [],
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

  if (message.type === 'PAGE_LOADED' && tabId && tabData[tabId]) {
    if (preserveOnReload) {
      // Antes de que la página reinicie su dataLayer, guardamos el último
      // snapshot capturado en el histórico para no perderlo.
      const previous = tabData[tabId].tagData?.dataLayer || [];
      if (previous.length) {
        tabData[tabId].dataLayerHistory = tabData[tabId].dataLayerHistory.concat(previous);
      }
    } else {
      // Comportamiento por defecto: limpiar todo en cada carga.
      tabData[tabId].gtmHits = [];
      tabData[tabId].ga4Hits = [];
      tabData[tabId].dataLayerHistory = [];
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
      tabData[tId].dataLayerHistory = [];
    }
    sendResponse({ ok: true });
    return true;
  }
});

// Limpiar datos al cerrar pestañas
browser.tabs.onRemoved.addListener((tabId) => {
  delete tabData[tabId];
});
