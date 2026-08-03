import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The link-preview card — a restaging of the home hero.
 *
 * The hero itself is a WebGL tunnel, so it cannot be rendered here (Satori draws
 * CSS, not shaders). This rebuilds the same composition instead: the near-black
 * canvas, the tunnel's warm signal-orange nodes blooming out of the depth, a
 * cool drift behind them, and the same centred Tanker lockup the phrases use —
 * so a shared link and the page it opens read as the same object.
 *
 * ⚠️ Tanker ships as WOFF2 and Satori CANNOT read WOFF2 (ttf/otf/woff only).
 * With no font passed it silently falls back to a generic sans and the card
 * stops looking like the site at all. `Tanker-Regular.ttf` is a committed
 * conversion — see scripts/brand-icons.py for how to regenerate it.
 *
 * ⚠️ Satori has no `filter: blur()`. Every glow here is a radial-gradient, soft
 * by construction — don't reach for a blur, it will silently no-op.
 *
 * ⚠️ Satori ignores the `inset` shorthand. `inset: 0` on the lockup left it with
 * no resolved size, so it collapsed to its content and sat in the top-left
 * instead of centring. Write left/top/right/bottom out in full.
 *
 * ⚠️ EVERY GLOW IS A FULL-BLEED BOX, sized to the whole card, with the bloom
 * placed by percentage and given an explicit pixel radius. The obvious approach
 * — a small absolutely-positioned box per glow — produced visible straight
 * edges where the boxes were clipped, and the ones hanging off the canvas on
 * negative offsets were worst. With the box always exactly the card, there is no
 * edge that can show. Verified against a three-variant probe render: percentage
 * stops, explicit `circle <px>` radius, and a sized box all draw clean, so the
 * gradient was never the problem — the box geometry was.
 */

export const alt =
  "Riddhiman Deb — Product—Design Builder. AI-native product designer who ships code and design.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hero palette: globals.css `.hero-dark`, plus the works tunnel's node colour.
const CANVAS = "#06080c";
const SIGNAL = "255, 141, 59"; // the orange the energy nodes travel in
const EMBER = "245, 200, 66"; // the hotter core of a node
const DRIFT = "96, 165, 250"; // .hero-dark --color-accent, electric blue

/**
 * A soft radial bloom — Satori's stand-in for the shader's glow.
 * `cx`/`cy` are percentages of the card; `r` is the bloom radius in px.
 */
function Glow({
  cx,
  cy,
  r,
  rgb,
  o,
}: {
  cx: number;
  cy: number;
  r: number;
  rgb: string;
  o: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size.width,
        height: size.height,
        backgroundImage: `radial-gradient(circle ${r}px at ${cx}% ${cy}%, rgba(${rgb}, ${o}) 0%, rgba(${rgb}, ${o * 0.45}) 32%, rgba(${rgb}, ${o * 0.14}) 58%, rgba(${rgb}, 0) 100%)`,
      }}
    />
  );
}

/** One of the tunnel's little square motes. */
function Mote({
  x,
  y,
  s,
  rgb,
  o,
  r = 0,
}: {
  x: number;
  y: number;
  s: number;
  rgb: string;
  o: number;
  r?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: s,
        height: s,
        borderRadius: s * 0.28,
        background: `rgba(${rgb}, ${o})`,
        transform: `rotate(${r}deg)`,
      }}
    />
  );
}

export default async function OpengraphImage() {
  // process.cwd() is the Next.js project directory (per the metadata docs).
  const tanker = await readFile(
    join(process.cwd(), "src/app/fonts/Tanker-Regular.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: CANVAS,
          overflow: "hidden",
        }}
      >
        {/* depth — warm nodes coming toward the lens, cool drift behind them.
            Kept to the edges: the middle stays dark so the type holds up. */}
        <Glow cx={9} cy={12} r={520} rgb={DRIFT} o={0.30} />
        <Glow cx={87} cy={6} r={640} rgb={SIGNAL} o={0.40} />
        <Glow cx={97} cy={44} r={430} rgb={EMBER} o={0.42} />
        <Glow cx={4} cy={90} r={540} rgb={SIGNAL} o={0.26} />
        <Glow cx={72} cy={98} r={560} rgb={DRIFT} o={0.14} />

        {/* the tunnel's debris — kept off-centre so the type stays clean */}
        <Mote x={126} y={92} s={30} rgb={SIGNAL} o={0.5} r={16} />
        <Mote x={1042} y={128} s={44} rgb={EMBER} o={0.62} r={-12} />
        <Mote x={78} y={470} s={22} rgb={DRIFT} o={0.45} r={24} />
        <Mote x={1112} y={452} s={26} rgb={SIGNAL} o={0.42} r={8} />
        {/* clear of the name's baseline — sitting just past the B it read as a
            stray full stop on the end of "DEB". */}
        <Mote x={1006} y={212} s={15} rgb={EMBER} o={0.5} r={0} />
        <Mote x={214} y={528} s={14} rgb={SIGNAL} o={0.32} r={-20} />
        <Mote x={606} y={64} s={13} rgb={DRIFT} o={0.3} r={10} />

        {/* the lockup — centred, exactly like the hero phrases */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: "0.28em",
              color: `rgba(${SIGNAL}, 1)`,
              fontFamily: "Tanker",
            }}
          >
            AI-NATIVE PRODUCT DESIGNER
          </div>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1,
              color: "#ffffff",
              fontFamily: "Tanker",
              marginTop: 30,
            }}
          >
            RIDDHIMAN DEB
          </div>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.66)",
              fontFamily: "Tanker",
              marginTop: 22,
            }}
          >
            PRODUCT—DESIGN BUILDER
          </div>
        </div>

        {/* domain + one-liner, on the site's hairline rhythm */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: "0.18em",
            color: "rgba(255, 255, 255, 0.55)",
            fontFamily: "Tanker",
          }}
        >
          <div style={{ display: "flex" }}>RUDYMAN.COM</div>
          <div style={{ display: "flex" }}>SHIPS CODE AND DESIGN</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Tanker", data: tanker, weight: 400, style: "normal" }],
    },
  );
}
