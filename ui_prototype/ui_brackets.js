/* Bracket handle dragging for Sample/Loop start/end
   - Drag the top "triangle area" (hitbox is bigger than triangle)
   - Updates CSS vars: --sample-start, --sample-end, --loop-start, --loop-end
   file:// safe, no modules, no fetch */
(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pxToPct(px, rect) {
    if (!rect || rect.width <= 0) return 0;
    return (px - rect.left) / rect.width * 100;
  }

  function getDetailEl() {
    return document.querySelector('[data-wf-detail]') || document.querySelector('.wf-detail');
  }

  function getVar(detailEl, name, fallbackPct) {
    var v = getComputedStyle(detailEl).getPropertyValue(name).trim();
    if (!v) return fallbackPct;
    if (v.endsWith('%')) return parseFloat(v);
    if (v.endsWith('px')) {
      var rect = detailEl.getBoundingClientRect();
      return (parseFloat(v) / rect.width) * 100;
    }
    var num = parseFloat(v);
    return isFinite(num) ? num : fallbackPct;
  }

  function setVar(detailEl, name, pct) {
    detailEl.style.setProperty(name, pct.toFixed(2) + '%');
  }

  function setBracketEdge(detailEl, which, side, pct) {
    // which: 'sample' | 'loop'
    var startName = which === 'loop' ? '--loop-start' : '--sample-start';
    var endName   = which === 'loop' ? '--loop-end'   : '--sample-end';

    var start = getVar(detailEl, startName, which === 'loop' ? 30 : 20);
    var end   = getVar(detailEl, endName,   which === 'loop' ? 70 : 80);

    // Keep a small minimum width so it can't invert/collapse
    var minGap = 0.5; // percent
    if (side === 'start') start = clamp(pct, 0, end - minGap);
    else end = clamp(pct, start + minGap, 100);

    setVar(detailEl, startName, start);
    setVar(detailEl, endName, end);
  }

  var dragging = null;

  function onPointerDown(e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('bracket-handle')) return;

    var detailEl = getDetailEl();
    if (!detailEl) return;

    var which = (t.getAttribute('data-bracket') || '').toLowerCase();
    var side  = (t.getAttribute('data-side') || '').toLowerCase();
    if (!which || (side !== 'start' && side !== 'end')) return;

    dragging = { detailEl: detailEl, which: which, side: side };
    try { t.setPointerCapture(e.pointerId); } catch (_) {}

    e.preventDefault();
    e.stopPropagation();

    // Apply immediately on down
    var rect = detailEl.getBoundingClientRect();
    var pct = clamp(pxToPct(e.clientX, rect), 0, 100);
    setBracketEdge(detailEl, which, side, pct);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    var detailEl = dragging.detailEl;
    var rect = detailEl.getBoundingClientRect();
    var pct = clamp(pxToPct(e.clientX, rect), 0, 100);
    setBracketEdge(detailEl, dragging.which, dragging.side, pct);
    e.preventDefault();
  }

  function onPointerUp() {
    dragging = null;
  }

  function boot() {
    if (document.__bracketDragBound) return;
    document.__bracketDragBound = true;

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
