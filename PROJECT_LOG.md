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

### ⚠️ GSAP rules this codebase has been bitten by (read before touching an animation)
1. **Never call `ScrollTrigger.getAll().forEach(t => t.kill())` in a component's cleanup.**
   `.getAll()` is PAGE-WIDE — it kills sibling components' triggers too. `useGSAP` already
   auto-reverts everything created inside its scope, so the manual kill is redundant *and*
   destructive. This froze the /work heading mid-scrub for two sessions (`3767462`).
2. **`yPercent` resolves against EACH element's own height.** Tweening `[bigThing, smallThing]`
   with one `yPercent` moves them different pixel distances and they visually come apart. To move
   several elements as one unit, wrap them and animate **the wrapper** (`4f8584e`).
3. **Prefer `fromTo` + `immediateRender: false` for scrubs.** A bare `.to()` captures "whatever
   the value is right now" as its start — nondeterministic if an entrance is still mid-flight,
   and it makes the scrub non-reversible.
4. **`autoAlpha` writes `visibility`, not just `opacity`.** A child left at `visibility:hidden` by
   an interrupted entrance can NEVER be recovered by fading an ancestor. If a parent owns the
   fade, `clearProps` the child's `opacity,visibility` when its entrance lands.
5. **NEVER decide scroll DIRECTION from scroll POSITION, and don't use ScrollTrigger's `snap`
   for reader-facing auto-scroll.** Any position threshold has a "below the line" branch that
   scrolls the reader backwards against their own gesture, and ST's snap only decides ~1.1s AFTER
   the gesture (it waits for `getVelocity() < 10`). Direction comes from the wheel event.
   **Four commits were spent relearning this — full account in §6 "THE SCROLL ESCALATOR".**
6. **`gsap.matchMedia()` callbacks re-run whenever the query re-evaluates** — which iOS Safari
   does when the browser toolbar collapses mid-scroll (Android does not, which is why iOS-only
   bugs here are usually this). So: never cache element references across a re-run
   (`gsap.quickSetter` does), and never put page-wide side effects in a matchMedia cleanup.

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

## 6. Current State (as of Session 26)

**Status (as of Session 26): LIVE ON `rudyman.com`. The scrolly-telling scroll model on the home
hero and `/about` was rebuilt from the ground up after four failed threshold-based attempts — the
reader's WHEEL EVENT now drives the escalator directly on desktop, ScrollTrigger's `snap` is off
there entirely, and pacing is a single px/sec knob.** Five commits (`c4c7052`, `5b7f15c`,
`f4b0710`, `a385d0a`, `fcbf1ce`), all pushed and verified live.
**THE LINK TO SHARE IS `https://rudyman.com`.**

### 🥇 THE SCROLL ESCALATOR — REBUILT — Session 26
Read this whole section before touching `Hero.tsx`, `AboutIntro.tsx`, `SmoothScrollProvider.tsx`
or anything in `src/lib/escalator*`/`scrollIntent`. The bug took five commits and the first four
were all the SAME mistake in different clothes.

**The complaint:** on the hero and the /about scrolly, "I scroll down a little and it takes me
back to the same text", plus "way too fast on a MacBook" (Windows felt fine).

#### ⚠️⚠️ RULE ZERO: NEVER DECIDE SCROLL DIRECTION FROM SCROLL POSITION
Four shipped attempts derived "which way is the reader going" from how far the scroll position had
travelled, against a threshold:
| Attempt | Model | Why it failed |
|---|---|---|
| original | fraction of the segment (`SNAP_FWD/REV = 0.5`) | anything short of halfway snapped back |
| 1 (`c4c7052`) | same, lowered to `0.15` | segments are wildly different LENGTHS, so 15% is a different number of real px at every point; on long segments a deliberate nudge still fell short |
| 2 (`f4b0710`) | absolute 22px + anchor sign | same class — the fallback for "no intent" was nearest-rounding, which is a 50% threshold wearing a hat |
| 3 | (any threshold) | — |

**EVERY threshold has a "below the line" branch, and that branch scrolls the reader BACK to where
they started. That IS "the page moved against my gesture."** No value of the number fixes it. The
user diagnosed this before the code did: *"the threshold approach is wrong since it can lead to
users scrolling in one direction and the page moving in another."*

Scroll position is also a LAUNDERED signal: by the time it is read it has been through Lenis'
easing AND ScrollTrigger's scrub lag, so a short deliberate gesture settles barely off the anchor
and falls under any guard at all.

#### ⚠️⚠️ WHY SCROLLTRIGGER'S `snap` CANNOT DO THIS (read the source, it settles it)
`node_modules/gsap/ScrollTrigger.js` ~line 1103: the snap decision runs inside a
`gsap.delayedCall` that only fires once `Math.abs(self.getVelocity()) < 10`. Under Lenis
(`duration: 1.1`) that is **~1.1s of free-scrubbing drift AFTER the reader's gesture**, plus
`snap.delay`, before anything is decided. That one fact produces all three symptoms at once:
- **the gap** — a visible pause where nothing has committed;
- **the bounce** — the reader has already drifted somewhere else, so committing means moving them;
- **the inconsistency** — where they drift to depends on gesture strength, so "scroll manually"
  and "flick and let go" land in different places.
ScrollTrigger's snap is BY DESIGN *wait for the scroll to stop, then decide*. The brief was
*decide at the moment of input*. It is the wrong tool; do not go back to it on desktop.

#### THE MODEL NOW — `src/lib/escalatorDrive.ts` (desktop) + `escalatorSnap.ts` (touch)
- **`scrollIntent.ts`** — reads the signed `deltaY` off the wheel event itself, plus keys
  (incl. Shift+Space) and touch. One notch down is as unambiguous as ten; nothing downstream can
  turn it into "up". `take()` CLEARS on read so one gesture can only ever cause one ride.
- **`escalatorDrive.ts` — DESKTOP. The wheel event starts the ride, same frame.** No threshold, no
  waiting, no drift to correct afterwards. Lands on the first reveal PAST the stop point in the
  asked-for direction — never the one behind it (landing behind is a visible bounce-back even when
  the net move is forward). `snap` is `undefined` on desktop; two systems moving the scroll fight.
- **`escalatorSnap.ts` — TOUCH / reduced-motion only.** Intent-based, still no threshold, but it
  goes through ScrollTrigger's snap because there is no Lenis instance to drive there.

#### ⚠️ THE THREE NON-OBVIOUS FACTS THE DRIVE DEPENDS ON
1. **Lenis' `Animate.fromTo` calls `onStart` SYNCHRONOUSLY** (`lenis.mjs` line 118). So
   `scrollTo(..., {lock: true})` sets `isLocked` DURING our own call, and Lenis' own wheel handler
   — which runs after ours, since child effects register before the provider's — hits its
   `isLocked` early-return (line 611). **The two cannot fight.** If this ever changes, fall back to
   `lenis.stop()` + `force: true` + `lenis.start()`, and keep a failsafe timer.
2. **`reset()` clears the lock BEFORE `onComplete`** (line ~832), so the lock can never strand the
   page. A failsafe `setTimeout` backs it up anyway — a page you cannot scroll is far worse than a
   missed step.
3. **ONE GESTURE = ONE REVEAL, gesture boundary = 100ms of wheel silence.** ⚠️ *This is what stops
   macOS running away.* A Mac flick does NOT end when the fingers lift — the OS streams momentum
   wheel events at ~120Hz for over a second. **Any rule of the form "events are still arriving =
   the reader is still asking" takes 3-4 steps on a Mac and 1 on a Windows wheel** — which is
   exactly the platform split being fixed. Momentum never leaves a 100ms hole; a human cannot flick
   twice inside 100ms. A second flick arriving mid-ride is QUEUED, not lost.

#### PACING — one knob, `RIDE_PX_PER_S` in `escalatorDrive.ts`
Speed is in **scroll px/sec (430)**, clamped 0.9–1.8s — deliberately NOT a flat duration:
- the gaps are not equal (a phrase-hold gap vs a works-beat exit span are very different
  distances), so one duration made the long steps fly and the short ones crawl;
- it decouples feel from geometry, so retuning a section's pin length can no longer silently
  change how fast it reads.
**Lower `RIDE_PX_PER_S` = slower. Tune there and nowhere else.**

⚠️ **`RIDE_MAX_S` MUST STAY ABOVE THE LONGEST GAP, or it silently turns the speed back into a
duration for exactly the longest rides — making the biggest transitions the FASTEST.** That
shipped at 1.8s and was reported as *"'HERE'S SOME OF MY WORK' just gets insta scrolled... it feels
like I'm scrolling age of intelligence and here's my work at the same time as one thing."* The
works heading sits between the two LONGEST gaps in the journey, so it was the one scene ridden
into AND out of far above everything else's pace. Cap is now **3.0s**; nothing clamps.

**THE MEASURED HERO — the real rest table** (read out of a live production build; pin spacer
**7249px**, timeline **17.75 units**, **8 rests**, 4 project beats). Keep this: deriving it from
the tween durations by hand was attempted twice and was wrong both times.
| # | unit | px | gap | ride | what it is |
|---|---|---|---|---|---|
| 0 | 0 | 0 | — | — | p1hold — "I AM A PRODUCT—DESIGN BUILDER" |
| 1 | 1.77 | 723 | 723 | 1.68s | p2hold — "I TURN IDEAS—INTO CODE" |
| 2 | 3.54 | 1446 | 723 | 1.68s | p3hold — "DESIGNING THE AGE OF INTELLIGENCE" |
| 3 | 5.60 | 2287 | 841 | 1.96s | **"HERE'S SOME OF MY WORK"** (`worksStart + 0.9`) |
| 4 | 8.38 | 3422 | 1135 | 2.64s | project 1 window |
| 5–7 | 11.28 / 14.18 / 17.08 | … | 1184 | 2.75s | projects 2–4 |

**Every gap runs at 429–431 px/s** and the longest ride (2.75s) clears the 3.0s cap. There is no
rest after project 4, so the reader free-scrolls the last ~274px out of the pin into the footer.

⚠️ **NO REST ON THE BLANK TUNNEL.** There used to be a second snapSpan per beat at `E + EXIT` —
the clean tunnel after a card exits. It is a legitimate stopping point that shows NOTHING (the bare
shader, no card), so a flick off a case study parked the reader on an empty screen: *"a flick back
up sometimes just shows the empty shaders in the background and stays in that limbo"* — on desktop
too. Gone; the neighbouring project window is now the next rest either way, so one flick carries the
current study out AND the next one in. The heading had already had its blank-tunnel rest removed for
exactly this reason; the two were inconsistent and the beat one was wrong.

⚠️⚠️ **NEVER PUT A DWELL SPACER BETWEEN A REST AND THE TRANSITION THAT LEAVES IT.** Empty
`.to({}, {duration})` tweens sat right after `p2hold` (0.5u), `p3hold` (0.35u) and the works heading
(0.5u). A spacer is scroll distance in which NOTHING animates, and because the rest sat at its
START, every flick burned it before anything moved — 203px/~470ms, 142px/~330ms, 122px/~280ms
respectively, while the project beats (rest at `E-0.07`) were already seamless at ~66ms. That is
both *"the gap between the flick register and next beat is still too much"* AND the earlier *"the
delays are random too for each beat"* — the delay differed per beat because the spacers did.
**The escalator makes dwell FREE: the reader parks on a rest indefinitely.** Buying dwell with
scroll distance only ever costs responsiveness. All three are deleted; every rest is now flush
against its outgoing transition. (This is also why the pin shrank 7745→7249 and the timeline
19.1→17.75 units.)

#### ⚠️⚠️ LAZY vs FREE — the PUSH model (`escalatorDrive`'s single most important idea)
The brief: *"I want the escalator to help only when I am lazy scrolling — that's what's happening
currently, it's perfect. Just when I scroll freely let me do that without getting me stuck at
beats."*

The devices' event streams are nothing alike, and everything in `escalatorDrive` exists to paper
over that:
| device | one physical gesture emits |
|---|---|
| mouse wheel | ONE event per notch. A **flick** is a fast spin, ~20–80ms apart; deliberate single notches are 120ms+ |
| trackpad | HUNDREDS of events ~8ms apart — the fingers, then a momentum tail running 1s+ after they lift |

**Two ideas, and they do different jobs:**
1. **BURST** — everything until `BURST_END_MS` (500ms) of quiet is ONE gesture, and is worth
   **exactly ONE beat**, however many events it contains. This is the only formulation that makes a
   flick one beat on BOTH devices at once.
2. **SUSTAIN** — when to stop helping. **NOT a count of events.** The one thing that truly separates
   a flick from real scrolling is that **momentum DECAYS and a reader still scrolling does not**:
   `t - burstStart > FREE_AFTER_MS (400) && |delta| >= burstPeak * SUSTAIN_RATIO (0.5)`.
   At 400ms a flick's tail is ~25% of its peak; a wheel spin is still at 100%. The time gate also
   covers a flick's own ramp-up, where delta is by definition at the running peak.

```
a burst         → ride to the next reveal, and ONLY the next one
sustained input → hand the scroll back (free scrolling)
```
Going further than one beat is a NEW gesture — 500ms of quiet re-arms it. That cannot strand a
reader mid-ride, because the other exit stays open: keep scrolling and SUSTAIN hands the whole
scroll back.

⚠️ **TWO COUNT-BASED VERSIONS FAILED FIRST — that is why this is spelled out.**
- *"a second **gesture** (>100ms gap) hands over"* — fine on a trackpad, broken on a mouse wheel
  where **every notch is >100ms apart**: it handed over, re-armed and handed over again on each
  notch → *"a lot of hiccups and friction, and the delays are random too for each beat."*
- *"**3 pushes** hands over"* (with a 45ms push gap) — a fast 3-notch flick counted as 3 pushes,
  tripped free mode, **cancelled its own ride** and stalled waiting to re-seat → *"when I flick the
  gap is too long between the transition."*
- *"**each push extends the ride** by one more reveal"* (push gap raised to 90ms) — added to stop a
  nudge mid-ride being swallowed, but a mouse-wheel flick's notches straddle EVERY gap threshold
  you might pick, so a 3-notch flick advanced **3 beats** → *"I am now skipping two beats in one
  flick."* ⚠️ **`PUSH_GAP_MS` IS GONE ENTIRELY** — counting events at any threshold was the bug.
  One-step-per-burst subsumes it, since the first event of a new burst is separated by definition.
The sustain test also subsumed a bolt-on "delta spike + ramp guard" heuristic that existed only to
catch a second trackpad flick arriving mid-momentum; that whole mechanism is gone.

⚠️ **A push while a ride is in flight EXTENDS the journey — it must not be swallowed.** `step()`
counts from `target`, not the live position, so a nudge mid-ride rides one reveal further. Dropping
this was the *"waits for the scene to set before going next"* complaint: rides run up to 3s, and a
reader who nudged again during one got nothing at all. (Repeated pushes inside one burst never
reach this path — they hand the scroll back instead.)

**Re-seating.** After free scrolling stops (`RESEAT_DELAY_MS`, 260ms), the reader is glided onto
the next reveal in the direction they were already travelling, so they are never parked
mid-transition. Safe where ScrollTrigger's snap was not, because the direction is the reader's own
last input — it can only carry them ONWARD. ⚠️ It used to ALSO poll until `lenis.isScrolling` went
false, i.e. wait out Lenis' ~1.1s ease on top — up to ~1.5s of nothing, and a wait whose length
varied with how hard the reader had scrolled. Gone: `scrollTo` with `force` simply replaces Lenis'
in-flight animation, so there is nothing to wait for.

#### ⚠️ LATENCY: "reduce the gap between the flick detection and action"
The ride starts on the very first wheel event — the felt delay was entirely downstream, in two
places, and BOTH had to go:
- **the ride's ease was `power2.inOut`**, which is nearly stationary for its first ~15%: on a
  1.7–3s ride that is ~300ms of the reader seeing nothing after their flick. Now **`power2.out`** —
  moves at once, eases into the reveal. It also matches Lenis' own easeOutExpo, so a ride reads
  like the page's normal scrolling rather than a separate animation. (Never a back/elastic ease
  here — "don't make it bounce" is an explicit part of the brief.)
- **`scrub` is SMOOTHING LAG** — the timeline trails the scroll by up to that many seconds. The
  hero ran **0.8**, which on desktop is pure latency stacked on a scroll the drive is already
  easing: the scroll moved and the TEXT lagged most of a second behind it. Desktop is now
  **`scrub: true`** (direct link, zero added lag) on both the hero and /about — there is no jitter
  to smooth away, because Lenis' output is already smooth. **Touch keeps its original values**
  (0.8 / 0.5) — there the scroll is raw native momentum and the smoothing is doing real work.
- ⚠️ The biggest contributor was NEITHER of these — it was the dwell spacers. See the rest table
  above.

**Handback** is `lenis.stop(); lenis.start();` — both public API, both running Lenis' internal
`reset()`, which clears the lock, halts the ride tween and re-seats Lenis on the real scroll
position so it picks up that very event. ⚠️ `reset()` kills the tween, so `onComplete` NEVER fires
— `land()` must be called by hand or `riding` sticks and the pin goes dead.

**Verified by simulation** (both device profiles, real measured rest table): a trackpad flick, a
3-notch @35ms wheel flick, a 5-notch @60ms spin and a single notch each give exactly **1 reveal, 0
handbacks, 0 free events**; two separate flicks give 2 reveals; 12 notches over 1.6s go FREE with
ONE handback then re-seat forward onto a real reveal; 4 back-to-back trackpad flicks go FREE; all
11 hero gaps still one-flick-one-reveal; direction never violated.

#### Also shipped in this run
- **macOS wheel normalisation** — `SmoothScrollProvider` now passes `wheelMultiplier` (0.55 → then
  **0.35** on Apple platforms, 1 elsewhere). Lenis runs in duration mode (`target += deltaY`), so
  distance travelled IS the delta the OS hands over, and macOS accelerates trackpad/Magic Mouse
  input and appends a momentum tail — ~2-3x the delta of the same Windows gesture. ⚠️ **This knob
  does NOTHING under macOS Accessibility → "Reduce motion"**, which takes the
  `prefers-reduced-motion` early-return and leaves the page on native scroll. Check that first if a
  Mac still feels fast.
- **Short-viewport pin floor (900px), FINE POINTERS ONLY** in both pins. Pin length is a multiple
  of `innerHeight`, so a 13" MacBook (~750-800 CSS px) got ~20% fewer scroll pixels for the same
  beats than a 1080p Windows window (~945). Floor only — tall viewports byte-identical. Gated to
  fine pointers after a first pass wrongly applied it on touch and silently undid the hand-tuned
  mobile travel.
- **Hero touch travel `endVh` 2.12 → 2.90** (scroll-px-per-timeline-unit, so **BIGGER = SLOWER**),
  reported too fast on BOTH Android and iOS. History: 1.25 was hair-trigger, 2.12 still too fast.

#### ⚠️ iOS "CAN'T SCROLL AT ALL" — CONFIRMED NOT REGRESSED
The user flagged the 8-try Session 21/22 bug. Verified against it:
- **`Loader.tsx` and `globals.css` are NOT in the diff** — the exit mask, the pre-paint
  `is-loading` scroll lock and the 12s ceiling release are all untouched.
- The drive registers **only `wheel` and `keydown`** — no `touch*` listener, so it cannot block a
  touch scroll even in principle — and it is not attached on touch at all (`smooth = !isCoarse`).
