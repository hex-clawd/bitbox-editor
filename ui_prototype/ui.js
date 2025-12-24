/* =========================================================
   Knobs: vertical drag (up = more), per-control display spec
   Default Level = 0.0dB
   ========================================================= */

(() => {
  const ROT_MIN = 15;
  const ROT_MAX = 345;
  const ROT_RANGE = ROT_MAX - ROT_MIN;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  const LEVEL_DEFAULT_NORM = 96 / 108; // 0dB

  function getRing(knobEl){
    return knobEl.querySelector('.knob-ring');
  }

  function getLabelText(knobEl){
    const el = knobEl.querySelector('.knob-label');
    return (el?.textContent || '').trim();
  }

  function getValueEl(knobEl){
    return knobEl.querySelector('.knob-value');
  }

  function setRotation(knobEl, norm){
    const rot = ROT_MIN + clamp(norm, 0, 1) * ROT_RANGE;
    knobEl.style.setProperty('--knob-rot', rot + 'deg');
  }

  function formatDb(v){
    const r = Math.round(v * 10) / 10;
    const sign = r > 0 ? '+' : '';
    return `${sign}${r.toFixed(1)}dB`;
  }

  function computeNormFromRing(ring){
    const v = Number(ring?.dataset.value);
    const min = Number(ring?.dataset.min);
    const max = Number(ring?.dataset.max);

    if (
      Number.isFinite(v) &&
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      max !== min
    ){
      return clamp((v - min) / (max - min), 0, 1);
    }
    return null;
  }

  function render(knobEl, norm){
    knobEl.dataset.norm = String(norm);
    setRotation(knobEl, norm);

    const label = getLabelText(knobEl);
    const valueEl = getValueEl(knobEl);
    if (!valueEl) return;

    if (label === 'Level') {
      valueEl.textContent = formatDb(lerp(-96, 12, norm));
      return;
    }

    valueEl.textContent = String(Math.round(lerp(0, 100, norm)));
  }

  function initKnob(knobEl){
    const ring = getRing(knobEl);
    if (!ring) return;

    const label = getLabelText(knobEl);

    let norm = computeNormFromRing(ring);

    // 🔹 force sane default for Level
    if (label === 'Level' && norm === null) {
      norm = LEVEL_DEFAULT_NORM;
    }

    if (norm === null) norm = 0.5;

    render(knobEl, norm);

    let dragging = false;
    let startY = 0;
    let startNorm = 0;

    function onMove(e){
      if (!dragging) return;
      const dy = e.clientY - startY;
      const delta = -dy / 180;
      render(knobEl, clamp(startNorm + delta, 0, 1));
    }

    function onUp(){
      if (!dragging) return;
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      knobEl.classList.remove('is-dragging');
    }

    ring.addEventListener('pointerdown', e => {
      dragging = true;
      startY = e.clientY;
      startNorm = Number(knobEl.dataset.norm ?? norm) || norm;
      knobEl.classList.add('is-dragging');

      window.addEventListener('pointermove', onMove, { passive:true });
      window.addEventListener('pointerup', onUp, { passive:true });
      e.preventDefault();
    });

    ring.addEventListener('wheel', e => {
      e.preventDefault();
      const step = e.shiftKey ? 0.005 : 0.02;
      const cur = Number(knobEl.dataset.norm ?? norm) || norm;
      render(knobEl, clamp(cur - Math.sign(e.deltaY) * step, 0, 1));
    }, { passive:false });
  }

  function boot(){
    document.querySelectorAll('.knob[data-knob]').forEach(initKnob);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
