// ui.js — shared UI logic for the popup (popup.js) and the sidebar (sidebar.js).
// Loaded as a classic script BEFORE the per-page entry script. Defines globals and
// the renderers; the entry script decides when to call initUI()/loadData().
/* exported initUI, loadData */
let currentTabId = null;
let currentData = null;
let allData = null;

// Wires up the static UI: tab switching (WAI-ARIA + keyboard), refresh and clear
// buttons. Called once per page by the entry script, after the DOM exists.
function initUI() {
  // Header version label — sourced from the manifest so it never drifts.
  const versionEl = document.querySelector('.header-version');
  if (versionEl) versionEl.textContent = 'v' + browser.runtime.getManifest().version;

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
      browser.runtime
        .sendMessage({ type: 'CLEAR_DATA', tabId: currentTabId })
        .then(() => loadData());
    }
  });
  document.getElementById('clearHitsBtn').addEventListener('click', () => {
    if (currentTabId) {
      browser.runtime
        .sendMessage({ type: 'CLEAR_DATA', tabId: currentTabId })
        .then(() => loadData());
    }
  });

  // "Keep data on reload" toggles — persist a flag in storage.local that the
  // background reads to skip clearing captured hits AND the dataLayer history
  // on PAGE_LOADED. The same toggle is shown in the DataLayer and Network tabs;
  // both stay in sync (and mirror changes from the popup/sidebar/DevTools).
  const preserveToggles = Array.from(document.querySelectorAll('.preserve-toggle'));
  if (preserveToggles.length) {
    const paint = (on) => {
      preserveToggles.forEach((t) => t.setAttribute('aria-checked', String(Boolean(on))));
    };

    browser.storage.local
      .get('preserveOnReload')
      .then(({ preserveOnReload }) => paint(preserveOnReload))
      .catch(() => {});

    preserveToggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const on = toggle.getAttribute('aria-checked') === 'true';
        const next = !on;
        paint(next);
        browser.storage.local.set({ preserveOnReload: next }).catch(() => paint(on));
      });
    });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && 'preserveOnReload' in changes) {
        paint(changes.preserveOnReload.newValue);
      }
    });
  }
}

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
    } else {
      currentData = null;
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

// DOM helpers
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style') node.setAttribute('style', v);
    else if (k.startsWith('aria-') || k === 'role' || k === 'hidden' || k === 'tabindex')
      node.setAttribute(k, v);
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function setBanner(node, className, iconText, message, strongValue) {
  clear(node);
  node.className = className;
  node.appendChild(el('span', { 'aria-hidden': 'true', text: iconText }));
  if (strongValue !== null && strongValue !== undefined) {
    const span = el('span', {}, [
      'Detected ',
      el('strong', { text: String(strongValue) }),
      ` ${message}`,
    ]);
    node.appendChild(document.createTextNode(' '));
    node.appendChild(span);
  } else {
    node.appendChild(document.createTextNode(' '));
    node.appendChild(el('span', { text: message }));
  }
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
    `${totalTags} Google tag${totalTags !== 1 ? 's' : ''} detected`
  );

  if (!currentData) {
    setBanner(
      statusBanner,
      'status-banner not-found',
      '⚠️',
      'Could not analyze this page. Is it a special browser page?'
    );
    clear(gtmSection);
    clear(ga4Section);
    return;
  }

  if (totalTags === 0) {
    setBanner(statusBanner, 'status-banner not-found', '🔍', 'No GTM or GA4 detected on this page');
  } else {
    const plural = totalTags !== 1 ? 's' : '';
    setBanner(statusBanner, 'status-banner found', '✅', `Google tag${plural}`, totalTags);
  }

  // GTM Cards
  clear(gtmSection);
  if (gtmItems.length > 0) {
    gtmSection.appendChild(el('h2', { class: 'section-label', text: 'Google Tag Manager' }));
    gtmItems.forEach((gtm) => {
      gtmSection.appendChild(
        buildCard({
          badgeClass: 'gtm-badge',
          badgeText: 'GTM',
          title: gtm.id,
          rows: [
            ['Container ID', gtm.id],
            ['Status', gtm.status],
            ['Version', gtm.version || 'N/A'],
          ],
        })
      );
    });
  }

  // GA4 Cards
  clear(ga4Section);
  if (ga4Items.length > 0) {
    ga4Section.appendChild(
      el('h2', { class: 'section-label', style: 'margin-top:10px', text: 'Google Analytics 4' })
    );
    ga4Items.forEach((ga4) => {
      const rows = [];
      if (ga4.id) rows.push(['Measurement ID', ga4.id]);
      rows.push(['Method', ga4.method || 'DOM script']);
      rows.push(['Status', ga4.status || 'Detected']);
      ga4Section.appendChild(
        buildCard({
          badgeClass: 'ga4-badge',
          badgeText: 'GA4',
          title: ga4.id || ga4.method || 'GA4 Active',
          rows,
        })
      );
    });
  }
}