- `pinType: "fixed"` / `anticipatePin: 0` for coarse pointers unchanged; Lenis still early-returns
  on touch so `wheelMultiplier` is a no-op there.
- **The one genuinely new thing on the touch path:** `scrollIntent` adds a `touchmove` listener. It
  is `{ passive: true }`, which makes `preventDefault` impossible — it can only read direction.

#### ⚠️ VERIFICATION — WHAT WAS AND WAS NOT PROVEN
- **Proven by simulation** (stubbed Lenis + fake wheel streams, in the scratchpad): a Windows notch
  and a macOS flick with a 1.4s momentum tail both produce **exactly one step**; two deliberate
  flicks produce two; **802 position/intent pairs with zero cases of moving against the gesture**;
  past the last reveal the event is not claimed so the reader exits the pin.
- **NOT proven:** the animation under real input. A local **production** build was served
  (`npm run start`, NOT the dev server — a `portfolio-prod` entry was added to
  `.claude/launch.json` for this) and driven via the Browser pane, but **the pane was never
  displayed, so `requestAnimationFrame` stays paused and no JS-driven scroll can tick.** Native
  `window.scrollTo` works; Lenis does not. ⚠️ **A synthetic `WheelEvent` is a valid input here (no
  `isTrusted` gate in Lenis) but proves nothing while rAF is paused** — and `defaultPrevented` is
  NOT a usable signal for "our handler claimed it", because Lenis calls `preventDefault` too.
  **To verify for real: ask the user to display the Browser pane first.**

### PRIOR STATUS (Session 25)

**The ORO Connect case study got a full pass —
hero now uses the same SVG title/company-role lockup as LIR/Verkos, several feature screenshots
were swapped for cleaner source assets, the search decision (DD2) was cut and the cart decision
renumbered to DD2 with its own supporting image, the interactive product-card micro-interaction
and a whiteboard sketch were removed, and the stakeholder matrix's R-labels moved from green to
the study's gold accent.** Shipped in one commit (`7912b98`), pushed to `main`.

### 🥇 ORO CONNECT CASE STUDY POLISH — Session 25 (`7912b98`)
A single working session of iterative asset swaps and section edits on `/work/oro-connect`,
driven entirely from screenshots the user annotated live plus files dropped into
`case-study-assets/oro-project/`. No new block types were needed except one:
- **New `imageRow` block type** (`lirDesign.ts` + `LirCaseStudy.tsx`) — renders `imgs: {src,alt}[]`
  side by side, capped at an optional `scale` fraction of the content measure. Added because the
  existing `media` block only stacks vertically; used once so far, for the two mobile-app
  screenshots in the Impact section (`scale: 0.55`, full phone screens visible, no cropping).
- **Hero now matches LIR/Verkos exactly.** `intro.title` + `intro.role` SVGs added
  (`oro-title.svg` = "Project tag.svg", `oro-company-role.svg` = "Company and tag.svg", both
  copied verbatim from the assets folder) alongside the existing `intro.bg`
  (`oro-cover-bg.webp`, from "Background thumbnail.png"). The old comment claiming ORO had no
  bespoke lockup is now wrong and was removed — it DOES have one, the user just hadn't supplied
  it yet.
- **Stakeholder matrix R-labels: green → gold.** The R1–R4 quadrant labels are injected by
  `scripts/oro-assets.mjs` (`withRLabels`) as raw SVG `<text>`, not baked into the source file —
  one `fill="#12D398"` → `fill="#D9A441"` (the study's gold accent) and a full `node
  scripts/oro-assets.mjs` re-run regenerated `power-interest.webp`. Any future change to this
  study's accent must also touch this hardcoded hex, it does not read from a shared token.
- **Feature-image swaps** (asset pipeline additions, all one-off `sharp-cli` conversions since
  they aren't in the `VECTORS`/screen-crop tables): `product-cards.webp` (Products feature),
  `search-box.webp` (Search feature), `two-id-system.webp` (DD1), `orders-dd.webp` (now under
  DD2/cart). `card-bangle.webp` was also replaced — the prior source PNG was tiled and broke the
  product-card hover's rotation math; the user supplied a clean single cutout.
- **DD2 (search) removed outright, DD3 (cart) renumbered to DD2.** The search decision's
  `decisionText` block is gone from `oroDesign.ts`; the cart block's `n` changed `"03"→"02"` and
  it now carries `img`/`imgAlt` pointing at `orders-dd.webp`. If a fourth decision is ever added,
  it becomes DD3 fresh — there's no gap to fill.
- **Interactive product card removed.** The `microInteraction` block (rendered `OroProductCard`,
  the hover-to-zoom bangle demo) is gone from the data file; the renderer's `case
  "microInteraction"` in `LirCaseStudy.tsx` and the `OroProductCard.tsx` component itself were
  left in place (dead code, not deleted) since the user said they'd replace it with a GIF later —
  re-adding the block is a one-line data change, not a rebuild.
- **Whiteboard process sketch removed** — the `media` block pointing at
  `process-whiteboard.webp` (the "wireframing the reorder flow" image under the design-system
  paragraph) is gone.
- **Friction map (`OroFrictionMap.tsx`) is one-shot per viewport entry, not a loop.** Removed
  `repeat: -1`/`repeatDelay` and the old Beat 8 dissolve-for-loop-restart; visibility gating is
  now `if (visible) tl.restart(); else tl.pause(0)` — replays from hidden every time the reader
  scrolls back, never idles mid-loop off-screen.
- **Product card hover (`OroProductCard.tsx`) rewritten with Figma-faithful geometry**, after
  several rounds of the rotation being swapped/wrong. The `IMG` constant now encodes actual
  window + photo dimension/position/rotation percentages lifted from the Figma prototype's
  Default↔Variant2 motion code (rest: `rotate(-15deg)`; macro: `rotate(45deg)`), not a CSS
  `scale()` approximation — the earlier version's core bug was treating a dimension+position
  change as a uniform zoom.
- **⚠️ Route is `/work/oro-connect`, not `/case-study/oro-connect`** — cost one dead navigation
  mid-session verifying the fix. All three case studies live under `/work/<slug>`.

Session 24 shipped three commits to `main`:
- **`f131f88` — /work cards: GSAP hover reveal** (Figma section `322:130`, frames 1→2→3).
- **`dabc817` — The Other Hand mobile fixes** (sizing, overlap, invisible particles).
- **`8b79a9a` — Background music + loader sound gate.**
See the three subsections directly below for the detail and the traps.

### 🎴 /work CARD HOVER TRANSITION — Session 24 (`f131f88`)
Rebuilt `WorkShowcase` as a **paused GSAP timeline** played/reversed on enter/leave, from the
user's Figma storyboard: cover darkens → inner screenshot rises from the frame's bottom edge and
seats centred at **75.6%** of the frame width (Figma 75.8%) → title lifts and the copy stack
(kicker / accent eyebrow / build note / FlytBase + duration) staggers up behind it.
- **Why a timeline, not `group-hover:` CSS:** the reveal is a SEQUENCE, and an interrupted hover
  has to reverse from wherever it actually is. A paused timeline gives both for free.
- **MOBILE IS A DIFFERENT LAYOUT.** Gated on `(hover: hover) and (pointer: fine)`, so the desktop
  timeline is **never built** on touch; the card ships permanently in the end state (title above
  the plate, darkened cover, smaller UI inside, copy below). Verified a tap changes nothing.
- **Alignment (the user gave grid lines):** title exactly on the thumbnail's horizontal centreline
  at rest (**0.0px**), whole title+copy group centred on it while hovered (**0.1px**), title
  travelling further than the supporting text.
- ⚠️ **`image-1.webp` IS THE LIR APP SCREENSHOT**, despite the generic name. Using it as the cover
  put the same picture in the plate AND the reveal, so the rest state already showed what hover was
  meant to bring in. LIR's plate is now **`cover/lir-plate.webp`**; its inner image is
  **`cover/lir-ui.webp`**. `image-1.webp` is still used by WorksJourney + the case study — don't
  delete it.
- ⚠️ **A hard-coded `yPercent: 100` overshot the inner image's park by ~262px** on a 405px frame
  (the image is shorter than the frame AND inset 12% from its top), leaving a dead run where the
  reveal looked stalled. The park distance AND the hover re-centre lift are now **FUNCTIONS**,
  re-measured on invalidate — card width is `vw`-driven, so a resize changes frame height without
  changing the media query, `matchMedia` does NOT re-run, and a captured value goes stale. Same
  staleness class as the works-journey ticker.
- ⚠️ **Two Tailwind `translate-x-*` classes on one element silently conflict** (both compile to
  `--tw-translate-x`, the later wins). Write the whole transform inline instead.
- **Verkos** uses the annotated **car-detection** frame as its inner image (user's call, not a UI
  shot) and the **LIGHTER** grade of the CCTV/skyline shot as its plate
  (`cover/verkos-plate.webp`) — the old `verkos-cover-bg.webp` was already near-black so the hover
  scrim had nothing to darken.
- **ContactCTA REMOVED from /work** (the footer already carries contact), which left the page fully
  static → its orphaned `sanityFetch`/`SITE_SETTINGS_QUERY` went with it.
- `flytbase-logo-light.svg` added: the committed `flytbase-logo.svg` has a `fill="black"` wordmark,
  invisible on this dark page.

### 🎵 BACKGROUND MUSIC + LOADER SOUND GATE — Session 24 (`8b79a9a`)
**"Friendship" by wooll**, optional, off unless chosen. Source stays in the gitignored
`Background music/` (already in `.vercelignore`); the web encodes are `public/audio/` —
**7 MB → 2.79 MB mp3 + 2.31 MB opus**, cover art stripped, title/artist read from the file's ID3
tags. **Default volume 0.5**, looping.
- **`AudioProvider`** (site layout) owns **ONE** `<audio>` element so the loader's choice and the
  home widget drive the same track. Two tags would double the audio.
- ⚠️ **`enable()` MUST be called synchronously in the click handler.** Browsers only grant
  `play()` inside a real user-gesture task; deferring it into a GSAP callback or past the exit
  animation puts it outside that window and it is rejected silently. A `blocked` flag exists for
  when a browser refuses anyway, so the UI never lies about a playing track.
- **Preference is `sessionStorage`, NOT localStorage** — music resuming on a page opened days later
  is startling. Deliberate; don't "upgrade" it. Auto-pauses on tab hide.
- **`NowPlaying`**: animated waveform + title/artist, whole lockup is the button.
  **The waveform IS the state indicator** — bars moving = on, bars collapsed to a flat line with a
  slash = off. Bars are **CSS-animated, not GSAP**: a decorative idle loop belongs on the compositor
  where a stalled main thread can't freeze it (the iOS lesson from §6).
  **It is mounted in FOUR places (`46f7cde`)** — the track has to be turn-off-able from anywhere,
  and each spot is chosen for where it is actually *reachable*:
  | Where | Breakpoint | Notes |
  |---|---|---|
  | Case-study rail, under Contents | `lg:` only | Inherits the rail's `lg:sticky`, so it follows the whole read (verified on screen at scrollY 4200). Below `lg` the rail isn't sticky, so a control there would just scroll away. |
  | Footer, spanning both link columns | all widths | Labelled "Now playing". The footer is the end of the page on a phone too, so the title/artist fit. |
  | Header, next to the hamburger | **mobile only** | `compact` prop → waveform ONLY. On a phone the case studies have no sticky rail, and the user explicitly ruled out putting it inside the hamburger — the header is the only element always on screen. `aria-label` still names the track. |
  | Floating bottom-right (`NowPlayingMount`) | `sm:` and up, home only | Hides once the footer scene is on screen. |
  ⚠️ **Bars + slash use `bg-current`, NOT `bg-white`.** The header is a WHITE bar with black text on
  light routes, where a hardcoded white waveform was invisible. Track text is
  opacity-on-currentColor for the same reason. **Don't reintroduce fixed colours here.**
  ⚠️ **The floating widget is `hidden sm:block` AND yields to the footer.** Two identical toggles on
  one screen is confusing, and pinned bottom-right it would sit on the back-to-top button and the
  RUDYMAN wordmark. Its hide gates `visibility` as well as opacity — fading alone left an
  invisible-but-clickable target over the footer's own controls.
- **The loader's ready state is now a sound gate.** "click to enter" and its **EB Garamond italic
  are GONE** from the ready state (the italic still renders "cooking" while loading). The pill and
  the quiet "Enter without sound" link are Plus Jakarta Sans.
- **"cooking" is per-letter with a left-to-right bounce** riding the pan's whip-up.
  ⚠️ It was first anchored to the **CATCH** and measured *completely dead*. The animation was
  correct; IMPACT is ~2.5s after mount and on a warm load "cooking" is replaced by the buttons in
  under 2s, so **it literally never ran**. Anchored to `LAUNCH_AT` it lands inside the window every
  cycle. A dev-only `window.__panToss` handle exists to scrub the toss for exactly this kind of
  check.

#### ⚠️⚠️ THE INTRO NO LONGER OPENS ITSELF — read before touching Loader.tsx
The 12s ceiling used to call `markReady()` + `openPan()` unaided (plus a 1.8s secondary calling
`finish()`), so **waiting let you into the site without clicking**. That was added in Session 21 as
the blunt fix for the iOS "page won't scroll at all" bug. It now **ONLY RELEASES THE SCROLL LOCK**
— it does not dismiss the intro or hand off to the hero. A reader who waits is left looking at the
intro (correct) on a page that is not frozen (safe). **Keep that distinction if you touch it: the
lock still needs an escape hatch, but it must not enter the site.**
Also removed: the **tap-anywhere-on-the-overlay** handler and the **global Enter/Space**. With two
choices, entering from a stray click would have to silently pick one — usually the wrong one
(silent, while the reader was reaching for the pill). The two buttons are the only way in; keyboard
works natively through them.

#### ⚠️⚠️ NEVER PUT CSS POSITIONING AND GSAP TRANSFORMS ON THE SAME ELEMENT
This caused the reported entrance glitch — *"the pan starts higher then glitches and comes below,
then the buttons and cooking start offset weird and then the buttons move to position"*.
An inline `transform: translate(-50%, …)` was doing the centring while
`gsap.set(".pan__group", {scale, y})` **rewrote `transform` wholesale and ate it**; same collision
on `.pan__label`, where `{y: 8}` wiped out its `translateX(-50%)`.
**Fix: two nested boxes — OUTER = CSS positioning, INNER = the GSAP target.** Verified across 400
frames from first paint: `jumpAtSwap 0`, pan top identical at start and at the swap, label/pill
horizontal range **0**.
Related: the cooking→buttons swap used to move everything because the group is centred with
`-translate-y-1/2`, which resolves against its OWN height — and "cooking" (~40px) vs the choice
block (~230px) are wildly different. **Both label states are absolutely positioned** so they
contribute zero height and the pan cannot move.
**Layout (the user's grid lines):** pill and "Enter without sound" sit exactly on the viewport's
vertical centre axis (**720/720**); the pan is nudged right so the **BOWL** — the mass the eye
centres on, since the handle drags the geometric middle right — lands on that axis (egg 6px off).
⚠️ `.loader-choice`'s intro animation needs `backwards`, **not `both`**: with `both` a running CSS
animation pins opacity at 1 and beats inline styles, so GSAP's exit fade does nothing.

### 🎮 THE OTHER HAND — MOBILE FIXED — Session 24 (`dabc817`)
User-reported on a real Android phone: cramped, running under the nav bar, back button written
over by the text, disc small with the particle shapes invisible inside it. **Four causes.**
- **Back link was `absolute top-24`** → outside the flow, so the game content (centred in its own
  `min-h-svh` box) ran underneath it. Now an in-flow flex child (27px clearance).
- **Two stacked full viewports.** The page was `min-h-svh` AND the stage was another with
  `justify-center`, so the card overflowed at BOTH ends while `overflow-hidden` clipped it.
  ⚠️ **The page is now a FIXED `h-svh`** — with `min-h-svh` the stage's `flex-1` grew past the
  viewport so `overflow-y-auto` never engaged and Begin sat ~35px below the fold, unreachable.
  Plus `env(safe-area-inset-bottom)` padding.
- **Disc `min(360px,74vw)` → `min(420px,88vw,52svh)`** (266→317px), bounded on both axes so it
  can't crowd out the controls in landscape.
- ⚠️ **THE ENGINE'S SHAPE GEOMETRY IS HARD-CODED IN PIXELS** against a ~360px disc (spiral arm
  140, main-sequence star 100, pulsar jet 250). On a 266px disc those radii overflowed and only
  the middle of each shape landed inside the circle. A **scale factor is applied at the single
  point where the offsets are consumed**, so the eight stages' maths stays byte-identical and a
  re-sync from the standalone Vite app is still a straight file copy. **Keep it that way.**
- ⚠️ **The canvas ignored `devicePixelRatio`** (drawing 266×266 and upscaling on DPR 3 — hence
  soft blobs, not lit points) **and only sized itself once on mount**, so an orientation change
  left it stretched. Now DPR-scaled + re-measured on resize/orientationchange. Dot radius scales
  by **sqrt**, not linearly — at full linear scale the dots stop reading as lit points.
- Fixed a latent input bug: `setInputBounds` listened for scroll on `window`, but the stage is now
  the scroller and **its scroll events don't bubble there** — the drag hit-zone went stale as soon
  as you scrolled inside the stage.

### PRIOR STATUS (Session 23)
Session 23 added the **/play page** — a wall of AI explorations with **The Other Hand playable
in-browser** at `/play/the-other-hand` (touch drag supported) — wired **/work + /play into the
nav and the hero curves**, and fixed the **heading scroll bug** on both pages: `WorkShowcase` was
killing every ScrollTrigger on the page (`3767462`), and `PageHeading` was tweening the word and
subtitle as two independent targets so they drifted apart (`4f8584e`). Both verified
old-fails/new-passes via CDP. Prod build clean (**16 routes**), typecheck clean.
Session 22 before it: went live on the domain, rebuilt the **/work index** (`e809c42`), removed
the zoom cursor + excluded the before/after slider from the lightbox (`beae3ab`), and fixed
**three iOS-only defects** — see "iOS BUG RUN" below. All confirmed on a real iPhone.
⚠️ STILL OPEN: **Sanity CORS** for the new origin, or `/studio` fails there (§7 item 0000) —
deprioritized, the user doesn't use `/studio`. **The Other Hand is untested on a real iPhone.**

### 🍎 iOS BUG RUN — three defects, ~8 rounds — Session 22
All three were invisible on desktop AND in emulated mobile Chrome; every one was finally
identified from an on-device readout, not from local reproduction. **The meta-lesson: when a bug
is iOS-only, instrument the device early — local emulation actively misled here, repeatedly
"passing" while the phone failed.**

**1. The intro loader never appeared (`5526ee5`).**
The overlay carried its EXIT MASK at all times:
`mask-image: radial-gradient(circle calc(var(--hole)*1vmax) …, transparent 99%, black 100%)`
with `--hole: 0`. In a CSS mask **transparent means hidden**, so a zero-radius gradient whose only
reachable stop is transparent makes the overlay **mask itself away**. Chrome resolves the
degenerate `0px` case as effectively opaque (hence desktop was fine); iOS Safari resolves it the
other way and the whole intro is invisible. The mask is now attached ONLY when the exit starts.
⚠️ **A DOM query cannot see a CSS mask** — `opacity`, `visibility`, `z-index` and hit-testing all
read perfectly healthy while the element was masked to nothing. That cost four wrong diagnoses.
Check computed `maskImage`/pixels, not element properties.
Related fixes in the same area: `prefers-reduced-motion` no longer SKIPS the intro (iOS reports
`reduce` whenever **Low Power Mode** is on — very common, and it was firing `finish()` on the
first frame); the scroll lock is applied by an **inline script before first paint** (`763a21d`)
because doing it in `useGSAP` left the hero painting first, unlocked, and mis-measuring its pin;
and hand-off no longer depends on GSAP timeline callbacks (`502fc82`) since the compositor keeps
animating the mask even when the JS loop stalls.

**2. The works-journey project cards never appeared (`d961026`).**
The ticker computed the right values and its writes never reached the rendered nodes. Signature,
captured twice on device in the SAME tick:
```
beat0 drv p=0.77 m=1.00 -> frame op=1.00 skin 0.00   (correct)
beat1 drv p=0.65 m=0.98 -> frame op=0.00 skin 1.00   (untouched markup defaults)
```
Both compute to `frame=1.00`, same code path, one written and one not. Root cause: **the ticker
held element references that go stale** — `gsap.quickSetter` caches its element, React swaps the
window between `<Link>` (published) and `<div>` (unpublished), and **`gsap.matchMedia()` re-runs
its callback whenever the query re-evaluates, which iOS Safari does when the browser toolbar
collapses during scroll.** *That is also why Android was always fine — its chrome doesn't trigger
the re-evaluation.*
Fixes, in order of how much they matter:
  a. **The window's opacity is now derived from the TIMELINE PLAYHEAD**, not the ticker's proxies,
     and written to nodes re-queried from the live beat. The playhead cannot go stale. The ticker
     still owns flight transforms, where a dropped frame is invisible anyway.
  b. Every write re-resolves its node via `querySelector` on the beat (`f31c954`).
  c. Hero drops any previously registered works ticker before adding one (`69e9656`), so two
     generations can never drive the DOM at once.
  d. Covers are warmed + decoded at module load, `decoding="sync"` + `fetchPriority="high"` on the
     beat `<img>`, and the Verkos cover recompressed 274 KB → 191 KB. The window lives in a
     scroll-scrubbed pin, so a late decode can miss the frames its beat is on stage — consistent
     with the heaviest cover (beat 2) being the last one to fail.

**3. A half-exited beat wrapper hid the card (`374557e`).**
`[data-beat-inner]` — the wrapper holding the title, window and copy — stranded at **opacity 0.70**
part-way through the beat's exit, dimming the card toward invisible while the frame's OWN opacity
read a healthy 1.00. (Found only by walking the ANCESTOR CHAIN; every frame-level check passed.)
It strands because the exit tweens are `immediateRender:false` and ScrollTrigger's snap — which is
meant to carry a reader who stops mid-exit through to the clean state — rarely fires on touch,
where native momentum doesn't produce the scroll-end snap needs. A per-frame guard now forces
`inner` to a clean state from the playhead alone.

⚠️ **PATTERN TO REMEMBER:** every one of these is the same shape — *a GSAP end-state that a
`fromTo` with `immediateRender:false` never reached, or an element reference that went stale.*
On this page, anything whose VISIBILITY matters must be derivable from the playhead and written to
a freshly-queried node. Don't trust a cached setter or a tween's end-state to have run.

### ✅ DOMAIN RESOLVED — `rudyman.com` live via Hostinger DNS — Session 22
**Went live 2026-07-30.** The route there matters, because the first diagnosis was wrong.

**What was actually broken:** Session 21 concluded "just waiting on DNS propagation". It was not.
With the domain delegated to `ns1/ns2.vercel-dns.com`, **Vercel's own nameservers answered
`Query refused`** — the zone was never provisioned on their DNS infrastructure, so every public
resolver returned **SERVFAIL**, not a stale cache. Waiting could never have fixed it.
`GET /v4/domains/<d>/records` was EMPTY and `POST` returned `invalid_zone`, while the API
simultaneously reported `serviceType: zeit.world` + `verified: true` — which is exactly what made
it look like latency.

⚠️ **THE DIAGNOSTIC THAT SETTLES THIS CLASS OF BUG — query the authoritative NS directly, which
bypasses every cache.** Watching public resolvers hid the real cause for ~14 hours:
```
nslookup -type=A <domain> ns1.vercel-dns.com                # "Query refused" = zone doesn't exist
curl -s "https://dns.google/resolve?name=<domain>&type=A"   # Status 2 = SERVFAIL (not a cache)
curl -s "https://rdap.verisign.com/com/v1/domain/<domain>"  # registry delegation = source of truth
```

**Tried, did NOT work** (don't repeat): force `POST /v9/projects/<id>/domains/<d>/verify` on both
apex + www; a full remove + re-add of the account-level domain.
⚠️ **`DELETE /v6/domains/<d>` ALSO drops the PROJECT domain bindings**, not just the account entry —
both domains vanished from the project and had to be restored via
`POST /v10/projects/<id>/domains`, re-applying `{"redirect":"rudyman.com","redirectStatusCode":308}`
to www or the apex/www relationship is silently lost.

**THE FIX — bypass Vercel DNS entirely.** Nameservers moved BACK to Hostinger
(`aurora.dns-parking.com` / `nebula.dns-parking.com`), then two records added in Hostinger's zone
editor (deleting the parking `A @ -> 2.57.91.91` first). Vercel's `serviceType` flipped
`zeit.world` -> **`external`** on its own and the site was live within minutes:

| Type | Name | Content | TTL |
|---|---|---|---|
| `A` | `@` | `216.198.79.1` | 3600 |
| `CNAME` | `www` | `8a0f233b3a7d8efb.vercel-dns-017.com.` | 3600 |

(The CNAME target is **PROJECT-SPECIFIC** — re-read it from `GET /v6/domains/<d>/config` if ever
needed again, don't copy it blind.)

**Verified live:** apex 200 · `www` 308 -> apex · `http` 308 -> `https` · Let's Encrypt cert valid
to 2026-10-27 (auto-renews) · `/`, `/work`, `/about`, both case studies, `/sitemap.xml`,
`/robots.txt` all 200 · sitemap + robots emit `https://rudyman.com` · Vercel `misconfigured: false`.

**Still open:** **Sanity CORS** for the new origin (§7 item 0000) — `/studio` fails on
`rudyman.com` until it's added.

### PRIOR STATUS (Session 21)
**CUSTOM DOMAIN `rudyman.com` BOUGHT + WIRED. Shipped in `91c68e3`: the iOS "can't scroll at all"
bug is FIXED, both case studies now open on a LAYERED cover (raster bg + vector title/role SVGs),
and Verkos Reports is the 2nd home work box (replacing Marrow).**

### /work INDEX REBUILT — particle field + alternating plates — Session 22 (`e809c42`)
The `/work` index was still the ORIGINAL light placeholder grid (`WorkGrid` + Sanity `PROJECTS_QUERY`,
which returns nothing). It is now a dark route with its own cinematic particle field, built from the
user's Figma slides 34/35/36.

**`src/components/hero3d/PageGlow.tsx` — the field.** Shares the footer's visual DNA (locked palette,
square-mote sprite, fresnel energy boxes) but is a DELIBERATELY different experience — the brief was
"should feel different from the footer". The five rules are written into the file header so they
don't drift; keep them if you retune:
  1. **Always in flight** — travels toward the camera even at rest (`BASE_SPEED`). A field that only
     moves on scroll reads as a widget, not a place.
  2. **Scroll ACCELERATES, doesn't start** — `uScroll` ADDS to the idle travel (`SCROLL_TRAVEL`, 90
     world-units across the page), so the reader throttles forward.
  3. **Depth is the point** — 3 discrete strata (`aDepth` 0.15/0.55/1.0) parallaxing at their own
     rates. Discrete, not random, so it reads as layers rather than mush.
  4. **Nothing pops** — `travelFade()` fades motes in far and dissolves them before the camera plane.
     The first build wrapped hard at the boundary, which instantly breaks the illusion.
  5. **Aerial perspective** — near = brighter/bigger, far = dimmer.
