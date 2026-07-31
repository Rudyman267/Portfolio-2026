/**
 * ORO asset pipeline — source PNGs → dark-mode webp in public/case-study/oro.
 *
 * WHY THIS EXISTS: the source slides were authored in LIGHT mode (white canvas,
 * near-black type) and the case study renders on a near-black canvas. Dropping
 * them in unchanged puts a 7680px sheet of white in the middle of a dark read —
 * it glares, and it breaks the page's whole atmosphere.
 *
 * ⚠️ A BLANKET INVERT IS THE WRONG TOOL. These slides mix three kinds of pixel:
 *   1. UI chrome + type  — SHOULD flip (black-on-white → white-on-black)
 *   2. Product photography (gold jewellery, people, offices) — must NOT flip;
 *      inverting turns gold into blue and skin into a negative
 *   3. Screenshots of the product itself — already the real UI; flipping them
 *      would misrepresent what was designed
 *
 * So each asset declares its own treatment:
 *   "invert"  — negate + re-hue: for pure diagram/type slides with no photo
 *   "dim"     — keep colours, drop the white point so it sits on dark
 *   "asis"    — untouched (photos, real product UI)
 *
 * Run:  node scripts/oro-assets.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "E:/personal projects/Portfolio/ORO Connect";
const OUT = path.join(process.cwd(), "public", "case-study", "oro");

/** width cap — these are 7680px slide exports; nothing needs more than this */
const MAX_W = 2000;

/**
 * treatment map. `to` is the published basename.
 *
 * ⚠️ PERSONA SLIDES USE "protect", NOT "invert".
 * They are type + flat cards (which must flip) around a PHOTOGRAPHIC PORTRAIT
 * (which must not). A plain invert was tried first and produced exactly what
 * you would expect — orange skin, white hair, a negative of a person sitting in
 * the middle of an otherwise correct slide. `protect` inverts the slide, then
 * composites the ORIGINAL photo region back over the result.
 *
 *  - product UI screenshots are "asis": they ARE the design; a viewer needs to
 *    see what actually shipped.
 */
const ASSETS = [
  // ── narrative / diagram slides (type-heavy → invert) ──────────────────
  { from: "Slide 16_9 - 56.png", to: "why-problem.webp", mode: "invert" },
  { from: "Slide 16_9 - 59.png", to: "solutions-summary.webp", mode: "invert" },
  // NOTE: power-interest comes from the VECTORS list below (already dark-mode);
  // the raster slide export is deliberately not used.
  { from: "Slide 16_9 - 50.png", to: "solutions-per-persona.webp", mode: "invert" },
  { from: "Slide 16_9 - 58.png", to: "who.webp", mode: "invert" },
  // IA (the FigJam board export)
  { from: "Slide 16_9 - 73.png", to: "ia-map.webp", mode: "invert" },

  // ── real product UI ───────────────────────────────────────────────────
  // ⚠️ SUPERSEDED — these came from the Framer deck: a UI screenshot pasted
  // onto a slide, complete with the slide's own caption text baked in. They are
  // replaced by direct Figma exports (see SCREENS below), which are 2x, have no
  // caption, and no deck framing. Kept here only so the mapping is legible if
  // an old build is ever compared; nothing references them any more.
  //   Slide 61 → landing / 62 → products / 63 → search-product-cards
  //   Slide 64 → cart     / 69 → reference-no / 70 → design-request

  // ── process photography (never invert) ────────────────────────────────
  { from: "Frame 25.png", to: "process-team.webp", mode: "asis" },
  { from: "Frame 26.png", to: "process-whiteboard.webp", mode: "dim" },
  { from: "Frame 27.png", to: "process-figma.webp", mode: "asis" },
];

