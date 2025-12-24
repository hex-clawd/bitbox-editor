(function () {
  window.UI_TEMPLATES = window.UI_TEMPLATES || {};

  const midiInOptions =
    ['None']
      .concat(Array.from({ length: 16 }, (_, i) => `Ch${i + 1}`))
      .map(v => `<option${v === 'Ch8' ? ' selected' : ''}>${v}</option>`)
      .join('');

  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function midiToNoteName(n){
    const name = NOTE_NAMES[n % 12];
    const octave = Math.floor(n / 12) - 1;
    return `${name}${octave}`;
  }
  const padNoteOptions =
    ['<option selected>Default</option>']
      .concat(
        Array.from({ length: 127 }, (_, idx) => {
          const n = idx + 1;
          return `<option>${midiToNoteName(n)}</option>`;
        })
      )
      .join('');

  window.UI_TEMPLATES['tpl-panel-main'] = `
    <section class="block">
      <h2 class="block-title">Main Params</h2>
      <div class="block-knobs">
        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button"
            data-min="-96" data-max="12" data-decimals="1" data-unit="dB" data-default="0"></button>
          <div class="knob-label">Level</div>
          <div class="knob-value mono">+0.0dB</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button"
            data-min="-24" data-max="24" data-decimals="1" data-unit="st" data-default="0"></button>
          <div class="knob-label">Pitch</div>
          <div class="knob-value mono">+0.0st</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button"
            data-min="-100" data-max="100" data-decimals="1" data-unit="%" data-default="0"></button>
          <div class="knob-label">Filter</div>
          <div class="knob-value mono">+0.0%</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button"
            data-min="0" data-max="100" data-decimals="1" data-unit="%" data-default="0"></button>
          <div class="knob-label">Resonance</div>
          <div class="knob-value mono">0.0%</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button"
            data-min="-100" data-max="100" data-decimals="1" data-unit="%" data-default="0"></button>
          <div class="knob-label">Pan</div>
          <div class="knob-value mono">+0.0%</div>
        </div>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Config</h2>
      <div class="kv-grid">
        <div class="kv inset"><div class="k">Launch Mode</div><div class="v">
          <select class="select"><option>Trigger</option><option>Gate</option><option selected>Toggle</option></select>
        </div></div>

        <div class="kv inset"><div class="k">Output</div><div class="v">
          <select class="select">
            <option selected>Out 1</option><option>Out 2</option><option>Out 3</option>
            <option>Out 4</option><option>Out 5</option><option>Out 6</option>
            <option>Out1/2</option><option>Out3/4</option><option>Out5/6</option>
          </select>
        </div></div>

        <div class="kv inset"><div class="k">Poly Mode</div><div class="v">
          <select class="select">
            <option>Mono</option><option>Poly 2</option><option>Poly 4</option>
            <option>Poly 6</option><option>Poly 8</option><option selected>Poly X</option>
          </select>
        </div></div>

        <div class="kv inset"><div class="k">Excl Group</div><div class="v">
          <select class="select">
            <option>Excl X</option><option selected>Excl A</option>
            <option>Excl B</option><option>Excl C</option><option>Excl D</option>
          </select>
        </div></div>

        <div class="kv inset"><div class="k">MIDI In</div><div class="v">
          <select class="select">${midiInOptions}</select>
        </div></div>

        <div class="kv inset"><div class="k">Pad Note</div><div class="v">
          <select class="select">${padNoteOptions}</select>
        </div></div>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Misc</h2>
      <div class="kv-grid">
        <div class="kv inset">
          <div class="k">Loop Mode</div>
          <div class="v">
            <select class="select">
              <option>None</option>
              <option selected>Forward</option>
              <option>Bidirect</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Loop Fade</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Loop Fade" />
            </div>
          </div>
        </div>

        <!-- checkbox sits directly in the row (no .v wrapper) -->
        <div class="kv inset kv--check">
          <div class="k">Reverse</div>
          <label class="check" aria-label="Reverse"><input type="checkbox" /></label>
        </div>

        <div class="kv inset"><div class="k">Beat Count</div><div class="v">16</div></div>
        <div class="kv inset"><div class="k">Quant Size</div><div class="v">1 bar</div></div>
        <div class="kv inset"><div class="k">Sync</div><div class="v">1/8</div></div>
      </div>
    </section>
  `;
})();
