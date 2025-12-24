/**
 * Boot (file:// safe):
 * - Templates are registered on window.UI_TEMPLATES by tpl_*.js files.
 * - Any element with [data-tpl="id"] gets replaced with that template HTML.
 * - Supports nesting (tpl-pad-details contains tpl-pads + panels etc).
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

  function boot() {
    applyTemplates(document);

    // Optional: init knobs if present
    if (typeof window.initKnobs === 'function') {
      window.initKnobs(document);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
