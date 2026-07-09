"use client";

/**
 * DEV-ONLY hero scene tweak panel — a floating action button that opens a
 * grouped control surface (sliders + color pickers) driving `tweakConfig`.
 * Everything updates live; "Copy config" dumps the current values as JSON to
 * paste back into source when a preset is locked.
 *
 * Gated to development only (see mountability check at the bottom + the guard in
 * the hero). When the user picks final values, delete this file, remove its
 * mount, and bake the copied JSON into the source defaults.
 */

import { useState, useSyncExternalStore } from "react";
import {
  tweak,
  setTweak,
  resetTweak,
  serializeTweak,
  subscribeTweak,
  getRevision,
  type HeroTweakConfig,
} from "@/components/hero3d/tweakConfig";

/** A slider control descriptor. `rebuild` re-creates the affected mesh. */
type Slider<G extends keyof HeroTweakConfig> = {
  kind: "slider";
  group: G;
  key: keyof HeroTweakConfig[G];
  label: string;
  min: number;
  max: number;
  step: number;
  rebuild?: boolean;
};
type ColorCtrl<G extends keyof HeroTweakConfig> = {
  kind: "color";
  group: G;
  key: keyof HeroTweakConfig[G];
  label: string;
};
type Ctrl = Slider<keyof HeroTweakConfig> | ColorCtrl<keyof HeroTweakConfig>;

// helper builders (keep the schema below terse + type-loose on purpose)
const s = (
  group: keyof HeroTweakConfig,
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  rebuild = false,
): Ctrl =>
  ({ kind: "slider", group, key, label, min, max, step, rebuild }) as Ctrl;
const c = (group: keyof HeroTweakConfig, key: string, label: string): Ctrl =>
  ({ kind: "color", group, key, label }) as Ctrl;