/**
 * DIRECT FIGMA EXPORTS — the real app screens, 2x PNG, exported by the author
 * straight from the ORO design file. These REPLACE the deck screenshots above.
 *
 * The app UI is LIGHT-THEMED and stays that way: only the case study's own
 * chrome is dark. Nothing here is inverted or recoloured — a viewer needs to
 * see what actually shipped.
 *
 * Each export is a full browser mock, so two things get cropped away:
 *   `chromePx` — height of the macOS menu bar + tab strip + URL bar, expressed
 *                in rows of a 1200px-wide render (scaled to the real file).
 *   `footer`   — fraction of height where the black placeholder band marked
 *                "Footer" begins. Omit when the screen has none.
 *
 * ⚠️ chromePx is a MEASURED CONSTANT, not auto-detected. Two auto-detect
 * attempts failed: a settling-row scan ate the cart's "My Cart" heading (it
 * settled 250 rows down), and a last-bright-row scan ran away because the app
 * page itself contains pure-white rows. The chrome is the same fixed-height
 * browser mock on every frame, so a constant is both simpler and correct.
 *
 * Native-pixel profile at 3840 wide, identical across all browser exports:
 *   rows   0- 56  dark macOS menu bar (~63)
 *   rows  60-135  tab strip (~225-229)
 *   rows 140-148  URL bar highlight (255)
 *   rows 152-200  browser grey (244 → 238)
 *   row  204+     app page begins
 * Hence 204. The New-order screens are modal captures with only a thin bar.
 */
const CHROME_BASIS = 3840; // width the chromePx figures were measured at
const SCREENS = [
  // NOTE: "Home.png" (a full browser-mock export needing chrome cropped away)
  // used to feed landing.webp. Replaced below by "Hero image.png" — a clean,
  // pre-cropped Figma export of just the hero banner, no chrome to remove.
  { from: "Products Page.png", to: "products.webp", chromePx: 204, footer: 0.887 },
  { from: "Cart Ref No.png", to: "cart.webp", chromePx: 204, footer: 0.673 },
  { from: "Orders Page-Ongoing.png", to: "orders-ongoing.webp", chromePx: 204, footer: 0.578 },
  { from: "Orders Page-Completed.png", to: "orders-completed.webp", chromePx: 204, footer: 0.583 },
  { from: "New order 1.png", to: "design-request.webp", chromePx: 60 },
  { from: "New order 2.png", to: "design-request-2.webp", chromePx: 60 },
  { from: "New order 3.png", to: "design-request-3.webp", chromePx: 60 },
  { from: "Sign up.png", to: "sign-up.webp", chromePx: 204 },
  { from: "404 Page not found.png", to: "not-found.webp", chromePx: 204, footer: 0.578 },
  { from: "Oops.png", to: "error-state.webp", chromePx: 204, footer: 0.578 },
];
const SCREEN_SRC = path.join(process.cwd(), "case-study-assets", "oro-project");

/**
 * INVERT + RE-HUE.
 * `negate` alone flips hue too, so a white slide with warm accents comes back
 * blue. Rotating the hue 180° afterwards puts chromatic content back where it
 * started while keeping the luminance flip — so type goes white-on-black and a
 * gold accent stays gold-ish rather than turning cyan.
 */
const invert = (img) =>
  img
    .negate({ alpha: false })
    .modulate({ hue: 180 })
    // pull the (now near-black) background the rest of the way down so it meets
    // the page's #06080c instead of sitting at a lighter grey
    .linear(1.06, -10);

/** Keep colour, just stop it glaring against the dark canvas. */
const dim = (img) => img.modulate({ brightness: 0.82 }).linear(0.95, -6);

/**
 * Find the photographic region of a slide.
 *
 * These slides are greyscale type/cards PLUS one colour photograph, so the
 * photo is simply the saturated part. Scanning for saturation finds it without
 * hardcoding a crop box that would drift the moment a slide is re-exported or a
 * persona card is nudged. Returns null when the slide has no photo, in which
 * case the caller just inverts the whole thing.
 */
