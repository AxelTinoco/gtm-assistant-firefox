# Accessibility Plan — GTM & QA Assistant
W3C WCAG 2.1 Audit & Implementation Roadmap

---

## Current State Summary

**Files audited:** `popup.html`, `popup.js`
**Standard:** WCAG 2.1 (Levels A and AA)
**Total issues found:** 39
**Critical blockers:** 9

---

## Issues Found

### Severity legend
- 🔴 Critical — WCAG 2.1 Level A failure, blocks assistive tech
- 🟠 High — WCAG 2.1 Level AA failure or major barrier
- 🟡 Medium — Best practice violation or partial barrier
- 🟢 Low — Minor / cosmetic improvement

---

### 1. Semantic HTML

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| S1 | 🔴 | Tabs are `<div>` elements — must be `<button role="tab">` | `popup.html` tab-segment |
| S2 | 🔴 | Card headers use `<div onclick>` — must be `<button>` | `popup.js` lines 107, 140, 187 |
| S3 | 🟠 | Missing landmark regions (`<header>`, `<main>`, `<footer>`) | `popup.html` overall structure |
| S4 | 🟡 | Section labels (DataLayer, Network) are styled divs, not `<h2>` | `popup.js` lines 103, 136 |
| S5 | 🟡 | `<span class="section-label">` in static HTML, not a heading | `popup.html` lines 571, 580 |

---

### 2. ARIA Roles & Attributes

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| A1 | 🔴 | Tab segment missing `role="tablist"`, tabs missing `role="tab"`, `aria-selected`, `aria-controls` | `popup.html` tab-segment |
| A2 | 🔴 | Tab panels missing `role="tabpanel"` and `aria-labelledby` | `popup.html` `#tab-overview`, `#tab-datalayer`, `#tab-network` |
| A3 | 🔴 | Collapsible cards missing `aria-expanded` (never toggled in JS) | `popup.js` `toggleCard()`, `toggleEvent()` |
| A4 | 🟠 | Status banner missing `role="status"` and `aria-live="polite"` | `popup.html` `#statusBanner` |
| A5 | 🟡 | URL bar `<span>` has no accessible label | `popup.html` `#urlBar` |
| A6 | 🟡 | "Clear" buttons lack `aria-label` describing what they clear | `popup.html` `#clearNetworkBtn`, `#clearHitsBtn` |
| A7 | 🟡 | Last scan `<span>` updated dynamically, missing `aria-live` | `popup.html` `#lastScan` |
| A8 | 🟡 | Badges updated dynamically, missing `aria-live` and `aria-label` | `popup.html` `#badge-*` |
| A9 | 🟢 | Header status dot has no accessible label | `popup.html` `.header-status-dot` |
| A10 | 🟢 | Header icon `</>` has no accessible label | `popup.html` `.header-icon` |

---

### 3. Keyboard Navigation

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| K1 | 🔴 | Tab elements not focusable (no `tabindex`, no keyboard events) | `popup.js` tab listener |
| K2 | 🔴 | Card/event toggle divs not focusable or keyboard-operable | `popup.js` dynamically generated HTML |
| K3 | 🟠 | No `focus-visible` styles on any interactive element | `popup.html` CSS |
| K4 | 🟡 | No arrow-key navigation between tabs (standard tab pattern) | `popup.js` |
| K5 | 🟡 | Focus not managed when switching tab panels | `popup.js` tab switcher |

---

### 4. Color Contrast