function buildCard({ badgeClass, badgeText, title, rows }) {
  const chevron = el('span', { class: 'card-chevron', 'aria-hidden': 'true', text: '▶' });
  const header = el(
    'button',
    {
      class: 'card-header',
      'aria-expanded': 'false',
      'aria-label': `Toggle details for ${title}`,
    },
    [
      el('span', { class: `tag-badge ${badgeClass}`, text: badgeText }),
      el('span', { class: 'card-title', text: String(title) }),
      el('span', { class: 'status-dot' }),
      chevron,
    ]
  );
  const body = el(
    'div',
    { class: 'card-body' },
    rows.map(([key, val]) =>
      el('div', { class: 'prop-row' }, [
        el('span', { class: 'prop-key', text: key }),
        el('span', { class: 'prop-val', text: String(val) }),
      ])
    )
  );
  header.addEventListener('click', () => toggleCard(header));
  return el('div', { class: 'card' }, [header, body]);
}

function renderDataLayer() {
  const list = document.getElementById('dataLayerList');
  // Eventos conservados de recargas anteriores (marcados) + eventos en vivo.
  const preserved = (allData?.dataLayerHistory || []).map((e) => ({ ...e, preserved: true }));
  const live = currentData?.dataLayer || [];
  const events = [...preserved, ...live];

  const datalayerBadge = document.getElementById('badge-datalayer');
  datalayerBadge.textContent = events.length;
  datalayerBadge.setAttribute(
    'aria-label',
    `${events.length} dataLayer event${events.length !== 1 ? 's' : ''}`
  );

  clear(list);

  if (events.length === 0) {
    list.appendChild(
      el('div', { class: 'empty-state' }, [
        el('div', { class: 'icon', role: 'img', 'aria-label': 'No events', text: '📭' }),
        el('p', {}, ['No dataLayer events found.', el('br'), 'This page may not use GTM.']),
      ])
    );
    return;
  }

  // Show most recent first
  const reversed = [...events].reverse();
  reversed.forEach((event) => {
    const nameColor = event.hasEvent ? '#B5A5FF' : '#FBBF24';
    const chevron = el('span', { class: 'card-chevron', 'aria-hidden': 'true', text: '▶' });
    const header = el(
      'button',
      {
        class: 'event-header',
        'aria-expanded': 'false',
        'aria-label': `Toggle payload for event ${event.event}`,
      },
      [
        el('span', { class: 'event-index', 'aria-hidden': 'true', text: `#${event.index}` }),
        el('span', {
          class: 'event-name',
          style: `color:${nameColor}`,
          text: String(event.event),
        }),
        event.preserved
          ? el('span', {
              class: 'event-preserved-tag',
              title: 'Conservado de una carga anterior',
              text: 'prev',
            })
          : null,
        chevron,
      ]
    );
    const body = el('div', { class: 'event-body' }, [
      el('div', { class: 'event-json', text: String(event.data) }),
    ]);
    header.addEventListener('click', () => toggleEvent(header));
    list.appendChild(el('div', { class: 'event-item' }, [header, body]));
  });
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
    `${allHits.length} network hit${allHits.length !== 1 ? 's' : ''}`
  );

  clear(list);

  if (allHits.length === 0) {
    list.appendChild(
      el('div', { class: 'empty-state' }, [
        el('div', { class: 'icon', role: 'img', 'aria-label': 'No network activity', text: '🌐' }),
        el('p', {}, ['No network hits captured.', el('br'), 'Browse this tab to start capturing.']),
      ])
    );
    return;
  }

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

    const topRow = el(
      'div',
      { style: 'display:flex;align-items:center;justify-content:space-between' },
      [
        el('div', { class: `hit-type ${typeClass}`, text: String(hit.type) }),
        el('div', { class: 'hit-time', text: time }),
      ]
    );

    const chips = [];
    if (hit.id) chips.push(el('span', { class: 'hit-chip', text: `ID: ${hit.id}` }));
    if (hit.eventName && hit.eventName !== 'N/A')
      chips.push(el('span', { class: 'hit-chip', text: `event: ${hit.eventName}` }));
    if (hit.measurementId && hit.measurementId !== 'N/A')
      chips.push(el('span', { class: 'hit-chip', text: `tid: ${hit.measurementId}` }));
    if (hit.clientId && hit.clientId !== 'N/A')
      chips.push(
        el('span', { class: 'hit-chip', text: `cid: ${hit.clientId.substring(0, 12)}...` })
      );

    const meta = el('div', { class: 'hit-meta' }, chips);
    list.appendChild(el('div', { class: 'hit-item' }, [topRow, meta]));
  });
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
