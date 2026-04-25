// panel.js - DevTools panel logic
let currentData = null;
let allNetworkData = null;

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadData() {
  const refreshBtn = document.getElementById('refreshBtn');
  const statusText = document.getElementById('statusText');

  refreshBtn.setAttribute('aria-busy', 'true');
  refreshBtn.setAttribute('aria-disabled', 'true');
  statusText.textContent = 'Analizando...';

  try {
    const tabId = browser.devtools.inspectedWindow.tabId;

    const tagResponse = await browser.tabs.sendMessage(tabId, { type: 'GET_TAGS' });
    if (tagResponse?.data) currentData = tagResponse.data;

    allNetworkData = await browser.runtime.sendMessage({ type: 'GET_ALL_DATA', tabId });

    renderSidebar();
    statusText.textContent = `Última actualización: ${new Date().toLocaleTimeString('es-MX')}`;
  } catch (e) {
    statusText.textContent = 'Error al cargar datos';
  } finally {
    refreshBtn.removeAttribute('aria-busy');
    refreshBtn.removeAttribute('aria-disabled');
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const gtm = currentData?.gtm || [];
  const ga4 = currentData?.ga4 || [];
  const ga4Hits = allNetworkData?.ga4Hits || [];
  const gtmHits = allNetworkData?.gtmHits || [];

  let html = '';

  if (gtm.length > 0) {
    html += '<h2 class="sidebar-label">Google Tag Manager</h2>';
    gtm.forEach((g) => {
      html += `<button type="button" class="tag-item" data-action="gtm" data-id="${escHtml(g.id)}">
        <span class="tid gtm">${escHtml(g.id)}</span>
        <span class="tsub">${escHtml(g.status)} • v${escHtml(g.version)}</span>
      </button>`;
    });
  }

  if (ga4.length > 0) {
    html += '<h2 class="sidebar-label">Google Analytics 4</h2>';
    ga4.forEach((g) => {
      const key = g.id || g.method;
      html += `<button type="button" class="tag-item" data-action="ga4" data-id="${escHtml(key)}">
        <span class="tid ga4">${escHtml(g.id || 'GA4')}</span>
        <span class="tsub">${escHtml(g.method || 'Script DOM')} • ${escHtml(g.status)}</span>
      </button>`;
    });
  }

  if (currentData?.dataLayer?.length > 0) {
    html += '<h2 class="sidebar-label">DataLayer</h2>';
    html += `<button type="button" class="tag-item" data-action="datalayer">
      <span class="tid" style="color:#fbbc04">dataLayer</span>
      <span class="tsub">${currentData.dataLayer.length} eventos</span>
    </button>`;
  }

  if (ga4Hits.length > 0 || gtmHits.length > 0) {
    html += '<h2 class="sidebar-label">Network Hits</h2>';
    html += `<button type="button" class="tag-item" data-action="network">
      <span class="tid muted">Hits capturados</span>
      <span class="tsub">${ga4Hits.length + gtmHits.length} requests</span>
    </button>`;
  }

  if (!html) {
    html = '<div class="empty sidebar-empty">No se detectaron tags en esta página</div>';
  }

  sidebar.innerHTML = html;
}

function setActiveItem(button) {
  const sidebar = document.getElementById('sidebar');
  sidebar.querySelectorAll('.tag-item[aria-current="true"]').forEach((el) => {
    el.removeAttribute('aria-current');
    el.classList.remove('active');
  });
  if (button) {
    button.setAttribute('aria-current', 'true');
    button.classList.add('active');
  }
}

function showDataLayer() {
  const detail = document.getElementById('detail');
  const events = currentData?.dataLayer || [];

  if (!events.length) {
    detail.innerHTML = '<div class="empty">DataLayer vacío</div>';
    return;
  }

  const rows = [...events]
    .reverse()
    .map(
      (e) =>
        `<tr>
      <td>${e.index}</td>
      <td class="event-cell">${escHtml(e.event)}</td>
      <td class="json-cell">${escHtml(e.data)}</td>
    </tr>`
    )
    .join('');

  detail.innerHTML = `
    <h2 class="detail-title">
      <span aria-hidden="true" style="color:#fbbc04">📦</span> DataLayer Events
    </h2>
    <table class="dl-table">
      <thead><tr><th scope="col">#</th><th scope="col">Event</th><th scope="col">Payload</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function showGTMDetail(id) {
  const gtm = currentData?.gtm?.find((g) => g.id === id);
  if (!gtm) return;
  const detail = document.getElementById('detail');
  detail.innerHTML = `
    <h2 class="detail-title">
      <span aria-hidden="true" style="color:#4285f4">📦</span> ${escHtml(gtm.id)}
    </h2>
    <table class="dl-table">
      <thead><tr><th scope="col">Propiedad</th><th scope="col">Valor</th></tr></thead>
      <tbody>
        <tr><td>Container ID</td><td class="event-cell">${escHtml(gtm.id)}</td></tr>
        <tr><td>Estado</td><td>${escHtml(gtm.status)}</td></tr>
        <tr><td>Versión</td><td>${escHtml(gtm.version || 'N/A')}</td></tr>
        <tr><td>DataLayer eventos</td><td>${currentData?.dataLayer?.length || 0}</td></tr>
      </tbody>
    </table>`;
}

function showGA4Detail(id) {
  const ga4 = currentData?.ga4?.find((g) => (g.id || g.method) === id);
  if (!ga4) return;
  const hits = allNetworkData?.ga4Hits?.filter((h) => h.measurementId === ga4.id) || [];
  const detail = document.getElementById('detail');

  let hitsHtml = '';
  if (hits.length > 0) {
    hitsHtml = `
      <h2 class="detail-title subhead">Network Hits (${hits.length})</h2>
      <table class="dl-table">
        <thead><tr><th scope="col">Evento</th><th scope="col">Session ID</th><th scope="col">Client ID</th><th scope="col">Hora</th></tr></thead>
        <tbody>
          ${hits
            .map(
              (h) => `<tr>
            <td class="event-cell">${escHtml(h.eventName)}</td>
            <td>${escHtml(h.sessionId || 'N/A')}</td>
            <td>${escHtml((h.clientId || 'N/A').substring(0, 16))}...</td>
            <td>${new Date(h.timestamp).toLocaleTimeString('es-MX')}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>`;
  }

  detail.innerHTML = `
    <h2 class="detail-title">
      <span aria-hidden="true" style="color:#34a853">📊</span> ${escHtml(ga4.id || 'GA4')}
    </h2>
    <table class="dl-table">
      <thead><tr><th scope="col">Propiedad</th><th scope="col">Valor</th></tr></thead>
      <tbody>
        ${ga4.id ? `<tr><td>Measurement ID</td><td class="event-cell">${escHtml(ga4.id)}</td></tr>` : ''}
        <tr><td>Método de implementación</td><td>${escHtml(ga4.method || 'DOM script')}</td></tr>
        <tr><td>Estado</td><td>${escHtml(ga4.status || 'Detectado')}</td></tr>
        <tr><td>Hits capturados</td><td>${hits.length}</td></tr>
      </tbody>
    </table>
    ${hitsHtml}`;
}

function showNetworkHits() {
  const detail = document.getElementById('detail');
  const gtmHits = allNetworkData?.gtmHits || [];
  const ga4Hits = allNetworkData?.ga4Hits || [];
  const all = [...gtmHits, ...ga4Hits].sort((a, b) => b.timestamp - a.timestamp);

  if (!all.length) {
    detail.innerHTML = '<div class="empty">Sin hits capturados</div>';
    return;
  }

  const rows = all
    .map((h) => {
      const time = new Date(h.timestamp).toLocaleTimeString('es-MX');
      return `<tr>
      <td class="event-cell">${escHtml(h.type)}</td>
      <td>${escHtml(h.id || h.measurementId || 'N/A')}</td>
      <td>${escHtml(h.eventName || '—')}</td>
      <td>${time}</td>
    </tr>`;
    })
    .join('');

  detail.innerHTML = `
    <h2 class="detail-title"><span aria-hidden="true">🌐</span> Network Hits</h2>
    <table class="dl-table">
      <thead><tr><th scope="col">Tipo</th><th scope="col">ID</th><th scope="col">Evento</th><th scope="col">Hora</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('sidebar').addEventListener('click', (event) => {
  const button = event.target.closest('.tag-item');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  setActiveItem(button);

  switch (action) {
    case 'gtm':
      showGTMDetail(id);
      break;
    case 'ga4':
      showGA4Detail(id);
      break;
    case 'datalayer':
      showDataLayer();
      break;
    case 'network':
      showNetworkHits();
      break;
  }
});

document.getElementById('refreshBtn').addEventListener('click', loadData);

// Initial load
loadData();
