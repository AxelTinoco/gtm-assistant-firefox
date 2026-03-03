// popup.js
let currentTabId = null;
let currentData = null;
let allData = null;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  loadData().finally(() => {
    setTimeout(() => btn.classList.remove('spinning'), 600);
  });
});

// Clear buttons
document.getElementById('clearNetworkBtn').addEventListener('click', () => {
  if (currentTabId) {
    browser.runtime.sendMessage({ type: 'CLEAR_DATA', tabId: currentTabId }).then(() => loadData());
  }
});
document.getElementById('clearHitsBtn').addEventListener('click', () => {
  if (currentTabId) {
    browser.runtime.sendMessage({ type: 'CLEAR_DATA', tabId: currentTabId }).then(() => loadData());
  }
});

async function loadData() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]) return;
  currentTabId = tabs[0].id;

  // Update URL display
  const url = tabs[0].url || '';
  document.getElementById('headerUrl').textContent = new URL(url).hostname || url;
  document.getElementById('urlBar').textContent = url;

  // Get tag data from content script
  try {
    const tagResponse = await browser.tabs.sendMessage(currentTabId, { type: 'GET_TAGS' });
    if (tagResponse && tagResponse.data) {
      currentData = tagResponse.data;
    }
  } catch (e) {
    currentData = null;
  }

  // Get network data from background
  try {
    allData = await browser.runtime.sendMessage({ type: 'GET_ALL_DATA', tabId: currentTabId });
  } catch (e) {
    allData = null;
  }

  renderUI();
}

function renderUI() {
  renderOverview();
  renderDataLayer();
  renderNetwork();
}

function renderOverview() {
  const gtmSection = document.getElementById('gtmSection');
  const ga4Section = document.getElementById('ga4Section');
  const statusBanner = document.getElementById('statusBanner');

  const gtmItems = currentData?.gtm || [];
  const ga4Items = currentData?.ga4 || [];
  const totalTags = gtmItems.length + ga4Items.length;

  // Update badge
  document.getElementById('badge-overview').textContent = totalTags;

  if (!currentData) {
    statusBanner.className = 'status-banner not-found';
    statusBanner.innerHTML = '<span>⚠️</span> <span>No se pudo analizar esta página. ¿Es una página especial del navegador?</span>';
    gtmSection.innerHTML = '';
    ga4Section.innerHTML = '';
    return;
  }

  if (totalTags === 0) {
    statusBanner.className = 'status-banner not-found';
    statusBanner.innerHTML = '<span>🔍</span> <span>No se detectaron GTM ni GA4 en esta página</span>';
  } else {
    statusBanner.className = 'status-banner found';
    statusBanner.innerHTML = `<span>✅</span> <span>Se detectaron <strong>${totalTags}</strong> tag${totalTags !== 1 ? 's' : ''} de Google</span>`;
  }

  // GTM Cards
  if (gtmItems.length > 0) {
    let html = '<div class="section-label">Google Tag Manager</div>';
    gtmItems.forEach(gtm => {
      html += `
        <div class="card">
          <div class="card-header" onclick="toggleCard(this)">
            <span class="tag-badge gtm-badge">GTM</span>
            <span class="card-title">${escHtml(gtm.id)}</span>
            <span class="status-dot"></span>
            <span class="card-chevron">▶</span>
          </div>
          <div class="card-body">
            <div class="prop-row">
              <span class="prop-key">Container ID</span>
              <span class="prop-val">${escHtml(gtm.id)}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Estado</span>
              <span class="prop-val">${escHtml(gtm.status)}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Versión</span>
              <span class="prop-val">${escHtml(gtm.version || 'N/A')}</span>
            </div>
          </div>
        </div>`;
    });
    gtmSection.innerHTML = html;
  } else {
    gtmSection.innerHTML = '';
  }

  // GA4 Cards
  if (ga4Items.length > 0) {
    let html = '<div class="section-label" style="margin-top:10px">Google Analytics 4</div>';
    ga4Items.forEach(ga4 => {
      html += `
        <div class="card">
          <div class="card-header" onclick="toggleCard(this)">
            <span class="tag-badge ga4-badge">GA4</span>
            <span class="card-title">${escHtml(ga4.id || ga4.method || 'GA4 Activo')}</span>
            <span class="status-dot"></span>
            <span class="card-chevron">▶</span>
          </div>
          <div class="card-body">
            ${ga4.id ? `<div class="prop-row"><span class="prop-key">Measurement ID</span><span class="prop-val">${escHtml(ga4.id)}</span></div>` : ''}
            <div class="prop-row">
              <span class="prop-key">Método</span>
              <span class="prop-val">${escHtml(ga4.method || 'DOM script')}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Estado</span>
              <span class="prop-val">${escHtml(ga4.status || 'Detectado')}</span>
            </div>
          </div>
        </div>`;
    });
    ga4Section.innerHTML = html;
  } else {
    ga4Section.innerHTML = '';
  }
}

