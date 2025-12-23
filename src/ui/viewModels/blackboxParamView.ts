export type DisplayRow = {
  label: string;
  value: string;
  rawKey?: string;
  rawValue?: string;
};

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function get(params: Record<string, string>, key: string): string | undefined {
  const v = params[key];
  if (v == null) return undefined;
  const t = String(v).trim();
  return t.length ? t : undefined;
}

function num(params: Record<string, string>, key: string): number | undefined {
  const v = get(params, key);
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function fmtDbFromThousandths(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  return `${(n / 1000).toFixed(1)} dB`;
}

function fmtPctFromTenth(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  return `${(n / 10).toFixed(1)}%`;
}

function fmtPctSignedFromTenth(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  return `${(n / 10).toFixed(1)}%`;
}

function fmtInt(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  return `${Math.trunc(n)}`;
}

function fmtSemitonesBestEffort(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  const semis = Math.abs(n) >= 100 ? n / 100 : n;
  return `${semis.toFixed(2)} st`;
}

function launchModeFromSamTrigType(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (v === "0") return "Trigger";
  if (v === "1") return "Gate";
  if (v === "2") return "Toggle";
  return `Unknown (${v})`;
}

function outputFromBus(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n >= 0 && n <= 2) return `Out ${n + 1}`;
  return `Bus ${v}`;
}

function polyModeFromValue(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n === 0) return "Mono";
  return `Poly (${v})`;
}

function exclGroupFromChoke(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n === 0) return "Excl X";
  return `Excl (${v})`;
}

function midiInLabelFromMidimode(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  const ch = clampInt(n, 0, 16);
  return ch === 0 ? "None" : `Ch${ch}`;
}

function padNoteLabelFromPadnote(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  const nn = clampInt(n, 0, 127);
  return nn === 0 ? "0 (C-1 / Default)" : `${nn}`;
}

function bool01(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  if (v === "0") return "Off";
  if (v === "1") return "On";
  return `Unknown (${v})`;
}

function lfoWaveLabel(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (v === "0") return "Sine";
  if (v === "1") return "Triangle";
  if (v === "2") return "Saw";
  if (v === "3") return "Square";
  if (v === "4") return "Random";
  return `Unknown (${v})`;
}

function loopModeLabel(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return `Mode (${v})`;
}

function quantSizeLabel(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return `Size (${v})`;
}

function syncTypeLabel(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return `Type (${v})`;
}

function maybeRow(
  label: string,
  params: Record<string, string>,
  rawKey: string,
  displayValue: string | undefined
): DisplayRow | null {
  if (displayValue == null) return null;
  return {
    label,
    value: displayValue,
    rawKey,
    rawValue: get(params, rawKey),
  };
}

/**
 * View-model builders (pure).
 * These map raw XML params to display rows. No UI here.
 */

export function buildBlackboxMainRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Level", params, "gaindb", fmtDbFromThousandths(num(params, "gaindb"))),
    maybeRow("Pitch", params, "pitch", fmtSemitonesBestEffort(num(params, "pitch"))),
    maybeRow("Filter", params, "dualfilcutoff", fmtPctSignedFromTenth(num(params, "dualfilcutoff"))),
    maybeRow("Resonance", params, "res", fmtPctFromTenth(num(params, "res"))),

    // ✅ moved here from Conf
    maybeRow("Pan", params, "panpos", fmtPctSignedFromTenth(num(params, "panpos"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxEnvRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Attack", params, "envattack", fmtPctFromTenth(num(params, "envattack"))),
    maybeRow("Decay", params, "envdecay", fmtPctFromTenth(num(params, "envdecay"))),
    maybeRow("Sustain", params, "envsus", fmtPctFromTenth(num(params, "envsus"))),
    maybeRow("Release", params, "envrel", fmtPctFromTenth(num(params, "envrel"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxLfoRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Wave", params, "lfowave", lfoWaveLabel(get(params, "lfowave"))),
    maybeRow("Rate", params, "lforate", fmtInt(num(params, "lforate"))),
    maybeRow("Amount", params, "lfoamount", fmtPctFromTenth(num(params, "lfoamount"))),
    maybeRow("Key Trig", params, "lfokeytrig", bool01(get(params, "lfokeytrig"))),
    maybeRow("Beat Sync", params, "lfobeatsync", bool01(get(params, "lfobeatsync"))),
    maybeRow("Rate Sync", params, "lforatebeatsync", fmtInt(num(params, "lforatebeatsync"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxPosRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Beat Count", params, "beatcount", fmtInt(num(params, "beatcount"))),
    maybeRow("Loop Mode", params, "loopmode", loopModeLabel(get(params, "loopmode"))),
    maybeRow("Quant Size", params, "quantsize", quantSizeLabel(get(params, "quantsize"))),
    maybeRow("Sync Type", params, "synctype", syncTypeLabel(get(params, "synctype"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxConfRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Launch Mode", params, "samtrigtype", launchModeFromSamTrigType(get(params, "samtrigtype"))),
    maybeRow("Output", params, "outputbus", outputFromBus(get(params, "outputbus"))),
    // ❌ Pan removed from here
    maybeRow("Poly Mode", params, "polymode", polyModeFromValue(get(params, "polymode"))),
    maybeRow("Excl Group", params, "chokegrp", exclGroupFromChoke(get(params, "chokegrp"))),
    maybeRow("MIDI In", params, "midimode", midiInLabelFromMidimode(get(params, "midimode"))),
    maybeRow("Pad Note", params, "padnote", padNoteLabelFromPadnote(get(params, "padnote"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxGranRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Grain Size", params, "grainsizeperc", fmtPctFromTenth(num(params, "grainsizeperc"))),
    maybeRow("Scatter", params, "grainscat", fmtPctFromTenth(num(params, "grainscat"))),
    maybeRow("Pan Rand", params, "grainpanrnd", fmtPctFromTenth(num(params, "grainpanrnd"))),
    maybeRow("Density", params, "graindensity", fmtPctFromTenth(num(params, "graindensity"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}
