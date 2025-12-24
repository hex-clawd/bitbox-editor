/**
 * Boot (file:// safe):
 * - Templates are registered on window.UI_TEMPLATES by tpl_*.js files.
 * - Any element with [data-tpl="id"] gets replaced with that template HTML.
 * - Supports nesting.
 */
(function () {
  function T() {
    window.UI_TEMPLATES = window.UI_TEMPLATES || {};
    return window.UI_TEMPLATES;
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function applyTemplatesOnce(root) {
    const templates = T();
    const nodes = Array.from(root.querySelectorAll('[data-tpl]'));

    for (const host of nodes) {
      const id = host.getAttribute('data-tpl');
      const html = templates[id];

      if (typeof html !== 'string') {
        host.innerHTML = `
          <div class="inset" style="padding:10px 12px;background:rgba(255,255,255,0.04);white-space:pre-wrap">
            ${escapeHtml('Missing template: ' + id + '\nDid you include the right tpl_*.js file in index.html?')}
          </div>
        `;
        host.removeAttribute('data-tpl');
        continue;
      }

      host.innerHTML = html;
      host.removeAttribute('data-tpl');
    }

    return nodes.length;
  }

  function applyTemplates(root) {
    for (let i = 0; i < 25; i++) {
      const n = applyTemplatesOnce(root);
      if (n === 0) break;
    }
  }

  function initFaders(root){
    // Only faders with an output element need JS updates.
    // (Loop Fade intentionally has no value display.)
    const faders = Array.from(root.querySelectorAll('input[type="range"][data-fader]'));
    for (const f of faders) {
      const row = f.closest('[data-fader-row]') || f.parentElement;
      const out = row ? row.querySelector('[data-fader-value]') : null;
      if (!out) continue;

      const decimals = Number(f.getAttribute('data-decimals') || '0');
      const unit = f.getAttribute('data-unit') || '';

      function format(v){
        const n = Number(v);
        if (!Number.isFinite(n)) return String(v);
        const p = Math.pow(10, decimals);
        const rounded = Math.round(n * p) / p;
        return `${rounded.toFixed(decimals)}${unit}`;
      }

      function sync(){
        out.textContent = format(f.value);
      }

      f.addEventListener('input', sync);
      sync();
    }
  }

  function boot() {
    applyTemplates(document);

    if (typeof window.initKnobs === 'function') {
      window.initKnobs(document);
    }

    initFaders(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
