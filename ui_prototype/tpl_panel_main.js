(function () {
  window.UI_TEMPLATES = window.UI_TEMPLATES || {};

  // ---- MIDI In options: None, Ch1..Ch16
  const midiInOptions =
    ['None']
      .concat(Array.from({ length: 16 }, (_, i) => `Ch${i + 1}`))
      .map(v => `<option${v === 'Ch8' ? ' selected' : ''}>${v}</option>`)
      .join('');

  // ---- Note options: None, C#-1 .. G9 (MIDI 1..127)
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function midiToNoteName(n){
    const name = NOTE_NAMES[n % 12];
    const octave = Math.floor(n / 12) - 1;
    return `${name}${octave}`;
  }
  const noteOptions =
    ['<option selected>None</option>']
      .concat(
        Array.from({ length: 127 }, (_, idx) => {
          const n = idx + 1;
          return `<option>${midiToNoteName(n)}</option>`;
        })
      )
      .join('');

  // ---- Pad Note options: Default, C#-1 .. G9
  const padNoteOptions =
    ['<option selected>Default</option>']
      .concat(
        Array.from({ length: 127 }, (_, idx) => {
          const n = idx + 1;
          return `<option>${midiToNoteName(n)}</option>`;
        })
      )
      .join('');

  // Placeholder max for "number of samples" fields (prototype-only)
  const SAMPLES_MAX = 1000000;

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

    <!-- ===================== SPECIFIC: SAMPLE ===================== -->
    <section class="block" data-specific-section data-mode="Sample">
      <h2 class="block-title">Specific — Sample</h2>
      <div class="kv-grid">
        <div class="kv inset">
          <div class="k">Loop Mode</div>
          <div class="v">
            <select class="select" aria-label="Loop Mode (Sample)">
              <option selected>None</option>
              <option>Forward</option>
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

        <div class="kv inset">
          <div class="k">Interp</div>
          <div class="v">
            <select class="select" aria-label="Interp (Sample)">
              <option selected>Normal</option>
              <option>High Q</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Root Note</div>
          <div class="v">
            <select class="select" aria-label="Root Note (Sample)">${noteOptions}</select>
          </div>
        </div>

        <div class="kv inset kv--check">
          <div class="k">Reverse</div>
          <label class="check" aria-label="Reverse (Sample)"><input type="checkbox" /></label>
        </div>

        <div class="kv inset">
          <div class="k">Start</div>
          <div class="v">
            <input class="num" type="number" min="0" max="${SAMPLES_MAX}" step="1" value="0" aria-label="Start (samples)" />
            <span class="unit-suffix mono">samples</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Length</div>
          <div class="v">
            <input class="num" type="number" min="0" max="${SAMPLES_MAX}" step="1" value="0" aria-label="Length (samples)" />
            <span class="unit-suffix mono">samples</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Loop Start</div>
          <div class="v">
            <input class="num" type="number" min="0" max="${SAMPLES_MAX}" step="1" value="0" aria-label="Loop Start (samples)" />
            <span class="unit-suffix mono">samples</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Loop End</div>
          <div class="v">
            <input class="num" type="number" min="0" max="${SAMPLES_MAX}" step="1" value="0" aria-label="Loop End (samples)" />
            <span class="unit-suffix mono">samples</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== SPECIFIC: MULTISAMPLE ===================== -->
    <section class="block" data-specific-section data-mode="Multisample" hidden>
      <h2 class="block-title">Specific — Multisample</h2>
      <div class="kv-grid">
        <div class="kv inset">
          <div class="k">Interp</div>
          <div class="v">
            <select class="select" aria-label="Interp (Multisample)">
              <option selected>Normal</option>
              <option>High Q</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== SPECIFIC: CLIP ===================== -->
    <section class="block" data-specific-section data-mode="Clip" hidden>
      <h2 class="block-title">Specific — Clip</h2>
      <div class="kv-grid">
        <div class="kv inset kv--check">
          <div class="k">Loop Mode</div>
          <label class="check" aria-label="Loop Mode (Clip)"><input type="checkbox" /></label>
        </div>

        <div class="kv inset">
          <div class="k">Beat Count</div>
          <div class="v">
            <input class="num" type="number" min="0" max="512" step="1" value="0" aria-label="Beat Count (0 = Auto)" />
            <span class="unit-suffix mono">beats</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Quant Size</div>
          <div class="v">
            <select class="select" aria-label="Quant Size (Clip)">
              <option selected>None</option>
              <option>1/16</option>
              <option>1/8</option>
              <option>1/4</option>
              <option>1/2</option>
              <option>1 bar</option>
              <option>2 bars</option>
              <option>4 bars</option>
              <option>8 bars</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Sync</div>
          <div class="v">
            <select class="select" aria-label="Sync (Clip)">
              <option selected>None</option>
              <option>1/16</option>
              <option>1/8</option>
              <option>1/4</option>
              <option>1/2</option>
              <option>1 bar</option>
              <option>Slice</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== SPECIFIC: SLICER ===================== -->
    <section class="block" data-specific-section data-mode="Slicer" hidden>
      <h2 class="block-title">Specific — Slicer</h2>
      <div class="kv-grid">
        <div class="kv inset kv--check">
          <div class="k">Loop Mode</div>
          <label class="check" aria-label="Loop Mode (Slicer)"><input type="checkbox" /></label>
        </div>

        <div class="kv inset kv--check">
          <div class="k">PlayThru</div>
          <label class="check" aria-label="PlayThru (Slicer)"><input type="checkbox" /></label>
        </div>

        <div class="kv inset">
          <div class="k">Beat Count</div>
          <div class="v">
            <input class="num" type="number" min="0" max="512" step="1" value="0" aria-label="Beat Count (0 = Auto)" />
            <span class="unit-suffix mono">beats</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Quant Size</div>
          <div class="v">
            <select class="select" aria-label="Quant Size (Slicer)">
              <option selected>None</option>
              <option>1/64</option>
              <option>1/32T</option>
              <option>1/32</option>
              <option>1/16T</option>
              <option>1/16</option>
              <option>1/8T</option>
              <option>1/8</option>
              <option>1/4T</option>
              <option>1/4</option>
              <option>1/2T</option>
              <option>1/2</option>
              <option>1 bar</option>
              <option>2 bars</option>
            </select>
          </div>
        </div>

        <div class="kv inset kv--check">
          <div class="k">Sync</div>
          <label class="check" aria-label="Sync (Slicer)"><input type="checkbox" /></label>
        </div>

        <div class="kv inset">
          <div class="k">Slice</div>
          <div class="v">
            <input class="num" type="number" min="1" max="64" step="1" value="1" aria-label="Slice (slices)" />
            <span class="unit-suffix mono">slices</span>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Slice Seq</div>
          <div class="v">
            <select class="select" aria-label="Slice Seq">
              <option selected>None</option>
              <option>Forward</option>
              <option>Backwards</option>
              <option>Random</option>
              <option>Stagger</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== SPECIFIC: GRANULAR ===================== -->
    <section class="block" data-specific-section data-mode="Granular" hidden>
      <h2 class="block-title">Specific — Granular</h2>
      <div class="kv-grid">
        <div class="kv inset">
          <div class="k">Density</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Density" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Grain Size</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Grain Size" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Window</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Window" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Scatter</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Scatter" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Pan Rnd</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="100" step="1" value="0" aria-label="Pan Rnd" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Speed</div>
          <div class="v">
            <div class="fader-row fader-row--noval">
              <input class="fader" type="range" min="0" max="200" step="1" value="100" aria-label="Speed" />
            </div>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Root Note</div>
          <div class="v">
            <select class="select" aria-label="Root Note (Granular)">${noteOptions}</select>
          </div>
        </div>
      </div>
    </section>
  `;
})();