async function findPhotoRegion(srcPath) {
  const SAMPLE_W = 240; // cheap scan; we only need approximate bounds
  const { data, info } = await sharp(srcPath)
    .resize({ width: SAMPLE_W })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: ch } = info;
  let minX = w, minY = h, maxX = -1, maxY = -1, hits = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      // saturated AND not near-black/near-white → real photographic colour
      if (mx - mn > 42 && mx > 55 && mx < 250) {
        hits++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  // too few coloured pixels to be a photo (stray accent dot, logo chip)
  if (hits < w * h * 0.004 || maxX < 0) return null;

  // ⚠️ TIGHTEN THE BOX BY DENSITY, don't just take the extremes.
  // A single saturated pixel far from the photo (an accent dot, a teal arrow,
  // a coloured chip) drags min/max out and the "photo" region ends up including
  // slide background — which is how the persona slides came back with a white
  // rectangle pasted around the portrait. Keep only the rows/columns that carry
  // a real share of the coloured pixels, so the box hugs the photograph.
  const colHits = new Array(w).fill(0);
  const rowHits = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 42 && mx > 55 && mx < 250) { colHits[x]++; rowHits[y]++; }
    }
  }
  const dense = (arr, span) => {
    const peak = Math.max(...arr);
    const floor = Math.max(2, peak * 0.12); // 12% of the busiest line
    let lo = 0, hi = arr.length - 1;
    while (lo < arr.length && arr[lo] < floor) lo++;
    while (hi >= 0 && arr[hi] < floor) hi--;
    return hi > lo ? [lo, hi] : [0, span - 1];
  };
  const [cx0, cx1] = dense(colHits, w);
  const [cy0, cy1] = dense(rowHits, h);

  return {
    left: cx0 / w,
    top: cy0 / h,
    width: (cx1 - cx0 + 1) / w,
    height: (cy1 - cy0 + 1) / h,
  };
}

/**
 * Invert the slide, then paste the ORIGINAL photo back over the region that
 * held it — so type flips to white-on-black while the photograph stays a
 * photograph. Pads the detected box slightly so an anti-aliased photo edge
 * doesn't leave an inverted halo.
 */
async function protectPhoto(srcPath, outPath, targetW) {
  const region = await findPhotoRegion(srcPath);
  const base = sharp(srcPath).resize({ width: targetW, withoutEnlargement: true });
  if (!region) {
    await invert(base).webp({ quality: 82 }).toFile(outPath);
    return false;
  }

  const invertedBuf = await invert(
    sharp(srcPath).resize({ width: targetW, withoutEnlargement: true }),
  )
    .png()
    .toBuffer();
  const meta = await sharp(invertedBuf).metadata();

  const PAD = 0.004;
  const left = Math.max(0, Math.round((region.left - PAD) * meta.width));
  const top = Math.max(0, Math.round((region.top - PAD) * meta.height));
  const width = Math.min(
    meta.width - left,
    Math.round((region.width + PAD * 2) * meta.width),
  );
  const height = Math.min(
    meta.height - top,
    Math.round((region.height + PAD * 2) * meta.height),
  );

  const photo = await sharp(srcPath)
    .resize({ width: targetW, withoutEnlargement: true })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();

  await sharp(invertedBuf)
    .composite([{ input: photo, left, top }])
    .webp({ quality: 82 })
    .toFile(outPath);
  return true;
}

/** The case-study canvas colour — what a transparent asset must sit on. */
const PAGE_BG = { r: 6, g: 8, b: 12 };

/**
 * Composite a TRANSPARENT vector onto the page colour, flipping only the near-
 * black glyphs to white on the way.
 *
 * Per-pixel rather than a filter because the input mixes three things that need
 * different fates and are trivially separable by alpha + luminance:
 *   - transparent      → becomes the page background
 *   - near-black ink   → becomes near-white (this is the loose body copy that
 *                        would otherwise be black-on-black)
 *   - everything else  → passes through untouched, which is what keeps the
 *                        photograph, the teal accents and the dark cards exactly
 *                        as they were authored
 */