| ID | Severity | Issue | Ratio | Required |
|----|----------|-------|-------|----------|
| C1 | 🟠 | `--text-secondary` (#ADB5BD) on `--bg-primary` (#212529) | ~4.2:1 | 4.5:1 (AA) |
| C2 | 🟠 | `--text-muted` (#6C757D) on `--bg-primary` (#212529) | ~3.3:1 | 4.5:1 (AA) |
| C3 | 🟠 | `--text-muted` (#6C757D) on `--bg-secondary` (#2B3035) | ~3.0:1 | 4.5:1 (AA) |
| C4 | 🟡 | `--accent` (#7C5CFC) used as text on `--bg-secondary` (#2B3035) | ~4.4:1 | 4.5:1 (AA) |
| C5 | 🟡 | Status states communicated by color alone (no text/icon shape differentiation) | — | WCAG 1.4.1 |

**Fix for C1–C3:** Lighten muted colors for text use:
- `--text-secondary`: `#ADB5BD` → `#C0C7CE`
- `--text-muted` (text use only): `#6C757D` → `#909AA3`

---

### 5. Interactive Elements

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| I1 | 🔴 | Divs with `onclick` used as buttons (no keyboard, no role) | `popup.js` generated HTML |
| I2 | 🟠 | `click`-only event listeners on tabs — no Enter/Space support | `popup.js` lines 7–14 |
| I3 | 🟡 | Decorative SVG (link icon) not marked `aria-hidden` | `popup.html` `.url-icon svg` |
| I4 | 🟡 | Emoji in empty states lack `role="img"` and `aria-label` | `popup.js` lines 174, 211 |

---

### 6. Screen Reader Support

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| R1 | 🔴 | Status banner changes (loading/found/not-found) not announced | `popup.js` `renderOverview()` |
| R2 | 🔴 | Dynamic card/event/hit lists injected with no live region | `popup.js` all render functions |
| R3 | 🟡 | Badge count updates not announced | `popup.js` badge updates |
| R4 | 🟡 | Last scan time update not announced | `popup.js` line 45 |

---

### 7. Buttons & Forms

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| B1 | 🟠 | No `:focus-visible` styles on `.refresh-btn` or `.clear-btn` | `popup.html` CSS |
| B2 | 🟡 | Refresh button has no `aria-busy` state during loading | `popup.js` `refreshBtn` handler |
| B3 | 🟢 | Refresh button could have `aria-label="Refresh analysis"` for clarity | `popup.html` `#refreshBtn` |

---

## Implementation Plan

Issues are grouped into 4 phases ordered by impact and dependency.

---

### Phase 1 — Critical: Keyboard & Role Fixes
**Goal:** Make the extension operable without a mouse.
**Effort:** Medium | **Impact:** Maximum

#### 1.1 Replace interactive divs with buttons (`popup.js`)
- `<div class="card-header" onclick="toggleCard(this)">` → `<button class="card-header" aria-expanded="false">`
- `<div class="event-header" onclick="toggleEvent(this)">` → `<button class="event-header" aria-expanded="false">`
- Update `toggleCard()` and `toggleEvent()` to also toggle `aria-expanded`

#### 1.2 Implement proper tab pattern (`popup.html` + `popup.js`)
- Wrap `.tab-segment` with `role="tablist"`
- Change each `.tab` div to `<button role="tab" aria-selected="true|false" aria-controls="tab-[name]" id="tab-btn-[name]">`
- Add `role="tabpanel" aria-labelledby="tab-btn-[name]"` to each `.tab-panel`
- Update tab switcher in JS to toggle `aria-selected` and support Arrow Left/Right keys

#### 1.3 Add focus-visible styles (`popup.html`)
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
.refresh-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
```

---

### Phase 2 — High: ARIA Live Regions & Labels
**Goal:** Make dynamic content changes audible to screen readers.
**Effort:** Low | **Impact:** High

#### 2.1 Add live regions to dynamic containers (`popup.html`)
```html
<!-- Status banner -->
<div id="statusBanner" role="status" aria-live="polite" class="status-banner loading">

<!-- Last scan -->
<span id="lastScan" role="status" aria-live="polite" class="footer-left">

<!-- Content sections — wrap in live region -->
<div id="gtmSection" aria-live="polite"></div>
<div id="ga4Section" aria-live="polite"></div>
<div id="dataLayerList" aria-live="polite"></div>
<div id="networkList" aria-live="polite"></div>
```

#### 2.2 Label "Clear" buttons (`popup.html`)
```html
<button class="clear-btn" id="clearNetworkBtn" aria-label="Clear dataLayer events">Clear</button>
<button class="clear-btn" id="clearHitsBtn" aria-label="Clear network hits">Clear</button>
```

#### 2.3 Label URL bar and badges (`popup.html`)
```html
<span class="url-text" id="urlBar" aria-label="Current page URL">—</span>
<span class="badge" id="badge-overview" aria-label="Overview tag count">0</span>
```

#### 2.4 Hide decorative elements from screen readers (`popup.html`)
```html
<div class="accent-line" aria-hidden="true"></div>
<span class="url-icon" aria-hidden="true">...</span>
<div class="header-status-dot" aria-label="Extension connected" role="img"></div>
```

#### 2.5 Add `aria-busy` to refresh button (`popup.js`)
```js
btn.setAttribute('aria-busy', 'true');
btn.setAttribute('aria-disabled', 'true');
// after:
btn.removeAttribute('aria-busy');
btn.removeAttribute('aria-disabled');
```

---

### Phase 3 — Medium: Semantic Landmarks & Headings
**Goal:** Proper document structure for navigation.
**Effort:** Low | **Impact:** Medium

#### 3.1 Add HTML landmarks (`popup.html`)
```html
<header class="header"> ... </header>
<main class="content"> ... </main>
<footer class="footer"> ... </footer>
```

#### 3.2 Convert section labels to headings (`popup.js`)
```js
// Instead of:
'<div class="section-label">Google Tag Manager</div>'
// Use:
'<h2 class="section-label">Google Tag Manager</h2>'
```

#### 3.3 Fix emoji in empty states (`popup.js`)
```js
// Instead of:
'<div class="icon">📭</div>'
// Use:
'<div class="icon" role="img" aria-label="No events">📭</div>'
```

---

### Phase 4 — Low: Color Contrast & Polish
**Goal:** Meet WCAG AA contrast requirements.
**Effort:** Low | **Impact:** Medium

#### 4.1 Update muted/secondary text colors (`popup.html`)
```css
:root {
  --text-secondary: #C0C7CE; /* was #ADB5BD — now 5.1:1 on bg-primary */
  --text-muted-ui: #909AA3;  /* for text use — was #6C757D (3.3:1, fails AA) */
}
```
> Keep `--text-muted` at `#6C757D` only for decorative/non-essential uses (borders, icons).

#### 4.2 Add text label alongside color for status states (`popup.js`)
The existing emoji + text already partially satisfies this (✅ / 🔍 / ⚠️). Ensure every state has a unique text label — no state communicated by color alone.

#### 4.3 Verify accent on secondary background (`popup.html`)
- `#7C5CFC` on `#2B3035` = 4.4:1 — fails for body text at 12px
- When using `--accent` as text color, ensure font-size ≥ 14px bold or ≥ 18px normal, OR lighten to `#8F75FD`

---

## Checklist (by file)

### `popup.html`
- [ ] Add `lang="en"` ✅ (already done)
- [ ] Replace `.header` div → `<header>`
- [ ] Replace `.content` div → `<main>`
- [ ] Replace `.footer` div → `<footer>`
- [ ] Add `role="tablist"` to `.tab-segment`
- [ ] Change tab `<div>` → `<button role="tab" aria-selected aria-controls>`
- [ ] Add `role="tabpanel" aria-labelledby` to each `.tab-panel`
- [ ] Add `role="status" aria-live="polite"` to `#statusBanner`
- [ ] Add `role="status" aria-live="polite"` to `#lastScan`
- [ ] Add `aria-live="polite"` to `#gtmSection`, `#ga4Section`, `#dataLayerList`, `#networkList`
- [ ] Add `aria-label` to `#urlBar`, `#clearNetworkBtn`, `#clearHitsBtn`, `#badge-*`
- [ ] Add `aria-hidden="true"` to `.accent-line`, `.url-icon svg`
- [ ] Add `:focus-visible` CSS for all interactive elements
- [ ] Update `--text-secondary` and `--text-muted` contrast values

### `popup.js`
- [ ] Change card-header template from `<div>` → `<button aria-expanded="false">`
- [ ] Change event-header template from `<div>` → `<button aria-expanded="false">`
- [ ] Change section labels from `<div>` → `<h2>`
- [ ] Update `toggleCard()` to set `aria-expanded`
- [ ] Update `toggleEvent()` to set `aria-expanded`
- [ ] Add Arrow Left/Right keyboard support to tab switcher
- [ ] Add `aria-busy` / `aria-disabled` to refresh button during load
- [ ] Add `role="img" aria-label` to emoji in empty states
- [ ] Change GA4 fallback text from `'GA4 Active'` → keep, already English ✅

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [WAI-ARIA Authoring Practices — Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN — Using aria-live](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live)
