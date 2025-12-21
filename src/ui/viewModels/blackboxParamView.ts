export type DisplayRow = {
  label: string;
  value: string;
  rawKey?: string;
  rawValue?: string;
};

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
  // blackbox often uses 0..1000 for 0..100.0%
  if (n == null) return undefined;
  return `${(n / 10).toFixed(1)}%`;
}

function fmtPctSignedFromTenth(n: number | undefined): string | undefined {
  if (n == null) return undefined;
  return `${(n / 10).toFixed(1)}%`;
}

function fmtSemitonesBestEffort(n: number | undefined): string | undefined {
  // We don't have confirmed scaling for pitch in your XML.
  // Best effort: if magnitude looks like "cents-ish" (>= 100), interpret as /100 semitones.
  // Otherwise, assume it's already semitones.
  if (n == null) return undefined;
  const semis = Math.abs(n) >= 100 ? n / 100 : n;
  return `${semis.toFixed(2)} st`;
}

function launchModeFromSamTrigType(v: string | undefined): string | undefined {
  if (!v) return undefined;
  // Best-effort mapping. If your real presets contradict this, we’ll adjust.
  // Common patterns:
  // 0: Trigger, 1: Gate, 2: Toggle
  if (v === "0") return "Trigger";
  if (v === "1") return "Gate";
  if (v === "2") return "Toggle";
  return `Unknown (${v})`;
}

function outputFromBus(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  // Best-effort: 0..2 => Out 1..3 (stereo). Higher values we show raw.
  if (n >= 0 && n <= 2) return `Out ${n + 1}`;
  return `Bus ${v}`;
}

function polyModeFromValue(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  // Best-effort placeholder; adjust once confirmed from device/presets.
  if (n === 0) return "Mono";
  return `Poly (${v})`;
}

function exclGroupFromChoke(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n === 0) return "Excl X";
  // Blackbox shows Excl A-D etc; we don't know the exact mapping here.
  return `Excl (${v})`;
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
 * Convert raw XML params into Blackbox-like rows for the inspector.
 * This is UI-facing view-model logic (pure), NOT domain logic.
 */
export function buildBlackboxMainRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Level", params, "gaindb", fmtDbFromThousandths(num(params, "gaindb"))),
    maybeRow("Pitch", params, "pitch", fmtSemitonesBestEffort(num(params, "pitch"))),
    // Filter cutoff: dualfilcutoff appears to be -1000..1000 => -100.0..+100.0%
    maybeRow("Filter", params, "dualfilcutoff", fmtPctSignedFromTenth(num(params, "dualfilcutoff"))),
    // Resonance: res looks like 0..1000 => 0..100.0% (your example had res=500)
    maybeRow("Resonance", params, "res", fmtPctFromTenth(num(params, "res"))),
    // ADSR: envattack/decay/sus/rel look like 0..1000
    maybeRow("Attack", params, "envattack", fmtPctFromTenth(num(params, "envattack"))),
    maybeRow("Decay", params, "envdecay", fmtPctFromTenth(num(params, "envdecay"))),
    maybeRow("Sustain", params, "envsus", fmtPctFromTenth(num(params, "envsus"))),
    maybeRow("Release", params, "envrel", fmtPctFromTenth(num(params, "envrel"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}

export function buildBlackboxConfRows(params: Record<string, string>): DisplayRow[] {
  const rows: Array<DisplayRow | null> = [
    maybeRow("Launch Mode", params, "samtrigtype", launchModeFromSamTrigType(get(params, "samtrigtype"))),
    maybeRow("Output", params, "outputbus", outputFromBus(get(params, "outputbus"))),
    maybeRow("Pan", params, "panpos", fmtPctSignedFromTenth(num(params, "panpos"))),
    maybeRow("Poly Mode", params, "polymode", polyModeFromValue(get(params, "polymode"))),
    maybeRow("Excl Group", params, "chokegrp", exclGroupFromChoke(get(params, "chokegrp"))),
  ];

  return rows.filter((r): r is DisplayRow => r != null);
}