- ⚠️ **Nodes need their OWN earlier dissolve (`travelFadeNode`, gone by z=4).** They're real geometry
  (up to ~1.3 world units); within ~12 units of the lens they blow up into flat opaque cubes. The
  first build did exactly that — huge dead cubes over the headline.
- Density ~3× the footer (900 motes / 46 nodes vs 310/22), filling the whole viewport rather than a
  band below the fold. Mobile takes ~45%.
- Motion split follows the house rule: **ScrollTrigger owns scroll-POSITION values** (`uScroll`, plus
  a velocity-derived `uFlare` that tweens back to 0 so fast scrolling energises the field); the
  **intro ignition self-plays** as a one-shot rAF tween (`uIgnite`); the **GPU owns per-frame** life
  cycles + drift (`uTime`). They never write the same uniform, so they can't fight.
- ⚠️ **`ssr: false` in `next/dynamic` is ILLEGAL in a Server Component** (Next 16 hard-errors). `/work`
  is a server component (fetches settings), so the dynamic import lives in
  **`PageGlowMount.tsx`** (`"use client"`). Same pattern any future page must use.
- ⚠️ **TWO GLSL TRAPS, both cost a debug cycle — commented in the file:**
  (a) **`half` is a RESERVED WORD in GLSL ES.** Using it as a parameter name fails with only
      "Vertex shader is not compiled" and no line number. Renamed to `h`.
  (b) **Backticks inside a shader comment TERMINATE the JS template literal** holding the GLSL.
      The error surfaces as "Expected a semicolon" in the .tsx, nowhere near the real cause.

**`src/components/sections/WorkShowcase.tsx` — the cards.** Alternate left/right (`index % 2`) down a
centred column with `14–18vh` gaps, so the pair reads as one staggered centre-stage column (Figma
slide 35). Entrance = GSAP rise + settle from the card's own side; the cover parallaxes against its
frame on scrub (hence `scale-[1.06]` on the img, so the translate never reveals an edge).
- **At REST the plate is a CLEAN image with the big Tanker title BELOW it.** An earlier build put the
  title ON the plate and it was illegible over bright covers (the gate shot is mostly sky + white
  truck) — and re-reading the user's slide 35, the title is below the card there too.
- **HOVER = the user's own Figma treatment: solid `#000` at 20% opacity** over the thumbnail (verified
  computes to exactly `0.2`), revealing the study headline (white) + eyebrow (accent orange) centred,
  with the year pinned bottom-right; the Tanker title turns accent. `text-shadow` on the copy so it
  survives a bright cover even at only 20% scrim.
- **`src/components/sections/PageHeading.tsx`** — the shared full-viewport Tanker lockup ("WORK" +
  subtitle) that opens the page; letters rise out of a mask, then it lifts + dissolves on scroll so it
  never fights the first plate. Generic — `/play` can reuse it as-is.
- Page root carries **`hero-dark`** (without it `text-fg` resolves to the LIGHT theme's near-black and
  the whole page renders dark-on-dark) and overrides `--color-accent` to the signal orange `255 141 59`
  (`.hero-dark` defaults it to electric blue, which fought the orange field).
- **`Header.tsx` `darkPage` now also matches `/work` and `/play`** — the index used to be a light route.
- ⚠️ **KNOWN GAP: the kicker/eyebrow are HOVER-ONLY, so touch users get image + title but no
  description.** Deliberate for now; add a static line under the title for coarse pointers if wanted.
- Placeholder slugs (nightshift/atlas/ember) are FILTERED OUT of this page — they 404, and this is the
  page whose whole job is to send people into the work. Years for the two real studies corrected to
  **2026** to match their own case-study meta.

### LIGHTBOX + ZOOM-CURSOR CHANGES — Session 22 (`beae3ab`)
- **The before/after slider is EXCLUDED from the lightbox.** `BeforeAfter`'s two images now carry
  `data-no-zoom` (checked by `ImageLightbox` in BOTH the click handler and the tagger, so they get
  neither the lightbox nor the hover affordance). It's a DRAG slider — opening a full-screen view
  mid-drag fights the interaction the component exists for.
- **`cursor: zoom-in` REMOVED site-wide** from `[data-zoomable]` (globals.css). The slight lift +
  accent ring is enough affordance; the magnifier made reading-flow screenshots feel like heavy UI
  controls. **Deliberate — don't reintroduce it** (noted in the CSS comment).
- ⚠️ **VERIFICATION TRAP:** a probe that looks for "any `div.fixed.inset-0` containing an img" FALSE-
  POSITIVES on the case-study cover intro plate, which is also `fixed inset-0` with images. Key off
  the real **`.lir-lightbox`** class. The first run reported the slider still opening the lightbox
  purely because of this; the behaviour was correct all along.

### CUSTOM DOMAIN — `rudyman.com` — Session 21
Registrar **Hostinger**; Vercel project `portfolio-2026` (`prj_LyJsSNYxQCqJu9xpZXEIfnG2s9oE`,
team `portfolio-27` / `team_ui5Ojpk8q4oYhCb6FrNH6RAe`). Everything configurable IS configured;
only resolver caches remain.
- **Nameservers switched at Hostinger → `ns1/ns2.vercel-dns.com`.** Confirmed live at the .com
  registry via RDAP (`rdap.verisign.com/com/v1/domain/rudyman.com`) at 2026-07-29 16:26 UTC.
- **`rudyman.com` is PRIMARY, `www` 308-redirects to it.** The domains were already attached but
  the redirect was BACKWARDS (bare → www); fixed via
  `PATCH /v9/projects/<id>/domains/<domain>` with `{"redirect":null}` on the apex and
  `{"redirect":"rudyman.com","redirectStatusCode":308}` on www.
- ⚠️ **Vercel's DNS zone is still EMPTY and `misconfigured: true` — this is EXPECTED, not a
  fault.** Vercel only provisions the zone after it confirms delegation; until then
  `POST /v2/domains/<d>/records` returns **`invalid_zone`** (tried; don't retry in a loop).
  Once provisioned Vercel writes the apex A + issues SSL itself. Only intervene if the zone is
  still empty ~6h after the NS change; the manual records would be A `@`→`216.198.79.1` and
  CNAME `www`→`8a0f233b3a7d8efb.vercel-dns-017.com.`
- **Why it's slow:** the OLD Hostinger SOA (`aurora.dns-parking.com` / `dns.hostinger.com`) has a
  **604800s (7-day) negative-cache TTL**, so public resolvers keep serving the parking IP
  `2.57.91.91` well after the registry flipped. Google + Cloudflare DoH both still returned it at
  session end. Nothing to fix — wait it out.
- **DO NOT re-edit DNS at Hostinger while waiting** — it only resets caches again.
- Useful checks: registry = the RDAP URL above (source of truth); resolver =
  `curl -s "https://dns.google/resolve?name=rudyman.com&type=A"`; Vercel's own view =
  `GET /v6/domains/rudyman.com/config?teamId=<t>` (watch for `misconfigured: false`).

### 🐞 FIXED: `NEXT_PUBLIC_SITE_URL` WAS NEVER SET ON VERCEL — Session 21
A REAL live-site bug found while doing the domain work. The var was absent from the Vercel
project entirely, and all three consumers fall back to `http://localhost:3000`
(`src/app/layout.tsx:39` metadataBase, `robots.ts:3`, `sitemap.ts:5`). The deployed
`robots.txt` was literally telling crawlers `Sitemap: http://localhost:3000/sitemap.xml` and
every `<loc>` in the sitemap was a localhost URL; OG/social preview images had the same broken
base. **Set to `https://rudyman.com` (production target) + redeployed; verified both files now
emit the real domain.** NOTE it's inlined at BUILD time, so it needs a redeploy to take effect.
⚠️ Side effect while DNS propagates: link-preview cards for the *vercel.app* URL point at a
domain that doesn't resolve yet, so previews may not render. The site itself is unaffected. The
user chose to WAIT rather than temporarily point it back at the vercel.app URL.

### iOS SCROLL LOCK — THE SITE COULDN'T SCROLL AT ALL ON iPhone — Session 21 (`91c68e3`)
User-reported, reproduced on multiple devices: the first scene painted but the page would not
scroll. **Root cause: the intro loader was a single point of failure for the whole page's
scrollability.** `body.is-loading` applies `overflow:hidden` (globals.css) and on a COLD visit
the ONLY thing that removed it was a successful tap on the pan button — no timeout, no fallback
(unlike `Hero.tsx`, which already had a poll + 2.5s ceiling for its own reveal).
- **Why iOS specifically:** the button was rendered with the **`disabled` attribute** until the
  WebGL hero signalled ready, and **iOS Safari keeps swallowing taps on a button that was
  rendered disabled even after it is re-enabled**. Tap does nothing → lock never lifts → frozen.
- **Fixes in `Loader.tsx`:** `disabled` → **`aria-disabled`** (the gate is still enforced in JS by
  `openPan()`, so the hit target stays live) + `onTouchEnd` + `touch-action:manipulation`;
  **tap-anywhere-on-the-overlay** opens it once ready; a **12s hard ceiling** lifts the intro
  unaided (with a 1.8s secondary that force-calls `finish()`); and **unmount cleanup always
  clears `is-loading`**. All paths funnel through the existing idempotent `openPan()`/`finish()`.
- **`globals.css`:** the lock is mirrored onto **`html:has(body.is-loading)`** + `touch-action:none`
  — `overflow:hidden` on `<body>` ALONE is unreliable on iOS Safari. Verified both rules survive
  into the prod CSS chunk.
- ⚠️ **VERIFYING SCROLL LOCKS: use REAL CDP touch events** (`Input.dispatchTouchEvent`), never
  `window.scrollBy`/`scrollTo` — programmatic scrolling bypasses the lock and falsely PASSES.
  (Same trap the Session-20 lightbox work hit.)
- Verified: iPhone-emulated + **never tapping** → lock clears, page scrolls (scrollY 770); a real
  tap still opens it at ~8.7s (**before** the 12s ceiling, proving the tap does the work, not the
  timeout); desktop 1440×900 unchanged. Harnesses in the session scratchpad.

### LAYERED CASE-STUDY COVERS (both studies) — Session 21
The fixed opening plate was ONE hardcoded SVG (`/case-study/thumbnail-1.svg`) shared by both
studies. Now per-study and **split into a raster background + vector overlays** — the whole point
being that on a phone the photo crops hard via `object-cover` while the TYPE is laid out
independently and stays legible instead of being shrunk with it.
- New optional **`intro: { bg, title, bgPosition? }`** on `LirDesign`. Assets in
  **`public/case-study/cover/`**: `lir-cover.webp` (9.3MB PNG → 146KB), `verkos-cover-bg.webp`
  (5.8MB → 65KB), `lir-title.svg`, `verkos-title.svg`, and the **shared `company-role.svg`**
  (flytbase + "AI Product Design Builder", used by BOTH studies). Sources are the user's
  `ThumbnailNew.png` / `Project Thumbnail.png` / `Thumbnail text and logo.svg` /
  `Thumbnail project name.svg` / `Company name and role.svg` in the gitignored asset folders.
- Both title SVGs are **803×175**, the role strip **552×35** — consistent, so ONE layout serves
  both: title bottom-left, role bottom-right on the same baseline (matches the Figma), stacked
  left-aligned on phones. Each SVG scales on its own clamp, NOT with the background.
- Added a bottom-up legibility scrim (both backgrounds are busy exactly where the type sits) and
  moved the **"scroll to enter" hint to TOP-centre when `intro` is set** — its old bottom-centre
  position sat right on top of the new lockup.
- The intro parallax now targets **`[data-intro-bg]` explicitly** (a bare `querySelector("img")`
  would have grabbed whichever image came first) and the type gets its own faster drift + fade.
- `public/case-study/thumbnail-1.svg` (1.4MB) is now **UNREFERENCED** — left on disk deliberately;
  safe to delete.

### VERKOS ON THE HOME PAGE + ACCENT/SPACING FIXES — Session 21
- **Verkos Reports replaces Marrow as home work box 02** (`placeholderProjects.ts`). Cover =
  **`/case-study/verkos-cover.webp`**, the annotated east-gate detection frame re-cropped to the
  window's 16:9 (scale-to-fill then crop — the source is 1600×772 so a plain crop to 900 fails;
  truck + red bbox + "Pickup truck (98%)" label all verified intact). Registered in `THUMB_SRC`
  in `WorksJourney.tsx`, which feeds BOTH the pinned journey and the static fallback.
  Verified: beat 02, thumbnail HTTP 200, zero "Marrow" left in the DOM.
