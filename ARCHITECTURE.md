# BitBox Editor — Architecture & Project Documentation

This document describes the **bitbox-editor** project structure and its two sub-projects.

---

## Overview

**bitbox-editor** is a desktop application for viewing and editing [1010music Blackbox](https://1010music.com/blackbox) preset files (`.xml`). The Blackbox is a hardware sampler/sequencer, and its presets store pad configurations, sample mappings, envelopes, LFO settings, and more in XML format.

### Current State

| Feature | Status |
|---------|--------|
| **Reading** `.xml` presets | ✅ Working |
| **Parsing** pad data, assets, slices | ✅ Working |
| **Displaying** parameters | ✅ Working |
| **Writing** changes back to XML | ❌ Not implemented |
| **Audio preview** | ❌ Not implemented |

**The editor is READ-ONLY.** It can open and display presets but cannot save modifications yet.

---

## Project Structure

```
bitbox-editor/
├── src/                    # Main Tauri+React app (the actual editor)
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── core/
│   │   ├── domain/         # Domain models
│   │   └── xml/            # XML parsing (and future serialization)
│   ├── services/           # Tauri integration (fs, dialog)
│   ├── controllers/        # State management logic
│   └── ui/
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       └── viewModels/     # Parameter display logic
│
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/
│   │   └── lib.rs          # Minimal Tauri setup
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── ui_prototype/           # Standalone UI mockup (separate project)
│   ├── index.html
│   ├── styles*.css
│   ├── tpl_*.js            # Template definitions
│   └── ui*.js              # UI logic
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Sub-Project 1: Main Editor (`src/` + `src-tauri/`)

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Tauri 2 (Rust)
- **Desktop framework**: Tauri (native macOS/Windows/Linux app)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React UI                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │TopToolbar│  │PresetDetails │  │  PadInspector      │     │
│  └──────────┘  └──────────────┘  │  (sections...)     │     │
│                                   └────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                     Hooks & State                            │
│  usePresetBrowser() — folder selection, file loading         │
├─────────────────────────────────────────────────────────────┤
│                     Core Logic                               │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ bitboxPresetParser   │  │ blackboxParamView (display) │  │
│  │ (XML → domain model) │  │ (params → user-friendly)    │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐                                   │
│  │bitboxPresetSerializer│  ← EMPTY (write not implemented) │
│  └──────────────────────┘                                   │
├─────────────────────────────────────────────────────────────┤
│                   Tauri Services                             │
│  tauriFs (file read)  │  tauriDialog (folder picker)        │
├─────────────────────────────────────────────────────────────┤
│                      Rust Backend                            │
│  Minimal — just provides file system access via plugins      │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

#### Domain Models (`src/core/domain/`)

**`bitboxPreset.ts`** — Core data structures:
- `BitboxPreset`: Top-level preset (name, pads, sample refs, warnings)
- `Pad`: Single pad with grid position, mode, filename, params, MIDI settings
- `PadMode`: "sample" | "multisample" | "slicer" | "granular"
- `AssetRef`: Linked assets (for multisamples)
- `SampleRef`: Discovered file references

**`presetEdit.ts`** — Mutation helpers (in-memory only):
- `ensurePadAt()` — Creates an empty pad at grid position

#### XML Handling (`src/core/xml/`)

**`bitboxPresetParser.ts`** — The main parser:
- Parses `<document><session><cell>` structure
- Extracts pads, params, slices, assets
- Links assets to pads via `asssrcrow`/`asssrccol`
- Derives pad mode from params
- Returns `ParseResult` with preset + warnings

**`bitboxPresetSerializer.ts`** — **EMPTY FILE**
- Placeholder for future XML writing capability
- Not implemented

#### Services (`src/services/`)

**`tauriFs.ts`** — File system wrapper using `@tauri-apps/plugin-fs`
- `readFile(path)` — Reads file as UTF-8 text

**`tauriDialog.ts`** — Dialog wrapper using `@tauri-apps/plugin-dialog`
- `pickFolder()` — Opens native folder picker

#### Controllers (`src/controllers/`)

**`PresetBrowserController.ts`** — Business logic for preset browsing:
- Scans folder for `.xml` files
- Filters to likely Blackbox presets
- Manages selection state

#### UI Layer (`src/ui/`)

**Hooks:**
- `usePresetBrowser.ts` — React hook wrapping PresetBrowserController

**View Models:**
- `blackboxParamView.ts` — Transforms raw params to display format:
  - `buildBlackboxMainRows()` — Level, Pitch, Filter, etc.
  - `buildBlackboxEnvRows()` — ADSR
  - `buildBlackboxLfoRows()` — LFO settings
  - `buildBlackboxConfRows()` — Launch mode, MIDI, etc.
  - Handles unit conversions (thousandths → dB, tenths → %)

**Components (`src/ui/components/`):**

| Component | Purpose |
|-----------|---------|
| `TopToolbar` | Folder picker, preset dropdown, XML preview button |
| `PresetDetails` | Pad grid display with clickable pads |
| `PadInspector` | Selected pad's detailed view |
| `StatusBar` | Errors and warnings display |
| `XmlPreviewModal` | Raw XML viewer (debug) |

**Pad Inspector Sections (`src/ui/components/padInspector/`):**
- `PadInspectorHeader` — Pad name, mode indicator
- `PadMainParamsSection` — Level, Pitch, Filter, Pan
- `PadConfParamsSection` — Launch mode, MIDI, Output
- `PadEnvSection` — ADSR envelope
- `PadLfoSection` — LFO parameters
- `PadGranSection` — Granular synthesis params
- `PadPosSection` — Loop/position settings
- `PadSlicesSection` — Slice markers display
- `PadMultisampleMappingSection` — Asset/keyzone display
- `PadRawParamsSection` — Debug view of all params

#### Rust Backend (`src-tauri/`)

**Minimal implementation** — Tauri handles file access:

```rust
// lib.rs — Just plugin registration
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Plugins used:
- `tauri-plugin-dialog` — Native folder picker
- `tauri-plugin-fs` — File system read/write
- `tauri-plugin-opener` — Open files externally

### Running the Editor

```bash
# Development
npm run tauri:dev

# Production build
npm run tauri:build
```

---

## Sub-Project 2: UI Prototype (`ui_prototype/`)

### Purpose

A **standalone, static HTML/CSS/JS** mockup of the editor UI. Used for:
- Rapid UI/UX iteration without Tauri rebuild cycles
- Visual design exploration
- Testing layout and interaction patterns

**No functionality** — purely visual. Does not read actual preset files.

### Tech Stack

- Pure HTML5, CSS3, vanilla JavaScript
- No build step, no bundler
- Works with `file://` protocol (double-click to open)
- Template-based UI composition

### Architecture

```
ui_prototype/
├── index.html              # Main entry point
├── styles.css              # Master CSS import
├── styles_*.css            # Modular stylesheets
│   ├── styles_vars.css     # CSS variables
│   ├── styles_base.css     # Base styles
│   ├── styles_layout.css   # Layout system
│   ├── styles_controls.css # Form controls
│   ├── styles_knobs.css    # Rotary knob styling
│   └── styles_waveform.css # Waveform display
│
├── tpl_*.js                # Template definitions
│   ├── tpl_toolbar.js
│   ├── tpl_waveform.js
│   ├── tpl_pad_details.js
│   ├── tpl_pads.js
│   ├── tpl_panel_main.js
│   └── tpl_panel_mod.js
│
├── ui.js                   # Template engine & boot
├── ui_*.js                 # UI components
│   ├── ui_knobs.js         # Rotary knob interaction
│   ├── ui_env_graph.js     # ADSR visualization
│   ├── ui_brackets.js      # Visual brackets
│   ├── ui_pad_type.js      # Pad mode selection
│   ├── ui_pads_select.js   # Pad grid selection
│   └── ui_partials.js      # Partial loading
│
└── partial_*.html          # HTML partials (not used w/ templates)
```

### Template System

Templates are defined in `tpl_*.js` files and registered on `window.UI_TEMPLATES`:

```javascript
// tpl_toolbar.js
window.UI_TEMPLATES = window.UI_TEMPLATES || {};
window.UI_TEMPLATES['tpl-toolbar'] = `
  <div class="toolbar-content">...</div>
`;
```

Used in HTML via `data-tpl` attribute:

```html
<header data-tpl="tpl-toolbar"></header>
```

The `ui.js` boot process replaces all `[data-tpl]` elements with their template HTML.

### Running the Prototype

Simply open `ui_prototype/index.html` in a browser:
```bash
open ui_prototype/index.html
# or just double-click the file
```

There's also a Tauri config for running it as a desktop app:
```bash
npm run tauri:proto
```

---

## Blackbox Preset XML Format

### Structure Overview

```xml
<document name="PresetName">
  <session>
    <!-- Pad cells (type="sample") -->
    <cell row="0" column="0" type="sample" filename="Kick.wav">
      <params 
        gaindb="0" 
        pitch="0" 
        cellmode="0"
        envattack="0" 
        envdecay="500" 
        envsus="1000" 
        envrel="100"
        midimode="1"
        padnote="36"
        ... />
      <slices>
        <slice pos="0" />
        <slice pos="44100" />
      </slices>
    </cell>
    
    <!-- Asset cells (for multisamples) -->
    <cell type="asset" filename="C3.wav">
      <params 
        asssrcrow="0" 
        asssrccol="0"
        rootnote="60"
        keyrangebottom="0"
        keyrangetop="127"
        ... />
    </cell>
  </session>
</document>
```

### Key Param Mappings

| XML Param | Display Name | Conversion |
|-----------|--------------|------------|
| `gaindb` | Level | /1000 → dB |
| `pitch` | Pitch | /100 → semitones |
| `dualfilcutoff` | Filter | /10 → % |
| `res` | Resonance | /10 → % |
| `panpos` | Pan | /10 → % |
| `envattack` | Attack | /10 → % |
| `envdecay` | Decay | /10 → % |
| `envsus` | Sustain | /10 → % |
| `envrel` | Release | /10 → % |
| `samtrigtype` | Launch Mode | 0=Trigger, 1=Gate, 2=Toggle |
| `midimode` | MIDI In | 0=None, 1-16=Ch1-16 |
| `padnote` | Pad Note | 0-127 (MIDI note) |
| `cellmode` | Pad Mode | 0=Sample, 2=Slicer, 3=Granular |
| `multisammode` | Multisample | 0=Off, 1=On |

---

## Development Notes

### Adding Write Support (Future)

To implement saving:

1. **Implement `bitboxPresetSerializer.ts`**:
   - Convert `BitboxPreset` back to XML
   - Preserve original XML structure where possible
   - Handle all param conversions in reverse

2. **Add save command** in Tauri backend or use `tauri-plugin-fs` write

3. **Add UI** for save button and dirty state tracking

### Known Limitations

- **Read-only**: Cannot save changes
- **No audio**: Cannot preview samples
- **No waveform**: Waveform display is mockup only
- **Desktop only**: No web version (Tauri-only)

### Preset Compatibility

Tested with Blackbox firmware presets. May not work with:
- Very old firmware versions
- Third-party preset formats
- Corrupted or hand-edited XML

---

## License

See repository root for license information.