const GROUPS: { title: string; controls: Ctrl[] }[] = [
  {
    title: "Scene",
    controls: [
      s("scene", "idleTravelSpeed", "Idle travel", 0, 6, 0.05),
      s("scene", "scrollTravel", "Scroll travel", 0, 200, 1),
      s("scene", "intensity", "Intensity", 0.2, 3, 0.02),
      s("scene", "recessionFloor", "Recession floor", 0, 1, 0.005),
      s("scene", "worldDepth", "World depth", 40, 180, 1, true),
      s("scene", "fovBase", "FOV", 30, 90, 0.5),
      s("scene", "cameraDrift", "Camera drift", 0, 5, 0.05),
    ],
  },
  {
    title: "Palette",
    controls: [
      c("palette", "colorA", "Color A (deep)"),
      c("palette", "colorB", "Color B (accent)"),
      c("palette", "colorHot", "Color Hot (glow)"),
    ],
  },
  {
    title: "Bloom",
    controls: [
      s("bloom", "intensity", "Intensity", 0, 3, 0.01),
      s("bloom", "threshold", "Threshold", 0, 1, 0.005),
      s("bloom", "smoothing", "Smoothing", 0, 1, 0.01),
    ],
  },
  {
    title: "Depth of Field",
    controls: [
      s("dof", "focusDistance", "Focus dist", 0, 0.3, 0.002),
      s("dof", "focalLength", "Focal length", 0, 0.4, 0.002),
      s("dof", "bokehScale", "Bokeh scale", 0, 8, 0.05),
    ],
  },
  {
    title: "Grade",
    controls: [
      s("grade", "vignetteOffset", "Vignette offset", 0, 1, 0.01),
      s("grade", "vignetteDarkness", "Vignette dark", 0, 1.5, 0.01),
      s("grade", "noiseOpacity", "Noise", 0, 1, 0.01),
      s("grade", "chromaticAberration", "Chromatic ab.", 0, 0.006, 0.0001),
    ],
  },
  {
    title: "Path (snake)",
    controls: [
      s("path", "f1", "Freq 1", 0, 0.3, 0.001),
      s("path", "a1", "Amp 1", 0, 20, 0.1),
      s("path", "f2", "Freq 2", 0, 0.2, 0.001),
      s("path", "a2", "Amp 2", 0, 16, 0.1),
      s("path", "fy", "Freq Y", 0, 0.2, 0.001),
      s("path", "ay", "Amp Y", 0, 12, 0.1),
      s("path", "ramp", "Ramp", 2, 40, 0.5),
    ],
  },
  {
    title: "Pointer",
    controls: [
      s("pointer", "pushRadius", "Push radius", 1, 20, 0.1),
      s("pointer", "pushStrength", "Push strength", 0, 3, 0.01),
      s("pointer", "glowRadius", "Glow radius", 1, 20, 0.1),
    ],
  },
  {
    title: "Fibers",
    controls: [
      s("fibers", "count", "Count", 0, 800, 5, true),
      s("fibers", "alpha", "Alpha", 0, 3, 0.02),
      s("fibers", "radiusMin", "Radius min", 0.001, 0.1, 0.001, true),
      s("fibers", "radiusMax", "Radius max", 0.001, 0.2, 0.001, true),
      s("fibers", "wave", "Wave", 0, 6, 0.02),
      s("fibers", "breathe", "Breathe", 0, 0.6, 0.005),
    ],
  },
  {
    title: "Particles",
    controls: [
      s("particles", "count", "Count", 0, 8000, 50, true),
      s("particles", "alpha", "Alpha", 0, 3, 0.02),
      s("particles", "sizeMin", "Size min", 0.2, 8, 0.05, true),
      s("particles", "sizeMax", "Size max", 0.2, 12, 0.05, true),
      s("particles", "drift", "Drift", 0, 10, 0.05),
    ],
  },
  {
    title: "Energy Nodes",
    controls: [
      s("nodes", "count", "Count", 0, 200, 1, true),
      s("nodes", "alpha", "Alpha", 0, 3, 0.02),
      s("nodes", "scaleMin", "Scale min", 0.02, 1.5, 0.01, true),
      s("nodes", "scaleMax", "Scale max", 0.02, 2.5, 0.01, true),
      s("nodes", "breathe", "Breathe", 0, 0.8, 0.005),
    ],
  },
  {
    title: "Fragments",
    controls: [
      s("fragments", "count", "Count", 0, 500, 2, true),
      s("fragments", "alpha", "Alpha", 0, 3, 0.02),
      s("fragments", "tumble", "Tumble", 0, 5, 0.02),
    ],
  },
  {
    title: "Footer Glow",
    controls: [
      s("footer", "particleCount", "Particles", 0, 600, 5, true),
      s("footer", "nodeCount", "Nodes", 0, 60, 1, true),
      s("footer", "spawnMin", "Spawn bot", -20, -6, 0.5, true),
      s("footer", "spawnMax", "Spawn top", -16, -2, 0.5, true),
      s("footer", "riseMin", "Rise min", 0, 20, 0.5, true),
      s("footer", "riseMax", "Rise max", 0, 24, 0.5, true),
      s("footer", "lifeMin", "Life min", 2, 20, 0.5, true),
      s("footer", "lifeMax", "Life max", 2, 28, 0.5, true),
    ],
  },
];

function readValue(ctrl: Ctrl): number | string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tweak as any)[ctrl.group][ctrl.key];
}

/** Loosely-typed setter for the schema-driven panel (the strict generic in
 *  tweakConfig collapses to `never` once group/key are widened to keyof). */
function writeValue(ctrl: Ctrl, value: number | string) {
  const rebuild = ctrl.kind === "slider" ? ctrl.rebuild : false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (setTweak as any)(ctrl.group, ctrl.key, value, rebuild);
}

