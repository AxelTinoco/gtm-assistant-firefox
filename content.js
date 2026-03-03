// content.js - Se ejecuta en el contexto del content script (acceso al DOM pero no a window de la página)

let lastData = null;

function injectScript() {
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('injected.js');
  script.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
}

// Escuchar resultados del script inyectado
window.addEventListener('gtm_ga4_assistant_result', (event) => {
  lastData = event.detail;
  // Enviar al background y al popup
  browser.runtime.sendMessage({
    type: 'TAG_DATA',
    data: lastData,
    url: window.location.href
  }).catch(() => {});
});

// Escuchar solicitudes del popup/background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAGS') {
    // Re-inyectar para datos frescos
    window.dispatchEvent(new CustomEvent('gtm_ga4_assistant_request'));
    // Dar tiempo a que responda
    setTimeout(() => {
      sendResponse({ data: lastData, url: window.location.href });
    }, 300);
    return true; // async response
  }

  if (message.type === 'GET_DATALAYER_LIVE') {
    window.dispatchEvent(new CustomEvent('gtm_ga4_assistant_request'));
    setTimeout(() => {
      sendResponse({ data: lastData });
    }, 300);
    return true;
  }
});

// Inyectar al cargar la página
injectScript();

// También escuchar requests de red para network hits
const observer = new MutationObserver(() => {
  // Re-scan si cambia el DOM significativamente (SPAs)
});

// Notificar al background que la página cargó
browser.runtime.sendMessage({
  type: 'PAGE_LOADED',
  url: window.location.href
}).catch(() => {});

// Inyección inicial
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('gtm_ga4_assistant_request'));
}, 500);
