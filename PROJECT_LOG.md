# Portfolio Website 2026 — Project Log

> **Purpose:** Persistent context across Claude Code sessions. Read this first at the
> start of every session. Update the **Session History** + **Current State** + **Next
> Steps** sections at the end of each session (the user will say "update the log").

---

## 1. Project Overview

A personal portfolio for an **AI-native Product Designer who ships both code and
design at high speed using AI**. Positioning: a **builder/designer hybrid** valuable
in the AI shift. The site must (1) showcase taste/craft via visual polish + motion,
and (2) show recruiters *process and thinking* through well-structured, flexible
case studies.

- **Working dir:** `e:\personal projects\Portfolio Website 2026 AI`
- **Platform:** Windows 11, PowerShell (Bash tool also available)
- **Scope:** Full v1 — Home, About, Work index, 2–3 case studies, contact/footer.

---

## 2. Confirmed Decisions (do not re-litigate)

| Area | Decision |
|---|---|
| Framework | **Next.js 16** (App Router, React 19.2) + TypeScript. **Dev runs on Webpack, NOT Turbopack** (`next dev --webpack`) — Turbopack crashed the laptop, see §3. |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` in globals.css — NO tailwind.config.ts) |
| CMS | **Sanity v6** embedded Studio at `/studio`; `next-sanity@13` |
| Animation | **GSAP 3.15 + ScrollTrigger + SplitText + Lenis** smooth scroll, via `@gsap/react` `useGSAP`. (Migrated off Framer Motion in Session 2 — `motion` dep removed.) Awwwards-tier target: refs galekto.com, armory.framer.ai, fromanother.love |
| Case studies | **Flexible per-project** Portable Text canvas with reusable blocks |
| Theme | **Single theme** for v1 (token system ready for dark mode later) |
| Contact | **Email + socials** only (no backend form) |
| Draft preview | **Yes** — Sanity Presentation/draft mode (`defineLive`) |
| Domain | Ship on free **`*.vercel.app`** first; custom domain later. **DEPLOYED (Session 8):** live at **https://portfolio-2026-psi-flax.vercel.app** (also `-portfolio-27.vercel.app`). GitHub-connected → auto-deploy on push to `main`. |
| Sanity account | **Personal account** |
| Hosting/Git | **GitHub:** `Rudyman267/Portfolio-2026` (private). **Vercel:** personal account **`riddhimandeb12-1923`** (email riddhimandeb12@gmail.com), team **`portfolio-27`**, project `prj_LyJsSNYxQCqJu9xpZXEIfnG2s9oE`, GitHub App linked (auto-deploy). Commit author = `Rudyman267 <riddhimandeb12@gmail.com>` (email MUST stay verified on GitHub or Vercel blocks the build). |
| Figma | Dev Mode MCP registered (`figma-dev-mode`, `http://127.0.0.1:3845/mcp`). File: Portfolio Website 2026 (AI Builder), frames **66:2 / 66:3** to read as a **LOOSE taste guide** (not pixel-match). Build uses neutral placeholder tokens until then. |

---

## 3. Environment Gotchas (IMPORTANT)

- **Next 16 + Tailwind 4 are NEWER than the model's training data.** An `AGENTS.md`
  in the repo warns conventions differ. **Bundled docs at `node_modules/next/dist/docs/`
  are the source of truth** — read the relevant doc before writing Next-specific code.
- Key v16 breaking changes in use: async Request APIs (`await params`,
  `await draftMode()`, `await cookies()`); `revalidateTag(tag, profile)` needs a 2nd
  arg; `opengraph-image`/`sitemap` get async `params`/`id`; `images.domains` removed
  → `remotePatterns`; `next lint` removed (ESLint flat config); Turbopack default.
- `react`/`react-dom` pinned to `^19.2.7` so Sanity's `@portabletext/editor` peer
  (`^19.2.5`) is satisfied.
- **Sanity CLI in the shell is NOT logged in** (user authed via browser during
  `sanity init`). `sanity dataset list` / `sanity cors` fail with "must login first."
  Do dataset/CORS/token management in the **sanity.io/manage web UI**, or `sanity login`.
- Dev server (Next 16) runs detached with a lockfile; `TaskStop` kills the wrapper but
  not the `next dev` process. To restart cleanly: `taskkill //PID <pid> //F`, remove
  `.next/dev` lock, then `npm run dev`. To stop from PowerShell:
  `Get-Process node | Stop-Process -Force`.
- **⚠️ CRITICAL — DEV SERVER CRASHED THE LAPTOP (Session 5). Two failsafes are now in
  place; do NOT undo them.** Symptom: `next dev` with **Turbopack** panicked during the
  first page compile — Turbopack's Rust thread pool (rayon) tried to grab a large memory
  block, Windows couldn't back it (*"The paging file is too small for this operation to
  complete."*), and the machine thrashed so hard **Task Manager froze and the laptop
  force-restarted.** Root cause: a spiky allocation outrunning the auto-managed pagefile's
  on-demand growth (16 GB RAM, but pagefile couldn't grow fast enough for the burst).
  **Failsafes applied (keep both):**
  1. **Pagefile moved off C: → fixed on E:** (16384 MB initial / 24576 MB max), auto-manage
     OFF. Gives compile spikes room; freed ~9 GB on C:. Verify with
     `Get-CimInstance Win32_PageFileUsage`.
  2. **Turbopack DISABLED — dev now runs on Webpack:** `dev` script is `next dev --webpack`
     (`--webpack` opt-out confirmed in `node_modules/next/dist/docs/.../06-cli/next.md`).
     Webpack is lighter on memory; it was the exact component that panicked.
  - **RULES FOR THIS SESSION AND FUTURE ONES:**
    - **Always start the dev server in the background** and **watch memory** while the first
      compile runs: `[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,2)`
      for free RAM and node RSS. **If free RAM collapses toward ~0, kill node immediately**
      rather than let it thrash — a frozen machine is the failure mode here.
    - **Do NOT re-enable Turbopack** (`--turbopack` / `--turbo`) unless the user explicitly
      asks and accepts the crash risk.
    - **First Webpack compile is SLOW (~30-90s)** on this project (Three.js/R3F/GSAP/Sanity).
      A long "Compiling..." is NORMAL and is NOT the crash — the crash was an instant panic.
      Verified healthy: homepage served **HTTP 200 in ~34s**, node peaked ~1.8 GB, ~6.5 GB
      RAM stayed free.
    - **This is a LOCAL-DEV-ONLY problem.** Hosting is unaffected: the platform runs
      `next build` once on its own servers and visitors hit pre-compiled output — no compiler
      runs for users. Recommended deploy path: **Vercel** (builds in their cloud, laptop never
      does the heavy compile). Reassure the user of this if they worry the live site will crash.
    - **`next build` uses TURBOPACK (default) and does NOT crash** — the crash was Turbopack
      *dev* only. Verified Session 8: local `npm run build` compiled clean in 30.6s (log said
      `(Turbopack)`). A local build test is safe if wanted; only `dev` must stay `--webpack`.

### Deploy gotchas (Session 8 — Vercel)
- **Working style locked:** iterate LOCALLY first (typecheck + headless-Chrome screenshots;
  dev server only when the user must *feel* GPU/motion), then **`git push` → Vercel
  auto-deploys.** Batch changes into meaningful commits, don't push every tweak.
- **Auth logins can't run in the SDK shell** (`gh auth login`, `vercel login` are interactive
  browser handshakes → hang). Use **tokens**: `gh auth login --with-token` (pipe the PAT);
  `vercel --token=<vcp_...>` / REST `Authorization: Bearer`. Vercel scope: `--scope <slug>`
  or `?teamId=<id>`.
- **GitHub fine-grained tokens are finicky** — need **Contents: Read & write** AND the repo in
  scope; the repo API's `permissions.push:true` can lie. A **classic token with top-level
  `repo`** is the reliable path (probe: `gh api repos/<o>/<r>/git/refs`; 403 = no write).
- **Vercel CLI uploads the whole cwd, ignores `.gitignore`** → 100 MB limit hit on
  `Asset videos/`. Fixed via committed **`.vercelignore`** (excludes Asset videos,
  case-study-assets, logs, node_modules, .next).
- **Framework not auto-detected on CLI create** → build looked for `dist` and failed. Fixed
  via committed **`vercel.json` `{ "framework": "nextjs" }`**.
- **New Vercel projects have SSO Deployment Protection ON** (302 → `/sso-api`; only owner can
  view). Disable: `PATCH /v9/projects/<id>?teamId=<t>` body `{"ssoProtection": null}`.
- **GitHub-integration deploys BLOCK if the commit author email isn't verified on the GitHub
  account** ("commit email could not be matched" → `readyState: BLOCKED`).
  `riddhimandeb12@gmail.com` IS verified on `Rudyman267`, so it passes.
- **Deploy from GitHub via API:** `POST /v13/deployments` with
  `gitSource:{type:"github", repoId:<num>, ref:"main"}` (needs **repoId** from
  `project.link.repoId`, not the name); poll `GET /v13/deployments/<id>` for `readyState`.

---

## 4. Sanity Project

- **projectId:** `4bo3ynjd`
- **org id:** `o7O6fCcH7`
- **project name:** Portfolio-Rudyman
- **dataset:** `production` (public read; confirmed exists, currently empty)
- Env in `.env.local` (gitignored). `.env.example` is committed.

