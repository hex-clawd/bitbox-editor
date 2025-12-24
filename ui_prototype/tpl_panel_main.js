(function () {
  window.UI_TEMPLATES = window.UI_TEMPLATES || {};
  window.UI_TEMPLATES['tpl-panel-main'] = `
    <section class="block">
      <h2 class="block-title">Main Params</h2>
      <div class="block-knobs">
        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Level knob"></button>
          <div class="knob-label">Level</div>
          <div class="knob-value mono">+0.0dB</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Pitch knob"></button>
          <div class="knob-label">Pitch</div>
          <div class="knob-value mono">50</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Filter knob"></button>
          <div class="knob-label">Filter</div>
          <div class="knob-value mono">50</div>
        </div>

        <div class="knob" data-knob>
          <button class="knob-ring inset" type="button" aria-label="Res knob"></button>
          <div class="knob-label">Res</div>
          <div class="knob-value mono">50</div>
        </div>

        <!-- Pan: -100.0% .. +100.0% -->
        <div class="knob" data-knob>
          <button
            class="knob-ring inset"
            type="button"
            aria-label="Pan knob"
            data-min="-100"
            data-max="100"
            data-decimals="1"
            data-unit="%"
            data-default="0"
          ></button>
          <div class="knob-label">Pan</div>
          <div class="knob-value mono">+0.0%</div>
        </div>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Config</h2>
      <div class="kv-grid">
        <div class="kv inset">
          <div class="k">Launch Mode</div>
          <div class="v">
            <select aria-label="Launch Mode" class="select">
              <option>Trigger</option>
              <option>Gate</option>
              <option selected>Toggle</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Output</div>
          <div class="v">
            <select aria-label="Output" class="select">
              <option selected>Out 1</option>
              <option>Out 2</option>
              <option>Out 3</option>
              <option>Out 4</option>
              <option>Out 5</option>
              <option>Out 6</option>
              <option>Out1/2</option>
              <option>Out3/4</option>
              <option>Out5/6</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Poly Mode</div>
          <div class="v">
            <select aria-label="Poly Mode" class="select">
              <option>Mono</option>
              <option>Poly 2</option>
              <option>Poly 4</option>
              <option>Poly 6</option>
              <option>Poly 8</option>
              <option selected>Poly X</option>
            </select>
          </div>
        </div>

        <div class="kv inset">
          <div class="k">Excl Group</div>
          <div class="v">
            <select aria-label="Excl Group" class="select">
              <option>Excl X</option>
              <option selected>Excl A</option>
              <option>Excl B</option>
              <option>Excl C</option>
              <option>Excl D</option>
            </select>
          </div>
        </div>

        <div class="kv inset"><div class="k">Midi In</div><div class="v">Ch 8</div></div>
        <div class="kv inset"><div class="k">Pad Note</div><div class="v">Default</div></div>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Misc</h2>
      <div class="kv-grid">
        <div class="kv inset"><div class="k">Loop Mode</div><div class="v">On</div></div>
        <div class="kv inset"><div class="k">Beat Count</div><div class="v">16</div></div>
        <div class="kv inset"><div class="k">Quant Size</div><div class="v">1 bar</div></div>
        <div class="kv inset"><div class="k">Sync</div><div class="v">1/8</div></div>
      </div>
    </section>
  `;
})();