- **The headline star is now ACCENT-DRIVEN.** `DroneMark` (`lirBlocks.tsx`) had `fill="#FF8D3B"`
  hardcoded, so Verkos showed LIR orange. Now `fill="currentColor"` + `text-accent` on the call
  site — LIR resolves to the same `#ff8d3b` as before, Verkos to its cyan `#08e6ff`. (The COVER
  SVGs were already correct: they export with `#08E6FF` / `#FF8D3B` baked in.)
- **The report exhibit and its "Enterprise security…" thesis each get their own viewport.** They
  were butted together, so the report's caption and the big statement collided in one screenful.
  New optional **`full?: boolean`** on the `statement` and `prototype` block types →
  `min-h-svh` + centred. Enabled on the Verkos pair only; the `sceneBreak` that followed is now
  redundant and removed. Measured: the statement stage is exactly 900px (1 viewport) with ~600px
  of clear air above it. The other two Verkos statements were LEFT INLINE on purpose — they sit
  mid-prose and a full viewport each would over-fragment the read.

### PRIOR STATE (Session 20) — all still live
**THE VERKOS APP EXHIBIT WAS REBUILT FROM THE LATEST SOURCE
(`verkos-reports-exhibit-rudy-main.zip`), replacing the older copy Session 19 shipped. It now
runs in PERMANENT demo mode with every live FlytBase/Supabase call answered offline, plus a
click-to-expand image lightbox across BOTH case studies, a Contents rail derived from the real
chapter flashes, and the three Figma design-decision images. Prod `npm run build` clean
(14 pages), typecheck clean. Dev server + headless Chrome stopped at session end.
Everything from Sessions 17–19 still live.
RESOLVED THIS SESSION: the "older source copy" caveat (§7 item 000) is GONE — the exhibit is
now the newest UI. The demo-mode button and DEMO chips were removed at the user's request.
KNOWN NIT (still deferred): the Problem `statement` beat renders at 4 lines (wanted 3) — note
the statements are now CENTRED, so line balance matters more than before.**

### VERKOS APP EXHIBIT — REBUILT FROM LATEST SOURCE — Session 20
**Supersedes the Session-19 app embed.** Source = `verkos-reports-exhibit-rudy-main.zip`
(E:\Grad Project@Flytbase\Flinks\Verkos\), extracted to `E:\tmp\verkos-main-src`, built in a
scratch copy at **`E:\tmp\verkos-exhibit-main`**. Neither the zip nor the user's source folders
were modified. Output → `public/verkos-demo/` (6.8 MB, was 3.1 MB).
- **`node_modules` seeded from the Session-19 scratch build** — dependency sets between `-fresh`
  and `-main` are BYTE-IDENTICAL (105 packages, zero version drift), so no install was needed.
- **DEMO MODE IS THE POINT AND IT IS PERMANENT.** This copy ships a real, purpose-built demo mode
  that Session 19 deliberately avoided (user reversed that call). It already short-circuits all
  three `generate-report` invokes (`ai-report-service.ts` `demoAssistSection` /
  `demoGenerateFullReport` / `demoFillSiteContext`), the wizard flights step, and the flights
  pages. `src/exhibit/bootstrap.ts` calls `enterDemoMode()` before the router mounts.
- **⚠️ DEMO MODE DOES NOT COVER EVERYTHING** (user flagged this; it was correct). The store's base
  mocks are EMPTY arrays — `mockSites = []`, `mockReports = []`, `mockDrafts = []` — and
  `flightContexts` starts `{}`, so `enterDemoMode()` looks up `demo-flight-1..5` contexts and
  finds none. **`src/exhibit/seed-data.ts`** authors the missing records: 3 enriched sites,
  5 reports (varied profile/status), 5 drafts, 5 flight contexts with pilot notes, and gallery
  media for flights 6-12 (the demo gallery only covers 1-5, so seeded reports showed
  "0 files from 0 flights").
- **`src/exhibit/mock-http.ts`** replaces the axios instance from `useHttp()`. URL-routing, never
  throws, never hits the network: `v2/flight`, `v2/objects/folder/:id`, forensic
  `ai-search/search/text` + `/detections/:id` (with plausible bboxes), sites, profile, org.
  ⚠️ **`sites/` returns a BARE ARRAY of ISite, not an envelope** — returning an object makes
  `mergeApiAndLocalSites` throw "e is not iterable" and the Sites route white-screens.
  ⚠️ **API site `_id`s must match the seeded local ids as `site-fb-<_id>`** — that's the merge key
  in `src/utils/map-api-site.ts`; mismatched ids render every site TWICE.
- **`src/exhibit-auth/`** (directory — deep imports need it) replaces the `@auth` vite alias.
  Inert guards (the real ones redirect the whole app to `/login`), pass-through providers,
  `useHttp()` → the mock client. **`useAuth().orgId` stays `null`** — load-bearing, keeps
  `useDbSync()` off Supabase (same as Session 19).
- **CREDENTIALS REMOVED — three, all would have shipped publicly:** a hard-coded Supabase URL +
  anon key in `integrations/supabase/client.ts` (replaced by a full offline mock covering all
  four modes incl. `extract_template`, which has NO demo branch); the FontAwesome Pro kit token
  in `index.html`; and a **Cesium ion token** in `environment.lovable.ts`.
- **`environment.lovable.ts` is the config that actually runs** — the runtime selector falls
  through to it for any non-flytbase hostname. Its `websiteBasePath` now derives from
  `import.meta.env.BASE_URL`, which sets the TanStack router `basepath`. **Without this every
  route falls through to the index** (all 7 routes rendered identical content until fixed).
- **Icons: FontAwesome → lucide.** `scripts/gen-icon-map.mjs` codegens `src/exhibit/lucide-icons.ts`
  (92 glyphs, all resolved first pass) from lucide-react's ESM `__iconNode` data.
  ⚠️ **`src/exhibit/icon-swap.ts` INJECTS a child into the existing `<i>` — it must NEVER use
  `replaceWith()`.** The first version replaced the node, which pulled React-managed elements out
  of the tree and threw `NotFoundError: Failed to execute 'removeChild'` on unmount, crashing
  `/flight/:id` and `/guides`. Do not go back to replaceWith.
- **Fonts self-hosted** (`public/fonts/`, 7 woff2 latin subsets, ~296 KB): Inter + DM Sans were
  loaded from Google in 5 places (index.html ×2, index.scss, report-print.ts, ReportPreview.tsx).
  The app has NO serif anywhere; the risk was print/canvas fallbacks landing on one. Verified 0.
- **`src/exhibit/asset-url.ts` is IDEMPOTENT ON PURPOSE** — demo data resolves URLs at module load
  and the mock HTTP layer hands the same values back as API responses; naive re-application
  produced `/verkos-demo/verkos-demo/demo/...` and broke every flight image.
