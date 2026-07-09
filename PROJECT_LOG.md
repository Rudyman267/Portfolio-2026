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
| Domain | Ship on free **`*.vercel.app`** first; custom domain later |
| Sanity account | **Personal account** |
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

## 6. Current State (as of Session 7)

**Status: full home experience built end-to-end — dark hero → white "MY WORKS."
horizontal gallery → dark footer finale. Session 7 added a DEV-ONLY live hero-shader
tweak panel (🎛 FAB) so the user can dial the 3D scene in on a real GPU and hand back
presets. Case-study structure planned (brief written), asset folders scaffolded.
typecheck clean throughout. No CMS content yet; not deployed; still no git commits.**

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
     socials + hardcoded email fallback in `(site)/layout.tsx`).
- ⛔ **No git commits yet.** Untracked: `.agents/`, `.claude/`, `skills-lock.json`, all session source,
     `public/videos/*`, `case-study-assets/*/README.md`, `docs/`. **`Asset videos/` (159 MB source mp4)
     already in `.gitignore`?** — verify before first commit; only ship the compressed `public/videos/`.
- ⛔ Not deployed. `SANITY_API_READ_TOKEN` not set (draft preview inactive).
- ⚠️ **`ContactCTA.tsx` now unused on the home flow** but still imported by `work/[slug]/page.tsx`
     (case-study page) — that page is pre-redesign and needs the footer swap. Don't delete ContactCTA
     until that page is redone (or it'll break the build).
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

0. **User judges the full home flow on real GPU** (door → hero recession → circle → gallery assembly
   → footer) and reports feel/FPS. Dials listed in Open items. **NEW: use the 🎛 dev tweak panel
   (bottom-right) to tune the hero scene live**, then **Copy config** and paste the JSON back so we
   bake the preset in and delete the panel (`HeroControls.tsx` + `tweakConfig.ts` + Hero.tsx mount).
1. **CASE STUDIES — the current focus** (brief in `docs/case-study-brief.md`, confirmed):
   a. **User picks the flagship** + gives real project names (rename `case-study-assets/*` slugs).
   b. **User drops assets + rough story** into the flagship's `case-study-assets/<slug>/` folder
      (screens/videos + Problem→Approach→Build→Result→Tradeoffs in the README).
   c. **Add the `sectionHeading` block** (optional stage label) to `richContent`; run `npm run typegen`.
   d. **Build the flagship case-study page** against real content — redesign `work/[slug]/page.tsx`
      to the cinematic direction, swap orphaned `ContactCTA` → footer, scrubbed section reveals,
      stage wayfinding. Then derive the thinner studies. Must name employer (Flytbase/ORO/self).
2. **First git commit** — verify `Asset videos/` gitignored; track all session source, `public/videos/*`,
   `case-study-assets/**/README.md`, `docs/`; keep `.claude/settings.local.json` ignored. Branch off `main`.
3. **Add content in the Studio** (`localhost:3000/studio`) — Site Settings (email/socials/résumé so
   footer + gallery stop using placeholders), Profile, the 5 Projects. Wire `FEATURED_PROJECTS_QUERY`
   result into `WorkGallery` (replace `placeholderProjects`). Add CORS origin if prompted.
4. **Build remaining nav destinations** — `#me` (About), maybe `#play`. `#work`/`#contact` resolve.
5. **Set `SANITY_API_READ_TOKEN`** for draft preview; **deploy to Vercel** (env vars, prod CORS, webhook
   → `/api/revalidate`, update `NEXT_PUBLIC_SITE_URL`).
6. Optional later: custom domain, per-case-study OG images, real profile URLs, Rive.

---

## 8. Session History

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
