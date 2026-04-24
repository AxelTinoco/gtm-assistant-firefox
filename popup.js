// popup.js
let currentTabId = null;
let currentData = null;
let allData = null;

// Tab switching — WAI-ARIA tab pattern with keyboard support
const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
const tabPanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function activateTab(tab) {
  // Deactivate all tabs (roving tabindex)
  tabButtons.forEach((t) => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  // Hide all panels
  tabPanels.forEach((p) => {
    p.classList.remove('active');
    p.hidden = true;
  });

  // Activate chosen tab
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  tab.setAttribute('tabindex', '0');

  // Show associated panel
  const panel = document.getElementById('tab-' + tab.dataset.tab);
  panel.classList.add('active');
  panel.hidden = false;
}

tabButtons.forEach((tab) => {
  tab.addEventListener('click', () => activateTab(tab));

  tab.addEventListener('keydown', (e) => {
    const index = tabButtons.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabButtons[(index + 1) % tabButtons.length];
      next.focus();
      activateTab(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabButtons[(index - 1 + tabButtons.length) % tabButtons.length];
      prev.focus();
      activateTab(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabButtons[0].focus();
      activateTab(tabButtons[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      tabButtons[tabButtons.length - 1].focus();
      activateTab(tabButtons[tabButtons.length - 1]);
    }
  });
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  btn.setAttribute('aria-busy', 'true');
  btn.setAttribute('aria-disabled', 'true');
  loadData().finally(() => {
    setTimeout(() => {
      btn.classList.remove('spinning');
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
    }, 600);
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
  document.getElementById('urlBar').textContent = url;
  document.getElementById('lastScan').textContent = 'Last scan: just now';

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
  const overviewBadge = document.getElementById('badge-overview');
  overviewBadge.textContent = totalTags;
  overviewBadge.setAttribute(
    'aria-label',
    `${totalTags} Google tag${totalTags !== 1 ? 's' : ''} detected`,
  );

  if (!currentData) {
    statusBanner.className = 'status-banner not-found';
    statusBanner.innerHTML =
      '<span aria-hidden="true">⚠️</span> <span>Could not analyze this page. Is it a special browser page?</span>';
    gtmSection.innerHTML = '';
    ga4Section.innerHTML = '';
    return;
  }

  if (totalTags === 0) {
    statusBanner.className = 'status-banner not-found';
    statusBanner.innerHTML =
      '<span aria-hidden="true">🔍</span> <span>No GTM or GA4 detected on this page</span>';
  } else {
    statusBanner.className = 'status-banner found';
    statusBanner.innerHTML = `<span aria-hidden="true">✅</span> <span>Detected <strong>${totalTags}</strong> Google tag${totalTags !== 1 ? 's' : ''}</span>`;
  }

  // GTM Cards
  if (gtmItems.length > 0) {
    let html = '<h2 class="section-label">Google Tag Manager</h2>';
    gtmItems.forEach((gtm) => {
      html += `
        <div class="card">
          <button class="card-header" onclick="toggleCard(this)" aria-expanded="false" aria-label="Toggle details for ${escHtml(gtm.id)}">
            <span class="tag-badge gtm-badge">GTM</span>
            <span class="card-title">${escHtml(gtm.id)}</span>
            <span class="status-dot"></span>
            <span class="card-chevron" aria-hidden="true">▶</span>
          </button>
          <div class="card-body">
            <div class="prop-row">
              <span class="prop-key">Container ID</span>
              <span class="prop-val">${escHtml(gtm.id)}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Status</span>
              <span class="prop-val">${escHtml(gtm.status)}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Version</span>
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
    let html = '<h2 class="section-label" style="margin-top:10px">Google Analytics 4</h2>';
    ga4Items.forEach((ga4) => {
      html += `
        <div class="card">
          <button class="card-header" onclick="toggleCard(this)" aria-expanded="false" aria-label="Toggle details for ${escHtml(ga4.id || ga4.method || 'GA4 Active')}">
            <span class="tag-badge ga4-badge">GA4</span>
            <span class="card-title">${escHtml(ga4.id || ga4.method || 'GA4 Active')}</span>
            <span class="status-dot"></span>
            <span class="card-chevron" aria-hidden="true">▶</span>
          </button>
          <div class="card-body">
            ${ga4.id ? `<div class="prop-row"><span class="prop-key">Measurement ID</span><span class="prop-val">${escHtml(ga4.id)}</span></div>` : ''}
            <div class="prop-row">
              <span class="prop-key">Method</span>
              <span class="prop-val">${escHtml(ga4.method || 'DOM script')}</span>
            </div>
            <div class="prop-row">
              <span class="prop-key">Status</span>
              <span class="prop-val">${escHtml(ga4.status || 'Detected')}</span>
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

  const datalayerBadge = document.getElementById('badge-datalayer');
  datalayerBadge.textContent = events.length;
  datalayerBadge.setAttribute(
    'aria-label',
    `${events.length} dataLayer event${events.length !== 1 ? 's' : ''}`,
  );

  if (events.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon" role="img" aria-label="No events">📭</div>
        <p>No dataLayer events found.<br>This page may not use GTM.</p>
      </div>`;
    return;
  }

  let html = '';
  // Show most recent first
  const reversed = [...events].reverse();
  reversed.forEach((event) => {
    const nameColor = event.hasEvent ? '#B5A5FF' : '#FBBF24';
    html += `
      <div class="event-item">
        <button class="event-header" onclick="toggleEvent(this)" aria-expanded="false" aria-label="Toggle payload for event ${escHtml(event.event)}">
          <span class="event-index" aria-hidden="true">#${event.index}</span>
          <span class="event-name" style="color:${nameColor}">${escHtml(event.event)}</span>
          <span class="card-chevron" aria-hidden="true">▶</span>
        </button>
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

  const networkBadge = document.getElementById('badge-network');
  networkBadge.textContent = allHits.length;
  networkBadge.setAttribute(
    'aria-label',
    `${allHits.length} network hit${allHits.length !== 1 ? 's' : ''}`,
  );

  if (allHits.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon" role="img" aria-label="No network activity">🌐</div>
        <p>No network hits captured.<br>Browse this tab to start capturing.</p>
      </div>`;
    return;
  }

  let html = '';
  allHits.forEach((hit) => {
    const time = new Date(hit.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const typeClass = hit.type.includes('GTM')
      ? 'gtm-type'
      : hit.type.includes('UA')
        ? 'ua-type'
        : 'ga4-type';

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
          ${hit.clientId && hit.clientId !== 'N/A' ? `<span class="hit-chip">cid: ${escHtml(hit.clientId.substring(0, 12))}...</span>` : ''}
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

function toggleCard(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.card-chevron');
  const isOpen = body.classList.toggle('open');
  chevron.classList.toggle('open');
  header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function toggleEvent(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.card-chevron');
  const isOpen = body.classList.toggle('open');
  chevron.classList.toggle('open');
  header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Exponer para onclick
window.toggleCard = toggleCard;
window.toggleEvent = toggleEvent;

// Iniciar
loadData();
