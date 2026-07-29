/**
 * EXHIBIT CODEGEN — fa-* → inline lucide SVG map.
 *
 * The app renders FontAwesome Pro glyphs as `<i class="fa-solid fa-x">`, served
 * by a FlytBase kit script carrying an account token. That script cannot ship on
 * a public portfolio, so this generates a static map of equivalent lucide SVG
 * markup which a small runtime swaps in place.
 *
 * Run:  node scripts/gen-icon-map.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ICON_DIR = path.resolve('node_modules/lucide-react/dist/esm/icons');
const OUT = path.resolve('src/exhibit/lucide-icons.ts');

/** fa glyph (without the fa- prefix) → lucide icon file name. */
const MAP = {
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-right-from-bracket': 'log-out',
  'arrow-turn-down-right': 'corner-down-right',
  bolt: 'zap',
  book: 'book',
  box: 'box',
  briefcase: 'briefcase',
  calendar: 'calendar',
  camera: 'camera',
  'chart-pie': 'chart-pie',
  check: 'check',
  'check-circle': 'circle-check',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-up': 'chevron-up',
  circle: 'circle',
  'circle-arrow-left': 'circle-arrow-left',
  'circle-check': 'circle-check',
  'circle-exclamation': 'circle-alert',
  'circle-info': 'info',
  'circle-notch': 'loader-circle',
  clock: 'clock',
  'clock-rotate-left': 'history',
  'cloud-arrow-down': 'cloud-download',
  comment: 'message-circle',
  'comment-dots': 'message-circle-more',
  crosshairs: 'crosshair',
  cube: 'box',
  database: 'database',
  download: 'download',
  ellipsis: 'ellipsis',
  'ellipsis-vertical': 'ellipsis-vertical',
  'exclamation-triangle': 'triangle-alert',
  expand: 'maximize',
  eye: 'eye',
  'eye-slash': 'eye-off',
  'file-arrow-up': 'file-up',
  'file-lines': 'file-text',
  'filter-circle-xmark': 'filter-x',
  fingerprint: 'fingerprint',
  'fish-fins': 'fish',
  globe: 'globe',
  'grip-vertical': 'grip-vertical',
  helicopter: 'plane',
  image: 'image',
  images: 'images',
  inbox: 'inbox',
  'info-circle': 'info',
  keyboard: 'keyboard',
  list: 'list',
  'location-dot': 'map-pin',
  'magnifying-glass': 'search',
  map: 'map',
  'map-marker-alt': 'map-pin',
  microphone: 'mic',
  'microphone-lines': 'mic',
  minus: 'minus',
  moon: 'moon',
  pager: 'smartphone',
  palette: 'palette',
  'paper-plane': 'send',
  pen: 'pen',
  'pen-to-square': 'square-pen',
  plug: 'plug',
  plus: 'plus',
  'question-circle': 'circle-help',
  'quote-left': 'quote',
  'quote-right': 'quote',
  radar: 'radar',
  robot: 'bot',
  rocket: 'rocket',
  route: 'route',
  'scale-balanced': 'scale',
  search: 'search',
  'shield-check': 'shield-check',
  'shield-halved': 'shield-half',
  sort: 'arrow-up-down',
  spinner: 'loader-circle',
  star: 'star',
  'table-cells': 'grid-3x3',
  'table-columns': 'panels-top-left',
  'times-circle': 'circle-x',
  'tower-broadcast': 'radio-tower',
  trash: 'trash-2',
  'triangle-exclamation': 'triangle-alert',
  upload: 'upload',
  user: 'user',
  video: 'video',
  'wand-magic-sparkles': 'wand-sparkles',
  xmark: 'x',
};

/** Pull the __iconNode array out of a lucide ESM icon module. */
function readIconNode(name) {
  const file = path.join(ICON_DIR, `${name}.js`);
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/const __iconNode = (\[[\s\S]*?\]);/);
  if (!m) return null;
  // The array is plain JS data (strings + object literals) — evaluate it.
  // eslint-disable-next-line no-new-func
  return new Function(`return ${m[1]}`)();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function toInnerSvg(node) {
  return node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${esc(v)}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
}

const out = {};
const missing = [];

for (const [fa, lucide] of Object.entries(MAP)) {
  const node = readIconNode(lucide);
  if (!node) {
    missing.push(`${fa} -> ${lucide}`);
    continue;
  }
  out[fa] = toInnerSvg(node);
}

if (missing.length) {
  console.error(`\nMISSING lucide icons (${missing.length}):`);
  for (const m of missing) console.error('  ' + m);
  process.exitCode = 1;
}

const header = `/**
 * EXHIBIT — GENERATED FILE, do not hand-edit.
 * Regenerate with: node scripts/gen-icon-map.mjs
 *
 * Maps every FontAwesome glyph the app uses to equivalent lucide SVG markup,
 * so the FlytBase FontAwesome Pro kit (an account token) never ships.
 */

export const ICON_SVG: Record<string, string> = ${JSON.stringify(out, null, 2)};
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, header);
console.log(`wrote ${Object.keys(out).length} icons -> ${path.relative(process.cwd(), OUT)}`);