async function darkenVector(buf, outPath) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 3);

  for (let i = 0, o = 0; i < data.length; i += channels, o += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = channels === 4 ? data[i + 3] : 255;

    if (a < 8) {
      out[o] = PAGE_BG.r; out[o + 1] = PAGE_BG.g; out[o + 2] = PAGE_BG.b;
      continue;
    }
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    // dark AND unsaturated = ink → flip to near-white
    if (lum < 90 && sat < 30) {
      const v = 235 + Math.round((90 - lum) / 90 * 20);
      const px = Math.min(255, v);
      // blend by alpha so anti-aliased glyph edges stay smooth
      const t = a / 255;
      out[o] = Math.round(px * t + PAGE_BG.r * (1 - t));
      out[o + 1] = Math.round(px * t + PAGE_BG.g * (1 - t));
      out[o + 2] = Math.round(px * t + PAGE_BG.b * (1 - t));
      continue;
    }
    const t = a / 255;
    out[o] = Math.round(r * t + PAGE_BG.r * (1 - t));
    out[o + 1] = Math.round(g * t + PAGE_BG.g * (1 - t));
    out[o + 2] = Math.round(b * t + PAGE_BG.b * (1 - t));
  }

  await sharp(out, { raw: { width, height, channels: 3 } })
    .webp({ quality: 84 })
    .toFile(outPath);
}

/**
 * VECTOR SOURCES — the personas and the stakeholder matrix were supplied as
 * SVGs that are ALREADY dark-mode (#2A2A2A cards, white type), so they need no
 * inversion at all: rasterising them preserves the author's own dark design
 * instead of guessing at one.
 *
 * ⚠️ They are rasterised rather than shipped as SVG because each one embeds a
 * ~1.8MB JPEG portrait — four of them is ~8MB of persona art on a single page,
 * and the photograph inside gains nothing from being wrapped in vector. At
 * 2000px wide the webp is visually identical on screen for ~4% of the bytes,
 * and the case study's lightbox still zooms it.
 */
// `cropTop` is a FRACTION of the rendered height to remove from the top. The
// persona boards carry their own baked-in "R1 / Distributor" heading, which
// duplicates (and disagrees with) the heading the case study writes above each
// figure. Measured on the supplied files: the heading block ends at ~y78 of
// 672px and the card starts at y140, so cutting at 140/672 ≈ 0.208 removes it
// with a clear margin and clips nothing. Re-measure if the boards are redrawn.
// `bg` = the colour transparent areas flatten onto. The persona boards flatten
// onto the PAGE colour (#06080c), NOT the figure fill (#10141b): the case study
// shows them WITHOUT a panel (the outer rectangle must vanish into the page),
// and the boards' "dark cards" are actually transparent regions read via their
// white hairline borders — so page-colour flattening keeps the cards legible
// while removing the boxed-slide look. The matrix also uses page colour now.
const VECTORS = [
  { from: "Persona 1.svg", to: "persona-r1.webp", cropTop: 0.208, bg: "#06080c" },
  { from: "Persona 2.svg", to: "persona-r2.webp", cropTop: 0.208, bg: "#06080c" },
  { from: "Persona 3.svg", to: "persona-r3.webp", cropTop: 0.208, bg: "#06080c" },
  { from: "Persona 4.svg", to: "persona-r4.webp", cropTop: 0.208, bg: "#06080c" },
  // No baked heading on the matrix — keep it whole. `rLabels` stamps the four
  // buyer profiles into their quadrants: the supplied export is an EMPTY grid
  // (its labels are outlined paths, not editable text), so the placement that
  // makes it a decision rather than a diagram is added here.
  {
    from: "Stakeholder matrix.svg",
    to: "power-interest.webp",
    rLabels: true,
    bg: "#06080c",
  },
];

/**
 * Quadrant label placement for the power-interest matrix, in the SVG's own
 * 827x582 viewBox coordinates. Measured off the grid: the axes cross at
 * x≈418/y≈263, so quadrant centres are x 247 (left) / 627 (right). Each R sits
 * ABOVE its quadrant caption, matching the reference the user supplied.
 *
 * Placement is the study's argument: R2 + R3 are the key players (high power,
 * high interest), R1 must be met, R4 is low priority. It agrees with the figure
 * caption in oroDesign.ts — change both together or they will contradict.
 */
const R_LABELS = [
  { t: "R1", x: 247, y: 178 },
  { t: "R2", x: 627, y: 160 },
  { t: "R3", x: 627, y: 196 },
  { t: "R4", x: 247, y: 441 },
];

