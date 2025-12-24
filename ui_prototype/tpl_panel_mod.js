(function () {
  window.UI_TEMPLATES = window.UI_TEMPLATES || {};

  const waveOptions = [
    'Saw', 'Reverse Saw', 'Triangle', 'Positive Triangle',
    'Sine', 'Positive Sine', 'Square', 'Positive Square', 'Random'
  ].map(v => `<option${v === 'Saw' ? ' selected' : ''}>${v}</option>`).join('');

  const beatSyncValues = [
    '8','4','2','1','1/2','1/2T','1/4','1/4T','1/8','1/8T',
    '1/16','1/16T','1/32','1/32T','1/64'
  ];
  const beatSyncOptions = beatSyncValues
    .map(v => `<option${v === '1/16' ? ' selected' : ''}>${v}</option>`)
    .join('');

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
        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Attack knob"
            data-min="0" data-max="100" data-decimals="1" data-unit="%"
            data-default="0" data-scale="log"></button>
          <div class="knob-label">Attack</div>
          <div class="knob-value mono">0.0%</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Decay knob"
            data-min="0" data-max="100" data-decimals="1" data-unit="%"
            data-default="0" data-scale="log"></button>
          <div class="knob-label">Decay</div>
          <div class="knob-value mono">0.0%</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Sustain knob"
            data-min="0" data-max="100" data-decimals="1" data-unit="%"
            data-default="100"></button>
          <div class="knob-label">Sustain</div>
          <div class="knob-value mono">100.0%</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Release knob"
            data-min="0" data-max="100" data-decimals="0" data-unit="%"
            data-default="0" data-scale="log"></button>
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
        <div class="param inset">
          <div class="param-name">Waveform</div>
          <div class="param-value">
            <select aria-label="LFO Waveform" class="select">
              ${waveOptions}
            </select>
          </div>
        </div>

        <!-- Use compact horizontal faders for "secondary" controls -->
        <div class="param inset">
          <div class="param-name">Rate</div>
          <div class="param-value">
            <div class="fader-row" data-fader-row>
              <input
                class="fader"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value="50"
                aria-label="LFO Rate"
                data-fader
                data-decimals="1"
                data-unit="%"
              />
              <span class="fader-value mono" data-fader-value>50.0%</span>
            </div>
          </div>
        </div>

        <div class="param inset">
          <div class="param-name">Beat Sync</div>
          <div class="param-value">
            <select aria-label="LFO Beat Sync" class="select">
              ${beatSyncOptions}
            </select>
            <span class="unit-suffix mono">bars</span>
          </div>
        </div>

        <div class="param inset">
          <div class="param-name">Depth</div>
          <div class="param-value">
            <div class="fader-row" data-fader-row>
              <input
                class="fader"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value="0"
                aria-label="LFO Depth"
                data-fader
                data-decimals="1"
                data-unit="%"
              />
              <span class="fader-value mono" data-fader-value>0.0%</span>
            </div>
          </div>
        </div>

        <div class="param inset">
          <div class="param-name">Beat</div>
          <div class="param-value">
            <label class="check" aria-label="LFO Beat">
              <input type="checkbox" checked />
              <span>On</span>
            </label>
          </div>
        </div>

        <div class="param inset">
          <div class="param-name">Trig</div>
          <div class="param-value">
            <label class="check" aria-label="LFO Trig">
              <input type="checkbox" />
              <span>On</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  `;
})();
