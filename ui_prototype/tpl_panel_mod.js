(function () {
  window.UI_TEMPLATES = window.UI_TEMPLATES || {};
  window.UI_TEMPLATES['tpl-panel-mod'] = `
    <section class="block">
      <h2 class="block-title">Envelope (ADSR)</h2>
      <div class="block-graph inset" aria-hidden="true">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline points="0,38 18,6 38,22 62,22 92,38"
            fill="none" stroke="currentColor" stroke-width="0.75"/>
        </svg>
      </div>

      <div class="block-knobs block-knobs--4">
        <!-- Attack: 0.0..100.0% (log) -->
        <div class="knob" data-knob>
          <button
            class="knob-ring inset"
            type="button"
            aria-label="Attack knob"
            data-min="0"
            data-max="100"
            data-decimals="1"
            data-unit="%"
            data-default="0"
            data-scale="log"
          ></button>
          <div class="knob-label">Attack</div>
          <div class="knob-value mono">0.0%</div>
        </div>

        <!-- Decay: 0.0..100.0% (log) -->
        <div class="knob" data-knob>
          <button
            class="knob-ring inset"
            type="button"
            aria-label="Decay knob"
            data-min="0"
            data-max="100"
            data-decimals="1"
            data-unit="%"
            data-default="0"
            data-scale="log"
          ></button>
          <div class="knob-label">Decay</div>
          <div class="knob-value mono">0.0%</div>
        </div>

        <!-- Sustain: 0.0..100.0% (linear) -->
        <div class="knob" data-knob>
          <button
            class="knob-ring inset"
            type="button"
            aria-label="Sustain knob"
            data-min="0"
            data-max="100"
            data-decimals="1"
            data-unit="%"
            data-default="100"
          ></button>
          <div class="knob-label">Sustain</div>
          <div class="knob-value mono">100.0%</div>
        </div>

        <!-- Release: 0..100% (log, integer) -->
        <div class="knob" data-knob>
          <button
            class="knob-ring inset"
            type="button"
            aria-label="Release knob"
            data-min="0"
            data-max="100"
            data-decimals="0"
            data-unit="%"
            data-default="0"
            data-scale="log"
          ></button>
          <div class="knob-label">Release</div>
          <div class="knob-value mono">0%</div>
        </div>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">LFO</h2>
      <div class="block-graph inset" aria-hidden="true">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline points="0,30 50,8 50,30 100,8"
            fill="none" stroke="currentColor" stroke-width="0.75"/>
        </svg>
      </div>

      <div class="param-grid">
        <div class="param inset"><div class="param-name">Wave</div><div class="param-value">Saw</div></div>
        <div class="param inset"><div class="param-name">Rate</div><div class="param-value">—</div></div>
        <div class="param inset"><div class="param-name">Amount</div><div class="param-value">—</div></div>
        <div class="param inset"><div class="param-name">Beat Sync</div><div class="param-value">On</div></div>
        <div class="param inset"><div class="param-name">Rate Sync</div><div class="param-value">1/16</div></div>
      </div>
    </section>
  `;
})();