/** Inject the R labels as real <text> just before </svg>. */
function withRLabels(svg) {
  const i = svg.lastIndexOf("</svg>");
  if (i === -1) throw new Error("matrix svg has no closing tag");
  const g = [
    // Rasterised here, so name a font the machine actually has as fallback —
    // Jakarta is loaded by next/font in the app, not installed system-wide.
    `<g font-family="Plus Jakarta Sans, Segoe UI, Arial, sans-serif" font-weight="700" font-size="34" fill="#D9A441" text-anchor="middle">`,
    ...R_LABELS.map((l) => `<text x="${l.x}" y="${l.y}">${l.t}</text>`),
    `</g>`,
  ].join("\n");
  return svg.slice(0, i) + "\n" + g + "\n" + svg.slice(i);
}
const VEC_SRC = path.join(process.cwd(), "case-study-assets", "oro-project");

fs.mkdirSync(OUT, { recursive: true });

for (const v of VECTORS) {
  const src = path.join(VEC_SRC, v.from);
  if (!fs.existsSync(src)) {
    console.log(`MISSING  ${v.from}`);
    continue;
  }
  const dest = path.join(OUT, v.to);
  // These SVGs are the author's DARK-MODE variants: transparent, with light ink
  // throughout (verified by sampling the loose copy, the card bodies and the
  // headings — all read light). So they flatten straight onto the page surface
  // and need no recolouring at all.
  //
  // History worth keeping: the ORIGINAL light-mode exports could not be
  // converted automatically. Three attempts failed — rasterise as-is (black on
  // black), flatten-white-then-invert (pasted a white rectangle around the
  // portrait, whose own background is white showroom shelving), and a per-pixel
  // ink flip (turned the dark text inside light cards white-on-white). The
  // workaround was to flatten onto a warm off-white so the board read as a light
  // figure on a dark page. Redrawing them in dark mode removed the problem at
  // source; don't reintroduce the off-white canvas.
  //
  // `density` drives the SVG rasterisation resolution before the resize.
  // Read the SVG so labels can be injected before rasterising. The SOURCE file
  // is never modified — a re-export from Figma would silently drop the edit.
  const svgInput = v.rLabels
    ? Buffer.from(withRLabels(fs.readFileSync(src, "utf8")))
    : src;
  let pipe = sharp(svgInput, { density: 200 }).resize({
    width: MAX_W,
    withoutEnlargement: false,
  });
  if (v.cropTop) {
    // Re-read the resized bitmap so the crop is computed against real pixel
    // dimensions rather than the SVG's declared viewBox.
    const buf = await pipe.png().toBuffer();
    const meta = await sharp(buf).metadata();
    const top = Math.round(meta.height * v.cropTop);
    pipe = sharp(buf).extract({
      left: 0,
      top,
      width: meta.width,
      height: meta.height - top,
    });
  }
  await pipe
    // Per-vector background (see VECTORS note). All vectors flatten onto the
    // page colour #06080c so no panel shows; fallback #10141b for any future add.
    .flatten({ background: v.bg ?? "#10141b" })
    .webp({ quality: 84 })
    .toFile(dest);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  const wasKb = Math.round(fs.statSync(src).size / 1024);
  console.log(`vector  ${v.to.padEnd(28)} ${kb}KB  (from ${wasKb}KB svg)`);
}

// ── direct Figma screen exports ─────────────────────────────────────────────
for (const s of SCREENS) {
  const src = path.join(SCREEN_SRC, s.from);
  if (!fs.existsSync(src)) {
    console.log(`MISSING  ${s.from}`);
    continue;
  }
  const meta = await sharp(src).metadata();
  // chromePx was measured on a CHROME_BASIS-wide render; scale to this file.
  const top = Math.round((s.chromePx ?? 0) * (meta.width / CHROME_BASIS));
  const bottom = s.footer ? Math.round(meta.height * s.footer) : meta.height;
  const dest = path.join(OUT, s.to);
  await sharp(src)
    .extract({ left: 0, top, width: meta.width, height: bottom - top })
    .resize({ width: MAX_W, withoutEnlargement: true })
    // The app UI is light by design — no invert, no dim. Only the case study
    // chrome around it is dark.
    .webp({ quality: 82 })
    .toFile(dest);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`screen  ${s.to.padEnd(28)} ${kb}KB  (cropped ${top}→${bottom} of ${meta.height})`);
}