- **Images:** the 6 real photos compressed 30 MB → 2.1 MB. The 16 `placehold.co` URLs are gone,
  replaced by frames DERIVED from the real photos with ffmpeg (thermal false-colour via
  `pseudocolor`, night grades, 14 patrol crops) plus **`Oil Rig.jpg`** — the one genuinely new
  asset in `Demo data\Demo images\` (the other six were already in the build).
- **UI edits (user-requested, the only deviations from "UI strictly as shipped"):** the sidebar
  "Try demo mode" CTA + "Demo mode · Exit" badge removed (a toggle would empty the app out from
  under a visitor), and the `Demo` chips + "viewing a complete demo shift report" banner removed
  from `ReportsTable.tsx` / `ReportReview.tsx`.
- **VERIFIED** (raw-CDP headless harness): 0 external requests · 0 leftover `fa-*` · 0 unmapped
  icons · 0 serif elements · 0 broken images · all 7 list routes + 7 detail routes populated ·
  the create-report wizard runs end-to-end (flights → agent → template → editable report) ·
  in-iframe nav is pure client-side (0 network). Embedded on the case study: app iframe at
  y=2397, report at y=4449, no horizontal overflow at 1500px.
- **KNOWN, ACCEPTED:** the reports table clips its TYPE/AUTHOR columns at the embed's 1400px
  logical width (container is `overflow-hidden`) — that is the app's own responsive behaviour;
  widening `designWidth` would shrink all text. Direct URL loads of `/verkos-demo/<route>` 404
  (Next serves `public/` with no SPA fallback) — irrelevant, the iframe entry point is
  `index.html` and routing is client-side thereafter.

### CASE-STUDY CHANGES — Session 20 (both studies)
- **Contents rail is now DERIVED** (`deriveContents()` in `LirCaseStudy.tsx`) from the sections in
  `CHAPTER_IDS`, using each chapter's real flash `heading`. The hand-authored `data.contents` had
  drifted badly in BOTH studies: 10 entries for 7 chapters, three ids targeted TWICE
  ("the shift"/"process", "solution"/"trade-offs", "Impact"/"reflection" — which also broke the
  scroll-spy, two links lighting at once), and **`features` missing entirely**. `data.contents`
  is now unused by the renderer but left in the types.
- **`ImageLightbox.tsx`** — click any screenshot → full-screen view, ✕ button, Esc or click-anywhere
  to close. **Delegated listener on the case-study root**, NOT per-image: the two studies render
  images from 16 call sites across 4 files, so wrapping each would miss any added later. Opt out
  with `data-no-zoom` (used on the fixed intro cover); images under 120px are skipped
  automatically, which excludes logos/icons. **Scroll lock is the whole point** — the studies are
  scroll-driven, so a reader must not advance past a chapter transition while an image is open.
  `overflow:hidden` alone is NOT enough (Lenis keeps driving the page) — it stops Lenis via
  `lenisBridge`. Verified with REAL CDP wheel events; `window.scrollBy` is programmatic and is
  never blocked, so it falsely reports failure. Restores the exact scroll offset on close.
- **Hover affordance** (`globals.css`): `[data-zoomable]` gets `cursor:zoom-in` + a 1.2% lift +
  accent ring. `(hover:hover) and (pointer:fine)` only; motion dropped under reduced-motion.
- **Design-decision images** replaced from the user's Figma exports (`DD1 figma.png` etc. in
  `case-study-assets/flytbase-project-2/`): `dd1-detection-events.webp`, **`dd2-templates.webp`
  (dd2 previously had NO image)**, `dd3-one-screen.webp`. All at 1400px (column renders 860px, so
  1400 stays crisp at 2× without waste). Old `dd1-configurable` / `dd2-onesurface` deleted.
- **New optional `imgScale` on `decisionText`** (0-1, fraction of the measure, centred via
  `mx-auto`): dd1 + dd3 are tall portrait captures at **0.8** so they don't tower over their cards;
  **dd2 stays full width** — it's the wide landscape template editor and shrinking it would push
  its UI text below readable size.
- **`statement` blocks are now CENTRED** + `text-balance` (was left + `text-pretty`). Centring makes
  ragged line lengths obvious, hence the balance swap. Verkos-only block; LIR is unaffected.

### VERKOS INTERACTIVE EXHIBITS — Session 19 (shipped in `8a3d26f`)
Two embeds on `/work/verkos-reports`, both rendered by ONE component
(`src/components/case-study/VerkosPrototype.tsx`) with a `variant` prop.

**1. `variant="app"` — the REAL Verkos frontend, static, in `public/verkos-demo/` (3.1 MB).**
Placed in `LirCaseStudy.tsx` right after the build statement and BEFORE the first chapter
flash (opt-in per study via `appDemo?: boolean` on `LirDesign`; only Verkos sets it), so a
reader can use the product before the story starts. Measured: app y=2397, CONTEXT flash
y=3728, report y=4449.
- ⚠️ **BUILT FROM THE OLDER SOURCE COPY** `E:\Grad Project@Flytbase\Flinks\Verkos\verkos-reports-exhibit-rudy`,
  **NOT** `-fresh`. Reason: `-fresh`'s `CreateReportWizard` calls LIVE FlytBase APIs
  (`fetchFlightMedia`, `runAgentDetectionQueries` via `useHttp`) so its report-generation flow
  cannot run without a backend. The older copy's wizard is fully local — grep for
  `useHttp|httpClient` in its `src/components/reports/` returns NOTHING; it runs on Zustand +
  `src/data/mock-*.ts`. **To move to `-fresh` later:** stub those two API helpers the same way
  Supabase was stubbed (canned media list + canned detection results). `-fresh` also adds
  `ContextCheckStep`, `ReportGenerationModal`, `SectionsDndList`, template panels, flights routes.
- **Build recipe** (all in a scratch copy at `E:\tmp\verkos-exhibit` — **neither source folder
  was modified**): source from the old copy, `node_modules` seeded from `-fresh` (its deps are a
  strict superset: 5 extra packages, zero version conflicts) then `npm install`.
  Patches applied there:
  1. `@auth` vite alias → `src/exhibit-auth/` stub (SuperTokens/guards inert). `orgId: null` is
     load-bearing — `TemplateAppLayout` feeds it to `useDbSync()`, which only calls Supabase when
     an org id is present, so null keeps the app entirely offline. Deep imports
     (`@auth/components/*`) needed the stub to be a DIRECTORY, not a file.
  2. `_layout.tsx` guard loader removed (else it redirects to `/login`).
  3. `App.tsx` reduced to I18n + QueryClient + Toaster + Router (SuperTokensWrapper/AuthProvider/
     HttpProvider/FeatureFlagInitializer all dropped).
  4. `src/integrations/supabase/client.ts` replaced by a pure mock — the real one calls
     `createClient(import.meta.env.VITE_SUPABASE_URL)` at IMPORT time and THROWS
     "supabaseUrl is required", which alone stopped the app mounting. Its only real use is
     `functions.invoke('generate-report')` (modes `site_context_fill` / `full_report` /
     `section_assist`) — each now resolves canned content in the caller's exact shape after a
     short delay so loading states still play.
  5. Store seeded at init with `buildDemoReport(mockTemplates[0])` + `DEMO_SITE`/`DEMO_AGENT`/
     `DEMO_GALLERY_IMAGES` — the app ships EMPTY otherwise. The `demoMode` FLAG is deliberately
     NOT set (user: don't use the app's demo mode; make up data instead).
  6. Absolute `/demo/` + `/assets/` paths rebased to `/verkos-demo/…` — vite's `base` does NOT
     rewrite absolute URLs inside JS strings.
  7. Vite `base` + `environment.lovable.ts` `websiteBasePath` both set to `/verkos-demo/` (the
     runtime env selector falls through to `lovableConfig` on non-flytbase hostnames).
- **FontAwesome Pro REMOVED — icons are lucide now.** The app renders `<i class="fa-solid fa-x">`
  from FlytBase's **Pro kit with an account token** (`kit.fontawesome.com/2fa2222b23.js`), which
  must not ship on a public portfolio. `src/exhibit-lucide-icons.ts` maps all **78** distinct
  `fa-*` glyphs to inline lucide SVGs and swaps them in place (MutationObserver catches icons
  React mounts later; each SVG inherits the original classes + `currentColor`, 1em box).
  Google Fonts `@import`s also stripped (`index.html` AND `src/index.scss`).
  **Verified: 0 external requests, 0 leftover `fa-*`, 0 unmapped icons.**
- **Fit-to-width scaling:** the dashboard wraps into unreadable slivers below ~1200px, and
  breaking it out of the reading column overflowed (the column is offset by the rail, so
  symmetric expansion pushes past the right edge). Instead the iframe renders at a logical
  1400px and a `ResizeObserver` scales it into the slot; fullscreen returns to 1:1. No
  horizontal overflow at 1500px or 2541px.

**2. `variant="report"` — `public/verkos-report/index.html` (1.3 MB), standalone.**
A self-contained recreation of the generated-report ARTIFACT, matched to the real viewer
(`Verkos Reports marketing material/generated report viewer.png`): light canvas,
`Observation #N` headings, coloured priority, "AI detection confidence: N%", *Pilot observation*,
then the annotated frame + detection caption. Interactive: filter by priority, disclose pilot
notes, re-roll the executive summary (3 canned variants on a timer). Opens 01 Context.
Icons are inlined lucide SVGs (it's plain HTML, so no React import). No network at all.

**Shared shell behaviour (both variants):**
- **Desktop-only** — `(min-width: 900px) and (pointer: fine)`; phones get a short notice. The
  gate returns `null` before measurement so SSR and first paint agree (no hydration mismatch).
- **Fullscreen toggles BOTH ways** (same button + Esc), with a fixed-overlay fallback when the
  Fullscreen API is missing or refuses (iOS Safari).
- iframe is `sandbox="allow-scripts allow-same-origin"` — first-party static build; same-origin
  is needed for its router/localStorage.
- **Images: annotated frames ONLY** (user's call). The 3 `*-annotated.jpg` were re-encoded
  (16 MB → 1.3 MB, ffmpeg, max 1800px, q4); the `-raw` variants were deleted and every
  reference repointed at the annotated file.

### CASE-STUDY FIXES — Session 19
- **Full-bleed panel.** `LirCaseStudy.tsx` had `max-w-[1680px]` on the same element as the
  opaque `bg-bg` that paints over the fixed intro thumbnail — so above 1680px the thumbnail
  showed through the left/right gutters. The cap moved INWARD onto the grid; the background is
  now full-width. Measured at 2541px: panel 0→2526 (no gutters), grid still 1680 centred,
  content position unchanged. Benefits LIR too (shared shell).
- **`VerkosLogo` alignment.** `(x, y)` now means the mark's CENTRE (was its top-left) so it sits
  on the wordmark's centre axis — `deltaY: 0` in both the pipeline and assembly diagrams (they
  share one `FlowSvg`, so one fix covers both). The true bbox was measured from the star path
  extents + the four **ROTATED** rects' corners (the raw `x/y/width` attrs describe pre-rotation
  boxes and understate the cluster): extent **83.09** centred **(42.93, 172.98)**, not the
  assumed `104` / `(8, 131.5)` — so the mark had also been rendering ~20% undersized.

### VERKOS REPORTS — Session 18 (the 2nd FlytBase case study, shipped in `c9fef67`)
Recreated from **Figma node 258:2** ("Page of project 3"). A FlytBase project — AI-powered automated
security **report generation**. Built to REUSE the LIR case-study shell (`<LirCaseStudy>` + `Chapter`),
so it inherits every chapter flash/spawn transition for free; only the content + accent differ.
- **Data:** `src/lib/caseStudies/verkosDesign.ts` — `LirDesign`-shaped, copy transcribed VERBATIM from
  the Figma text nodes (a hand-authored `Verkos_Reports_case_study.md` exists in the gitignored assets
  but is NOT the copy source — the user was explicit: follow Figma). Registered in the `STUDIES` slug
  registry in `work/[slug]/page.tsx`.
- **Per-study accent = cyan `#08e6ff`** (vs LIR orange). Added `accent?: "orange" | "cyan"` to
  `LirDesign`; the component sets `data-accent="cyan"` on the `.lir` root; globals.css
  `.lir[data-accent="cyan"]` overrides `--color-accent`. Everything token-driven recolors (eyebrow,
  stats, chapter flash, decision labels, rail, diagram vectors, the Verkos star logo).
- **anime.js (v4) — the user asked for it for this study's transitions/vectors.** It does NOT conflict
  with GSAP: the division is GSAP/ScrollTrigger owns scroll-POSITION-driven motion (chapter flashes,
  pin, scrub); anime.js does self-playing ONE-SHOT motion fired by an IntersectionObserver (no scroll
  scrubbing), so it never touches ScrollTrigger's world. `@types/animejs` (v3) UNINSTALLED — v4 ships
  its own types and the v3 ones conflict. `ogl` is still an unused dep from the removed video shader.
  - `VerkosMotion.tsx`: `AnimeReveal` (staggered rise+fade), `AnimeVectorDraw` (draws stroked SVG paths
    via `svg.createDrawable`), `InlineSvg` (fetches an external .svg, injects it inline so anime can
    reach its geometry, draws strokes + fades fills — used for the real Figma Reframe diagram).
  - ⚠️ GOTCHA: `InlineSvg` fills animate OPACITY ONLY — never translate/transform. The Verkos star
    logo has 4 rotated-rect petals; adding a translate fought their existing `rotate()` and scattered
    the mark. Both anims hard-set their final state `onComplete` so the diagram always ends intact.
- **`verkosBlocks.tsx`:** `DecisionText` (native decision cards — the copy is live text in Figma, not
  baked SVGs like LIR) + `VerkosDiagram`/`FlowSvg` (inline animated pipeline + assembly diagrams, one
  self-contained SVG each so boxes/text/connectors never misalign) + `VerkosLogo` (the real 4-petal +
  cyan-star mark, geometry lifted from the Figma export, reused in the "Verkos Reports" box).
- **Decision cards — EXACT Figma palette** (258:2): solid fills tempting `#FFB350` / problem `#FFA09B`
  / chose `#7AC3FF` / why `#62FFC0`; labels `#000`; body `#363636`; the "why" cards carry a mixed-
  weight semibold black lead + regular. **Headings verbatim from Figma** (the user re-added the heading
  layers so they'd export): 01 "Detection events needed details for the VLM to fetch bounding boxes",
  02 "How to configure report structure and contents via editable templates", 03 "One screen from
  flight to report." Layout: the FIRST TWO cards pair 2-up, every card after spans full width (matches
  dd1 tempting+problem 2-up / chose+why full; dd2+dd3 tempting+chose 2-up / why full). dd1→image599,
  dd3→image511, dd2 has no image.
- **New SHARED blocks** added to `lirDesign.ts` + `LirCaseStudy.tsx` (available to LIR too):
  `statement` (big bold display beat, indented onto the content column), `leadP` (white bold lead
  sentence + light-grey body — the Impact copy), `decisionText`, `verkosDiagram`. `quoteFlash` gained
  `tone` ("bright"=white) + `wide` (2-line measure) — the Reframe thesis is a full-viewport bright
  `quoteFlash`. `richP` unchanged.
- **Demo video is now OPTIONAL** (`data.demoVideo?`): the Overview only renders `<DemoVideo>` when a
  study provides it. LIR keeps its video (moved into LIR's data); Verkos ships none. Fixed the bug
  where LIR's video showed on every study.
- **Overview polish (shared, so LIR benefits):** headline `max-w` widened → breaks to 2 lines in BOTH
  studies; stats grid columns adapt to stat COUNT (Verkos has 2, LIR 4) so a 2-stat study isn't
  quarter-width; `CountUp` skips the count-up for arrow-notation values ("45 → 5 mins", "187 → 0")
  which it would otherwise tick through nonsense — renders them static + `whitespace-nowrap`.
- **UI IMAGES = bare figures, NO rounded container frames** (house rule the user restated). 8 UI
  screenshots WebP-compressed (ffmpeg libwebp cap 1600w q82/86: 24MB PNG → ~1.6MB) into
  `public/case-study/flytbase-2`; sources in gitignored `case-study-assets/flytbase-project-2`.
  - **Annotated frames re-composited:** the Figma exports of east-gate / south-fence were the RAW
    photos; the red/orange detection boxes + "Pickup truck (98%)" / "Fence deformation (87%)" labels
    are drawn manually in Figma. Baked them in with ffmpeg drawbox/drawtext at the Figma frame coords
    (scale 1.5685 to 1600w). GOTCHA: ffmpeg `drawtext` mangles `%` even escaped/in a textfile — must
    pass **`expansion=none`** to render "(98%)" literally. Label bar widths sized to the text so it
    doesn't bleed out of the coloured bar.
  - Figma asset server: `http://localhost:3845/assets/<hash>.png|svg` via the Dev-Mode MCP (no Figma
    REST token available — CLI not logged in; `get_screenshot` renders composed frames but can't save
    to disk, so raster compositing + inline SVG were the paths used).

### PRIOR STATE (Session 17): MOBILE HERO PASS + LIR CONTENT/READABILITY (still live)
**`e94238f`** (LIR Process reorder + code-architecture timeline) + **`a682c1c`** (mobile hero
adaptation + video-fallback removal + LIR text-SVG widening) + **`41d86dd`** (mobile round 2: Android
pin flash, iOS reveal, home hamburger) — all live. First real mobile work; still NOT fully device-
verified on real iOS Safari. The hero background VIDEO fallback is GONE (non-WebGL2 → dark canvas).

### MOBILE HERO + VIDEO REMOVAL — Session 17 (shipped in `a682c1c`)
First real cross-device pass on the home hero, driven by user bug reports (Android empty drag-scrolls
+ white flash at bottom; iOS showed only the shader, no headline text). All desktop-affecting logic is
gated on `pointer: coarse` so **desktop is byte-for-byte unchanged**. Verified with a mobile-emulated
raw-CDP harness (device metrics + touch + coarse pointer; SwiftShader `--use-angle=swiftshader
--enable-unsafe-swiftshader` so the WebGL2 scene branch actually mounts headless).
- **Hero background VIDEO fallback REMOVED entirely.** `VideoBackground.tsx` + `ShaderBackground.tsx`
  DELETED. Non-WebGL2 devices (or a scene crash / reduced-motion) now get a plain dark `#04070d`
  canvas via a tiny `DarkFallback` that still calls `markHeroVideoReady()` so the loader door never
  hangs. `HeroCanvas` modes are now `"scene" | "dark"`. `heroReady.ts` kept (loader coordination) with
  refreshed comments. **`ogl` is now an unused dependency** — left in package.json to avoid a lockfile
  churn; safe to drop on the next real `npm install`.
- **Mobile scroll journey SHRUNK, not removed** (user explicitly wanted it kept but "smaller / more
  accessible"). In `Hero.tsx`, pin travel is `endVh = isCoarse ? 1.25 : 2.35` (was a flat
  `OLD_END_VH = 2.35`). Same journey (all 3 phrases + 5 node beats) now plays over ~half the scroll —
  page height **~11 → ~6.8 viewports** on a 390px phone (measured). `heroScroll.progress` still scales
  by `OLD_UNITS` so the tunnel just travels a touch faster per swipe. Desktop path untouched.
- **iOS "only shader, no text" FIXED.** The headline `[data-intro]` layer was staying parked at
  `yPercent:120` (off-screen) when the loader hand-off timing lined up badly with the pinned WebGL
  scene mount on iOS Safari. Fix: a latched **`revealOnce()`** wrapper + a hard **1.4s failsafe timer**
  so the reveal fires no matter which trigger wins — the headline can never stay hidden. Both the
  loader-event path and the client-nav double-rAF path now call `revealOnce`; cleanup clears the timer.
- **White flash at page bottom FIXED.** The page `body` default background is warm near-white
  (`--color-bg: 250 250 249`); on touch the hero pin-spacer could briefly under-cover as the pin
  released, flashing white. Fix: `page.tsx` home root wrapped in `bg-[#06080c]` so any spacer gap shows
  the dark canvas. Scoped to the home page — the light `/work` index and other routes are untouched.

### LIR MOBILE READABILITY — Session 17 (shipped in `a682c1c`)
User asked to scale up SPECIFIC baked-in-text SVGs on phones (their text is inside the SVG, so render
width = text size; too small in the reading column on a 390px phone).
- **New `.lir-wide-mobile` utility** (globals.css, `.lir` scope): breaks an element out to
  `100vw - 24px` on phones (`margin-left:50% + translateX(-50%)`), collapsing to a normal in-column
  element at `min-width: 640px` (`sm`). Phone-only — desktop/tablet untouched.
- Applied to EXACTLY the three the user named: the **orange "gap conclusion" box** (end of Problem,
  `GapReveal` img) and dd3's **"Why I gave it up" / "What it cost me"** cards (the `wide` cards in the
  "Mobile is a different persona" decision cluster). Threaded via a new optional `wideMobile?: boolean`
  on `DecisionCluster` (set true only on dd3 in `lirDesign.ts`) → `CardRows` → `CardImg`; only applied
  to SOLO full-width cards (a 2-up pair can't take the negative-margin breakout). Verified: phone
  renders them 366px vs the 342px text column (wider = bigger text); desktop stays 850–860px in-column;
  no horizontal scroll introduced.

### LIR PROCESS CONTENT — Session 17 (shipped in `e94238f`)
- **Audit trio moved into Process.** The "Before designing anything new… I audited what already
  existed" intro + the three orange `auditNotes` callouts now OPEN 05 Process instead of trailing 04
  Reframe; Reframe now ends on the "single room per incident" vision lede. (Note: content-order changes
  to a Chapter need a HARD reload to re-measure — ScrollTrigger keeps stale flash/spawn offsets across
  HMR, which briefly showed a dead gap under the PROCESS flash until reload.)
- **New `archTimeline` block** — the "code architecture" Q&A beats on a vertical accent rail. Two beats
  (drone-feed via a Supabase edge fn; live-chat 7–11 language translation server-side), each = question
  (white) → constraint (muted) → answer (brighter), framed by "Then I had to start building the code
  architecture." / "And similarly every other moving piece… needed a plan." Component `ArchTimeline`
  in `lirBlocks.tsx`: the rail DRAWS IN on scroll (scaleY scrub), per-beat node dot pops (`back.out`) +
  staggered line reveals (ProseReveal idiom), full reduced-motion fallback. Inserted right after the
  audit, before the user-flow beat.

### LIR POLISH + PERF — Session 16 (all shipped in `9aff22d`)
Iterative polish on the LIR case study, driven by the user screenshot-by-screenshot, plus a real
perf pass. All verified via the raw-CDP headless-Chrome harness (scratchpad `verify*.mjs`; run FROM
project dir so `ws` resolves; dismiss egg loader by clicking `button[aria-label="Click to enter the
site"]`; CONNECT TO A PAGE TARGET not the browser endpoint; scroll THEN measure since images are
eager). typecheck + prod build clean.
- **Chapter flashes rebuilt to VIEWPORT-DRIVEN, zero dead scroll** (`Chapter.tsx`). Earlier passes
  went scrubbed-pin → self-play-pin → **final: in-flow full-viewport panels**. Each flash is a real
  `h-svh` panel in normal flow: `[data-flash]` = one-shot ENTRANCE (plays on enter, `toggleActions:
  "play none none reverse"`), `[data-flash-exit]` (outer wrapper) = SCRUBBED departure (lifts/scales/
  dissolves as the panel scrolls off, `start:"top top" end:"center top"`). Two wrappers so the two
  tweens never fight one element. NO pins, NO fixed overlays — those clipped titles + made black
  holes + forced empty scrolling (the user's exact complaint). Page height 49k→~30k px. Dial:
  `FLASH_START` ("top 55%"). Content blocks + `ProseReveal` also self-play on enter.
- **"Here's the gap" morph REMOVED.** `GapMorph` component + `gapMorph`/`gapHeading` block types
  deleted; `heres-the-gap.svg` no longer referenced. The orange CEO box now just pops in after the
  warehouse scenario via `GapReveal`'s spring-in (block type `gapConclusion`, unchanged).
- **Decision cards (`lirBlocks.tsx` `DecisionCluster` + new `CardRows`/`CardImg`):** dd2 was
  rendering its two "wide" cards stretched ~2.3x — they were exported at the SMALL 368/373px size,
  not 765. `CardRows` reads each SVG's intrinsic width and lays small ones 2-up (the Figma 2x2 for
  dd2, node 239:27), full-width ones span. Derived from file width, so re-exporting reflows with no
  code change. `WIDE_CARD_DESIGN_W = 700` is the threshold. **`CardImg` reads naturalWidth on mount
  AND onLoad — a cached image never fires onLoad** (this bit twice; the fix is load-agnostic now).
- **Media rows height-capped** (Figma fixed boxes): `tight` rows (dd3 3-up phones) `h-[clamp(300px,
  32vw,470px)]` + `gap-2`; single full-width `clamp(...444px)`; 2-3up `clamp(...310px)`. `object-
  contain` (NOT cover — cropping a tall phone shot cuts the UI). Fixes towering screenshots.
- **dd3 content edits (`lirDesign.ts`):** added `note` type on a cluster ("Mobile is a different
  product, not a smaller one." + 2 body lines) rendered between the cards and the phone shots;
  REMOVED the two persona figures (`dd3-img-4/5` "fig. UI for Jean" / "operator and guests"); phone
  row now `tight`.
- **Body copy +2px across the study** via the shared **`--lir-note` (14px)** token (created in a
  prior step for audit callouts): audit callouts, the dd3 note, AND all Features body paragraphs
  (`FeatureRow` body/body2) now 14px. `--lir-body-sm` (12px) UNCHANGED — captions/back-link/overview
  notes stay small. Token drives 3 things now; change it in globals.css `:root` to move all together.
- **Feature images CYCLE in place** (`ImageCycle`): the horizontal scroll-snap strip is GONE. 2+
  images stack in ONE box (first in flow sizes it, rest `absolute inset-0`) and crossfade every
  **2s** (`CYCLE_MS`), GSAP, pauses off-screen (ScrollTrigger onToggle), reduced-motion shows frame 1.
  No added frame/rounding — screenshots carry their own chrome.
- **Minimal GSAP text reveals** (`ProseReveal` in `lirBlocks.tsx`): children rise 14px + fade,
  stagger 0.08, one-shot on enter (`top 82%`), reverse on scroll-up. Applied to cluster headings +
  the dd3 note. Deliberately understated — motion budget is spent on the chapter flashes.
- **DEMO VIDEO player** (`DemoVideo` in `lirBlocks.tsx`) replaces the 16:9 placeholder that closed
  the Overview. Real controls: click/tap play, PAUSE, MUTE toggle, VOLUME slider, SCRUB bar, time
  readout. **Never autoplays** — browsers force-mute autoplay, which would drop the narration the
  user said matters. Serves `.webm` (VP9/Opus) then `.mp4` (H.264/AAC) + poster. `video` block type
  gained optional `src`/`poster` (renders player when set, placeholder otherwise).
- **VIDEO ENCODING (ffmpeg, kept audio):** source `case-study-assets/flytbase-project-1/LIR_V1.mp4`
  (41.8MB, H.264/AAC, 1920x1080, 100s) → **`public/case-study/video/lir-demo.{webm,mp4}`** +
  `lir-demo-poster.jpg`. webm = libvpx-vp9 crf34 + libopus 96k (11MB); mp4 = libx264 crf26 + aac 128k
  (13.8MB); both scaled to 1600w, stereo audio PRESERVED, `+faststart` on mp4. Range requests work
  (HTTP 206 → seeking). Source stays in gitignored `case-study-assets/`.
- **IMAGE PERF — PNG→WebP:** `public/case-study` was **~70MB**; PNGs were 4K-wide (e.g. before-ui
  4173x2167) rendering in an 860px column. Converted ALL case-study PNGs → **resized WebP** (ffmpeg
  libwebp, cap width 1600 lanczos, quality 82): scenario 13.6MB→173KB, image-1 5.1MB→103KB, etc.
  **Dir now ~31MB.** All 24 code refs updated to `.webp` (0 `.png` refs remain, all resolve). PNGs
  deleted. Sources stay in gitignored `case-study-assets/`. NOTE: images are still `loading="eager"`
  (deliberate — fixes a ScrollTrigger measurement bug per Session 15; weight solved via compression
  not lazy-loading).
- **HEADER on case-study routes (`Header.tsx`):** case studies were falling through to the WHITE bar
  (nav = bare black text colliding with dark scrolling copy). Fix: `darkPage` now matches `/about`
  OR `/^\/work\/[^/]+$/` → solid `#06080c` bar + white nav. ALSO the LIR thumbnail intro
  (`LirCaseStudy.tsx`, `fixed inset-0`) was marked `data-header-dark`, so its rect overlapped the
  header strip at EVERY scroll pos → pinned the header transparent for the whole page. Removed that
  attr. Verified: solid `rgb(6,8,12)` at every depth, transparent only at footer. Home/about
  unchanged.

### WORKS JOURNEY — Session 15 (home work showcase moved INTO the hero tunnel)
The white horizontal "MY WORKS." gallery is GONE (`WorkGallery.tsx` deleted; `page.tsx` now renders
`<Hero/>` + `<WorksIndexStatic/>` reduced-motion fallback). The work showcase now happens INSIDE the
hero's pinned dark tunnel — the circle-wipe is gone too.
- **New files:** `src/components/sections/WorksJourney.tsx` (the beats + ticker + static fallback),
  `worksAnchor.ts` (bridge so `/#work` glides to the in-pin chapter offset — no `#work` element on
  the motion path), `hero3d/WorksNode.tsx` (the real 3D energy-cuboid mesh), `hero3d/pathMath.ts`
  (THREE-free `pathOffset`/`smoothstep` mirror of the shader path, so DOM riders bend along the
  same snake path).
- **How it works:** after phrase 3 recedes, "HERE'S SOME OF MY WORK" rises, then 5 project beats
  play out on the SAME pinned scrub. Each beat: a real orange energy CUBOID (`WorksProjectNode`,
  same RoundedBox + fresnel/hot-core shader as the background `EnergyNodes`, a camera child, gets
  the scene's bloom/DoF for free) flies up the snake path via `heroScroll.worksNode` (camera-space
  x/y/z the DOM ticker publishes each frame), then morphs into the white project WINDOW (DOM frame
  crossfades in as the cuboid burns off). Window = real `<Link>` to the case study. LIR shows its
  real cover; others clean white (add to `THUMB_SRC`). On the video fallback (no WebGL2), the DOM
  orange-skin flies the whole way instead (`heroScroll.sceneLive` gate).
- **Bridge (`heroScroll.ts`) gained:** `travel` (SceneController writes eased uTravel back for DOM
  riders), `sceneLive`, `worksNode`. Hero pin length now scales with `scrub.duration()` so the
  tunnel's world-units-per-scroll stays constant however many beats exist. Nav + Footer `/#work`
  call `scrollToWorks()`. **NOT felt on real GPU yet** (headless can't run WebGL) — dials are at the
  top of `WorksJourney.tsx` (FLIGHT_H, SCATTER, NODE_D_FAR, beat rhythm SPAWN/MORPH/HOLD/EXIT).
- **`npm run dev:lir`** added (`scripts/dev-open.mjs`) — starts dev + opens straight to the LIR
  route so only that route compiles (skips the heavy hero compile). Next 16 removed `next dev
  --open`, so the wrapper opens the browser itself.

### LIR DARK REBUILD — Session 15 (the case study, now DARK + real assets + scroll scenes)
The LIR case study was flipped from the light/editorial build to **DARK** and wired with the user's
real Figma exports, per-section scroll scenes, and Figma-faithful layouts (nodes 229:3, 239:27,
240:42). It supersedes the Session-12 light look; `lirDesign.ts` + `LirCaseStudy.tsx` + `lirBlocks.tsx`
+ `Chapter.tsx` are the live files.
- **Dark palette (`.lir` scope in globals.css):** bg `#06080c` (the About/hero canvas), headings
  `#FFFFFF`, body `#B4B4B4` (`--color-muted`), accent ORANGE `#FF8D3B`, surfaces `#0d1016`, white
  hairlines via alpha. Type scale/geometry tokens UNCHANGED — only the palette flipped. DroneMark
  sparkle → orange, 4 spokes → white. FlytBase logo sits on a white chip (dark logo vanished).
- **All real assets wired** (in `public/case-study/`, sources in gitignored `case-study-assets/
  flytbase-project-1/`): fresh dark drone/dock diagrams; `user-flow.svg`/`stakeholder-actions.svg`
  (persona `roles.svg` REMOVED — it duplicated the "matters" list); design-decision card SVGs
  (`dd{1,2,3}-{tempting,gaveup,shortcut,why}.svg`, copy baked in) + screenshots (`dd*-img-*`);
  `features-1..7`, `impact-1..3`, `design-system`/`ascii-layout`/`before-ui`, `gap-conclusion.svg`.
  **All images render BARE** (no rounded embed frame, no crop) — `Figure` shows a real `src` as a
  plain `<img>`; only src-less placeholder slots keep the dashed box.
- **Every numbered section is now a CHAPTER** (`CHAPTER_IDS` = context/problem/reframe/process/
  decisions/features/impact) — full-viewport Tanker title FLASH then content spawns scrubbed.
- **Scene splits:** Problem = quoteFlash → warehouse image → "Here's the gap" bars → orange
  gap-conclusion box (plain stacked blocks, NOT the pinned `gapMorph` — that overlapped; `GapMorph`
  exists but is unused). Reframe split via `sceneBreak` blocks (intro trio / matters list / audit).
  New block types: `heading`, `subhead`, `beforeAfter`, `splitRow`, `gapConclusion`, `gapMorph`,
  `video`, `sceneBreak`. "Features shipped" overview note → a 16:9 VIDEO placeholder frame.
- **Process design.md subsection (Figma 240:42-ish):** asymmetric `splitRow`s (text one side, bare
  image the other) + a **before/after drag SLIDER** (`BeforeAfter`, Before UI → shipped screen,
  pointer-drag wipe + keyboard range).
- **Design decisions (Figma 239:27):** `DecisionCluster` renders the card SVGs (tempting+counter
  row → wide "why"/"what it cost me") + a `mediaRows` image grid (explicit `cols` per row — e.g.
  dd3 concludes with the **3 phone shots 3-up** + 2 persona figures). dd3 card order = "Why I gave
  it up" then "What it cost me".
- **Features (Figma 240:42):** each feature = a cream `#FFE2B1` tagline pill (full width) + a
  two-col row, TEXT sticky/fixed beside the images. 2+ images = a horizontal scroll-snap strip
  ("one after another"); 1 image = static. Session-creation split into two features.
- **⚠️ CHAPTER SEGMENTATION — two bugs fixed, keep both fixes (`Chapter.tsx`):**
  1. **Flash ghosting** — the flash title bled through neighbouring content. Fix: each flash has an
     opaque **`fixed inset-0` backdrop** (viewport-covering) toggled SOLID for the whole pin via
     `onToggle`, + a **45vh trailing spacer** after each chapter's content. Verified 0 overlaps.
  2. **Sections collapsing / next flash eating prior content** (decisions 2/3 vanished under the
     FEATURES flash) — ROOT CAUSE was `loading="lazy"` images: below-fold images had no height when
     ScrollTrigger measured all pin/flash/section positions, so chapters collapsed and later flashes
     landed too early. Fix: case-study images switched to **`loading="eager"`** + a
     **`ScrollTrigger.refresh()`** on all-images-loaded / `fonts.ready` / window `load` in the
     `LirCaseStudy` useGSAP. Verified: decision clusters ~1550px apart, FEATURES after all of them.

### NAV + LOAD BEHAVIOUR — Session 14 (LOCKED — do not re-litigate)
The load/navigation model, decided after several failed SPA attempts:
- **The About opening now AUTO-PLAYS on load.** `AboutIntro.tsx` has a separate PAUSED `intro`
  timeline (frame grow 0.36→1 + "HEY! THAT'S"/"MY NAME" sliding in from the edges, grey→white)
  that `.play()`s on `LOADER_DONE_EVENT` (or immediately if not loading). The SCRUBBED timeline
  no longer owns that entrance — it STARTS from the converged flank state and its first scroll
  beat is the merge/fade. So a visitor sees the intro animate itself; scrolling continues the
  story and scrolling back to top rests on the convergence (never the tiny-photo opening).
  - The intro's x slides are `fromTo(startX → flankX)` (NOT `.to`) — the scrubbed timeline's
    initial ScrollTrigger refresh pins the phrases at flankX, so a plain `.to` would have zero
    travel; forcing the offscreen `from` restores the slide. GOTCHA, keep it.
  - Pin length dropped **1205% → 1050%**, timeline **~36.6 → ~31.9 units** (scene-1 entrance
    moved off the scrub to the load intro; everything downstream rebased −4.7 units, same feel).
- **Cross-route navigation = a REAL (hard) page load, NOT SPA.** Nav links (Rudyman brand, header
  Nav, footer INDEX) call `hardNavigate(href)` (`routeTransitionBridge.ts`) → `location.assign`.
  WHY: the persistent Lenis + ScrollTrigger carry the previous route's scroll/pin state across a
  client-side nav; NO ordering of reset/refresh reliably reproduced a clean load (headless looked
  fine, real GPUs still auto-scrubbed the hero + distorted pins with hourglass pin-spacers). A
  hard load = fresh Lenis/ScrollTrigger + the Loader runs = identical to a refresh, by construction.
  **Do NOT try to make these SPA again.**
  - **Pan-flip feel kept, no click gate:** `hardNavigate` sets a one-shot `sessionStorage` flag
    (`NAV_FLAG`); the Loader reads it on the fresh load and runs in **transition mode — pan ONLY**
    (no counter, no "cooking"/"click to enter" label), one quick flip, then AUTO-exits (`openPan`).
    A cold first visit (no flag) keeps the full click-to-enter loader. `openPan` guard relaxed to
    allow opening when `isNav` (nav mode drives the open; `ready` may still be false).
  - Same-page `#hash` links (Work `/#work`, Contact `/#contact` when already home) keep normal
    in-page scroll — `hardNavigate` only fires when the target PATH differs from current pathname.
  - `SmoothScrollProvider` gained a pathname-change scroll-reset effect (bails while `is-loading`,
    i.e. lets the loader own curtain navs) — kept as the safety net for any curtain-LESS nav
    (e.g. a future gallery-card → case-study client link).
  - Hero client-nav reveal defers 2 rAFs past the ScrollTrigger refresh (harmless now that nav is
    hard-load, but correct if any SPA nav returns).
- **The SPA `RouteTransition` curtain component was built then DELETED** — it was the racy approach.
  If you see references to it, they're stale.

### ABOUT PAGE — Session 13 (the "Me" journey, `/about`)
ONE pinned GSAP timeline (`AboutIntro.tsx`, pin `end:+=1050%` — was 1205% before Session 14
rebased scene 1 off the scrub, scrub 0.5, ~31.9 timeline units — positions in comments) driving
six scenes on the `.hero-dark` `#06080c` canvas. All user-driven, storyboard by storyboard.
**Scene 1's entrance now auto-plays on load — see "NAV + LOAD BEHAVIOUR — Session 14" above.**
Scene map:
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

000000. **🥇 FEEL THE SCROLL ESCALATOR ON REAL HARDWARE — nothing about it has been felt yet.**
    The Session 26 rebuild is simulation-verified only (see §6 "VERIFICATION — WHAT WAS AND WAS NOT
    PROVEN"). The decision logic is proven; the animation under real input is not.
    a. **MacBook + Windows desktop:** one wheel notch / one trackpad flick should advance exactly
       ONE reveal on both, at the same pace, with no bounce and no waiting gap. If a Mac still runs
       away, **check macOS Accessibility → "Reduce motion" first** — it disables Lenis entirely and
       makes `wheelMultiplier` a no-op.
    b. **Pace:** `RIDE_PX_PER_S` (430 px/s) is the ONE knob. Lower = slower. ⚠️ If you lower it,
       RAISE `RIDE_MAX_S` (3.0s) to match, or the longest gaps clamp and become the fastest rides —
       that was the "here's some of my work gets insta scrolled" bug. See the measured rest table
       in §6; the longest gap in the site is **1248px** (works heading → project 1).
    c. **Real iPhone + Android** on the hero — touch keeps ScrollTrigger's snap (`escalatorSnap`),
       which is a DIFFERENT path from desktop, and `endVh` went 2.12 → 2.90 there. §6 records why
       the iOS no-scroll bug is believed not to have regressed, but that is a code-path argument,
       not a device test.
    d. To verify in-session: serve the **production** build (`portfolio-prod` in
       `.claude/launch.json`) — but **ask the user to display the Browser pane first**, or rAF
       stays paused and no smooth scroll can tick.

00000. **ORO CONNECT — verify the Session 25 pass on a real device + swap the GIF in.**
    Everything in Session 25 was verified via the Browser pane / CDP on desktop only.
    a. **Real-device pass** on `/work/oro-connect` — the product-card hover geometry rewrite in
       particular (`OroProductCard.tsx`) has been through several wrong iterations already; confirm
       it reads correctly on a trackpad/touch, not just via computed style checks.
    b. **The interactive product-card micro-interaction is removed, not deleted.** User said they'd
       replace it with a GIF — `OroProductCard.tsx` and the `case "microInteraction"` renderer in
       `LirCaseStudy.tsx` are still in the codebase, unreferenced. Re-adding the data block or
       swapping in a `video`/`media` block for the GIF is a one-line change in `oroDesign.ts`.
    c. Consider whether the gold-accent hex in `scripts/oro-assets.mjs`'s `withRLabels()`
       (`#D9A441`) should be pulled from a shared token instead of hardcoded, if the accent ever
       changes again.

0000. **✅ `rudyman.com` IS LIVE (Session 22) — ONE ITEM LEFT.**
    Full account of the Vercel zone bug + the Hostinger workaround that fixed it is in §6
    "DOMAIN RESOLVED". Nothing about the domain needs re-doing; do NOT re-run remove/re-add.
    a. **⚠️ ADD SANITY CORS FOR THE NEW ORIGIN — the only outstanding piece.**
       sanity.io/manage/project/4bo3ynjd/api → CORS origins → add `https://rudyman.com`
       (and `https://www.rudyman.com`), allow credentials. **`/studio` on the custom domain will
       fail until this is done.** The CLI is not logged in, so use the web UI.
    b. Already done, no action: project bindings (apex serves, www 308s),
       `NEXT_PUBLIC_SITE_URL=https://rudyman.com` on production, sitemap + robots emitting the real
       domain, TLS (Let's Encrypt, auto-renews).
    c. **THE LINK TO SHARE IS NOW `https://rudyman.com`.** The `*.vercel.app` URL still works but
       is no longer the one to give out.
    d. Optional follow-ups now that the domain is real: submit the sitemap to Google Search
       Console, and consider per-case-study OG images (§7 item 5).

000z. **🍎 SESSION 24 NEEDS ONE REAL-DEVICE PASS — highest-value check right now.**
    Everything in Session 24 was verified via CDP on emulated viewports. Given §6's iOS BUG RUN
    (three defects that every local and emulated check passed while the phone failed), treat these
    as unverified until touched on a real device:
    a. **THE INTRO CAN NO LONGER OPEN ITSELF** (`8b79a9a`). The 12s ceiling now only releases the
       scroll lock; it does NOT enter the site. This is what the user asked for, but it deliberately
       undoes part of the Session-21 iOS fix — so if a tap is ever swallowed on iOS the reader is
       stuck looking at the intro (on a scrollable page). **Confirm both buttons take a real tap on
       an iPhone.** The `disabled`→`aria-disabled` fix and `onTouchEnd` are still in place.
    b. **Audio actually starting from the tap.** Playback was verified with Chrome's autoplay policy
       relaxed, so the gesture path itself is untested on-device. iOS is strictest here, and Low
       Power Mode reports `prefers-reduced-motion: reduce`. The provider's `blocked` flag exists for
       a refusal — check the widget shows the muted state rather than lying.
    c. **The Other Hand's mobile layout on a real phone** (`dabc817`) — the Android report is what
       started it, so re-check there first, then iOS.
    d. **The /work hover transition on a trackpad/real GPU**, and that the touch cards look right.
    e. **The header music waveform's TAP TARGET on a phone** (`46f7cde`). It sits immediately left of
       the hamburger — 36×36 with a 1-unit gap, so it is the one spot in this session where a
       mis-tap could plausibly open the menu instead of muting (or vice versa). Worth a real thumb.

000a. **🎮 THE OTHER HAND — verify on a real iPhone (from Session 23).**
    The game ships at `/play/the-other-hand` and touch drag works, but **only in emulation**.
    Given this project's track record (§6 "iOS BUG RUN" — three defects that every local and
    emulated check passed while the phone failed), treat emulated touch as unverified. Things
    most likely to bite: the drag bounds from `setBounds()` after an orientation change, Web
    Audio needing a user gesture to unlock on iOS, and the canvas sizing under the collapsing
    Safari toolbar. Also give the whole game a pass on a real GPU for feel.
    ⚠️ `the-other-hand project/` at the repo root is the ORIGINAL Vite app and **must stay
    gitignored** — the engine lives copied-and-flattened in `src/components/play/other-hand/`.
    Edits to the original do NOT reach the site.

000b. **🔐 REVOKE THE VERCEL TOKEN pasted in Session 21** (`vcp_1fr3...`, in that session's
    transcript) now that the domain work is done — plus the older Session-8 tokens still listed
    in item 2 below. **Still not done — flagged across three sessions now.**

000. **⭐ VERKOS APP EXHIBIT — mostly RESOLVED in Session 20** (rebuilt from the latest source; the
    old-copy caveat, the demo-mode button and the unverified wizard are all done). What REMAINS:
    a. **Feel it on a real GPU / real browser.** Everything was verified in headless Chrome via
       raw CDP — routes, detail pages, the wizard end-to-end, scroll lock, 0 external requests.
       Not yet driven by a human on a real machine.
    b. ✅ **DONE (Session 20, commit `4ec9456`) — the build source is now IN THE REPO** at
       **`verkos-exhibit-src/`** (12 MB, 1142 files). It is excluded from `tsconfig.json`
       (otherwise `tsc --noEmit` compiles ~1000 files importing `@auth`/`@ui`/`@libs` aliases the
       portfolio lacks) and from `.vercelignore`; nothing imports it, so it never enters a bundle
       — verified absent from `.next/static` + `.next/server`, build still clean in 35.5s.
       See `verkos-exhibit-src/README-EXHIBIT.md` for the patch map + rebuild steps.
       NOT vendored: `node_modules/`, `dist/`, `public/demo/` (identical to
       `public/verkos-demo/demo`, see `public/DEMO-IMAGES-RESTORE.md`), and the 31 MB of
       uncompressed originals (still in the user's `Demo data\Demo images\`).
       ⚠️ While vendoring, **four MORE Cesium ion tokens** were found and scrubbed in
       `environment.{dev,prod,stag,eu-prod}.ts` — Session 20 had only blanked `lovable`, and
       these would otherwise have entered the public repo. **Re-scan after any re-sync from the
       original zip:** `grep -rlnE "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" src/`
    c. **Payload:** `public/verkos-demo` 6.8 MB (was 3.1) + `public/verkos-report` 1.3 MB = 8.1 MB
       in the repo. Static + lazy so initial page weight is unaffected, but it is real repo size.
       The JS bundle is 2.24 MB of it — this copy has far more screens than the old one.
    d. **Reports table clips TYPE/AUTHOR** at the 1400px logical embed width (see §6 KNOWN).
       Only fixable by raising `designWidth` in `VerkosPrototype.tsx`, which shrinks all text.
    e. Seeded reports carry observations + media but **`missionCount` / stat tiles are authored,
       not derived** — if a viewer edits a report the numbers won't recompute. Cosmetic.

00. **VERKOS REPORTS — polish pass (Session 18 shipped v1).** Loose ends / to feel on a real GPU:
    (a) the Problem `statement` beat renders 4 lines, wanted 3 — tune the `statement` measure/size in
    `LirCaseStudy.tsx` (the three statements are different lengths sharing one style, so they fight;
    maybe per-block line hint). (b) Verify the anime.js diagram draws + the Reframe SVG curve-draw feel
    right on a real GPU (headless can't show the motion). (c) Confirm the Verkos MOBILE breakpoints
    (decision cards, diagrams, statements, annotated images) — only desktop was captured. (d) `ogl` is
    an unused dep (from the removed video shader) — safe to drop on the next `npm install`.

0. **MOBILE — the blocking iOS defects are FIXED (Session 22); what's left is polish.**
   The intro loader, page scrolling and the works-journey cards were all broken on iPhone and are
   now confirmed working on a real device (full detail + the pattern in §6 "iOS BUG RUN"). Also
   already done in Session 17: the mobile fallback video is gone, the hero scroll journey is
   shortened on touch, the iOS no-text bug and the white-flash-at-bottom are fixed, and two LIR
   text-SVGs are widened on phones. STILL OPEN:
   a. **Android re-check.** Everything was fixed against iOS Safari this session; Android was
      always fine but has not been re-tested since. Worth one pass.
   b. **Hero left/right white gutters on mobile** (the curved CASES/PLAYS side masks) — never
      addressed, still to check on a real phone.
   c. **Footer shaders on mobile** — believed wired; confirm on-device.
   d. **The Session-16 LIR blocks on a phone** (decision cards, media rows, image-cycle boxes,
      before/after slider, demo video player) — still unverified on a real device.
   e. ✅ **RESOLVED (Session 24, `f131f88`) — `/work` cards on touch.** The hover-only kicker/eyebrow
      problem is gone: the mobile card now ships in the FULL end state (title above the plate,
      darkened cover with the inner UI seated inside, kicker + eyebrow + build note + FlytBase and
      duration below). It is a separate layout, not a scaled-down desktop card.
   ⚠️ **When touching hero/works motion again, read the PATTERN note at the end of §6 "iOS BUG
   RUN" first** — three separate bugs there had the same root shape.

0b. **⭐ BUILD THE `/play` PAGE — NOW MOSTLY COMPOSITION.** Session 22 built the two pieces it needs
   and both are already generic: **`PageGlow`** (via `PageGlowMount`, the particle field) and
   **`PageHeading`** (the full-viewport Tanker lockup — pass `title="PLAY"` +
   `subtitle="Spellcrafting with AI"` per the user's Figma slide 36). Copy the `/work` page shell:
   `hero-dark` + `bg-[#06080c]` + the `--color-accent` orange override + `data-header-dark`
   (`Header.tsx` already treats `/play` as a dark route). **The user explicitly deferred the page's
   CONTENTS ("hold on about the play page contents for now") — ask before inventing them.**
   Still the styled 404 today. Plan: AI experiments gallery; The Other Hand gets its own page/embed
   (source in gitignored `the-other-hand project/`; DO NOT commit it — separate Vite app).
   Also `#play` + `#resume` nav anchors still have no destinations.

0c. **`/work` follow-ups (Session 22).**
   a. ✅ **RESOLVED (Session 24, `f131f88`)** — see item 0e above. The mobile card carries the full
      description; the desktop reveal is the GSAP hover timeline.
   b. **Feel the field on a real GPU.** The 5 cinematic rules, the scroll flare and the ignition
      were only verified in software-rendered headless Chrome. Dials at the top of `PageGlow.tsx`
      (`DENSITY`, `BASE_SPEED`, `SCROLL_TRAVEL`) and the two fade windows in `FIELD_GLSL`.
   c. The old `WorkGrid` + `PROJECTS_QUERY` path is now UNUSED by `/work` — prune when Sanity
      content lands (or wire the real query into `WorkShowcase`, which takes a plain array).
1. **USER TO FEEL ON REAL GPU** — everything below verified only in software-rendered headless
   Chrome; feel it on the actual GPU:
   a. **Home WORKS JOURNEY** — the 5 project-node beats (energy cuboid flying the snake path →
      morph into the white window). Dials at the top of `WorksJourney.tsx` (FLIGHT_H, SCATTER,
      NODE_D_FAR, SPAWN/MORPH/HOLD/EXIT) + the `uGlow` ramp in `WorksNode.tsx`. Check the flight
      reads as "one node glows and comes forward", the morph crossfade aligns, and the pin length
      feels right. Confirm image slots land in the right beats.
   b. **About page + nav flow** — dials inline in `AboutIntro.tsx` (pin 1050%, scrub 0.5, etc.).
   c. **LIR case study** — the chapter flashes, the before/after slider drag, the features
      horizontal image strips. Confirm no section overlap on a real GPU (the lazy-load fix should
      hold, but the bug was GPU-timing-sensitive).
2. **LIR — remaining polish (user drives).** The DARK rebuild + real assets + scroll scenes + the
   Session-16 polish/perf pass are DONE (see Current State §6). Left:
   a. ✅ **Demo VIDEO — DONE (Session 16).** Real player w/ audio+volume controls shipped; encoded
      to webm/mp4 in `public/case-study/video/`. (dd3 persona figs removed, phone shots re-laid-out.)
   b. **Verify per-image placement** — features (7 imgs / 3-4 features) and dd3 (now 3 phone imgs)
      were mapped by best guess of order; user to confirm none land in the wrong slot.
   c. **Derive the 4 thinner studies** later (Flytbase 2/3, ORO, self) as their own `lirDesign`-shaped
      files in the `STUDIES` registry. Must name employer.
   d. **Later:** migrate to Sanity (add `sectionHeading` block to `richContent`, `npm run typegen`)
      when the CMS is populated — the local data files are Sanity-shaped for this. NOTE the old dark
      data file `liveIncidentResponse.ts` still exists on disk but is UNUSED; the unused inline
      diagram components (`PersonaSplitDiagram` etc.) + the unused `GapMorph` can be pruned.
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

### Session 26 — 2026-08-03
**Rebuilt the scrolly-telling scroll model on the home hero + /about. Five commits, all pushed and
confirmed live on `rudyman.com`. Full technical account in §6 "THE SCROLL ESCALATOR — REBUILT".**

The user reported two things: the escalator dragged them BACK onto the text they were leaving, and
the hero scrolled far too fast on a MacBook (Windows felt fine). The first four commits all failed
the same way, and the honest summary is that **three of them were the same mistake re-tuned**:

- `c4c7052` — fraction-of-segment threshold → absolute-pixel threshold, plus a macOS
  `wheelMultiplier` (0.55) and a short-viewport pin floor. *Didn't work.*
- `5b7f15c` — gated that pin floor to fine pointers (it had silently undone the hand-tuned mobile
  travel).
- `f4b0710` — direction from the WHEEL EVENT instead of scroll position (user's steer:
  *"We should use intent direction as the approach, if i want to go up i go up"*), multiplier to
  0.35. *Still didn't work* — the "no intent on record" fallback was nearest-rounding, i.e. a 50%
  threshold in disguise, and it was being hit.
- `a385d0a` — **the actual fix.** Stopped using ScrollTrigger's `snap` on desktop entirely and
  built `escalatorDrive.ts`: the wheel event starts the ride on the same frame. Prompted by the
  user's third message — *"It should also feel seamless without any awkward waiting gaps... whether
  i take the scroll manually or let it go midway, the outcome is always going to be same"* — which
  ruled out ST's snap architecturally, since it only decides ~1.1s after the gesture.
- `fcbf1ce` — pacing: flat 0.85s ride → **430 px/sec** clamped 0.9–1.8s.
- `d6cd2f8` — user: *"everything is perfect except 'HERE'S SOME OF MY WORK' just gets insta
  scrolled... it feels like I'm scrolling age of intelligence and here's my work at the same time
  as one thing."* **The 1.8s cap was the cause** — the works heading sits between the two longest
  gaps in the journey (1059px and 1248px), so those two rides clamped and ran at 588 and 694 px/s
  against everyone else's 430. Cap → 3.0s; every gap now runs at a true 430 px/s.
  ⚠️ **My first hypothesis here was wrong** (a momentum-tail double-step) and I wrote a repro for
  it — **the repro passed on the ALREADY-SHIPPED code, which is how I caught it.** Always run a new
  repro against the old build before believing it. The real answer came from instrumenting the
  live bundle (temporarily exposing `rests` on `window`, reading it out of a production build, then
  reverting) rather than deriving the timeline by hand — hand-derivation was attempted twice and
  was wrong both times. The measured table is now in §6; use it.

**What actually unblocked it was reading source instead of reasoning:** `ScrollTrigger.js` (the
`getVelocity() < 10` delayed-call that makes snap structurally "decide late") and `lenis.mjs`
(`onStart` is synchronous, so `lock: true` wins the ordering race against Lenis' own wheel handler;
`reset()` clears the lock before `onComplete`, so it can't strand the page; `stopPropagation` not
`stopImmediatePropagation`, so our listener does fire).

**Method notes worth keeping:**
- Each attempt was checked by **simulating the model in node** with stubbed input (802 position/
  intent pairs; fake 120Hz macOS momentum streams). This is what caught that a Mac flick would
  chain 3-4 steps under a "still receiving events" rule, before shipping it. **It also caught two
  of my own test expectations being wrong rather than the code** — worth re-deriving the expected
  behaviour from the brief, not from the implementation.
- A local **production** server was used to poke at the real bundle (`portfolio-prod` added to
  `.claude/launch.json`) — explicitly not the dev server, which the user had ruled out. It proved
  the wiring but not the motion: **the Browser pane was never displayed, so rAF stays paused.**
- Live deploys were confirmed by grepping the served chunks for the EXACT minified expression from
  the local build (e.g. `window.scrollY)/430`). ⚠️ Two earlier markers false-positived — `Spacebar`
  collides with React's key map, and a bare `430` matches anything. Pick a marker, then verify it
  appears in the local build output first.
- User also asked how to re-add expired GitHub/Vercel tokens; **the GitHub token turned out to
  still be valid** (classic PAT, `repo` scope, write confirmed via `gh api .../git/refs`), and no
  Vercel token is needed at all — the GitHub App integration is what deploys on push.

### Session 25 — 2026-07-31
**ORO Connect case study polish pass — hero lockup, asset swaps, section edits. One commit,
pushed to `main`.**

Driven live off the user's own annotated screenshots and files dropped into
`case-study-assets/oro-project/` mid-session, in this order:
- Removed background + reduced size (scale 0.7) on the stakeholder power-interest matrix.
- Swapped feature screenshots for cleaner source assets: Products feature → `product-cards.webp`,
  Search feature → `search-box.webp`, DD1 (two-ID system) → `two-id-system.webp`.
- `OroFrictionMap` changed from an infinite loop to one-shot-per-viewport-entry (Verkos-style).
- `OroProductCard`'s hover rotation went through several correction rounds (rest/macro swapped,
  wrong angle from a stale Figma read, "glitching") before the user supplied the full Figma motion
  code; rewritten with actual Figma-faithful window/photo dimension + position + rotation
  percentages instead of a CSS `scale()` approximation. Also replaced the bangle source image — the
  old one was a tiled texture, not a single cutout, which was silently breaking the geometry math.
- Removed the "Every persona traced to something that shipped" heading + the whole
  solutions-summary section.
- Replaced the static IA-map image with a live FigJam iframe embed (new `figjamEmbed` block type).
- **User: "stop listening to the figma mcp server my session usage is spiking"** — Figma MCP tools
  were not used again this session; all remaining asset needs were served from files the user
  placed in `case-study-assets/oro-project/`.
- Removed DD2 (the search decision) entirely; renumbered DD3 (cart) to DD2 and added
  `orders-dd.webp` under it. Removed the interactive product-card micro-interaction block and its
  "Hover to zoom" hint text (component left in place, unreferenced — user plans to swap in a GIF).
- Removed a leftover whiteboard-wireframe process image the user flagged as out of place.
- Added a new `imageRow` block type (side-by-side images, optional `scale`) and used it once for
  two mobile-app screenshots in the Impact section, at `scale: 0.55` so full phone screens show
  without cropping.
- **Hero rebuilt to match LIR/Verkos exactly**: added `intro.title`/`intro.role` SVG lockups
  (copied verbatim from "Project tag.svg" / "Company and tag.svg") alongside the existing
  `intro.bg`. Previously ORO fell back to rendering title/company as plain text because no bespoke
  lockup existed — it turned out the user just hadn't handed it over yet.
- Stakeholder matrix R1–R4 labels recolored from green (`#12D398`) to the study's gold accent
  (`#D9A441`) — this is a hardcoded hex inside `scripts/oro-assets.mjs`'s `withRLabels()`, injected
  as raw SVG text at build time, not sourced from a shared token. Full asset pipeline re-run to
  regenerate `power-interest.webp`.

**Process note:** navigated to `/case-study/oro-connect` while verifying and got a 404 — the real
route for every case study is `/work/<slug>`. Caught via `preview_logs`, not worth repeating.

Committed as `7912b98` ("ORO Connect case study: hero lockup, asset swaps, section edits"),
pushed to `main` on the user's explicit "yes" after asking whether it shipped to Vercel.

### Session 24 — 2026-07-30
**Shipped the /work card hover transition from Figma, background music with a sound gate on the
intro loader, and fixed The Other Hand's mobile layout. Three commits to `main`.**

- **`f131f88` — /work hover transition.** `WorkShowcase` rebuilt as a paused GSAP timeline from
  Figma section `322:130` (frames 1→2→3): cover darkens → inner screenshot rises from the frame's
  bottom edge and seats at 75.6% width → title lifts and the copy stack staggers up behind it.
  Mobile is a genuinely different layout (`(hover: hover) and (pointer: fine)` gate, so the desktop
  timeline is never built on touch — the card ships in the end state). Assets pulled from Figma via
  the Dev Mode MCP. Title on the thumbnail's centreline at rest (0.0px), group centred while
  hovered (0.1px). ContactCTA removed from /work, which made the page fully static.
- **`dabc817` — The Other Hand mobile.** Back link taken out of `absolute` so the game no longer
  runs under it; page pinned to a FIXED `h-svh` so the stage is a real scroll container (Begin was
  unreachable below the fold); disc 266→317px; and the two reasons the particles were invisible —
  the engine's pixel-space shape radii overflowing a small disc, and a canvas that ignored DPR and
  never re-measured.
- **`8b79a9a` — background music.** "Friendship" by wooll, one `<audio>` element behind an
  `AudioProvider`, 50% default volume. The loader's ready state became a sound gate ("Enter with
  sound" pill / "Enter without sound"), "cooking" moved to Plus Jakarta Sans with a per-letter
  bounce, and a `NowPlaying` waveform widget landed on the home page.
- **`46f7cde` — the music toggle reaches every page and breakpoint.** Shipped after the above,
  because a control that only exists on the home hero can't be turned off from anywhere else — the
  case studies are long reads and were the worst case. Added to the **case-study rail under
  Contents** (sticky, `lg:` only), the **footer** (all widths), and the **header next to the
  hamburger on mobile** via a new `compact` prop that renders the waveform alone. The user ruled out
  putting it inside the hamburger — on a phone the case studies have no sticky rail, so the header is
  the only element always on screen. Full placement table in §6.
  Two things this forced that weren't in the ask: the bars were hardcoded `bg-white` and therefore
  **invisible on the light header bar** (now `bg-current`), and the home page's floating widget
  **collided with the footer's own copy** (now hides there, and is `sm:` and up only so a phone never
  shows two identical toggles).

**Four things in this session were the same shape of bug and are worth remembering:**
1. **An animation that was correct but never ran.** The "cooking" letter wave was anchored to the
   pan's CATCH (~2.5s after mount); on a warm load the label is gone in under 2s. Measured as
   `[0,0,0,0,0,0,0]` travel. *Check that the window your animation needs actually exists.*
2. **CSS positioning and GSAP transforms on the same element.** GSAP rewrites `transform`
   wholesale, so it ate the centring translate — which is what the user saw as the pan starting
   high and the buttons sliding into place. Split into outer-positions / inner-animates.
3. **A captured measurement going stale.** A hard-coded `yPercent: 100` (and later a fixed em lift)
   can't track a `vw`-driven card through a resize that doesn't re-run `matchMedia`. Function-based
   values re-measure on invalidate.
4. **A generic filename lying about its contents.** `image-1.webp` is the LIR app screenshot, so
   using it as the card cover put the reveal's own image in the rest state.

**Process note:** the user corrected my read of their grid-line screenshot — I inferred "the
buttons are right, the pan is wrong" and shifted the pan the wrong way, making it worse. The actual
spec was "buttons on the viewport's vertical axis, pan slightly right of it." **When a visual
reference is ambiguous about which element is the reference and which is the error, ask instead of
inferring a rule from it.**

**Still open:** the intro's no-auto-enter change means the site is now unreachable if input never
lands — the scroll lock still lifts, but nothing enters. That is the intended behaviour, but it
undoes part of the Session-21 iOS safety net, so **it wants a check on a real iPhone** (§7 item 0).

### Session 23 — 2026-07-30
**Built the /play page (The Other Hand playable in-browser), wired /work + /play into the nav and
the hero curves, and fixed the two-part scroll bug on both page headings.**
- **/play SHIPPED.** A wall of AI explorations, built as a LIST (`EXPERIMENTS` in
  `PlayWall.tsx`) so the next experiment is a one-entry change. Today: The Other Hand + a
  deliberate "More in the works" tile so a single card doesn't read as an unfinished page.
