// popup.js — entry point for the browser_action popup.
// Shared logic lives in ui.js (loaded first). The popup is transient, so it just
// wires the UI and loads once; no live-update listeners (see sidebar.js for those).
/* global initUI, loadData */
initUI();
loadData();

// Sidebar toggle: opens/closes this panel as the docked Firefox sidebar.
// The switch reflects the live state — isOpen() (async) sets it when the popup
// opens, and toggle() flips it on click. toggle() must run synchronously inside
// the click (Firefox requires a user gesture). When opening, the sidebar takes
// focus and the popup closes on its own; when closing, the popup stays open.
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle && browser.sidebarAction) {
  const sidebarToggleLabel = document.getElementById('sidebarToggleLabel');

  const setToggleState = (open) => {
    sidebarToggle.setAttribute('aria-checked', open ? 'true' : 'false');
    sidebarToggleLabel.textContent = open ? 'Sidebar is open' : 'Open in sidebar';
  };

  // Reflect the current state when the popup opens (async is fine here).
  (async () => {
    try {
      const win = await browser.windows.getCurrent();
      const open = await browser.sidebarAction.isOpen({ windowId: win.id });
      setToggleState(open);
    } catch (e) {
      // isOpen() unsupported or failed — leave the default state; toggle still works.
    }
  })();

  sidebarToggle.addEventListener('click', () => {
    const willOpen = sidebarToggle.getAttribute('aria-checked') !== 'true';
    browser.sidebarAction.toggle().catch(() => {});
    setToggleState(willOpen);
  });
}