function renderDataLayer() {
  const list = document.getElementById('dataLayerList');
  const events = currentData?.dataLayer || [];

  document.getElementById('badge-datalayer').textContent = events.length;

  if (events.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>No hay eventos en el dataLayer<br>o la página no usa GTM</p>
      </div>`;
    return;
  }

  let html = '';
  // Show most recent first
  const reversed = [...events].reverse();
  reversed.forEach(event => {
    const nameColor = event.hasEvent ? '#4285f4' : '#fbbc04';
    html += `
      <div class="event-item">
        <div class="event-header" onclick="toggleEvent(this)">
          <span class="event-index">#${event.index}</span>
          <span class="event-name" style="color:${nameColor}">${escHtml(event.event)}</span>
          <span class="card-chevron">▶</span>
        </div>
        <div class="event-body">
          <div class="event-json">${escHtml(event.data)}</div>
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

function renderNetwork() {
  const list = document.getElementById('networkList');
  const gtmHits = allData?.gtmHits || [];
  const ga4Hits = allData?.ga4Hits || [];
  const allHits = [...gtmHits, ...ga4Hits].sort((a, b) => b.timestamp - a.timestamp);

  document.getElementById('badge-network').textContent = allHits.length;

  if (allHits.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌐</div>
        <p>Sin hits de red capturados.<br>Navega en esta pestaña para capturarlos.</p>
      </div>`;
    return;
  }

  let html = '';
  allHits.forEach(hit => {
    const time = new Date(hit.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const typeClass = hit.type.includes('GTM') ? 'gtm-type' : hit.type.includes('UA') ? 'ua-type' : 'ga4-type';

    html += `
      <div class="hit-item">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="hit-type ${typeClass}">${escHtml(hit.type)}</div>
          <div class="hit-time">${time}</div>
        </div>
        <div class="hit-meta">
          ${hit.id ? `<span class="hit-chip">ID: ${escHtml(hit.id)}</span>` : ''}
          ${hit.eventName && hit.eventName !== 'N/A' ? `<span class="hit-chip">event: ${escHtml(hit.eventName)}</span>` : ''}
          ${hit.measurementId && hit.measurementId !== 'N/A' ? `<span class="hit-chip">tid: ${escHtml(hit.measurementId)}</span>` : ''}
          ${hit.clientId && hit.clientId !== 'N/A' ? `<span class="hit-chip">cid: ${escHtml(hit.clientId.substring(0,12))}...</span>` : ''}
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

function toggleCard(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.card-chevron');
  body.classList.toggle('open');
  chevron.classList.toggle('open');
}

function toggleEvent(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.card-chevron');
  body.classList.toggle('open');
  chevron.classList.toggle('open');
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Exponer para onclick
window.toggleCard = toggleCard;
window.toggleEvent = toggleEvent;

// Iniciar
loadData();
