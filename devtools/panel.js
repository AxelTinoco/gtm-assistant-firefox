// panel.js - DevTools panel logic
let currentData = null;
let allNetworkData = null;

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadData() {
  document.getElementById('statusText').textContent = 'Analizando...';

  try {
    const tabId = browser.devtools.inspectedWindow.tabId;

    // Get tag data
    const tagResponse = await browser.tabs.sendMessage(tabId, { type: 'GET_TAGS' });
    if (tagResponse?.data) currentData = tagResponse.data;

    // Get network data
    allNetworkData = await browser.runtime.sendMessage({ type: 'GET_ALL_DATA', tabId });

    renderSidebar();
    document.getElementById('statusText').textContent =
      `Última actualización: ${new Date().toLocaleTimeString('es-MX')}`;
  } catch(e) {
    document.getElementById('statusText').textContent = 'Error al cargar datos';
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
    html += '<div class="sidebar-label">Google Tag Manager</div>';
    gtm.forEach(g => {
      html += `<div class="tag-item" onclick="showGTMDetail('${escHtml(g.id)}')">
        <div class="tid gtm">${escHtml(g.id)}</div>
        <div class="tsub">${escHtml(g.status)} • v${escHtml(g.version)}</div>
      </div>`;
    });
  }

  if (ga4.length > 0) {
    html += '<div class="sidebar-label">Google Analytics 4</div>';
    ga4.forEach(g => {
      html += `<div class="tag-item" onclick="showGA4Detail('${escHtml(g.id || g.method)}')">
        <div class="tid ga4">${escHtml(g.id || 'GA4')}</div>
        <div class="tsub">${escHtml(g.method || 'Script DOM')} • ${escHtml(g.status)}</div>
      </div>`;
    });
  }

  if (currentData?.dataLayer?.length > 0) {
    html += '<div class="sidebar-label">DataLayer</div>';
    html += `<div class="tag-item" onclick="showDataLayer()">
      <div class="tid" style="color:#fbbc04">dataLayer</div>
      <div class="tsub">${currentData.dataLayer.length} eventos</div>
    </div>`;
  }

  if (ga4Hits.length > 0 || gtmHits.length > 0) {
    html += '<div class="sidebar-label">Network Hits</div>';
    html += `<div class="tag-item" onclick="showNetworkHits()">
      <div class="tid" style="color:#7070a0">Hits capturados</div>
      <div class="tsub">${ga4Hits.length + gtmHits.length} requests</div>
    </div>`;
  }

  if (!html) {
    html = '<div class="empty" style="padding:20px 0;text-align:left;">No se detectaron tags en esta página</div>';
  }

  sidebar.innerHTML = html;
}

window.showDataLayer = function() {
  const detail = document.getElementById('detail');
  const events = currentData?.dataLayer || [];

  if (!events.length) {
    detail.innerHTML = '<div class="empty">DataLayer vacío</div>';
    return;
  }

  let rows = [...events].reverse().map(e =>
    `<tr>
      <td>${e.index}</td>
      <td class="event-cell">${escHtml(e.event)}</td>
      <td class="json-cell">${escHtml(e.data)}</td>
    </tr>`
  ).join('');

  detail.innerHTML = `
    <div class="detail-title">
      <span style="color:#fbbc04">📦</span> DataLayer Events
    </div>
    <table class="dl-table">
      <thead><tr><th>#</th><th>Event</th><th>Payload</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

window.showGTMDetail = function(id) {
  const gtm = currentData?.gtm?.find(g => g.id === id);
  if (!gtm) return;
  const detail = document.getElementById('detail');
  detail.innerHTML = `
    <div class="detail-title">
      <span style="color:#4285f4">📦</span> ${escHtml(gtm.id)}
    </div>
    <table class="dl-table">
      <thead><tr><th>Propiedad</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Container ID</td><td class="event-cell">${escHtml(gtm.id)}</td></tr>
        <tr><td>Estado</td><td>${escHtml(gtm.status)}</td></tr>
        <tr><td>Versión</td><td>${escHtml(gtm.version || 'N/A')}</td></tr>
        <tr><td>DataLayer eventos</td><td>${currentData?.dataLayer?.length || 0}</td></tr>
      </tbody>
    </table>`;
};

window.showGA4Detail = function(id) {
  const ga4 = currentData?.ga4?.find(g => (g.id || g.method) === id);
  if (!ga4) return;
  const hits = allNetworkData?.ga4Hits?.filter(h => h.measurementId === ga4.id) || [];
  const detail = document.getElementById('detail');

  let hitsHtml = '';
  if (hits.length > 0) {
    hitsHtml = `
      <div class="detail-title" style="font-size:13px;margin-top:16px;">Network Hits (${hits.length})</div>
      <table class="dl-table">
        <thead><tr><th>Evento</th><th>Session ID</th><th>Client ID</th><th>Hora</th></tr></thead>
        <tbody>
          ${hits.map(h => `<tr>
            <td class="event-cell">${escHtml(h.eventName)}</td>
            <td>${escHtml(h.sessionId || 'N/A')}</td>
            <td>${escHtml((h.clientId || 'N/A').substring(0,16))}...</td>
            <td>${new Date(h.timestamp).toLocaleTimeString('es-MX')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  detail.innerHTML = `
    <div class="detail-title">
      <span style="color:#34a853">📊</span> ${escHtml(ga4.id || 'GA4')}
    </div>
    <table class="dl-table">
      <thead><tr><th>Propiedad</th><th>Valor</th></tr></thead>
      <tbody>
        ${ga4.id ? `<tr><td>Measurement ID</td><td class="event-cell">${escHtml(ga4.id)}</td></tr>` : ''}
        <tr><td>Método de implementación</td><td>${escHtml(ga4.method || 'DOM script')}</td></tr>
        <tr><td>Estado</td><td>${escHtml(ga4.status || 'Detectado')}</td></tr>
        <tr><td>Hits capturados</td><td>${hits.length}</td></tr>
      </tbody>
    </table>
    ${hitsHtml}`;
};

window.showNetworkHits = function() {
  const detail = document.getElementById('detail');
  const gtmHits = allNetworkData?.gtmHits || [];
  const ga4Hits = allNetworkData?.ga4Hits || [];
  const all = [...gtmHits, ...ga4Hits].sort((a,b) => b.timestamp - a.timestamp);

  if (!all.length) {
    detail.innerHTML = '<div class="empty">Sin hits capturados</div>';
    return;
  }

  let rows = all.map(h => {
    const time = new Date(h.timestamp).toLocaleTimeString('es-MX');
    return `<tr>
      <td class="event-cell">${escHtml(h.type)}</td>
      <td>${escHtml(h.id || h.measurementId || 'N/A')}</td>
      <td>${escHtml(h.eventName || '—')}</td>
      <td>${time}</td>
    </tr>`;
  }).join('');

  detail.innerHTML = `
    <div class="detail-title">🌐 Network Hits</div>
    <table class="dl-table">
      <thead><tr><th>Tipo</th><th>ID</th><th>Evento</th><th>Hora</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

document.getElementById('refreshBtn').addEventListener('click', loadData);

// Initial load
loadData();
