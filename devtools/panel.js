// panel.js - DevTools panel logic
let currentData = null;
let allNetworkData = null;

// DOM helpers
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style') node.setAttribute('style', v);
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function table(headers, rowsData) {
  const thead = el(
    'thead',
    {},
    el(
      'tr',
      {},
      headers.map((h) => el('th', { scope: 'col', text: h }))
    )
  );
  const tbody = el(
    'tbody',
    {},
    rowsData.map((cells) =>
      el(
        'tr',
        {},
        cells.map((cell) => {
          if (cell && typeof cell === 'object' && 'node' in cell) return cell.node;
          if (cell && typeof cell === 'object' && 'text' in cell)
            return el('td', { class: cell.class || '', text: String(cell.text) });
          return el('td', { text: String(cell ?? '') });
        })
      )
    )
  );
  return el('table', { class: 'dl-table' }, [thead, tbody]);
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

function sidebarButton({ action, id, tidClass, tidText, sub, tidStyle }) {
  const attrs = { type: 'button', class: 'tag-item', 'data-action': action };
  if (id != null) attrs['data-id'] = id;
  return el('button', attrs, [
    el(
      'span',
      tidStyle ? { class: `tid ${tidClass}`, style: tidStyle } : { class: `tid ${tidClass}` },
      tidText
    ),
    el('span', { class: 'tsub' }, sub),
  ]);
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const gtm = currentData?.gtm || [];
  const ga4 = currentData?.ga4 || [];
  const ga4Hits = allNetworkData?.ga4Hits || [];
  const gtmHits = allNetworkData?.gtmHits || [];

  clear(sidebar);
  let added = false;

  if (gtm.length > 0) {
    sidebar.appendChild(el('h2', { class: 'sidebar-label', text: 'Google Tag Manager' }));
    gtm.forEach((g) => {
      sidebar.appendChild(
        sidebarButton({
          action: 'gtm',
          id: g.id,
          tidClass: 'gtm',
          tidText: String(g.id),
          sub: `${g.status} • v${g.version}`,
        })
      );
    });
    added = true;
  }

  if (ga4.length > 0) {
    sidebar.appendChild(el('h2', { class: 'sidebar-label', text: 'Google Analytics 4' }));
    ga4.forEach((g) => {
      const key = g.id || g.method;
      sidebar.appendChild(
        sidebarButton({
          action: 'ga4',
          id: key,
          tidClass: 'ga4',
          tidText: String(g.id || 'GA4'),
          sub: `${g.method || 'Script DOM'} • ${g.status}`,
        })
      );
    });
    added = true;
  }

  if (currentData?.dataLayer?.length > 0) {
    sidebar.appendChild(el('h2', { class: 'sidebar-label', text: 'DataLayer' }));
    sidebar.appendChild(
      sidebarButton({
        action: 'datalayer',
        tidClass: '',
        tidStyle: 'color:#fbbc04',
        tidText: 'dataLayer',
        sub: `${currentData.dataLayer.length} eventos`,
      })
    );
    added = true;
  }

  if (ga4Hits.length > 0 || gtmHits.length > 0) {
    sidebar.appendChild(el('h2', { class: 'sidebar-label', text: 'Network Hits' }));
    sidebar.appendChild(
      sidebarButton({
        action: 'network',
        tidClass: 'muted',
        tidText: 'Hits capturados',
        sub: `${ga4Hits.length + gtmHits.length} requests`,
      })
    );
    added = true;
  }

  if (!added) {
    sidebar.appendChild(
      el('div', { class: 'empty sidebar-empty', text: 'No se detectaron tags en esta página' })
    );
  }
}

function setActiveItem(button) {
  const sidebar = document.getElementById('sidebar');
  sidebar.querySelectorAll('.tag-item[aria-current="true"]').forEach((node) => {
    node.removeAttribute('aria-current');
    node.classList.remove('active');
  });
  if (button) {
    button.setAttribute('aria-current', 'true');
    button.classList.add('active');
  }
}

function detailTitle(iconColor, iconChar, titleText) {
  return el('h2', { class: 'detail-title' }, [
    el('span', { 'aria-hidden': 'true', style: `color:${iconColor}`, text: iconChar }),
    ` ${titleText}`,
  ]);
}

function showDataLayer() {
  const detail = document.getElementById('detail');
  const events = currentData?.dataLayer || [];
  clear(detail);

  if (!events.length) {
    detail.appendChild(el('div', { class: 'empty', text: 'DataLayer vacío' }));
    return;
  }

  detail.appendChild(detailTitle('#fbbc04', '📦', 'DataLayer Events'));
  const rows = [...events]
    .reverse()
    .map((e) => [
      String(e.index),
      { text: String(e.event), class: 'event-cell' },
      { text: String(e.data), class: 'json-cell' },
    ]);
  detail.appendChild(table(['#', 'Event', 'Payload'], rows));
}

function showGTMDetail(id) {
  const gtm = currentData?.gtm?.find((g) => g.id === id);
  if (!gtm) return;
  const detail = document.getElementById('detail');
  clear(detail);

  detail.appendChild(detailTitle('#4285f4', '📦', String(gtm.id)));
  detail.appendChild(
    table(
      ['Propiedad', 'Valor'],
      [
        ['Container ID', { text: String(gtm.id), class: 'event-cell' }],
        ['Estado', String(gtm.status)],
        ['Versión', String(gtm.version || 'N/A')],
        ['DataLayer eventos', String(currentData?.dataLayer?.length || 0)],
      ]
    )
  );
}

function showGA4Detail(id) {
  const ga4 = currentData?.ga4?.find((g) => (g.id || g.method) === id);
  if (!ga4) return;
  const hits = allNetworkData?.ga4Hits?.filter((h) => h.measurementId === ga4.id) || [];
  const detail = document.getElementById('detail');
  clear(detail);

  detail.appendChild(detailTitle('#34a853', '📊', String(ga4.id || 'GA4')));

  const rows = [];
  if (ga4.id) rows.push(['Measurement ID', { text: String(ga4.id), class: 'event-cell' }]);
  rows.push(['Método de implementación', String(ga4.method || 'DOM script')]);
  rows.push(['Estado', String(ga4.status || 'Detectado')]);
  rows.push(['Hits capturados', String(hits.length)]);
  detail.appendChild(table(['Propiedad', 'Valor'], rows));

  if (hits.length > 0) {
    detail.appendChild(
      el('h2', { class: 'detail-title subhead', text: `Network Hits (${hits.length})` })
    );
    const hitRows = hits.map((h) => [
      { text: String(h.eventName), class: 'event-cell' },
      String(h.sessionId || 'N/A'),
      `${String((h.clientId || 'N/A').substring(0, 16))}...`,
      new Date(h.timestamp).toLocaleTimeString('es-MX'),
    ]);
    detail.appendChild(table(['Evento', 'Session ID', 'Client ID', 'Hora'], hitRows));
  }
}

function showNetworkHits() {
  const detail = document.getElementById('detail');
  const gtmHits = allNetworkData?.gtmHits || [];
  const ga4Hits = allNetworkData?.ga4Hits || [];
  const all = [...gtmHits, ...ga4Hits].sort((a, b) => b.timestamp - a.timestamp);
  clear(detail);

  if (!all.length) {
    detail.appendChild(el('div', { class: 'empty', text: 'Sin hits capturados' }));
    return;
  }

  detail.appendChild(
    el('h2', { class: 'detail-title' }, [
      el('span', { 'aria-hidden': 'true', text: '🌐' }),
      ' Network Hits',
    ])
  );

  const rows = all.map((h) => [
    { text: String(h.type), class: 'event-cell' },
    String(h.id || h.measurementId || 'N/A'),
    String(h.eventName || '—'),
    new Date(h.timestamp).toLocaleTimeString('es-MX'),
  ]);
  detail.appendChild(table(['Tipo', 'ID', 'Evento', 'Hora'], rows));
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
