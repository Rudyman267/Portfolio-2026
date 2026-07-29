/**
 * EXHIBIT — FontAwesome → lucide swapper.
 *
 * The app renders icons as `<i class="fa-solid fa-camera">`, painted by a
 * FontAwesome Pro kit script tied to a FlytBase account. That script is removed
 * from index.html, so this fills those elements with inline lucide SVG markup.
 *
 * Why a DOM pass rather than editing components: the icons appear across 86
 * files and the brief is that the UI must stay exactly as it ships in the repo.
 *
 * IMPORTANT — we inject a CHILD into the existing <i>; we never replace or
 * remove it. React renders these as childless elements, so it does not
 * reconcile their children and the injected SVG is left alone. An earlier
 * version called `el.replaceWith(svg)`, which pulled React-managed nodes out of
 * the tree and made React throw
 *   "NotFoundError: Failed to execute 'removeChild' on 'Node'"
 * when it later tried to unmount them (this crashed /flight/:id and /guides).
 * Do not go back to replaceWith.
 */

import { ICON_SVG } from './lucide-icons';

const MARK = 'data-exhibit-icon';

/** Pull the glyph name out of a class list, ignoring style/sizing classes. */
function glyphFrom(el: Element): string | null {
  for (const c of Array.from(el.classList)) {
    if (!c.startsWith('fa-')) continue;
    const name = c.slice(3);
    if (ICON_SVG[name]) return name;
  }
  return null;
}

function paint(el: Element): void {
  if (el.hasAttribute(MARK)) return;

  const glyph = glyphFrom(el);
  const host = el as HTMLElement;

  if (!glyph) {
    // Unknown glyph — collapse it rather than leave an empty FA box.
    host.setAttribute(MARK, 'unmapped');
    host.style.display = 'none';
    return;
  }

  host.setAttribute(MARK, glyph);
  // The FA classes no longer resolve to a font, so give the host a box.
  host.style.display = 'inline-flex';
  host.style.alignItems = 'center';
  host.style.justifyContent = 'center';
  host.style.verticalAlign = '-0.125em';
  host.style.flexShrink = '0';

  host.innerHTML =
    `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ` +
    `style="display:block">${ICON_SVG[glyph]}</svg>`;
}

const SELECTOR = 'i[class*="fa-"], span[class*="fa-"]';

function paintAll(root: ParentNode = document): void {
  root.querySelectorAll(SELECTOR).forEach((el) => {
    if (Array.from(el.classList).some((c) => c.startsWith('fa-'))) paint(el);
  });
}

let started = false;

export function startIconSwap(): void {
  if (started) return;
  started = true;

  paintAll();

  // React mounts icons long after first paint, and swaps them on navigation.
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n.nodeType !== Node.ELEMENT_NODE) return;
        const el = n as Element;
        if (el.matches?.(SELECTOR)) paint(el);
        el.querySelectorAll?.(SELECTOR).forEach((child) => {
          if (Array.from(child.classList).some((c) => c.startsWith('fa-'))) paint(child);
        });
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}