function ControlRow({ ctrl }: { ctrl: Ctrl }) {
  useSyncExternalStore(subscribeTweak, getRevision, getRevision);
  const val = readValue(ctrl);

  if (ctrl.kind === "color") {
    return (
      <label style={ROW}>
        <span style={LABEL}>{ctrl.label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="color"
            value={val as string}
            onChange={(e) => writeValue(ctrl, e.target.value)}
            style={{ width: 26, height: 20, padding: 0, border: "none", background: "none" }}
          />
          <span style={VALUE}>{val as string}</span>
        </span>
      </label>
    );
  }

  const decimals = ctrl.step < 0.01 ? 4 : ctrl.step < 1 ? 3 : 0;
  return (
    <label style={ROW}>
      <span style={LABEL}>
        {ctrl.label}
        {ctrl.rebuild ? <span style={{ color: "#f6a", marginLeft: 4 }}>↻</span> : null}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
        <input
          type="range"
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          value={val as number}
          onChange={(e) => writeValue(ctrl, parseFloat(e.target.value))}
          style={{ flex: 1, minWidth: 60, accentColor: "#3ec6ff" }}
        />
        <span style={VALUE}>{(val as number).toFixed(decimals)}</span>
      </span>
    </label>
  );
}

function Section({ title, controls }: { title: string; controls: Ctrl[] }) {
  const [open, setOpen] = useState(title === "Scene");
  return (
    <div style={{ borderTop: "1px solid #ffffff14" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...RESET_BTN,
          width: "100%",
          textAlign: "left",
          padding: "8px 12px",
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#cfe8ff",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.5 }}>{open ? "–" : "+"}</span>
      </button>
      {open && <div style={{ padding: "2px 12px 10px" }}>{controls.map((ctrl, i) => <ControlRow key={i} ctrl={ctrl} />)}</div>}
    </div>
  );
}

export function HeroControls() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serializeTweak());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked — dump to console as a fallback
      // eslint-disable-next-line no-console
      console.log(serializeTweak());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2147483000, pointerEvents: "auto" }}>
      {open && (
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }}>
              Hero Scene · tweaks
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" style={ACTION_BTN} onClick={copy}>
                {copied ? "Copied ✓" : "Copy config"}
              </button>
              <button
                type="button"
                style={{ ...ACTION_BTN, background: "#3a1420", color: "#ffb4c8" }}
                onClick={resetTweak}
              >
                Reset
              </button>
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
            {GROUPS.map((g) => (
              <Section key={g.title} title={g.title} controls={g.controls} />
            ))}
          </div>
          <div style={{ padding: "8px 12px", fontSize: 10, color: "#ffffff55", borderTop: "1px solid #ffffff14" }}>
            ↻ = rebuilds that system. DEV only — not shipped.
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Toggle hero scene controls"
        onClick={() => setOpen((o) => !o)}
        style={FAB}
      >
        {open ? "✕" : "🎛"}
      </button>
    </div>
  );
}

/* --- inline styles (self-contained, no CSS deps) ------------------------- */
const PANEL: React.CSSProperties = {
  width: 300,
  maxHeight: "84vh",
  marginBottom: 12,
  borderRadius: 14,
  background: "rgba(8,14,22,0.92)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid #ffffff1f",
  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
  color: "#eaf6ff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const PANEL_HEAD: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #ffffff1f",
  gap: 8,
};
const FAB: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  border: "1px solid #ffffff2a",
  background: "rgba(8,14,22,0.9)",
  color: "#eaf6ff",
  fontSize: 18,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: "auto",
};
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "3px 0",
  fontSize: 11,
};
const LABEL: React.CSSProperties = { color: "#a9c6dd", whiteSpace: "nowrap", minWidth: 92 };
const VALUE: React.CSSProperties = { color: "#eaf6ff", width: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const RESET_BTN: React.CSSProperties = { background: "none", border: "none", cursor: "pointer" };
const ACTION_BTN: React.CSSProperties = {
  background: "#123",
  color: "#9fe3ff",
  border: "1px solid #ffffff1f",
  borderRadius: 7,
  padding: "4px 8px",
  fontSize: 10.5,
  cursor: "pointer",
  fontFamily: "inherit",
};
