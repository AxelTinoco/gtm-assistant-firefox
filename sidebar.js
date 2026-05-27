// sidebar.js — entry point for the sidebar_action panel.
// Shared logic lives in ui.js (loaded first). Unlike the popup, the sidebar stays
// open while the user browses, so it re-analyzes on tab switches and navigations.
/* global initUI, loadData */
initUI();
loadData();

// Debounce so rapid tab switching doesn't stack overlapping loadData() calls
// (each GET_TAGS round-trip waits ~300ms in content.js).
let loadTimer = null;
function scheduleLoad() {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(loadData, 200);
}

// User switched to a different tab.
browser.tabs.onActivated.addListener(() => scheduleLoad());

// The active tab finished loading/reloading. Ignore background tabs and
// intermediate states so we only refresh when the visible page is ready.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) scheduleLoad();
});
