/* =========================================================
   Knobs (file:// safe, no imports):
   - Vertical drag: up = more, down = less
   - Per-knob ranges/units via .knob-ring data-*
   - Optional log scale for feel (data-scale="log")
   ========================================================= */

(function () {
  const ROT_MIN = 15;
  const ROT_MAX = 345;
  const ROT_RANGE = ROT_MAX - ROT_MIN;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  function setRotation(knobEl, norm){
    const rot = ROT_MIN + clamp(norm, 0, 1) * ROT_RANGE;
    knobEl.style.setProperty('--knob-rot', rot + 'deg');
  }

  function getLabelText(knobEl){
    const el = knobEl.querySelector('.knob-label');
    return (el?.textContent || '').trim();
  }

  function getValueEl(knobEl){
    return knobEl.querySelector('.knob-value');
  }

  function readNumberAttr(el, name){
    if (!el) return null;
    const raw = el.getAttribute(name);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function knobCfgFromRing(ring){
    const min = readNumberAttr(ring, 'data-min');
    const max = readNumberAttr(ring, 'data-max');
    const decimals = readNumberAttr(ring, 'data-decimals');
    const def = readNumberAttr(ring, 'data-default');
    const unit = ring?.getAttribute('data-unit') || '';
    const scale = (ring?.getAttribute('data-scale') || '').toLowerCase();

    if (min == null || max == null || max === min) return null;

    return {
      min,
      max,
      decimals: (decimals == null ? 0 : decimals),
      unit,
      defaultValue: def,
      scale: (scale === 'log' ? 'log' : 'linear')
    };
  }

  function applyScale(norm, scale){
    norm = clamp(norm, 0, 1);
    if (scale !== 'log') return norm;

    // "log feel" without requiring min>0:
    // bias toward low values using an exponential curve.
    // (This is perceptually close to log for time-ish params.)
    const k = 4.0; // stronger = more compressed near 0
    return (Math.exp(k * norm) - 1) / (Math.exp(k) - 1);
  }

  function formatValue(value, cfg){
    const p = Math.pow(10, cfg.decimals);
    const rounded = Math.round(value * p) / p;
    const fixed = rounded.toFixed(cfg.decimals);

    // show + sign when range crosses 0 (e.g. -24..+24, -100..+100)
    const needsSign = (cfg.min < 0 && cfg.max > 0);
    const sign = (needsSign && rounded > 0) ? '+' : '';
    return `${sign}${fixed}${cfg.unit}`;
  }

  function render(knobEl, norm){
    knobEl.dataset.norm = String(norm);
    setRotation(knobEl, norm);

    const valueEl = getValueEl(knobEl);
    if (!valueEl) return;

    const ring = knobEl.querySelector('.knob-ring');
    const cfg = knobCfgFromRing(ring);

    if (!cfg) {
      valueEl.textContent = String(Math.round(lerp(0, 100, norm)));
      return;
    }

    // scaled norm for feel (log)
    const t = applyScale(norm, cfg.scale);
    const v = lerp(cfg.min, cfg.max, t);

    valueEl.textContent = formatValue(v, cfg);
  }

  function initKnob(knobEl){
    const ring = knobEl.querySelector('.knob-ring');
    if (!ring) return;

    const cfg = knobCfgFromRing(ring);

    let norm = 0.5;

    if (cfg && cfg.defaultValue != null) {
      norm = clamp((cfg.defaultValue - cfg.min) / (cfg.max - cfg.min), 0, 1);
    }

    render(knobEl, norm);

    let dragging = false;
    let startY = 0;
    let startNorm = 0;

    function onMove(e){
      if (!dragging) return;
      const dy = e.clientY - startY;
      const delta = -dy / 180; // up = more
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

  window.initKnobs = function initKnobs(root = document){
    root.querySelectorAll('.knob[data-knob]').forEach(initKnob);
  };
})();