- **The Other Hand is playable inside the site** at `/play/the-other-hand`. Seven engine files
  copied VERBATIM from the gitignored `the-other-hand project/` into
  `src/components/play/other-hand/` with imports flattened, plus a shell (intro note, framing
  copy, instructions, start button; the volume controls already existed in the source) and
  `OtherHandGameMount.tsx` as the client boundary — `ssr:false` dynamic imports are illegal in a
  Server Component. **Touch support added** to `BallController.ts`: `isTouch()`, drag-only
  tracking, `pointercancel`, and `setBounds()` fed by a ResizeObserver (the user asked for
  click-and-drag on phone). ⚠️ `the-other-hand project/` MUST stay gitignored — separate Vite app.
- **Navigation wired:** `DEFAULT_NAV` now points at `/work` + `/play` (was `/#work`, `/#play`);
  the hero's right-hand PLAYS curve goes to `/play` (was `/work`); the About section's play
  button reaches the game.
- **THE HEADING SCROLL BUG — two defects, both fixed and both verified old-fails/new-passes.**
  Symptom the user reported twice: the /work + /play title shows on load, then vanishes on scroll
  and never returns — and once it did return, the word and subtitle moved as two separate things.
  1. **`WorkShowcase.tsx` was killing every ScrollTrigger on the page** (`3767462`). Its
     `useGSAP` cleanup ran `ScrollTrigger.getAll().forEach(t => t.kill())`. `useGSAP` already
     auto-reverts its OWN triggers, so the line was redundant — and `.getAll()` reaches outside
     the component, so each `gsap.matchMedia()` re-run killed *PageHeading's* scrub mid-flight,
     freezing the heading at whatever opacity it was passing through.
  2. **`PageHeading.tsx` tweened `[word, sub]` as an array** (`4f8584e`). `yPercent` resolves
     against **each element's own height**, and the word is `14vw` while the subtitle is ~1rem —
     so `-38%` moved them different pixel distances and the lockup came apart. Fixed by wrapping
     both in `[data-lockup]` and animating that ONE element. The `<h1>`'s `overflow-hidden`
     entrance mask stays INSIDE the wrapper, or the departure lift would be clipped by it.
     Also `clearProps: "opacity,visibility,transform"` on the subtitle's entrance: `autoAlpha`
     writes `visibility`, so the child was a second independent opacity layer under the wrapper
     fade, and an interrupted entrance could strand it at `visibility:hidden` where no parent
     fade recovers it. Measured on the old code at rest: `wOp 1 / sOp 0` — invisible until the
     first scroll. Sonnet's earlier `fromTo` + `immediateRender:false` change was correct and
     was KEPT; the array target was the remaining half.
  **Verification method worth reusing:** a CDP probe that samples the *gap between the two lines*
  at four scroll depths plus effective opacity walked up the ancestor chain. Old: gap drifted
  26→53px, restore-on-scroll-up `false`. New: 0px drift, restore `true`, identical on both routes.