### Env vars
```
NEXT_PUBLIC_SANITY_PROJECT_ID=4bo3ynjd
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
SANITY_API_READ_TOKEN=        # for draft preview — get Viewer token from sanity.io/manage
SANITY_REVALIDATE_SECRET=dev-secret-change-me
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 5. Architecture / Where Things Live

```
src/
  app/
    layout.tsx                    # root: fonts, metadataBase, html/body
    (site)/                       # public route group (Header/Footer/MotionProvider)
      layout.tsx                  # fetches siteSettings; mounts SanityLive + VisualEditing (draft)
      page.tsx                    # Home: Hero + featured WorkGrid + ContactCTA
      about/page.tsx
      work/page.tsx               # index w/ client tag filter
      work/[slug]/page.tsx        # case study (async params, generateStaticParams/Metadata)
      not-found.tsx
    studio/[[...tool]]/           # page.tsx (server) + Studio.tsx ("use client" NextStudio)
    api/revalidate/route.ts       # Sanity webhook → revalidateTag(type,'max'); @sanity/webhook sig
    api/draft-mode/{enable,disable}/route.ts
    sitemap.ts, robots.ts, opengraph-image.tsx
    globals.css                   # DESIGN TOKENS (:root vars) + @theme + base + .full-bleed
  components/
    layout/ (Header, Nav, Footer)
    sections/ (Hero, WorkGrid, ProjectCard, ContactCTA)
    motion/ (SmoothScrollProvider[Lenis↔GSAP ticker], Loader[intro counter, emits LOADER_DONE_EVENT],
             FadeIn[+Stagger/Item], Reveal, SplitReveal[per-line mask, sets data-split], Parallax, Magnetic)
    portable-text/ (PortableTextRenderer + blocks/*)
    ui/ (Container, Button[+ButtonLink], Tag)
    SanityImage.tsx               # next/image + urlFor + LQIP blur
    DisableDraftMode.tsx
  sanity/
    env.ts, client.ts, image.ts (createImageUrlBuilder), live.ts (defineLive, apiVersion 'vX')
    queries.ts                    # GROQ via defineQuery (typed)
    structure.ts                  # singletons + orderable Projects
    schemas/{index.ts, documents/*, objects/*}
  lib/ (gsap.ts → registers plugins + exports gsap/ScrollTrigger/SplitText/useGSAP + ease/duration
        tokens mirroring globals.css; utils.ts → cn())  [motion-tokens.ts DELETED with Framer]
  types/sanity.types.ts           # GENERATED by `npm run typegen` — do not hand-edit
sanity.config.ts, sanity.cli.ts   # root
sanity-typegen.json               # typegen config (schema.json is gitignored, regenerable)
```

### Design tokens — how to retheme
All tokens are CSS custom properties in `src/app/globals.css` under `:root`
(colors as space-separated RGB channels, fluid type scale, spacing, radii, shadows,
motion). `@theme inline` maps them to Tailwind utilities. Motion ease/duration tokens mirrored in
`src/lib/gsap.ts` (`ease`, `duration` exports). **To apply Figma: replace the values in `:root` in one place.**
All GSAP animations are gated by `gsap.matchMedia()` for `prefers-reduced-motion`; Lenis smooth
scroll is additionally disabled on touch (coarse pointer). globals.css has Lenis base styles +
`.is-loading` scroll-lock + a `[data-split]` rule (opts SplitReveal headings out of `text-wrap:balance`,
which fights SplitText line-splitting).

### Sanity schema (the flexible case-study system)
- **Documents:** `siteSettings` (singleton), `profile` (singleton), `project` (orderable).
- **`richContent`** = the Portable Text canvas. Block members: text block, `imageWithAlt`,
  `imageGallery`, `videoEmbed`, `metricCallout`, `quote`, `twoColumn`, `fullBleedMedia`,
  `captionedFigure`, `processStep`. Plus `seo`, `link` objects.
- After any schema/query change run: **`npm run typegen`** (extracts schema + regenerates types).

### Useful commands
```
npm run dev         # dev server (localhost:3000) — runs on WEBPACK (--webpack), not Turbopack; see §3
npm run build       # production build (separate output dir from dev in v16)
npm run typecheck   # tsc --noEmit
npm run typegen     # sanity schema extract + typegen generate → src/types/sanity.types.ts
```

---

## 6. Current State (as of Session 13)

**Status (as of Session 13): EVERYTHING IS SHIPPED. Two commits pushed (`2f3009f` LIR case
study + `4fbf57c` About page); LIVE site = `4fbf57c`. The ABOUT PAGE (`/about`, nav "Me") is a
complete cinematic scroll journey — the biggest new build. The LIR light case study (Session 12)
went out in the same push. Verified live: `/`, `/about`, `/work/live-incident-response` all 200.**

### ABOUT PAGE — Session 13 (the "Me" journey, `/about`)
ONE pinned GSAP timeline (`AboutIntro.tsx`, pin `end:+=1205%`, scrub 0.5, ~36.6 timeline units —
positions in comments) driving six scenes on the `.hero-dark` `#06080c` canvas. All user-driven,
storyboard by storyboard. Scene map:
1. **Name intro** — photo frame scales/drifts (scroll-mapped) while "HEY! THAT'S"/"MY NAME"
   (Tanker) travel in from the edges, converge white flanking the photo, then FADE OUT while
   merging into one axis (no crossing shown); "RIDDHIMAN DEB" pops via masked letter rise.
   Photos AUTOPLAY-shuffle every 900ms (gsap crossfade interval, NOT scroll-mapped; cleaned up
   via matchMedia teardown). Photos: `public/about/me-{1..4}.jpeg`.
2. **22 years** — text wipes in line-by-line from the left; the ending video slides in from the
   right; meet as one composition. Video: `public/about/ending.webm` (VP9 570KB) + `.mp4`
   fallback (1.28MB); plays via `tl.call` (muted/loop), never under reduced motion.
3. **NOW I / BUILD / PRODUCT EXPERIENCES** — words fade in at storyboard anchors (no stagger),
   travel HORIZONTALLY ONLY (ease none) to dock against the game card (parts occluded by its
   opaque `bg-bg`), then keep drifting and blur(6px)+fade out (no pause — continuous). The card
   (`GameThumb.tsx`) = live 2D-canvas replica of The Other Hand's DEFAULT particle state (Google
   palette, pure brownian + wrap — NO center pull, it orbit-decays into a blob). Card =
   `<Link href="/play">` (page NOT built → 404s), hover = white border + PLAY? glow. Card is a
   SHORT box (h-22svh, w clamp 21vw) offset +5.35svh so its TOP edge slices NOW I's row and its
   BOTTOM slices PRODUCT EXPERIENCES'. Then PLAY? → punchline "NVM CHECK IT OUT LATER ITS COOL"
   (card hides completely first).
4. **Collapsing boundary (thesis)** — "DESIGN IS / CHANGING" pops stacked → halves pull apart
   into one row while a hairline rule draws between them → rule flickers, SNAPS, halves collapse
   into it → "For years designers owned the interface…" paragraph wipes in per-line masks.
5. **Process rope unroll** — 7 SVG lockups (`public/about/process-{1..7}.svg`, labels BAKED IN,
   frame 7 = "Reiterate fast") fade in on an ellipse, orbit ONE full rotation (proxy tween +
   trig placement), then UNROLL onto the line like a rope: coil keeps spinning + shrinking while
   its head walks the row, icon 1 lays first → 7 last, whole thing drifts left `-3S·p` so the
   line ends centered. Seamless at both ends of the morph.
6. **Finale** — icons collapse into a glowing idea-dot → dot pops into "IDEAS DESERVE MORE THAN
   PROTOTYPES. THEY DESERVE TO EXIST." (masked rise) → scroll THROUGH it (scale 2.3 + blur) →
   "I DON'T JUST WANT TO DESIGN THE FUTURE OF PRODUCTS. I WANT TO HELP BUILD IT." resolves from
   depth → unpin → footer.
Reduced motion: scene-1 settled state only (photo+name), everything else hidden; sr-only h1/p
carry all copy. FOUC guards: every animated layer inline `opacity:0;visibility:hidden` +
`immediateRender:true` on later-positioned fromTos. `document.fonts.ready → ScrollTrigger.refresh()`
(Tanker changes phrase widths). Function-based x/y + `invalidateOnRefresh` throughout.

### Supporting changes shipped with it (Session 13)
- **Egg loader physics pass** (`Loader.tsx`): egg re-seated on the bowl's visual center
  (left 16% / top 34% / width 46%); egg now rides dip + ROT_DROP≈14px (pan pivots at the handle —
  y alone made it float); exit throw egg rides only ~4px (the +8° tilt RAISES the bowl); catch
  squash (scaleY .93 at contact patch, elastic back); sizzle micro-jiggle on `.pan__egg` (child
  svg, never fights wrapper transforms), killed on openPan.
- **Frame-zero reload guarantee**: browsers deferred-restore a CLAMPED scroll position after the
  provider's reset (pin spacers grow the page late) → the loader now re-asserts `scrollTo(0,0)`
  on mount AND in `finish()`/`handOff()`. Verified: reload from 11000px deep → scrollY 0.
- **Header on dark pages**: `/about` → solid header inverts to `#06080c` + white nav via
  `data-solid-dark` attr + globals rules (transparent-over-dark behavior unchanged). Mobile
  panel inverts too. `darkPage = pathname === "/about"` in Header.tsx.
- **Nav "Me" → `/about`** (DEFAULT_NAV). **Gallery card 1 → the real LIR study**
  (placeholderProjects[0] = live-incident-response); cards 2–5 still 404 to not-found.
- **Hero phrases → Tanker** (all 3 scenes; single-weight, tracking 0.01em, no font-bold).
- **One canvas color everywhere**: `#06080c` (hero-dark) — the earlier custom `#050608` made a
  visible band at the about→footer seam. About page wraps in a `bg-[#06080c]` div so the pin
  spacer / seam can never flash white.
- **`.gitignore`**: `the-other-hand project/` + zip (separate game project, NOT part of the
  site), `.claude/settings.json`.

### LIR LIGHT REBUILD — Session 12 (the current case study)
Recreated the **Live Incidence Response** case study from **Figma node 172:56 / frame 168:408**
(1920 frame) as a **light, editorial** page — white canvas, near-black text, electric-blue
`#1291e0` accent, **Tanker** display headings. Wired the route at `work/[slug]/page.tsx` →
`<LirCaseStudy>`. The Session-10 dark `<CaseStudy>` + `blocks.tsx` + `StageRail.tsx` stay on
disk, unused.

**Files (all NEW this direction):**
- `src/lib/caseStudies/lirDesign.ts` — typed content + block model (`LirDesign`, `Section`,
  `Block`, `Span`). Discriminated-union blocks: `label`, `lede`, `p`, `richP` (mixed-weight +
  indented bold lead), `quote`, `quoteFlash` (2nd full-screen flash), `note`, `media`
  (+`caption`), `figure` (isolated/hanging transparent img), `gapHeading`, `centerP`,
  `diagram`, `matters`, `gapCards`, `auditNotes`, `designMd`. Asset punch-list at bottom.
- `src/components/case-study/LirCaseStudy.tsx` — orchestrator (one `"use client"` island):
  fixed z-index thumbnail intro, persistent 2-col grid, hero, `SectionRenderer` + `ProseBody`.
- `src/components/case-study/lirBlocks.tsx` — atoms: `DroneMark` (real FlytBase sparkle SVG),
  `CountUp` (stat ticker), `Figure`, `OutlineNote`, `PullQuote`, `MattersList`, `GapCards`,
  `DecisionCluster`, + inline SVG diagrams (`PersonaSplitDiagram` etc — persona now uses the
  real `diagram-users.svg`).
- `src/components/case-study/Chapter.tsx` — the **chapter flash transition** (`Chapter`,
  `FlashPanel`, `Spawn`).

**Type scale — EXACT Figma px (÷16 = rem), sourced via MCP, NOT guessed.** Tokens live in the
`.lir` scope in `globals.css` (`--lir-h-section` … `--lir-body`, `--lir-rail-*`, geometry
`--lir-rail-w` 315→now 210, `--lir-col-gap`, `--lir-measure`). Body text was reduced 4px per
type on user request (lede/body 20→16, secondary 16→12, meta 13→11-ish rail, captions 13→9).
Frame reference: **1920** — user designs there, we map px→rem 1:1 on desktop with clamp floors.

**Tanker font** self-hosted at `src/app/fonts/Tanker-Regular.woff2` via `next/font/local`
(`--font-tanker`), exposed as `--font-display-tanker` in `.lir .display`. ⚠️ GOTCHA fixed:
the token was originally named `--font-tanker` (same as the next/font var) → circular ref →
Tanker never rendered. Must use a DIFFERENT token name than the next/font variable.

**Real assets** copied into `public/case-study/` (source in gitignored `Asset videos/` +
`case-study-assets/flytbase-project-1/`): `flytbase-logo.svg`, `diagram-users.svg`,
`thumbnail-1.svg`, `image-1.png` (cover/session view), `scenario.png`, `drone-diagram.png`,
`dock-diagram.png`, `heres-the-gap.svg`. `Figure`/`figure` render real `<img>` when `src` set.

**Thumbnail intro = z-index cover reveal** (NOT opacity fade — that ghosted). Thumbnail is
`fixed inset-0 z-0` fully opaque + never fades; page content is `z-10` + opaque `bg-bg` and
scrolls UP over it, covering from the bottom. `[data-intro-wrap]` = 100vh spacer. Whisper of
parallax on the img + "scroll to enter" hint fade.

**Chapter flash transition (Context, Problem, Reframe wired; add ids to `CHAPTER_IDS` set to
enable more).** Each `Chapter`: a **55vh lead-in** (so the previous chapter's last element
scrolls out first), then a PINNED full-viewport flash of the Tanker title (`FlashPanel`,
scrubbed fade+scale in→hold→out, replays on scroll-up), then content where each block spawns
in **scrubbed** (`Spawn`, via the `spawn` prop threaded through `ProseBody`'s `<W>` wrapper).
A chapter can hold MULTIPLE flashes — Problem has a 2nd `quoteFlash` ("During an emergency…",
all grey `#636363`, ExtraBold, wide 2-line, plays then clears as the scenario image appears).

**Stat ticker (`CountUp`):** counts 0→target when in view, **slow (2.8s)**, **replays every
time it re-enters** (resets to 0 on leave). Handles decoration: `<30s` keeps `<`/`s`.

**Contents nav scroll-spy:** blue is a MOVING highlight (one active at a time). `#overview`
marker + each `[data-section]` band runs top→next-section-top. "Overview" is grey by default,
lit only at the top. (Note: some TOC labels share a target — the-shift/process, etc.)

**Content structure locked so far (per user, chapter by chapter):**
- **Overview** (hero, right column): title 32px + blue eyebrow 24px + drone mark LEFT of the
  46px headline (35px gap, 60px eyebrow→headline) + lede + 4 stat tickers + cover (image-1) +
  build statement + **"Features shipped" label + capability note** (these CLOSE the overview,
  NOT the start of Context).
- **01 Context:** hanging drone-diagram (isolated, no box) → `richP` body ("Drones are
  operational infrastructure now." bold indented lead + bold entity names) → hanging
  dock-diagram. Caption/body match the cover width.
- **02 Problem:** PROBLEM flash → grey "During an emergency" quoteFlash → scenario.png (as-is)
  + center caption (full image width) → "Here's the gap" SVG → center CEO text (full width).
- **03 Reframe:** REFRAME flash → "If it sounds like…/The brief…/Read it again…" + the
  **matters list** (moved here FROM Problem) → "single room per incident" lede → persona
  diagram (`diagram-users.svg`) → audit notes.
- **the shift / process / solution / trade-offs / Impact / reflection:** NOT yet chapter-ized
  (still render as plain sections via the non-chapter `SectionRenderer` path).

**Two-column layout:** container `max-w-[1680px]` so the sticky rail (meta card + Contents,
white fill `#dcdcdc` border r12, ~2/3 scale) hangs near the left edge; content column capped
`max-w-[860px]` + `mx-auto` so it floats centered. Rail persists the whole page (sticky).

**Header:** this page is LIGHT → no `data-header-dark` on content, so the header renders solid
(white bar, black nav). The thumbnail intro DOES carry `data-header-dark` so nav stays visible
over the dark cover.

**Verification each step:** typecheck clean throughout; drove the running app with a raw-CDP
headless-Chrome harness (scratchpad `cap*.mjs`, uses `ws` from node_modules — run scripts FROM
the project dir so `ws` resolves; dismiss the egg loader by clicking
`button[aria-label="Click to enter the site"]` after enabling it). NO prod build run this
session; NOT committed/pushed.

### LIR case study — Session 10
The flagship case study (Flytbase project 1, "Live Incident Response") is built and verified
locally (desktop + mobile screenshots, typecheck + prod build clean). Route:
**`/work/live-incident-response`**. Direction: **dark cinematic** (echoes hero/footer via
`.hero-dark` scope) + **editorial calm**, per-study accent = signal **orange `#ff781f`**.
- **Source copy:** `case-study-assets/flytbase-project-1/LIR_case_study_copy.md` (hand-authored,
     senior register, ~20 `[FILL]` metrics). User confirmed LIR = THE flagship.
- **NOT in Sanity** (Sanity still empty). Built as a **typed local data file** —
     `src/lib/caseStudies/liveIncidentResponse.ts` (Sanity-shaped, mirrors `placeholderProjects.ts`
     pattern, migrates later). Discriminated-union `Section` types (prose/decisions/features/impact);
     `Block[]` stream (p/quote/media/metric/table). `[FILL]` metrics render as `pending:true`
     (muted "Awaiting data"). Bottom of that file has the **ASSET PUNCH-LIST**.
- **Components** (`src/components/case-study/`): `CaseStudy.tsx` (orchestrator — poster w/ accent
     wash, snapshot bar, headline metrics, cover, 9 spine sections, close; one "use client" island);
     `StageRail.tsx` (fixed left "you are here" rail 01–09, lights active section in accent via
     per-section ScrollTrigger; hidden < lg, inline numbers on mobile); `blocks.tsx` (PullQuote,
     DecisionCard [tradeoff in accent footer], ImpactMetric [↑ arrows], DataTable, MediaPlaceholder
     [Fig.NN labeled slots], MetricRow, Measure/Para).
- **`work/[slug]/page.tsx` rewritten** — server comp with a `STUDIES` slug registry → renders
     `<CaseStudy>`; `generateStaticParams`/`generateMetadata` from local data; `notFound()` else.
     **Dropped the `ContactCTA` import** (footer IS the contact close). NOTE: `ContactCTA.tsx` is
     STILL USED by `about/page.tsx` + `work/page.tsx` — do NOT delete it.
- **Structure** takes cues from ref **gauravi.design/case-business.html** (numbered sections, Fig.
     labels, tradeoff grouping, directional impact numbers) — but look is 100% our tokens/motion.
- **NO IMAGES yet** — user has them in Figma. Every image/diagram/graph renders as a labeled
     dashed `Fig.NN` placeholder (grid texture + caption). **6 slots + 1 cover** to fill; punch-list
     in the data file + relayed to user. Diagrams (2×2 segmentation, loop comparison, DOM-bug,
     system-parity) could alternatively be built as inline SVG if user prefers.
- **Tables built** (real, not placeholder): the 4-layer reframe, the 3-roles breakdown.

### Loader fix — Session 10 (⚠️ ties into the case study)
The fried-egg loader **hung at 90 forever on non-home routes** — it awaits `whenHeroVideoReady()`,
which ONLY the home page's 3D hero calls (`markHeroVideoReady`). Fixed in `Loader.tsx`: added
`usePathname()`; off-home → `heroWait = Promise.resolve()` (no hero to wait for); on home → still
awaits the hero but **races an 8s failsafe** so it can never deadlock either. Verified: on
`/work/live-incident-response` the counter now reaches 100 → "click to enter". typecheck clean.
- **Dev-overlay "1 Issue" hydration warning is a FALSE POSITIVE** — a browser extension
     (BitDefender/Kaspersky-style) injects `bis_skin_checked="1"` attrs before React hydrates.
     Dev-only, never in prod, not our code. Don't chase it.

### Session 9 state (home experience — unchanged, still live)
Full home experience — FRIED-EGG loader → dark 3D hero → white "MY WORKS." gallery → dark footer
finale (ambient glow, denser, energy boxes bloom). Session 9 (multi-ship): re-tuned the hero theme
repeatedly (FINAL = MAGENTA/ORANGE), added live "Footer Glow" panel controls, swapped the loader
pancake → a FRIED-EGG (final = the user's PRE-DISTORTED egg vector, perspective baked into the
paths, centered in the pan — NO CSS skew/scale), added a Bloom pass to the footer so the energy
boxes glow, and made the 🎛 dev FAB PERMANENTLY dev-gated (always in local, tree-shaken from prod
— no more manual mount/unmount, see [[shader-fab-dev-gated]] memory). typecheck + build clean.
No CMS content yet.**

### Hero shader theme + footer controls — Session 9
User brought the (Session-8-deprecated) shader control FAB back to re-tune the scene, then
shipped. Two things happened:
1. **New theme baked into `DEFAULT_TWEAK`** (`tweakConfig.ts`). MANY palette iterations across the
   session (purple/blue/pink → silver → red/black → charcoal → teal → blue/mauve/pink → …);
   **FINAL shipped preset (magenta/orange):**
   - **Palette:** `colorA` **`#c328e2`** (magenta) / `colorB` **`#000000`** (black) /
        `colorHot` **`#ff781f`** (orange highlight). FooterGlow inherits it live via shared `tweak`
        — footer colors ALWAYS track the hero automatically (user confirmed they should).
   - **`bloom.intensity`** → **3**; **`grade.chromaticAberration`** → **0.002**;
        **`grade.vignetteDarkness`** `1.03` → **`1.27`**; **`path.a1`** → **4.8**;
        **`pointer.pushRadius`** → **2.5**; **hero `particles.count`** `300` → **`1200`**
        (**drift 10**); **`fragments.count`** → **70**. Rest = Session-8 preset.
2. **Live "Footer Glow" controls added.** FooterGlow's density/motion were hardcoded constants; now
   they're a **`footer` group in `tweakConfig`** (`particleCount`, `nodeCount`, `spawnMin/Max`,
   `riseMin/Max`, `lifeMin/Max`) exposed as a rebuild-class slider group in `HeroControls.tsx`.
   `FooterGlow.tsx` reads `tweak.footer` and rebuilds its meshes on `getGeneration()` via
   `useSyncExternalStore` (mirrors the hero's worldObjects pattern) + disposes old geometry/material
   on swap so live count tuning doesn't leak GPU buffers. **Shipped footer values:** particleCount
   **310**, nodeCount **22**, spawn **[-11,-10]**, rise **[8, 19.5]**, life **[12.5, 22]** (denser,
   rises higher, lingers longer than the original 140/11/…).
**FAB is now PERMANENTLY dev-gated** (not manually unmounted) — mounted in Hero.tsx behind
`process.env.NODE_ENV === "development"` (dynamic, ssr:false), so it's ALWAYS in `next dev` and
tree-shaken from prod. User asked for "panel in local only, gone on Vercel." Verified against the
real prod build: `HeroControls`/`Copy config` appear ONLY in a `.map` sourcemap, zero in client
chunks. **Do NOT manually mount/unmount going forward** — see [[shader-fab-dev-gated]].

### Fried-egg loader — Session 9
Implemented Figma node **133-155** (pan with a FRIED EGG replacing the pancake). Swapped the
`pan__cake` ellipse for the egg SVG, reusing the `pan__cake` element so ALL the toss/flip/exit
GSAP physics drive it unchanged. Iterated the egg's isometric tilt HEAVILY with the user (CSS
`skewX/skewY/scaleX/scaleY` on an inner wrapper — many rounds: too flat → too skewed → wider →
recentered). **Final resolution:** the user supplied a **PRE-DISTORTED egg export** (`EggArt`
viewBox **116×64**, perspective baked into the paths) — so the component uses it at NATURAL
proportions with **NO CSS skew/scale**, just seated centered in the bowl via wrapper `left/top/
width` (`left:26% top:44% width:36%`). The old 72×68 upright egg paths were removed. Lesson the
user drove home: **don't stretch the vector** — bake perspective into the art, place it undistorted.

### Footer energy-box bloom — Session 9
Added a **Bloom-only `EffectComposer` pass** to the FooterGlow `<Canvas>` (`@react-three/
postprocessing`, intensity 2.4 / threshold 0.12 / mipmapBlur) + brighter node emissive (hot core
pushed past 1.0) so the energy boxes glow like light sources. Runs only while the footer is
on-screen (existing frameloop gate). Transparency holds (no black-box regression) — verified via
headless capture: boxes bloom, text/wordmark/bg still show through.

### Frying-pan loader (Session 8 — replaced the door)
`src/components/motion/Loader.tsx` fully rewritten from the door intro to the Figma 124:80
frying-pan concept. **The 3D hero-readiness gating + `LOADER_DONE_EVENT` handoff are unchanged.**
- **Loading state:** black void, white line-art pan (Figma SVG inlined as `PanArt`), *cooking*
     label in **EB Garamond Medium Italic** (font added to `layout.tsx` as `--font-eb-garamond`),
     huge bold counter bottom-left. Counter still reflects real load (→90, holds for
     `whenHeroVideoReady`, →100 → "click to enter").
- **Tossing loop — physics-driven pancake flip** (heavily iterated with the user). The final
     mechanic: a **DIP-DOWN then WHIP-UP** flip — pan sinks (bowl tips DOWN via `rotation: -6`,
     pivot at handle `transformOrigin:"90% 10%"`), pancake rides down glued, pan whips up fast
     (`power3.in`); the pancake **launches from BELOW on the up-stroke** as the pan passes rest
     level, arcs a real gravity parabola (rise `power2.out` / fall `power2.in`, matched halves),
     drifts sideways + does ONE flip, then the pan **catches** it with an elastic settle. Pancake
     rests LOW inside the bowl (`top:40%`). Constants: `DIP_DEPTH/DIP_AT/LAUNCH_AT/AIR/APEX`.
     Key fixes the user drove: pan must NOT reverse the instant the pancake lifts; pancake sticks
     with the pan briefly before flying; launch reads as coming from the down-then-up whip.
- **Exit — shape reveal, NO white flash:** on click, one hard flick throws the pancake off-screen
     (`-85vh`), then a **circular hole** (animated CSS `mask` radial-gradient, `--hole` var 0→165
     vmax at 50% 46%) opens from the pan's spot and grows until the hero fills the viewport — the
     site emerges from behind the pan. `LOADER_DONE_EVENT` fires as the hole opens (headline rises
     mid-reveal). Reduced-motion skips it; keyboard works.

### Footer ambient glow (Session 8 — ⚠️ committed to disk, NOT pushed)
`src/components/hero3d/FooterGlow.tsx` — a whisper of the hero ecosystem behind the footer.
- **ONLY particles (square pixel motes, count 96) + energy nodes (fresnel rounded cubes, count
     11)** — NO fibers/lines, NO fragments. **Identical hero visual DNA:** reads palette/intensity/
     drift/breathe/sizes/scales **live from the same `tweak` config** the hero uses, plus the exact
     hero particle+node fragment shaders and fbm drift/twinkle verbatim.
- **Footer-specific motion:** each instance loops its own life — emerges from BELOW the fold,
     rises into the lower third, dissolves; seeds randomise the order (continuous, never synced);
     grows-in on emergence (the "pop"). Deliberately sparse; concentrated at the viewport bottom.
- **Behind all text:** canvas `z-0`, all footer content lifted to `z-[1]`. Cheap (one `uTime`
     uniform/frame), renders only while footer on-screen (IntersectionObserver→frameloop), skips
     on reduced-motion/touch/no-WebGL2 (dynamic `ssr:false` + error boundary). Dials at top of
     file: `PARTICLE_COUNT`/`NODE_COUNT`, `SPAWN_Y`/`RISE`/`LIFE`, emergence envelope.
- ⚠️ **NOT pushed to Vercel** — session ended right after the user approved it locally. The LIVE
     site still shows the pre-glow footer. First action next session (if wanted): `git push`.

### Hero shader preset — BAKED (Session 8)
User tuned the scene on their GPU (purple/blue/pink palette `#811aff`/`#004cff`/`#f93ed7`,
100 fibers, 136 nodes, bloom 2.23, etc.) and handed back the JSON. **Baked verbatim into
`DEFAULT_TWEAK` in `tweakConfig.ts`** (the scene reads `tweak` = clone of defaults, so this IS
the shipped look). **Unmounted `<HeroControls/>` from `Hero.tsx`** (the 🎛 FAB is gone) but
**KEPT `HeroControls.tsx` + `tweakConfig.ts` on disk** per the user — a comment in Hero.tsx
shows exactly how to re-mount the panel for future tweaks. Also: phrase-transition crossfade
added to Hero (outgoing/incoming lines fade opacity during the yPercent swap so the two phrases
don't overlap illegibly over the busy 3D bg).

### Hero shader tweak panel (Session 7 — dev tooling)
A live control surface for tuning the hero 3D scene on the real GPU, then baking a
chosen preset back into source. **DEV-ONLY** — dynamically imported + gated behind
`process.env.NODE_ENV === "development"`, so it's tree-shaken out of production.
**⚠️ Session 8 UNMOUNTED it (preset baked) but kept the code — see above.**

### Hero shader tweak panel (Session 7 — dev tooling)
A live control surface for tuning the hero 3D scene on the real GPU, then baking a
chosen preset back into source. **DEV-ONLY** — dynamically imported + gated behind
`process.env.NODE_ENV === "development"`, so it's tree-shaken out of production.
- **`src/components/hero3d/tweakConfig.ts`** — single module store (`tweak`) holding every
     dial; defaults **exactly mirror** the shipped values (opening the panel changes nothing
     until a slider moves). `setTweak(group,key,val,rebuild)` mutates + emits; `subscribeTweak`,
     `getRevision` (bumps on EVERY change — React post-FX/panel), `getGeneration` (bumps ONLY on
     rebuild-class edits — counts/scatter/worldDepth → mesh re-create). `serializeTweak()` = JSON
     for Copy. `resetTweak()` restores defaults.
- **`src/components/hero3d/HeroControls.tsx`** — schema-driven FAB panel (bottom-right), inline
     styles (zero CSS deps, CSP-safe). Groups: Scene, Palette (color pickers), Bloom, DoF, Grade,
     Path (7 snake constants), Pointer, Fibers, Particles, Nodes, Fragments. **Copy config** →
     clipboard JSON; **Reset**. `↻` marks rebuild-class sliders (live mesh re-create per user's
     "live rebuild" choice); everything else is instant uniform writes.
- **Plumbing that made it live:** promoted GLSL literals → uniforms in `shaders.ts`
     (`uRecessionFloor`, `uWave`/`uBreathe` fibers, `uDrift` particles, node `uBreathe`,
     `uTumble` fragments, per-system `uAlpha`, pointer `uPushRadius`/`uPushStrength`/`uGlowRadius`,
     and **path constants → `uPath1`(f1,a1,f2,a2)/`uPath2`(fy,ay,ramp)** replacing the old
     compile-time `f()`-baked literals — the `f` helper + `import PATH` were removed from shaders.ts).
     Per-system push/glow radii kept their ORIGINAL relative ratios (e.g. particles 0.8×/1.7×,
     fragments 0.8×/0.62×) so defaults reproduce the old look exactly. Added the shared uniforms to
     `SceneUniforms` + `createSceneState` in `SceneState.ts`. **`SceneController`** now reads `tweak`
     each frame → writes shared uniforms (recession/push/glow/path) and routes idleTravelSpeed/
     scrollTravel/intensity-baseline/fovBase/cameraDrift (the old `IDLE_TRAVEL_SPEED`/`SCROLL_TRAVEL`
     consts are gone). **`worldObjects.tsx`** rebuilt: counts/scatter read from `tweak`, meshes keyed
     on `getGeneration()` via `useSyncExternalStore`; per-material uniforms (uAlpha/uWave/…+palette)
     kept in sync via a `useMaterialSync` subscription (no per-frame cost). Palette colors now
     `.clone()` per material (were a shared PALETTE object). **`Scene.tsx`** post-processing split into
     a `<PostFX>` subcomponent subscribed to `getRevision` so bloom/DoF/grade/CA retune live.
     Mounted `<HeroControls/>` in `Hero.tsx` (dynamic, ssr:false, dev-gated).
- ⚠️ **To lock a preset:** user opens panel on GPU → tunes → **Copy config** → pastes JSON → we
     bake values into `tweakConfig` DEFAULT_TWEAK (or straight into shaders/worldObjects/Scene/
     SceneState/SceneController defaults) and **DELETE `HeroControls.tsx` + `tweakConfig.ts` + the
     mount + import in Hero.tsx**. The uniform promotions can stay (harmless) or be re-inlined.
- ✅ typecheck clean; dev server recompiled clean, home SSRs, panel confirmed client-only + dev-gated.
     NOT yet felt on GPU (headless can't run the WebGL scene — that's the whole point of the panel).

### Home flow (Session 6 — the big build)
The home page is now `<Hero />` → `<WorkGallery />` (the old empty "Selected work" block +
`ContactCTA` were removed from `page.tsx`). The full scroll journey:
- ✅ **Door rebuilt to Figma** (`Loader.tsx`, nodes 12:9 rest / 14:7 open). `#191919` void,
     a **WHITE doorway interior** (the light) with a dark panel hinged left that swings inward
     in perspective (`rotateY -78`) revealing the white, which then scales up to fill screen
     and the overlay clears. **NO glow/beam/flash/dive** — earlier glow+9×-dive version was
     scrapped per user. "click to enter" = Plus Jakarta Light Italic 16px.
- ✅ **Hero scene TONED DOWN** (gladeye ref) — fibers thinner (radius `0.006–0.026`),
     **progressive depth attenuation** in all 4 vertex shaders (`depthAtt = mix(0.05, 1.0,
     smoothstep(uDepth*0.65, 10.0, -z))`) so the tunnel melts into darkness with distance;
     near field brighter (base alphas raised); particles `4200→2400`; Bloom `1.15→0.85`,
     threshold `0.08→0.12`. Snake-path bend + scroll-scrubbed travel (`heroScroll.progress`)
     from earlier this session are in place.
- ✅ **Circle wipe** at the hero pin tail (`[data-circle-wipe]`) grows from center, `scale 4.2`
     `power2.in`, fills screen white right at unpin (hero `end: +=235%`). Hands into the gallery.
- ✅ **"MY WORKS." horizontal gallery** (`WorkGallery.tsx`, Figma 101:20 + noth.in motion).
     White, pinned; vertical scroll → horizontal travel of a filmstrip (`containerAnimation`,
     `ease:"none"`). Pinning **gates the footer** (verified: can't reach footer until reel ends).
     **Title assembly**: split M/Y + W/ORKS. — M/W **materialise on APPROACH** (blur+fade+rise,
     separate scrub `top 62%→top 8%`) and **Y/ORKS. trace in from the right on the SAME timeline**
     (offset 0.35) so it's ONE connected gesture, no dead scroll. Title **exits as one unit**
     (`[data-title-group]`) once project 1 is ~70% in-frame. Dead-scroll between white and title
     cut ~780px→~60px via assemble-on-approach (NOT negative margin — that caused a white-bleed
     hourglass bug, reverted). Per-panel reveals are **scrubbed** (was `toggleActions`, which
     desynced on backward scroll and stranded panels hidden — now symmetric fwd/back).
     Data = `lib/placeholderProjects.ts` (5 projects, Sanity-shaped), dark `#2b2b2b` thumbs.
- ✅ **Footer = full-viewport dark finale** (`Footer.tsx`) echoing the hero (`hero-dark` scope,
     header inverts via `data-header-dark`). Absorbs the contact CTA — IS `/#contact`. Content:
     `( Contact )` + coords labels · "Let's build something that ships." · **magnetic email CTA**
     (`riddhimandeb12@gmail.com`, underline sweep) · two balanced columns **INDEX** (nav) +
     **CONNECT** (socials+résumé, placeholder profiles until Sanity filled) · © + **live Pune
     clock** + magnetic **back-to-top** (Lenis glide via `lenisBridge.ts`). Centerpiece: full-bleed
     **RUDYMAN** wordmark, baseline cropped by the fold, letters masked-rise scrubbed to arrival.
- ✅ **Header colors** — hero/footer text pure `#FFFFFF` (was cream `#fffde2`); solid header is
     pure white bg, NO border line, black nav (`header:not([data-over-hero]) nav a` rule).
- ✅ **CASES/PLAYS curves gated to scenes 2–3** — armed from scrub progress (`ARM_AT=0.22`),
     disarm force-closes; never appear/hover in scene 1. **Scroll resets to top on reload**
     (`history.scrollRestoration="manual"` + `scrollTo(0,0)` in SmoothScrollProvider).

### Case studies (Session 6 — PLANNED, not built)
- ✅ **Design brief written**: `docs/case-study-brief.md`. Ran `/shape`. Decisions: **suggested
     spine** (freeform sections each with an OPTIONAL stage label Problem/Approach/Build/Result/
     Tradeoffs); **freeform decisions** (no dedicated Decision block — user wants distinct studies,
     rigor via craft+convention); **AI leverage narrated inline** where real; per-project
     `accentColor` = distinctiveness engine. Schema impact: ONE additive field (a `sectionHeading`
     block carrying the optional stage label). Fix orphaned `ContactCTA` → footer on case-study page.
- ✅ **5 projects identified**: **3 from Flytbase, 1 from ORO, 1 self-project.** Case studies must
     name the employer/context. Flagship NOT yet chosen (user to pick — the one with the full crisp
     arc + most material). Depth will vary (internship sub-projects tighter).
- ✅ **Asset folders scaffolded**: `case-study-assets/{flytbase-project-1..3,oro-project,self-project}/`
     each with a README template (drop cover/thumb/numbered screens/videos + paste the Problem→
     Approach→Build→Result→Tradeoffs story). **Gitignored** (only READMEs tracked). Rename to real
     slugs once user gives project names.
- ⚠️ Existing case-study page (`work/[slug]/page.tsx`) is still the OLD light-theme design and
     references the now-removed `ContactCTA` — needs the redesign pass + the footer swap.

### The Hero internals (Sessions 3–4, still current)

### The Hero (Session 3 — the marquee work)
The home hero is a dark, cinematic, single-section experience built from Figma (25:144 + the
"Reference 1" storyboard 66:2/66:3). It pins and drives everything on one scroll timeline:
- ✅ **Door intro = the loader.** A bare white-wireframe door in a black void with a 0→100
     counter beneath it (`src/components/motion/Loader.tsx`). The counter reflects REAL loading:
     eases to 90%, **holds until the hero video buffers** (`whenHeroVideoReady`), finishes 90→100,
     then "click to enter" unlocks. On click the door swings open into the dark and the overlay
     clips away — **no glow/beam/flash** (bare, per user). Emits `LOADER_DONE_EVENT`.
- ✅ **3D "living ecosystem" background — PRIMARY** (`src/components/hero3d/`, Session 4).
     R3F + three + drei + postprocessing. Infinite forward travel via **world-recycling in the
     vertex shaders** (camera static; instance z wraps a 90-unit depth window against `uTravel` —
     zero per-frame CPU instance work). Four GPU-instanced systems in custom GLSL (`shaders.ts`):
     **FiberField** (240 tubes, fbm wave + breathing + data packets racing along them),
     **Particles** (4,200, drift/twinkle), **EnergyNodes** (42, fresnel halos), **Fragments**
     (64 latent shards, luminous edges). Interaction via ONE smoothed **3D pointer ray** shared by
     all shaders: particles repel + spring back, fibers bend, nodes illuminate on hover; **click**
     fires a propagating energy pulse; **scroll velocity** raises traversal speed (+FOV swell) and
     intensity. `CameraRig` = heavy-inertia drift + breathing float + whisper of roll. Post:
     Bloom/DoF/ChromaticAberration/Vignette/Noise. Perf: additive `depthWrite:false`, one `useFrame`
     heartbeat mutating shared uniforms, `PerformanceMonitor` auto-DPR, frameloop pauses off-screen,
     three dynamically imported (no SSR, out of initial bundle).
- ✅ **Fallback ladder** (`hero3d/HeroCanvas.tsx`): desktop+WebGL2 → 3D scene; touch / no WebGL2 /
     runtime crash (error boundary) → **light-trails VIDEO**; reduced-motion → poster still. Every
     branch signals the door loader (`markHeroVideoReady`), 8s failsafe — door can never deadlock.
- ✅ **Video kept as fallback** (`VideoBackground.tsx`). ffmpeg-transcoded 1080p encodes in
     `public/videos/`: `hero-trails.webm` (VP9 2-pass, **3.58 MB**) + `.mp4` (H.264 CRF20,
     **7.05 MB**) + poster. **57% opacity over #000000** (Figma Fill). Force-plays on `LOADER_DONE`.
- ✅ **`ShaderBackground.tsx`** (ogl) — last-resort fallback inside VideoBackground only.
- ✅ **Pinned phrase flow** — headline cycles `I AM A / PRODUCT—DESIGN / BUILDER` →
     `I TURN / IDEAS—INTO / CODE` → `DESIGNING / THE AGE OF / INTELLIGENCE`, each line masking
     out/in, scrubbed. **Two nested layers per line** (`[data-intro]` for the door-synced reveal,
     `[data-line]` for the scrub) so the two systems never fight over `yPercent`.
- ✅ **CASES / PLAYS curves woven into the hero** (not a separate section — that was deleted, which
     also removed the duplicate shader). Blank white S-wave (exact Figma "Vector 3" path) spawns
     organically from L/R edges during the phrase 2→3 scroll; **blank at rest (no labels)**; on
     hover the wave stretches full-width and the panel content (CASES copy, "2025–Today",
     "Click to view") fades in. `pointerEvents` gated so only the open panel is clickable.
- ✅ **Header** transparent (cream) over any `[data-header-dark]` section, solid on light content;
     re-arms on route change; survives the pinned hero. Brand = **"Rudyman"**; nav = Work · Play ·
     Me · Resume · Contact (14px, `-0.42px` tracking) → home anchors (`/#work` etc.), **pages not built**.
- ✅ **Fonts** = Plus Jakarta Sans via `next/font/google` (500/600/700). `.hero-dark` token scope
     in globals.css (cream `#fffde2` on near-black) — dark is scoped to the hero, rest of site light.

### Everything else (from Sessions 1–2, unchanged)
- ✅ Next 16 + Tailwind 4 + Sanity 6 stack; GSAP + ScrollTrigger + SplitText + Lenis.
- ✅ Layout shell, embedded Studio `/studio`, full flexible CMS schema, typed GROQ, live/draft,
     webhook revalidation, Portable Text renderers, all pages wired, SEO (OG/sitemap/robots).
- ✅ Connected to Sanity project `4bo3ynjd`; production `build` + `typecheck` clean.
- ✅ **Figma Dev Mode MCP** working (`figma-dev-mode` @ `127.0.0.1:3845/mcp`). NOTE: it drops when
     Figma desktop sleeps/closes; a raw MCP client script in scratchpad (`figma-raw.mjs` /
     `figma-shot.mjs`) can fetch context/screenshots directly if the deferred tools aren't loaded.
- ✅ **ffmpeg installed** (winget Gyan.FFmpeg 8.1.2). Not on PATH in a fresh shell — binary at
     `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe`.

### Open items
- ⛔ **No content in Sanity yet** (gallery uses `placeholderProjects.ts`; footer uses placeholder
     socials + hardcoded email fallback in `(site)/layout.tsx`). LIVE site shows placeholders.
- ✅ **Git initialized + on GitHub** (Session 8): `Rudyman267/Portfolio-2026` (private), 3 commits on
     `main`. `Asset videos/` + logs + `.vercel` gitignored; `.vercelignore` mirrors it for CLI uploads.
- ✅ **DEPLOYED to Vercel** (Session 8): live at **https://portfolio-2026-psi-flax.vercel.app**,
     GitHub-connected (auto-deploy on push). SSO protection disabled (public). See §2 + §3 deploy notes.
- ✅ **Footer glow SHIPPED** (Session 9) — pushed + live. Everything through the egg fix (`23cb3e0`)
     is on the live site; nothing pending unpushed.
- ⚠️ **Sanity CORS not added for the Vercel origin** — embedded Studio (`/studio`) + live content won't
     connect on the deployed site until `https://portfolio-2026-psi-flax.vercel.app` is added at
     sanity.io/manage/project/4bo3ynjd/api. Public site still works (placeholders).
- ⚠️ **Tokens pasted in chat this session** (GitHub PATs + Vercel `vcp_` tokens) — user should REVOKE
     them (github.com/settings/tokens, vercel.com/account/tokens). Also the old Claude-Desktop
     `ghp_315k...` from the Session-8 lovable-mcp cleanup. Old blocked Vercel project on the
     `juniorscrolls2017-8889` account can be deleted.
- ⛔ `SANITY_API_READ_TOKEN` / `SANITY_REVALIDATE_SECRET` not set on Vercel (draft preview + webhook
     revalidation inactive — optional, public site fine without).
- ⚠️ **`ContactCTA.tsx` — do NOT delete.** No longer imported by `work/[slug]/page.tsx` (Session 10
     rewrite dropped it — case-study page uses the footer as the contact close). BUT still imported by
     `about/page.tsx` + `work/page.tsx`, so deleting it breaks the build. Leave it.
- ⚠️ Nav anchors (`/#play`, `/#me`, `/#resume`) still point at sections that **don't exist**. `#work`
     (gallery) and `#contact` (footer) now resolve. `#me`/`#play` could map to About/a playground later.
- ⚠️ **Whole cinematic flow verified only in software-rendered headless Chrome** — user must judge
     feel/FPS on a real GPU. Live dials (all documented inline): hero recession `depthAtt` floors +
     `smoothstep(uDepth*0.65, 10.0)` range, fiber radius, Bloom; circle `scale 4.2`; gallery `HOLD()`,
     assembly `start/end` + offsets, per-panel reveal `scrub 0.5` window, title-exit `panelW*0.62`;
     footer wordmark `stagger 0.06`/`scrub 0.6` + size `clamp(4.5rem,17.5vw,21rem)`.
- ⚠️ **Two stacked pins** (hero, then gallery) — ordered via `refreshPriority` (hero=1, gallery=0).
     Negative-margin overlap is FORBIDDEN (caused white-bleed hourglass). Keep them adjacent, not overlapping.
- ⚠️ **R3F v9 TS gotcha:** global JSX augmentation collapses generic `ElementType` JSX tags to `never`
     (TS2745). Polymorphic components render via `createElement` — do the same for any future `as?:` comp.

---

## 7. Next Steps (priority order)

0. **BUILD THE `/play` PAGE** — the About page's game card links to `/play` (currently the styled
   404). Plan: Play page = AI experiments gallery; The Other Hand gets its own page/embed (source
   in gitignored `the-other-hand project/`; DO NOT commit it — it's a separate Vite app).
   Also `#play` + `#resume` nav anchors still have no destinations.
1. **USER TO FEEL THE ABOUT PAGE ON GPU** — whole journey verified only in software-rendered
   headless Chrome. Dials documented inline in `AboutIntro.tsx` (timeline unit positions, pin
   length 1205%, scrub 0.5, photo-shuffle 900ms, rope-unroll windows).
2. **CONTINUE THE LIR CHAPTER-BY-CHAPTER BUILD (user drives, section by section).** Chapters wired so far:
   Context, Problem, Reframe (flash transition + spawns). **Next up: "the shift" (04) → process (05) →
   solution (06) → trade-offs (07) → Impact (08) → reflection (09).** To chapter-ize one: add its id to
   `CHAPTER_IDS` in `LirCaseStudy.tsx`. NOTE the 9 TOC entries currently map to FEWER real sections
   (the-shift→process, solution/trade-offs→decisions, reflection→impact share targets) — user may want
   distinct sections per entry; ask before splitting. The old dark data file
   (`liveIncidentResponse.ts`) still exists on disk but is UNUSED — real content is in `lirDesign.ts`.
   a. **Remaining real image assets** the user still needs to supply/place (map/mobile/annotate/
      translation/session-create/PostHog dashboards) — see the punch-list at the bottom of
      `lirDesign.ts`; some are still labelled placeholders via `Figure`.
   b. **Derive the 4 thinner studies** later (Flytbase 2/3, ORO, self) as their own `lirDesign`-shaped
      files in a `STUDIES` registry. Must name employer.
   d. **Later:** migrate to Sanity (add `sectionHeading` block to `richContent`, `npm run typegen`)
      when the CMS is populated — the local data files are Sanity-shaped for this.
2. **Housekeeping (security):** user should REVOKE the tokens pasted in Session 8 (GitHub PATs +
   Vercel `vcp_` tokens + old Claude-Desktop `ghp_315k...`); delete the old blocked Vercel project on
   the `juniorscrolls2017-8889` account. **Add Sanity CORS** for `portfolio-2026-psi-flax.vercel.app`
   (sanity.io/manage/project/4bo3ynjd/api) so `/studio` + live content work on the deployed site.
3. **Add content in the Studio** (`localhost:3000/studio` or live once CORS added) — Site Settings
   (email/socials/résumé so footer + gallery stop using placeholders), Profile, the 5 Projects. Wire
   `FEATURED_PROJECTS_QUERY` result into `WorkGallery` (replace `placeholderProjects`).
4. **Build remaining nav destinations** — `#me` (About), maybe `#play`. `#work`/`#contact` resolve.
5. **Optional:** set `SANITY_API_READ_TOKEN` + `SANITY_REVALIDATE_SECRET` on Vercel (draft preview +
   webhook revalidation → `/api/revalidate`); update `NEXT_PUBLIC_SITE_URL` env to the vercel.app URL;
   custom domain; per-case-study OG images; real profile URLs; Rive.

---

## 8. Session History

### Session 13 — 2026-07-12 (later same day)
**BUILT THE ENTIRE ABOUT PAGE (`/about`) and SHIPPED EVERYTHING — two commits pushed
(`2f3009f` LIR case study, `4fbf57c` About page + supporting), live at `4fbf57c`.** Long
storyboard-driven session; the user supplied reference frames scene by scene and iterated
tightly on every beat (see Current State §6 "ABOUT PAGE — Session 13" for the full scene map
and dials). Highlights & lessons:
- **One pinned timeline, 6 scenes** (name intro → 22-years+video → NOW-I-BUILD + game card →
  collapsing boundary → process rope unroll → idea-dot + quotes finale). User taste rules that
  emerged: motion mapped to scroll (`ease:"none"`, no decorative staggers), horizontal-only text
  travel, no docking pauses (speed-continuous disappearances), fades > per-letter mask tricks
  (built letter-walls, then reverted to blur+fade on request), occlusion via opaque `bg-bg`
  layers, exact anchor %s from storyboards.
- **GameThumb**: replicating the game's neutral state — ANY radial force + damping collapses a
  brownian field into a blob (orbit decay); pure brownian + edge wrap keeps it uniform. Canvas
  must size from `offsetWidth` (layout), NOT `getBoundingClientRect` (includes GSAP scale).
- **Egg loader physics** (pan pivots at handle → bowl moves MORE than pan y; egg must ride
  dip+ROT_DROP or it floats; exit +8° tilt RAISES the bowl). Catch squash + sizzle idle added.
- **Reload = frame zero**: browsers deferred-restore a clamped scroll AFTER the provider reset
  (pin spacers grow the page late) → Loader re-asserts `scrollTo(0,0)` on mount + at handOff.
  Verified reload from 11000px deep → 0.
- **Seam bug**: a second dark hex (`#050608`) next to hero-dark's `#06080c` = visible band at
  the about→footer boundary → unified everything on `#06080c`. Also the white-hairline artifact
  = body's white showing through a sub-pixel pin-spacer gap → dark wrapper div on the page.
- **Stitching**: nav Me → `/about`; gallery card 1 → real LIR study (cards 2–5 still 404);
  hero phrases → Tanker (single weight — drop font-bold, tracking 0.01em); `/play` link 404s
  until built. `the-other-hand project/` gitignored (separate Vite app, NOT committed).
- **Assets pipeline**: user photos + ending video (VP9 webm 570KB vs mp4 1.28MB) + 7 process
  SVG lockups (labels baked in) copied into `public/about/`.
- **Harness gotcha**: scratchpad CDP scripts must `createRequire(<project>/package.json)` to
  resolve `ws` — bare ESM imports resolve from the script's own dir, not cwd.
- **Ship discipline** per §3: killed dev+chrome, local `npm run build` clean, two feature
  commits, push → Vercel auto-deploy, polled live URLs (all 200). User's browser showed a
  CACHED pre-deploy home page (hero seemed non-Tanker) — live HTML verified correct; hard
  refresh resolves.
- **Ended at:** site live at `4fbf57c` with Home + About + LIR case study stitched. Next: /play
  page, GPU feel-pass on About, remaining case studies. Dev server + all node stopped.

### Session 12 — 2026-07-12
**REBUILT the LIR case study as a LIGHT / EDITORIAL design from Figma (172:56), replacing the
Session-10 dark version. Long iterative session, built chapter by chapter with tight user feedback.**
- Pulled the design via Figma MCP (`get_metadata`/`get_design_context`/`get_screenshot`). Confirmed
  direction with the user: **replace dark → light**, **self-host Tanker**. Built new data model
  (`lirDesign.ts`) + components (`LirCaseStudy`, `lirBlocks`, `Chapter`) + `.lir` token scope.
- **Assets:** real FlytBase drone-mark SVG (user supplied), `flytbase-logo.svg`, `diagram-users.svg`
  (persona split), `thumbnail-1.svg`, `image-1.png`, `scenario.png`, `drone/dock-diagram.png`,
  `heres-the-gap.svg` — all copied from gitignored source folders into `public/case-study/`.
- **Type scale:** iterated hard on sizing. User pushed back that I was guessing → pulled EXACT Figma
  px via MCP and mapped px→rem 1:1 (frame 1920). Later reduced all body text 4px per type. Scaled the
  rail down ~1/3 (white cards, #dcdcdc border). Fixed the **Tanker circular-var bug** (token name ==
  next/font var name → nothing rendered; renamed to `--font-display-tanker`).
- **Layout:** widened container to 1680, rail hangs left, content capped 860 + centered. Persistent
  sticky 2-col grid the whole page.
- **Motion built this session:** (1) **thumbnail intro** changed from opacity-fade (ghosted) → **z-index
  cover reveal** (page rises over the fixed opaque thumbnail). (2) **stat tickers** (`CountUp`) — slow
  2.8s, replay every time in view, handles `<30s`. (3) **chapter flash transition** (`Chapter` +
  `FlashPanel` + `Spawn`) — pinned full-viewport Tanker title flash then scrubbed content spawns;
  supports MULTIPLE flashes per chapter; 55vh lead-in so chapters don't overlap. (4) moving Contents
  scroll-spy highlight.
- **Content wired chapter by chapter with the user:** Overview (hero + Features-shipped close),
  01 Context (hanging drone/dock illos + mixed-weight `richP`), 02 Problem (PROBLEM flash → grey
  "During an emergency" quoteFlash → scenario img + center caption → "Here's the gap" SVG → center CEO
  text), 03 Reframe (REFRAME flash → the "If it sounds like…" paras + matters list MOVED here from
  Problem → single-room lede → persona diagram → audit notes). the-shift→reflection NOT chapter-ized yet.
- **Verification:** typecheck clean throughout; drove the app via raw-CDP headless Chrome (scratchpad
  `cap*.mjs`) capturing each flash/spawn/ticker state. NO prod build; NOT committed/pushed.
- **RAM watch:** user on 16GB with Figma/Discord/Brave open (~2.5–4.8GB free during the session); dev
  server + headless Chrome ran fine, node never spiked near the crash zone. User declined closing
  Discord (on a call). Dev server + all node/headless-chrome stopped at end.
- **Ended at:** everything above built + verified locally, **uncommitted/unpushed**. First move next
  session: `npm run build`, then keep chapter-izing (the shift → …). See Next Steps §1.

### Session 11 — 2026-07-12
- Short session — started the dev server to resume work, then user closed for the day without code
  changes. **No edits made this session.** The LIR flagship case study + loader fix from Session 10
  remain built on disk, **still uncommitted/unpushed**. Live site unchanged (`23cb3e0`).
- Housekeeping only: corrected a stale Open Item (the `ContactCTA` note — that import was already
  dropped from `work/[slug]/page.tsx` in Session 10). Next Steps + Current State from Session 10
  still accurate.
- **Ended at:** dev server + all node stopped. First move next session: review the LIR page, then
  commit + push, then fill the 7 Figma asset slots + `[FILL]` metrics (see Next Steps §1).

### Session 10 — 2026-07-11
Built the **flagship case study — Live Incident Response** (Flytbase project 1), the big
remaining feature from the brief.
- Read the hand-authored copy (`case-study-assets/flytbase-project-1/LIR_case_study_copy.md`).
  User confirmed via Q&A: **LIR = the flagship**; direction = **dark cinematic** (not light
  editorial); wayfinding = **fixed side-rail + inline**. Mid-session user asked for **placeholder
  slots for all images/diagrams** (assets live in Figma, none dropped yet) + **build tables where
  useful**, and shared **gauravi.design/case-business.html** as a STRUCTURE reference (design stays
  ours).
- **Architecture decision:** built as a **typed local data file** (`liveIncidentResponse.ts`,
  Sanity-shaped) + client `<CaseStudy>` island, NOT via Sanity (empty CMS, bespoke copy). Mirrors
  the `placeholderProjects.ts` pattern; migrates to CMS later. Discriminated-union sections;
  Fig.NN labeled media placeholders; `[FILL]` metrics render as muted "Awaiting data".
- **Rewrote `work/[slug]/page.tsx`** to a `STUDIES` slug registry → `<CaseStudy>`. Dropped the
  `ContactCTA` import (footer is the contact close) — but KEPT `ContactCTA.tsx` (still used by
  about + work index; would break build if deleted). Verified this before removing.
- **Fixed loader hang:** the fried-egg loader waited for a hero-ready signal only the home page
  sends → stuck at 90 on `/work/*`. Added `usePathname()` gating + 8s failsafe race. Verified the
  counter reaches 100 → "click to enter" on the case-study route.
- **Verification:** typecheck clean; prod `next build` clean (`/work/live-incident-response`
  prerendered SSG); drove the running app with headless-Chrome/CDP (reduced-motion emulation to
  bypass the loader) — captured poster, decisions, stage-rail (03 lit orange as scrolled),
  mobile (390px, rail hidden, inline numbers). All render correctly.
- Diagnosed the dev-overlay "1 Issue" as a **BitDefender-style extension false-positive**
  (`bis_skin_checked` attrs), NOT our code.
- **Ended at:** case study built + verified locally, **NOT committed/pushed** (user: "work later,
  close for today"). Dev server + all node stopped. Next: commit+push, then fill the 6 image/
  diagram slots + `[FILL]` metrics from Figma/PostHog, then derive the 4 thinner studies.


### Session 1 — 2026-06-14
- Planned the full architecture (Plan agent) and locked all decisions via Q&A.
- Discovered scaffold installs **Next 16 + Tailwind 4** (newer than training data) — read
  bundled docs, adapted to v16 conventions (async APIs, `revalidateTag` 2-arg, Tailwind 4 `@theme`).
- Verified `next-sanity@13` supports Next 16 / React 19.2 / Sanity 6 before committing.
- Built the entire codebase (tokens, motion, layout, Studio, schema, data layer, Portable
  Text renderers, all pages, SEO). Type-checks + production build pass clean.
- User ran `sanity init` → project `4bo3ynjd` (Portfolio-Rudyman, org `o7O6fCcH7`). Wired
  projectId into `.env.local`; confirmed site renders against the real project.
- **Ended at:** ready for content entry + Figma + deploy. See Next Steps.
- Plan file: `C:\Users\LENOVO\.claude\plans\hi-i-want-to-crispy-planet.md`

### Session 2 — 2026-07-03
- Installed GreenSock **GSAP skills** (`npx skills add greensock/gsap-skills`) — 8 skills, security-clean,
  in `.agents/skills/` symlinked to `.claude/skills/` + `skills-lock.json`.
- User chose to **switch animation stack to GSAP + ScrollTrigger** for Awwwards-tier feel, citing refs
  **galekto.com, armory.framer.ai, fromanother.love**. Chose: full premium feature set, Lenis smooth
  scroll, intro loader.
- **Migrated off Framer Motion → GSAP 3.15 + ScrollTrigger + SplitText + Lenis + @gsap/react.** Removed
  `motion` dep, deleted `MotionProvider`/`motion-tokens.ts`. New: `src/lib/gsap.ts` (central setup+tokens);
  `SmoothScrollProvider` (Lenis↔GSAP ticker), `Loader` (intro counter→mask reveal, emits
  `LOADER_DONE_EVENT`), rebuilt `Reveal`/`FadeIn`, new `SplitReveal`/`Parallax`/`Magnetic`. Rebuilt Hero
  (SplitText headline, magnetic CTAs, loader-synced), Header mobile menu, ProjectCard. Added Lenis/loader/
  SplitText CSS to globals.css. All reduced-motion + touch aware. **typecheck + build clean; dev verified**
  (routes 200, SSR intact, no runtime errors).
- Clarified the reference designer's skill list is *their résumé*, not a build spec — our stack (React,
  Tailwind, GSAP, Vercel) is sufficient; Rive/shadcn optional/skippable.
- User shared Figma file (Portfolio Website 2026 AI Builder), frames **66:2 / 66:3**, to use as a **LOOSE
  taste guide**. **Registered Figma Dev Mode MCP** (`figma-dev-mode` @ `127.0.0.1:3845/mcp`) — connected +
  healthy, but tools load only at session start.
- **Ended at:** session must be **restarted** to load Figma MCP tools, then read 66:2/66:3 and do the
  design/theming pass. Nothing committed to git yet.

### Session 3 — 2026-07-03
Designed & built the signature **home hero** from Figma. Big session.
- **Figma MCP debugging:** the `figma-dev-mode` server kept "vanishing" — root cause was a
  **project-key mismatch in `~/.claude.json`** (session resolves cwd as lowercase-drive `e:/...`; the
  server was registered under `E:/...` and `E:\...` variants). Fixed by placing it under the lowercase
  key; documented in memory. Server also drops when Figma desktop sleeps — built a **raw MCP client**
  (`scratchpad/figma-raw.mjs`, `figma-shot.mjs`) that does the initialize→tools/call handshake to fetch
  design context + screenshots even when the deferred tools aren't loaded.
- **Hero built** (see Current State for the full component map). Locked with the user via Q&A:
  door-is-the-loader, click-to-enter, dark hero scoped, video-primary bg, curves woven into the hero.
- **Door loader:** rebuilt as a bare white door (removed the earlier glow/beam/flash per user — "just
  the door like image 3"). Counter now gates on real video load via `heroReady.ts`.
- **Phrase flow bug fixed:** intro reveal + scroll scrub were fighting over `yPercent` and freezing
  lines — solved with **two nested layers per line** (`[data-intro]` vs `[data-line]`), verified by
  reading computed transforms at multiple scroll depths.
- **CASES/PLAYS:** first built as a standalone section, then (per user) **folded into the hero** and the
  standalone section + its duplicate `ShaderBackground` deleted. Rest = blank S-wave tips (no labels),
  hover = full wave + content. Tailwind gotcha found: `translate-*` utilities write the CSS `translate`
  property which STACKS with GSAP `transform` — use inline `transform` for GSAP-driven elements.
- **Video pipeline (did it end-to-end):** installed **ffmpeg** (winget), probed source (3840×2160/24fps/
  10.4s/159 MB), transcoded to 1080p **WebM VP9 2-pass (3.58 MB)** + **MP4 H.264 CRF20 (7.05 MB)** +
  poster. Built `VideoBackground` (video primary @ **57% opacity over #000000** per Figma Fill; poster +
  shader fallbacks). **Fixed the "video stays paused" bug**: coordinated video readiness with the loader
  (door won't unlock until `canplaythrough`; force-play on `LOADER_DONE`) — verified the reveal opens on a
  playing video (`paused:false`, `readyState:4`).
- **Nav:** brand → "Rudyman"; items → Work·Play·Me·Resume·Contact @ 14px → home anchors (pages NOT built).
- All work **reduced-motion + touch safe**; `typecheck` + `build` clean throughout; every state verified
  via scripted headless-Chrome CDP screenshots.
- **Ended at:** hero is done and looks great. Next: gitignore `Asset videos/`, first commit, then build
  the remaining home sections (Play/Me/Resume/Contact) the nav points at.

### Session 4 — 2026-07-03 (later same day)
Replaced the video hero background with a **premium interactive 3D scene** (user brief: "senior
creative developer from Active Theory / Lusion / Resn" — cinematic AI-native designer world).
- Installed **three 0.185 + @react-three/fiber 9 + drei 10 + @react-three/postprocessing 3**.
- Built `src/components/hero3d/`: `SceneState` (shared uniforms, palette), `shaders.ts` (GLSL:
  hash-fbm noise, pointer-ray push/glow/pulse chunks, 4 material pairs), `worldObjects.tsx`
  (instanced FiberField/Particles/EnergyNodes/Fragments), `SceneController` + `CameraRig` (one
  per-frame heartbeat; scroll-velocity → speed/intensity; click pulses), `Scene.tsx` (Canvas + post
  + PerformanceMonitor + first-frame ready signal), `HeroCanvas.tsx` (fallback ladder + error
  boundary + off-screen frameloop pause).
- **Key architecture:** camera static, world recycles in the vertex shader (infinite, seam-free,
  no CPU instance updates). One smoothed pointer ray drives all interaction in every shader.
- **Video demoted to fallback** (still fully wired for touch/no-WebGL2/crash; poster for reduced
  motion). Loader-gating preserved — the scene releases the door on its first painted frame.
- Fixed **R3F v9 JSX-augmentation TS break** (TS2745 on `ElementType` tags) in `Container` /
  `SplitReveal` via `createElement` (see Open items note).
- Verified: typecheck + production build clean; scripted CDP run — door gated on scene readiness,
  all 3 phrases + curve hover work over the canvas. NOT yet felt on a real GPU.
- **Ended at:** user to test the scene feel/FPS on their machine and report tuning preferences
  (speed, palette, density, bloom). Then: gitignore `Asset videos/`, first commit, remaining
  home sections.

### Session 5 — 2026-07-04
Short session — **the dev server was crashing the user's laptop; diagnosed + fixed.** No feature work.
- User asked to run the site locally. `next dev` (default **Turbopack**) panicked during the first
  page compile: rayon thread pool → *"The paging file is too small for this operation to complete."*
  The machine thrashed so hard **Task Manager froze and the laptop force-restarted.** User (understandably)
  said stop starting the server.
- **Diagnosed (read-only):** 15.86 GB RAM, ~9 GB free at idle, pagefile **auto-managed** on C: (9.2 GB
  allocated, only ~240 MB used). Conclusion: not an out-of-memory-overall problem — a **sudden spiky
  allocation outrunning the pagefile's on-demand growth**. Drives: C: 89 GB free, D: 179 GB, **E: 210 GB**
  (the portfolio drive).
- **Failsafe 1 — moved pagefile off C: → fixed on E:** User wanted zero C: space used (and confused it
  with VRAM — clarified: pagefile = virtual memory on disk, not RAM/VRAM). Set a **fixed 16384/24576 MB**
  pagefile on E: via `Win32_PageFileSetting`, auto-manage OFF, C: pagefile removed. User ran the elevated
  PowerShell themselves (needed admin/UAC — the SDK shell is non-elevated; `IsInRole(Administrator)` = False).
  Gotcha: `New-CimInstance` needs `InitialSize`/`MaximumSize` cast to **`[uint32]`** (plain ints → "Type
  mismatch"). Rebooted; verified **active** pagefile is now `E:\pagefile.sys` 16 GB.
- **Failsafe 2 — disabled Turbopack.** `dev` script was already just `next dev`, but **Turbopack is the
  Next 16 default** — confirmed via bundled docs that **`--webpack`** opts out. Changed `package.json` →
  `"dev": "next dev --webpack"`.
- **Verified the fix end-to-end:** started dev in background, watched RAM + node RSS live through the first
  compile. Log showed **(webpack)**; homepage returned **HTTP 200 in ~34s**; node peaked ~1.8 GB with
  ~6.5 GB RAM free throughout — **no thrash, no crash.** Stopped the server at end of session
  (`Get-Process node | Stop-Process -Force`).
- Also answered the user's worry: **hosting will NOT crash like this** — the platform builds once on its own
  servers and serves pre-compiled output; recommended **Vercel** so the laptop never runs the heavy build.
- **Ended at:** dev server now safe to run (background + memory-watch discipline in §3). Work resumes
  next session. Unchanged backlog: gitignore `Asset videos/`, first commit, remaining home sections.

### Session 6 — 2026-07-09
Large build session — completed the home experience end-to-end and planned the case studies.
- **Snake-path hero + scroll-scrubbed travel** (gladeye ref): world bends along an S-curve in the
  vertex shaders (`PATH_GLSL` / `PATH` in SceneState), travel scrubbed to hero scroll via
  `heroScroll.progress`. Pointer push softened to gaussian falloff (was aggressive `smoothstep`
  kink). Fragments → pixel-cubes, particles → square sprites, nodes → rounded cubes.
- **Door REBUILT to Figma** (12:9 / 14:7). Scrapped the earlier glow+beam+9×-dive version entirely
  (user: "no weird glow or random door effects"). Now: white doorway interior (= the light), dark
  panel swings inward in perspective revealing it, white scales up to fill + overlay clears. Clean.
- **"MY WORKS." horizontal gallery built** (`WorkGallery.tsx`) — the session's biggest piece. Figma
  101:20 layout + noth.in motion. Pinned; vertical→horizontal filmstrip travel; footer gated by the
  pin. Iterated HEAVILY with the user on the title assembly: split M/Y + W/ORKS., materialise-on-
  approach so M/W + Y/ORKS. form as ONE connected gesture, exit as one unit once project 1 is ~70% in.
  Killed the blank-white dead-scroll (~780px→~60px) — first tried a negative-margin overlap which
  caused a **white-bleed hourglass bug** (gallery white showing through the dark hero), reverted, then
  solved correctly with assemble-on-approach. Fixed backward-scroll asymmetry (panels stranded hidden)
  by switching per-panel reveals from `toggleActions` → `scrub`. Circle wipe tuned (`scale 4.2`, fills
  at unpin). Placeholder data in `lib/placeholderProjects.ts`.
- **Footer redesigned** into a full-viewport dark finale (`Footer.tsx`) — echoes the hero, absorbs the
  contact CTA (removed `ContactCTA` from `page.tsx`), giant **RUDYMAN** wordmark (masked-rise scrubbed),
  magnetic email CTA (`riddhimandeb12@gmail.com`) + back-to-top (Lenis glide via new `lenisBridge.ts`),
  live Pune clock, two balanced columns **INDEX** + **CONNECT** (renamed from "Sitemap"/"Elsewhere").
- **Header/hero colors** → pure `#FFFFFF` (was cream); solid header pure-white, no border, black nav.
- **CASES/PLAYS curves gated to scenes 2–3** (progress-armed, `ARM_AT=0.22`); **scroll resets to top
  on reload** (`scrollRestoration="manual"`). Fixed a Bitwarden hydration warning (`suppressHydrationWarning`).
- **Case studies PLANNED** via `/shape` → `docs/case-study-brief.md`. Suggested spine, freeform decisions,
  inline AI narration, per-project accent. 5 projects = 3 Flytbase + 1 ORO + 1 self (must name employer).
  Scaffolded gitignored `case-study-assets/*/` folders with README templates. Flagship not yet chosen.
- typecheck clean throughout; every beat verified via scripted headless-Chrome CDP sweeps. NOT felt on GPU.
- **Ended at:** home flow complete. Next: user picks flagship + drops assets/story → build the flagship
  case-study page against real content (add `sectionHeading` stage-label block, swap orphaned ContactCTA).
  Still no git commits.

### Session 7 — 2026-07-09 (later same day)
Focused tooling session — built a **live hero-shader tweak panel** so the user can dial the 3D scene
in on their real GPU (headless can't render WebGL) and hand back a preset to bake in.
- **Safe dev-server start** per §3: checked free RAM (2.63 GB at start — tight but pagefile healthy on
  E:), confirmed the running `node` (PID 2808) was an **unrelated `lovable-mcp-server`**, not ours.
  Started `next dev --webpack` in background, watched RAM live through first compile — **Ready in 6.5s,
  home HTTP 200, node peaked ~1.4 GB, free RAM held ~1.5 GB, no thrash.** Stopped cleanly at end
  (`Get-Process node | Stop-Process`, excluding PID 2808) — free RAM back to 3.08 GB.
- **Built the tweak system** (see Current State §6 "Hero shader tweak panel" for the full component
  map). User asked for: rework ALL FOUR systems via an on-site controller with per-system + scene-wide
  dials, as a floating-action-button menu, dev-only, with **Copy config** export and **live rebuild**
  on count changes (both confirmed via Q&A). Delivered `tweakConfig.ts` (store + generation/revision
  counters), `HeroControls.tsx` (schema-driven FAB, 11 groups, sliders/color-pickers), promoted the
  key GLSL literals → uniforms (recession/wave/breathe/drift/tumble/alpha/pointer/**path**), rewired
  `SceneController` (per-frame uniform writes), `worldObjects.tsx` (`useSyncExternalStore` on generation
  for rebuilds + `useMaterialSync` subscription for live uniforms), `Scene.tsx` (`<PostFX>` subscribed
  to revision), mounted dev-gated in `Hero.tsx` (dynamic, ssr:false).
- **Defaults exactly mirror shipped values** (opening the panel is a no-op until a slider moves);
  per-system pointer ratios preserved so the default look is byte-for-byte the old scene.
- typecheck clean; dev recompiled clean; panel confirmed client-only + dev-gated via SSR probe.
- **Ended at:** panel ready. Next session: **user tunes on GPU → Copy config → paste JSON → we bake
  the preset into defaults and DELETE the panel + store + mount.** Then back to the case-study track.
  Still no git commits.

### Session 8 — 2026-07-09 (later same day)
Big session — new loader, preset baked, phrase crossfade, footer glow, and **first-ever git commits +
LIVE Vercel deploy.**
- **Baked the hero-shader preset** the user tuned on their GPU (purple/blue/pink palette, 100 fibers,
  136 nodes, bloom 2.23, dip/whip constants) → verbatim into `DEFAULT_TWEAK` in `tweakConfig.ts`.
  **Unmounted `<HeroControls/>`** from Hero.tsx (🎛 FAB gone) but **KEPT the panel + store code** on
  disk per the user, with a comment showing how to re-mount. Also killed a stray `lovable-mcp-server`
  (unrelated project) permanently — removed it from Claude Desktop's `claude_desktop_config.json`
  (flagged a plaintext GitHub token in there to revoke).
- **Phrase-transition crossfade** in Hero — outgoing/incoming headline lines now fade opacity during
  the yPercent swap so the two phrases don't overlap illegibly over the busy 3D bg.
- **REPLACED the door loader with a frying-pan loader** (Figma 124:80) — see Current State §6 for the
  full spec. Heavily iterated the pancake-flip PHYSICS with the user across ~6 rounds: pivot at the
  handle, launch from a DIP-DOWN→WHIP-UP (not a flick from rest), pancake rides down glued + sticks
  briefly + launches from below on the up-stroke, pan must not reverse the instant it lifts, gravity
  arc + elastic catch, pancake rests low IN the bowl, bowl tips DOWN on the dip. Exit = pancake thrown
  off-screen + a circular CSS-mask hole opens from the pan revealing the hero (NO white flash). Added
  EB Garamond font. Every beat verified via headless-Chrome CDP traces (sampled transform.m42 over
  time to confirm the arc + coupling numerically) + frame captures.
- **Footer ambient glow** (`FooterGlow.tsx`) — user brief: hero-DNA particles + energy blobs (NO
  lines), rising from below the fold behind ALL footer text, sparse + randomized. Reads palette/dials
  live from the same `tweak` config; exact hero fragment shaders; per-instance life-cycle
  emerge→rise→dissolve. Counts bumped 64→96 particles / 7→11 nodes on user request. **Committed to
  disk but NOT pushed** (session ended right after local approval → live site is one commit behind).
- **DEPLOYED** (the milestone). Decisions via Q&A: GitHub repo + Vercel, test build locally first,
  personal git identity `riddhimandeb12@gmail.com`. **Local `npm run build` passed clean (30.6s, ran
  on Turbopack, no crash)** — stopped the dev server first to free RAM (crash discipline). Installed
  `gh` CLI. **Fought through token-scope hell** (fine-grained PATs kept lacking Contents:write; classic
  `repo`-scoped token finally worked). First 2 commits → pushed to `Rudyman267/Portfolio-2026`
  (private). Then Vercel: the `juniorscrolls` account's project got **BLOCKED** (commit-email not
  matched + the `dist`/framework + `.vercelignore` 100MB + SSO-protection issues — ALL now documented
  in §3). **User switched to their own Vercel account** (`riddhimandeb12-1923`, team `portfolio-27`);
  created a GitHub-LINKED project via API, set env vars, triggered a GitHub deploy → **built READY**,
  disabled SSO protection → **LIVE + public at https://portfolio-2026-psi-flax.vercel.app.** Auto-deploy
  on push is wired. Committed `vercel.json` + `.vercelignore` (3rd commit, pushed).
- **Working style agreed:** local iterate + verify → push when ready → Vercel shows it. Dev server only
  when the user must feel GPU/motion.
- **Ended at:** site is live. ⚠️ Footer glow needs a `git push` to go live. Housekeeping open: revoke
  the pasted tokens, add Sanity CORS for the Vercel origin, delete the old blocked Vercel project.
  Next feature: case studies.

### Session 9 — 2026-07-10
Short focused session — **re-tuned the hero-shader theme** (new palette) via the dev tweak panel.
- User: "start dev server and launch the shader control UI FAB that we deprecated — I need to tweak
  the colors again." The panel was UNMOUNTED (not deleted) in Session 8; `Hero.tsx` had a comment
  with the exact re-mount recipe. **Followed it:** re-added `import dynamic from "next/dynamic"`,
  re-declared the dev-gated `HeroControls` (dynamic import, `ssr:false`, `NODE_ENV==="development"`
  so it's tree-shaken from prod), mounted `<HeroControls/>` in the hero section.
- **Safe dev-server start** per §3: checked free RAM (3.5 GB, no stray node), cleared `.next/dev`
  lock, started `next dev --webpack` in background, watched RAM through first compile — **home
  HTTP 200, node peaked ~1.67 GB, ~1.8 GB free, no thrash.** (Webpack, not Turbopack.)
- User tuned on their GPU → **Copy config** → pasted JSON back. **Baked into `DEFAULT_TWEAK`.**
  User first tried a silver/dark-teal preset, then said "nvm" and handed a final one: **only the
  palette changed** from Session 8 → purple/blue/pink to **red `#ff4747` / black `#000000` /
  white `#ffffff`** (all other dials unchanged). FooterGlow inherits the palette live (same `tweak`).
  (NOTE: the entry above captured only the first hour. The session then ran LONG — see below.)
- **Then it became a big multi-ship session.** After more palette rounds the FINAL preset landed on
  **magenta `#c328e2` / black / orange `#ff781f`** (+ bloom 3, 1200 particles/drift 10, CA 0.002,
  fragments 70, push 2.5). Added a live **"Footer Glow" control group** (`tweak.footer` → sliders in
  HeroControls; FooterGlow rebuilds meshes on generation, disposes old buffers). Footer values
  bumped to 310 particles / 22 nodes / higher rise / longer life.
- **Fried-egg loader** (Figma 133-155): pancake → egg. Long tilt iteration, resolved by the user
  handing a **PRE-DISTORTED egg vector** (116×64, perspective in the paths) → used undistorted,
  centered in the pan. Lesson: don't stretch the vector.
- **Footer energy boxes now GLOW** — Bloom `EffectComposer` pass on the FooterGlow canvas + brighter
  node emissive. Transparency verified intact.
- **🎛 FAB made PERMANENTLY dev-gated** (user: "panel in local only, gone on Vercel"). No more
  mount/unmount; verified absent from prod build (sourcemap-only). Saved [[shader-fab-dev-gated]].
- **SHIPPED — 3 pushes:** `21bd9d0` (footer glow + blue/mauve/pink theme + footer controls),
  `a21bc92` (magenta/orange + footer bloom + egg + permanent FAB), `23cb3e0` (pre-distorted egg,
  centered). Each: stop dev → prod build (crash-safe, ~21-33s clean) → commit → push → Vercel
  auto-deploys. Verified every step via headless-Chrome captures + typecheck + build.
- **Ended at:** everything live at `23cb3e0`, nothing pending. Dev server stopped, RAM freed.
  Backlog unchanged: case studies (main feature), housekeeping (revoke Session-8 tokens, add Sanity
  CORS for the Vercel origin), CMS content. Next feature session → case studies (§7.2).
