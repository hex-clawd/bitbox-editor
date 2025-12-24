(function () {
  function clamp01(v) {
    v = Number(v);
    if (!isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 100) return 100;
    return v;
  }

  function readKnobValueFromButton(btn) {
    if (!btn) return NaN;

    // Preferred: dataset value set by knob logic.
    if (btn.dataset && btn.dataset.value != null && btn.dataset.value !== '') {
      const n = parseFloat(btn.dataset.value);
      if (isFinite(n)) return n;
    }

    // Common ARIA pattern.
    const ariaNow = btn.getAttribute('aria-valuenow');
    if (ariaNow != null) {
      const n = parseFloat(ariaNow);
      if (isFinite(n)) return n;
    }

    // Fallback: text label next to it.
    const wrap = btn.closest('.knob');
    if (wrap) {
      const label = wrap.querySelector('.knob-value');
      if (label) {
        const n = parseFloat(String(label.textContent || '').replace(',', '.'));
        if (isFinite(n)) return n;
      }
    }

    return NaN;
  }

  function findEnvelopeBlock() {
    // The Envelope section lives in tpl-panel-mod.
    // Find it by heading text to avoid relying on extra attributes.
    const blocks = document.querySelectorAll('.block');
    for (const b of blocks) {
      const h = b.querySelector('.block-title');
      if (!h) continue;
      const t = (h.textContent || '').trim();
      if (t === 'Envelope (ADSR)') return b;
    }
    return null;
  }

  function computePoints(a, d, s, r) {
    // Widths: A/D/R are proportional to their %, sustain segment width is always "100%".
    const A = clamp01(a);
    const D = clamp01(d);
    const R = clamp01(r);
    const S_LEN = 100;

    const total = (A + D + S_LEN + R) || 1;

    const x0 = 0;
    const x1 = 100 * (A / total);
    const x2 = x1 + 100 * (D / total);
    const x3 = x2 + 100 * (S_LEN / total);
    const x4 = 100;

    const yBottom = 38;
    const yTop = 6;

    const S = clamp01(s);
    const yS = yBottom - (S / 100) * (yBottom - yTop);

    // Points: start -> peak -> decay -> sustain -> release end.
    return [
      `${x0.toFixed(2)},${yBottom.toFixed(2)}`,
      `${x1.toFixed(2)},${yTop.toFixed(2)}`,
      `${x2.toFixed(2)},${yS.toFixed(2)}`,
      `${x3.toFixed(2)},${yS.toFixed(2)}`,
      `${x4.toFixed(2)},${yBottom.toFixed(2)}`
    ].join(' ');
  }

  function updateEnvelopeGraph(block) {
    if (!block) return;

    const svg = block.querySelector('.block-graph svg');
    if (!svg) return;

    const poly = svg.querySelector('polyline');
    if (!poly) return;

    const knobs = block.querySelectorAll('.block-knobs .knob');
    if (knobs.length < 4) return;

    // Order in template: Attack, Decay, Sustain, Release
    const aBtn = knobs[0].querySelector('.knob-ring');
    const dBtn = knobs[1].querySelector('.knob-ring');
    const sBtn = knobs[2].querySelector('.knob-ring');
    const rBtn = knobs[3].querySelector('.knob-ring');

    const a = readKnobValueFromButton(aBtn);
    const d = readKnobValueFromButton(dBtn);
    const s = readKnobValueFromButton(sBtn);
    const r = readKnobValueFromButton(rBtn);

    const pts = computePoints(a, d, s, r);

    if (poly.getAttribute('points') !== pts) {
      poly.setAttribute('points', pts);
    }
  }

  let lastKey = '';
  function tick() {
    const block = findEnvelopeBlock();
    if (!block) {
      requestAnimationFrame(tick);
      return;
    }

    // Lightweight change detection so we don't write attributes every frame.
    const knobs = block.querySelectorAll('.block-knobs .knob .knob-ring');
    if (knobs.length >= 4) {
      const a = readKnobValueFromButton(knobs[0]);
      const d = readKnobValueFromButton(knobs[1]);
      const s = readKnobValueFromButton(knobs[2]);
      const r = readKnobValueFromButton(knobs[3]);
      const key = `${a}|${d}|${s}|${r}`;
      if (key !== lastKey) {
        lastKey = key;
        updateEnvelopeGraph(block);
      }
    }

    requestAnimationFrame(tick);
  }

  // Kick off after DOM is ready (templates render quickly, but safe).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick, { once: true });
  } else {
    tick();
  }
})();