- Typecheck clean, prod build clean (**16 routes** now, up from 14 — `/play` + `/play/the-other-hand`).
- **Ended:** pushed to `main` (`4f8584e`), dev server stopped.
- ⚠️ **Still open, carried forward:** Sanity CORS for `rudyman.com` (§7 item 0000a) — deprioritized
  since the user doesn't use `/studio`; token revocation (§7 item 000b); and The Other Hand has
  **not been driven on a real iPhone** (touch drag verified only in emulation).

### Session 22 — 2026-07-30
**Went live on `rudyman.com`, rebuilt the /work index, and fixed three iOS-only defects that
made the phone experience unusable.**
- **DOMAIN LIVE.** Vercel never provisioned the DNS zone (their nameservers answered
  `Query refused`), so DNS moved BACK to Hostinger with `A @ -> 216.198.79.1` +
  `CNAME www -> 8a0f233b3a7d8efb.vercel-dns-017.com.` Live within minutes. Full account in §6.
- **/work index rebuilt** (`e809c42`) — cinematic particle field flying toward the camera,
  alternating project plates, hover scrim. Plus the lightbox/zoom-cursor changes (`beae3ab`).
- **iOS bug run (~8 rounds).** (1) the intro loader was invisible because the overlay carried its
  exit MASK at rest and iOS resolves the degenerate zero-radius gradient as fully transparent;
  (2) the works-journey cards never appeared because the ticker's element references go stale when
  `gsap.matchMedia()` re-runs — which iOS does when the browser toolbar collapses, and Android
  never does; (3) a half-exited beat wrapper sat at opacity 0.70 over the card. All three fixed
  and confirmed on a real iPhone. Detail + the pattern behind all three in §6 "iOS BUG RUN".
