// Este script se inyecta en el contexto de la página para acceder a window
(function () {
  'use strict';

  function detectTags() {
    var result = {
      gtm: [],
      ga4: [],
      dataLayer: [],
      timestamp: Date.now(),
    };

    // --- Detectar GTM ---
    if (window.google_tag_manager) {
      var gtmObj = window.google_tag_manager;
      for (var key in gtmObj) {
        if (key.startsWith('GTM-') || key.startsWith('G-') || /^[A-Z]+-[A-Z0-9]+$/.test(key)) {
          var container = gtmObj[key];
          result.gtm.push({
            id: key,
            status: 'Activo',
            version: container && container.version ? container.version : 'N/A',
          });
        }
      }
    }

    // Buscar GTM/GA4 IDs en scripts del DOM
    var scripts = document.querySelectorAll('script');
    scripts.forEach(function (script) {
      var src = script.src || script.textContent || '';
      var gtmMatch = src.match(/GTM-[A-Z0-9]+/g);
      if (gtmMatch) {
        gtmMatch.forEach(function (id) {
          if (
            !result.gtm.find(function (g) {
              return g.id === id;
            })
          ) {
            result.gtm.push({ id: id, status: 'Detectado en DOM', version: 'N/A' });
          }
        });
      }
    });

    // --- Detectar GA4 ---
    if (window.gtag) {
      result.ga4.push({ method: 'gtag()', status: 'Activo' });
    }
    if (window.ga) {
      result.ga4.push({ method: 'window.ga', status: 'Universal Analytics' });
    }
    scripts.forEach(function (script) {
      var src = script.src || script.textContent || '';
      var ga4Match = src.match(/G-[A-Z0-9]+/g);
      if (ga4Match) {
        ga4Match.forEach(function (id) {
          if (
            !result.ga4.find(function (g) {
              return g.id === id;
            })
          ) {
            result.ga4.push({ id: id, method: 'Script DOM', status: 'Detectado' });
          }
        });
      }
    });

    // --- DataLayer ---
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      var total = window.dataLayer.length;
      var slice = window.dataLayer.slice(-20);

      result.dataLayer = slice.map(function (entry, i) {
        var label = null;
        var hasEvent = false;
        var serialized = '';

        try {
          // gtag() pushes Arguments objects into dataLayer
          // They are array-like: {0: fn, 1: "event"/"config", 2: "name", 3: {...}}
          var isArguments =
            entry !== null &&
            typeof entry === 'object' &&
            !Array.isArray(entry) &&
            typeof entry.length === 'number' &&
            !Object.prototype.hasOwnProperty.call(entry, 'event');

          if (isArguments || Array.isArray(entry)) {
            var arr = Array.from(entry).map(function (v) {
              if (typeof v === 'function') return '[Function]';
              if (v instanceof Date) return v.toISOString();
              return v;
            });
            serialized = JSON.stringify(arr, null, 2);

            // arr[0] = function (gtag itself), arr[1] = command, arr[2] = target/name
            var cmd = arr[1] || arr[0];
            var arg1 = arr[2];
            var params = arr[3];

            if (cmd === 'event' && typeof arg1 === 'string') {
              label = 'event: ' + arg1;
              hasEvent = true;
              // Add key params to label
              if (params && typeof params === 'object') {
                var pkeys = Object.keys(params).slice(0, 2).join(', ');
                if (pkeys) label += ' {' + pkeys + '}';
              }
            } else if (cmd === 'config' && typeof arg1 === 'string') {
              label = 'config: ' + arg1;
            } else if (cmd === 'set') {
              if (arg1 && typeof arg1 === 'object') {
                label = 'set: ' + Object.keys(arg1).join(', ');
              } else {
                label = 'set';
              }
            } else if (cmd === 'js') {
              label = 'gtag init';
            } else if (cmd) {
              label = String(cmd);
            } else {
              label = '(gtag call)';
            }
          } else if (entry !== null && typeof entry === 'object') {
            // Classic GTM object: { event: "...", key: val, ... }
            serialized = JSON.stringify(entry, null, 2);

            if (entry.event) {
              label = entry.event;
              hasEvent = true;
            } else {
              var keys = Object.keys(entry).filter(function (k) {
                return k !== 'gtm.uniqueEventId';
              });
              if (keys.length > 0) {
                var k = keys[0];
                var v = entry[k];
                label =
                  typeof v === 'string' || typeof v === 'number'
                    ? k + ': ' + String(v).substring(0, 40)
                    : keys.join(', ');
              } else {
                label = '(objeto)';
              }
            }
          } else {
            label = String(entry);
            serialized = JSON.stringify(entry);
          }
        } catch (e) {
          label = '(error)';
          serialized = String(entry);
        }

        return {
          index: total - slice.length + i,
          event: label || '(sin nombre)',
          hasEvent: hasEvent,
          data: serialized,
        };
      });
    }

    return result;
  }

  var data = detectTags();
  window.dispatchEvent(new CustomEvent('gtm_ga4_assistant_result', { detail: data }));

  window.addEventListener('gtm_ga4_assistant_request', function () {
    var freshData = detectTags();
    window.dispatchEvent(new CustomEvent('gtm_ga4_assistant_result', { detail: freshData }));
  });
})();