/**
 * OVERVIEW COVER — the hero banner, exported clean from Figma.
 *
 * Handled apart from SCREENS because it needs none of that pipeline: it is
 * already cropped to the banner (no browser chrome, no footer band), and it
 * carries an ALPHA CHANNEL — rounded corners plus the collections card that
 * overhangs the bottom-right edge.
 *
 * ⚠️ ALPHA IS PRESERVED, not flattened. Flattening onto #06080c would bake the
 * page colour into the corners, which then shows as dark notches the moment the
 * cover sits on anything else (the lightbox, a lighter surface, a future
 * retheme). The `.lir` canvas is that colour anyway, so transparent corners
 * render identically today and stay correct if the backdrop changes.
 */
{
  const src = path.join(SCREEN_SRC, "Hero image.png");
  if (fs.existsSync(src)) {
    const dest = path.join(OUT, "landing.webp");
    await sharp(src)
      .resize({ width: MAX_W, withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 100 })
      .toFile(dest);
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`cover   ${"landing.webp".padEnd(28)} ${kb}KB  (Hero image.png, alpha kept)`);
  } else {
    console.log(`MISSING  Hero image.png`);
  }
}

/**
 * The products page is ~5900px tall once cropped, so it reads as a texture
 * rather than a screen. The search story needs its TOP: the two filter tiers,
 * the active filter chips and an open metal dropdown. Derived from the finished
 * products.webp (not the raw export) so both stay in sync automatically.
 *
 * ⚠️ It must stay visibly different from products.webp — they sit in adjacent
 * features, and reusing one image would read as a duplicate.
 */
{
  const src = path.join(OUT, "products.webp");
  if (fs.existsSync(src)) {
    const m = await sharp(src).metadata();
    const dest = path.join(OUT, "search-scoped.webp");
    await sharp(src)
      .extract({ left: 0, top: 0, width: m.width, height: Math.round(m.height * 0.16) })
      .webp({ quality: 86 })
      .toFile(dest);
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`derive  ${"search-scoped.webp".padEnd(28)} ${kb}KB  (top 16% of products.webp)`);
  }
}

/** Product-card micro-interaction source — the bangle cut-out, alpha preserved
 *  so it sits on both the white catalogue state and the dark macro state. */
{
  const src = path.join(
    SCREEN_SRC,
    "card",
    "fa5529db9ffdf086c5b6cdd5fedb4a2884370992.png",
  );
  if (fs.existsSync(src)) {
    const dest = path.join(OUT, "card-bangle.webp");
    await sharp(src)
      .resize({ width: 1400 })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(dest);
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`card    ${"card-bangle.webp".padEnd(28)} ${kb}KB`);
  }
}

let ok = 0;
let missing = 0;
for (const a of ASSETS) {
  const src = path.join(SRC, a.from);
  if (!fs.existsSync(src)) {
    console.log(`MISSING  ${a.from}`);
    missing++;
    continue;
  }
  const dest = path.join(OUT, a.to);
  if (a.mode === "protect") {
    const found = await protectPhoto(src, dest, MAX_W);
    if (!found) console.log(`  (no photo region found in ${a.from} — plain invert)`);
  } else {
    let img = sharp(src).resize({ width: MAX_W, withoutEnlargement: true });
    if (a.mode === "invert") img = invert(img);
    else if (a.mode === "dim") img = dim(img);
    await img.webp({ quality: 82 }).toFile(dest);
  }
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`${a.mode.padEnd(7)} ${a.to.padEnd(28)} ${kb}KB`);
  ok++;
}
console.log(`\n${ok} written, ${missing} missing → ${OUT}`);