- **Debug probes removed** (`b0687af`) once confirmed.
- Typecheck + prod build clean (14 pages) throughout.
- **Ended:** shipped and live; dev server left RUNNING at the user's request.

### Session 21 — 2026-07-29
**Fixed the iOS "site won't scroll at all" bug, rebuilt both case-study opening covers as
layered raster+vector plates, put Verkos Reports on the home page, and bought + wired the
custom domain `rudyman.com` (waiting only on DNS propagation at session end).**
- **iOS scroll lock (user-reported, multiple devices).** Root cause: the intro loader was the
  single point of failure for the whole page's scrollability — `body.is-loading` sets
  `overflow:hidden` and only a successful tap on a `disabled`-rendered button ever removed it,
  which iOS Safari swallows. Added aria-disabled + tap-anywhere + a 12s ceiling + unmount
  cleanup, and hardened the CSS lock for iOS. Verified with REAL CDP touch (never
  `window.scrollBy`, which bypasses the lock and falsely passes).
- **Layered covers** (`intro` on `LirDesign`): raster bg + vector title + shared company/role
  SVG, so phone type stays legible while the photo crops. New `public/case-study/cover/`.
- **Verkos Reports replaces Marrow** as home work box 02, covered by the annotated east-gate
  frame. Also made the headline star accent-driven (was hardcoded LIR orange, so Verkos showed
  the wrong colour) and gave the report exhibit + its thesis their own viewports (they collided).
- **Domain:** nameservers → Vercel (confirmed at the .com registry), `rudyman.com` set primary
  with `www` 308-redirecting to it. **Found + fixed a real live bug:** `NEXT_PUBLIC_SITE_URL`
  was never set on Vercel, so the deployed robots.txt/sitemap advertised `http://localhost:3000`.
- Shipped in **`91c68e3`** (pushed, deployed READY) + a follow-up redeploy for the env var.
  Typecheck + prod build clean (14 pages).
- **Ended:** waiting on DNS caches (old Hostinger SOA has a 7-day negative TTL). Next session
  starts at §7 item 0000. Dev server + headless Chrome stopped.

### Session 20 — 2026-07-29
**Rebuilt the Verkos app exhibit from the LATEST source zip (superseding Session 19's older copy),
made demo mode permanent + filled the data gaps it leaves, added a click-to-expand image lightbox
to BOTH case studies, fixed the Contents rail, and wired the three Figma design-decision images.
Typecheck + prod build clean (14 pages). Full detail in Current State §6.**
- **The trigger:** user supplied `verkos-reports-exhibit-rudy-main.zip` — the newest UI, which
  Session 19 could not use (`-fresh`'s wizard called live FlytBase APIs). I unzipped it, confirmed
  the same two blockers, and rebuilt rather than patched: same recipe, bigger surface.
- **User reversed Session 19's "don't use demo mode" call** — this copy has a real demo mode that
  covers the AI calls, wizard flights and flights pages. It's now ON permanently and cannot be
  exited (button removed).
- **User was right that "demo mode doesn't have mock data for everything"** — the store's base
  mocks are empty arrays and flight contexts start `{}`. Authored sites/reports/drafts/contexts
  and gallery media for flights 6-12 in `src/exhibit/seed-data.ts`.
- **Three credentials found and removed** before they shipped publicly: a Supabase URL + anon key,
  the FontAwesome Pro kit token, and a Cesium ion token.
- **Four real bugs found and fixed during verification**, each documented in §6: Sites crashed
  (bare-array response shape), `/flight/:id` + `/guides` crashed (my icon swapper used
  `replaceWith` on React-managed nodes), every route fell through to the index (router `basepath`
  from `websiteBasePath`), and sites rendered twice (`site-fb-<id>` merge key).
- **Two of my own test methods were wrong and gave false readings** — worth remembering: dropped
  `s` characters in the TOC came from `innerText` extraction, not rendering (`textContent` was
  correct); and `window.scrollBy` is programmatic so `overflow:hidden` never blocks it, which
  falsely failed the scroll lock. Real CDP wheel events confirmed the lock works.
- **Case-study work:** Contents rail derived from real chapter flashes (both studies had 10
  entries for 7 chapters, 3 duplicate targets, `features` missing); lightbox + hover affordance;
  DD1/DD2/DD3 images from Figma with a new `imgScale` for the two tall ones; statements centred.
- **Follow-up commit `4ec9456`:** vendored the exhibit build source into the repo at
  `verkos-exhibit-src/` (it had only existed in `E:\tmp`). Found and scrubbed **four more Cesium
  ion tokens** in the unused environment files on the way in — bringing the session total to
  **eight credentials removed**. Confirmed it does not touch the site build or the served
  prototype: excluded from tsconfig + .vercelignore, absent from `.next/static`/`.next/server`,
  `public/verkos-demo/` unchanged.
- Dev server + headless Chrome stopped at session end, per user request.

### Session 19 — 2026-07-28
**Added TWO interactive exhibits to the Verkos case study + two visual fixes. One commit
`8a3d26f` to `main` → Vercel. Prod build clean (14 pages). Full detail in Current State §6
("VERKOS INTERACTIVE EXHIBITS" + "CASE-STUDY FIXES").**
Started as a mobile-verification question (checklist written, testing still on the user), then
became a long, user-steered build with several mid-flight pivots — worth recording because the
end state is NOT what the first three attempts were:
1. **Full-bleed fix** — thin strips of the scrolling intro thumbnail showed at the far left/right
   above 1680px. `max-w-[1680px]` was on the opaque `bg-bg` panel itself; moved inward to the grid.
2. **VerkosLogo alignment** — the mark hung below the "Verkos Reports" wordmark in both diagrams.
   Root cause was a coordinate-contract mismatch (component treated `(x,y)` as top-left, caller
   passed a centre) PLUS a wrong cluster extent (104 vs the true 83.09), so it was undersized too.
3. **Exhibit, attempt 1 — REJECTED:** a hand-built React prototype of the report flow. User: "use
   the frontend UI of the code present in the folder as is, don't make your own UI."
4. **Exhibit, attempt 2:** built the REAL app to static. Chose the older source copy after finding
   `-fresh`'s wizard is API-bound. Stripped auth, mocked Supabase, seeded the store, rebased asset
   paths. Got the library + routing working headlessly.
5. **PIVOT (user):** "small standalone HTML report instead" + "use lucide react icons instead of
   FontAwesome" — answered via a decision prompt after the **FontAwesome Pro token** was spotted
   leaking in the app build. Built `public/verkos-report/index.html`, removed the app.
6. **PIVOT BACK (user):** "where is the app? add the full demo app UI iframe just before the
   context section starts." Rebuilt the app WITH the lucide swap applied (all 78 `fa-*` glyphs),
   Google Fonts stripped, and fit-to-width scaling so the dashboard doesn't wrap in-column.
   Both exhibits now ship, app first.
- **Verified:** typecheck + prod build clean throughout; headless-Chrome measurement for the
  full-bleed fix (2541px), logo `deltaY: 0`, report interactions (filter/disclose/regenerate),
  app icon swap (0 external requests / 0 leftover fa / 0 unmapped), embed ordering, and the
  mobile gate (notice shown, 0 iframes). Dev server + Chrome stopped at session end.
- **User asked to revisit the app exhibit** — see Next Steps §000.

### Session 18 — 2026-07-26
**Built the 2nd case study — VERKOS REPORTS — from Figma 258:2, and SHIPPED. One commit `c9fef67` to
`main` → Vercel. Prod build clean (14 pages). Full detail in Current State §6 ("VERKOS REPORTS").**
Reuses the LIR chapter/flash shell (`<LirCaseStudy>`) with a cyan `#08e6ff` accent + **anime.js (v4)**
for its scroll-triggered content/vector motion (IntersectionObserver-fired, GSAP-independent → no
conflict). Chapters: Context · Problem · Reframe · Process · Design Decisions · Features · Impact.
Highly iterative, user driving screenshot-by-screenshot against Figma:
1. Content + copy transcribed VERBATIM from Figma (the .md in assets is NOT the source).
2. Decision cards rebuilt as NATIVE cards (copy is live text in Figma) with the exact Figma palette
   (#FFB350/#FFA09B/#7AC3FF/#62FFC0, #000/#363636 text), mixed-weight "why" bodies, headings verbatim
   (user re-added the heading layers), first-two-2-up / rest-full-width layout.
3. Diagrams built inline + animated: the persona split uses the REAL Figma `Reframe diagram.svg`
   (inlined so anime draws its curves); pipeline/assembly are self-contained SVGs with the real
   `VerkosLogo` in the report box (centred as a group).
4. Annotated UI images (east-gate/south-fence) RE-COMPOSITED — Figma exports were the raw photos; baked
   the detection boxes + labels in via ffmpeg (`expansion=none` to survive the `%` in "(98%)").
5. New shared blocks: `statement`, `leadP`, `decisionText`, `verkosDiagram`; `quoteFlash` gained
   tone/wide; demo video made optional (LIR keeps its, Verkos has none); stats grid adapts to count;
   arrow-notation stats skip the count-up; overview headline → 2 lines. UI images stay BARE (no frames).
- **Verified:** typecheck + prod build clean throughout; emulated headless-Chrome captures for line
  counts, decision headings, logo centring. NOT felt on real GPU. Known nit: Problem `statement` = 4
  lines (wanted 3), deferred.

### Session 17 — 2026-07-24
**LIR Process content (audit reorder + new code-architecture timeline), then a first real MOBILE pass
on the home hero + LIR readability, then SHIPPED. Two commits pushed to `main` → Vercel: `e94238f`
(content) and `a682c1c` (mobile). Prod `npm run build` clean (13 pages) before each push. Dev server +
headless Chrome stopped at end. Full detail in Current State §6 (three Session-17 subsections).**
1. **LIR: moved the audit trio into Process** (`lirDesign.ts`) — the "Before designing anything new…"
   intro + 3 orange `auditNotes` now OPEN 05 Process (were trailing 04 Reframe). HMR gotcha noted: a
   Chapter content-order change needs a HARD reload to re-measure ScrollTrigger (stale flash offsets
   briefly showed a dead gap under the PROCESS flash).
2. **LIR: new `archTimeline` block** — "code architecture" Q&A beats on a vertical accent rail (rail
   draws in on scroll, node-dot pop + staggered reveals). Two beats (drone-feed edge-fn; live-chat 7–11
   lang translation). Component `ArchTimeline` in `lirBlocks.tsx`.
3. **Hero: removed the VIDEO fallback everywhere** (`VideoBackground.tsx` + `ShaderBackground.tsx`
   DELETED; non-WebGL2 → plain dark canvas + `DarkFallback` still unblocks the loader). `ogl` now unused.
4. **Hero mobile scroll SHRUNK** — `endVh` `2.35 → 1.25` on coarse pointer (page ~11 → ~6.8 viewports),
   same journey, half the scroll. Desktop untouched.
5. **iOS "only shader, no text" FIXED** — latched `revealOnce()` + 1.4s failsafe so the headline can't
   stay parked off-screen. **White-flash-at-bottom FIXED** — home root painted `#06080c`.
6. **LIR mobile readability** — new `.lir-wide-mobile` utility widens 3 named baked-in-text SVGs to
   `100vw-24px` on phones (orange gap box + dd3 why/cost cards); collapses in-column at `sm+`. Threaded
   via `wideMobile` on `DecisionCluster`→`CardRows`→`CardImg` (dd3 only, solo cards only).
- **Verification:** typecheck + prod build clean; mobile-EMULATED CDP harness (touch + coarse pointer +
  SwiftShader for WebGL2). **NOT verified on real iOS Safari / Android hardware** — the iOS fix is a
  timing failsafe; user to confirm on-device. Hero side gutters + full LIR mobile-breakpoint sweep
  still open (see Next Steps §0).

### Session 16 — 2026-07-17
**LIR case-study polish + perf pass, then SHIPPED to prod. Full detail in Current State §6
("LIR POLISH + PERF — Session 16"). Committed `9aff22d`, pushed to `main` → Vercel auto-deploy;
local `npm run build` clean (51s, 13 pages); live site 200.** Iterative, screenshot-by-screenshot:
1. **Chapter flashes → in-flow viewport-driven panels** (`Chapter.tsx`) to KILL the dead scroll the
   user kept hitting. Went scrubbed-pin → self-play-pin → final in-flow (`[data-flash]` one-shot
   entrance + `[data-flash-exit]` scrubbed departure, no pins/fixed). Page 49k→~30k px.
2. **Removed "Here's the gap" morph** (`GapMorph` + `gapMorph`/`gapHeading` types deleted); orange
   box now pops in after the warehouse via `GapReveal`.
3. **Decision-card + media-row layout fixes** — dd2 renders 2x2 (was stretched ~2.3x; `CardRows`
   groups by intrinsic width), media rows height-capped + `object-contain`, dd3 phones larger/tighter.
   Added dd3 `note` ("Mobile is a different product…"), removed the 2 persona figs.
4. **Body copy +2px** via shared `--lir-note` (14px): audit callouts + dd3 note + all Features bodies.
5. **Feature images cycle in place** every 2s (`ImageCycle`) instead of a scroll strip; minimal
   `ProseReveal` GSAP text reveals added.
6. **Demo VIDEO player** (`DemoVideo`) with play/pause/MUTE/VOLUME/scrub, never autoplays (audio
   matters). Encoded `LIR_V1.mp4` 41.8MB → webm 11MB + mp4 13.8MB + poster (audio kept), in
   `public/case-study/video/`.
7. **PERF: PNG→WebP** — `public/case-study` ~70MB → ~31MB (ffmpeg libwebp, cap 1600w, q82; 4K sources
   were rendering in an 860px column). All 24 code refs → `.webp`; PNGs deleted; sources safe in
   gitignored `case-study-assets/`.
8. **Header on case-study routes** — now a solid dark bar (`darkPage` matches `/work/<slug>`); removed
   `data-header-dark` from the LIR fixed thumbnail intro that had pinned the nav transparent all page
   (nav text was colliding with dark copy). Verified solid at every depth, transparent only at footer.
- **Deferred by the user:** a mobile-responsiveness request (hero + LIR + footer shaders on phone,
  remove mobile fallback video, kill hero side gutters) was raised but explicitly pushed to next
  session — user said ship first. See Next Steps §0. **NOT felt on real GPU** (headless only).
- **Session end:** dev server + headless Chrome stopped. Perf note for the user: local lag this
  session was the dev environment (node ~2.5GB, RAM 77%) — NOT the shipped site; the WebP/video pass
  is the real-visitor win.

### Session 15 — 2026-07-14 → 07-16
**Two big bodies of work; details in Current State §6 ("WORKS JOURNEY" + "LIR DARK REBUILD").**
1. **Home works journey** — deleted the white horizontal `WorkGallery`; the work showcase now plays
   INSIDE the hero tunnel as 5 project-node beats (a real 3D energy cuboid flies the snake path then
   morphs into a white case-study window). New: `WorksJourney.tsx`, `worksAnchor.ts`,
   `hero3d/WorksNode.tsx`, `hero3d/pathMath.ts`; `heroScroll` bridge extended; Hero pin scales with
   beat count; `/#work` glides into the pin. Added `npm run dev:lir` (`scripts/dev-open.mjs`).
2. **LIR dark-mode rebuild** — flipped the case study to DARK (`#06080c` / white / `#B4B4B4` /
   orange `#FF8D3B`), wired ALL the user's real Figma exports (bare images, no frames), made every
   numbered section a full-viewport chapter flash, added scene splits + new block types
   (`beforeAfter` drag slider, `splitRow`, `heading`/`subhead`, `video`, `sceneBreak`,
   `gapConclusion`), rebuilt decisions (card SVGs + `mediaRows` grid, dd3 = 3 phones 3-up + persona
   figures) and features (cream tagline pills + sticky-text/scroll-strip rows) to Figma 229:3 /
   239:27 / 240:42. **Fixed two chapter-segmentation bugs:** flash ghosting (opaque `fixed` backdrop
   + trailing spacer) and sections collapsing under the next flash (root cause: `loading="lazy"` →
   switched to eager + `ScrollTrigger.refresh()` on images-loaded/fonts-ready/load).
- **Verified:** prod `npm run build` clean (29.6s, 13 pages). Iterated heavily via a raw-CDP
  headless-Chrome harness (scratchpad `cap-*.mjs`) — dismiss the egg loader via the
  `button[aria-label="Click to enter the site"]`; NOT felt on real GPU (see Next Steps §1).
- **Ended:** dev server stopped; committed on a Session-15 branch. NOT pushed/deployed.

### Session 14 — 2026-07-14
**Navigation + About-intro polish. One commit on top of `4fbf57c`.** Focused, iterative session
on how the site loads. What shipped (details in Current State §6 "NAV + LOAD BEHAVIOUR"):
- **About opening auto-plays on load** — extracted scene 1's entrance (frame grow + "HEY! THAT'S
  / MY NAME" edge-slide, grey→white) into a separate paused `intro` timeline that plays on
  `LOADER_DONE_EVENT`; the scrubbed timeline now starts from the converged state. Rebased the whole
  About timeline −4.7 units so scrolling reacts immediately (killed the "residue scroll" before the
  text moved); pin 1205%→1050%. Fixed a snap/zero-travel bug: intro x slides must be `fromTo`
  (offscreen `from`) because the scrub's initial refresh pins the phrases at flankX.
- **Nav "text doesn't load" / "garbled mid-way page" fixed at the root.** Diagnosis chain: client
  nav didn't run the loader → destination pins measured against the old page's tearing-down layout
  → hero stranded/auto-scrubbed. Tried an SPA `RouteTransition` pan curtain + Lenis stop/rewind/
  refresh ordering — worked headless, still raced on the user's real GPU (hourglass pin-spacers,
  ballooning circle-wipe). **Final call (user chose "hard nav + keep pan feel"): cross-route nav is
  now a REAL page load** (`hardNavigate` → `location.assign`), so it's identical to a refresh by
  construction. Kept the pan-flip feel via a `sessionStorage` `NAV_FLAG` that puts the Loader in
  **pan-only auto-play mode** (no counter/label/click) for nav loads; cold visits keep click-to-enter.
  Deleted the racy `RouteTransition` component.
- **Lesson:** for a persistent-Lenis + heavy-pinned-page site, SPA route transitions between pinned
  pages are not worth the race — a hard load is the robust, refresh-identical path. Don't reintroduce.
- Verified via headless CDP capture harnesses (scratchpad; drove real click-throughs, sampled
  scrollY / intro transform / circle-wipe scale over time). typecheck clean throughout. NOT run as a
  prod build this session.

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
