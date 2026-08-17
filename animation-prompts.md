# Component loops — build and test these five first

Supersedes the earlier animation notes. Do **not** touch the portfolio until every loop passes
the seam test in `loop-test.html`.

Companion files: `render-prompts.md` (the flat page images) · `loop-test.html` (the judge).

---

## 1. What you're building

Five components, each isolated, each at the exact quality of `portfolio-card.png`, each with a
seamless repeating loop. Separate files so you can accept or reject them one at a time.

| # | Component | Frames | Loop principle | Difficulty |
|---|---|---|---|---|
| 1 | Glass gearbox | 12 | one tooth pitch | hard |
| 2 | Humanoid | 8 | idle weight shift on a sine | medium |
| 3 | Drone | 8 | hover bob on a sine | easy |
| 4 | Neural nodes | 10 | glow travels one layer spacing | easiest |
| 5 | Backend layers | 10 | packet descends one plate gap | easy |

Start with **neural nodes**. The geometry never moves — only light travels — so it's the one
most likely to succeed, and getting a win first tells you the workflow is sound before you
spend attempts on the gearbox.

---

## 2. The rule behind every loop

**Find the period, and loop over exactly one of it.**

A shape that repeats in space is identical after moving one repeat distance. So:

- A gear with 20 teeth is identical after **18°**. And because meshing gears pass the same
  number of teeth through the contact point, one tooth pitch on the driver is one tooth pitch
  on *every* gear in the train — the whole box resets at once.
- A glowing pulse travelling down evenly spaced plates is identical after moving **one gap**.
- A signal wave crossing evenly spaced network layers is identical after **one layer spacing**.
- A bob following a full sine is identical after **one cycle**.

This is why you need 8–12 frames and not 240.

**The thing that breaks it:** bolt holes, keyways, spokes and shaft collars don't share the
tooth pitch. Six holes repeat every 60°, so at 18° they visibly jump once per loop. Every
prompt below therefore bans them.

---

## 3. STYLE BLOCK — paste verbatim into every generation

Attach `portfolio-card.png` as a reference image every single time. It holds the look far
better than words do.

```
STYLE: Photoreal product render, path-traced with full global illumination and ray-traced
reflections. Octane/Cycles look, 16-bit, physically based materials.

PALETTE (strict): background #07080A · brass #C8A15E · warm steel #A9A296 · frame metal #8E8A82
bone shell #D6CBB6 · near-black parts #24231F · amber oil #9A6218 · data glow #5FE39A
No blue, purple, teal or magenta anywhere. Warm neutrals plus one green accent only.

LIGHTING: large rectangular softbox key from upper left throwing long straight specular streaks
across metal. Low cool grey fill from lower right. Warm bronze rim from behind right separating
the subject from the void. Deep falloff to near black at the frame edges. Soft volumetric haze.

SET: one object alone, centred, on a dark reflective floor with a faint engraved grid catching a
soft specular reflection. Empty black void behind. Nothing else in frame.

CAMERA: 85mm, locked tripod, slight low angle, shallow depth of field, subject tack sharp.

NEGATIVE: no text, no lettering, no numbers, no watermark, no logo, no UI, no people, no hands,
no bright background, no cartoon or stylised look, no clutter, no lens flare, no blue cast.
```

---

## 4. The five prompts

Every one ends with the same locking clause. Do not drop it — it's what keeps the frames
from drifting into different objects.

> **LOCK:** camera, lighting, materials, floor, haze, exposure and framing are PIXEL IDENTICAL
> in every frame. Only the described motion changes. Do not reframe, do not recolour, do not
> restyle, do not add or remove any part.

### 4.1 Gearbox — `gearbox-01.png` … `gearbox-12.png`

```
SUBJECT: A transparent glass-walled industrial gearbox alone on the dark grid floor, three-quarter
view. Brass and steel spur gears meshing above an amber oil bath, the lowest gear dipping into the
oil. Brushed metal frame rails on every edge with corner blocks. Cast sump beneath with cooling fins.

GEOMETRY CONSTRAINT: gears have plain solid webs — no bolt holes, no spokes, no keyways, no visible
shaft collars. Smooth hubs only. The driving gear has exactly 20 teeth.

SEQUENCE: frame {N} of 12. The gear train has rotated {(N-1) * 1.5} degrees from the start pose.
Frame 1 is 0 degrees. Oil level and surface are unchanged in every frame.
LOCK: [paste the lock clause]
```

### 4.2 Humanoid — `humanoid-01.png` … `humanoid-08.png`

```
SUBJECT: A bipedal humanoid robot standing alone on the dark grid floor, three-quarter view, arms
relaxed at its sides. Bone-coloured armour shells over dark articulated joints, brass joint
housings, a warm amber visor band across the head, rubber tread soles.

SEQUENCE: frame {N} of 8 in a standing idle loop. The torso rises and falls a total of 8 pixels
across the loop following a smooth sine — frame 1 lowest, frame 5 highest, frame 8 returning
toward the low point so it flows back into frame 1. The visor brightens to its peak at frame 5.
Feet stay planted. Limbs do not swing. Head does not turn.
LOCK: [paste the lock clause]
```

> **Do not attempt a walk cycle.** Sixteen frames of a consistent character with consistent
> armour, joint positions and proportions is beyond what these models hold. Every attempt gives
> you a robot that morphs while walking, which looks worse than one standing still. If you want
> the humanoid to genuinely walk, the WebGL scene already does it with a correct contralateral
> gait — use that instead.

### 4.3 Drone — `drone-01.png` … `drone-08.png`

```
SUBJECT: A quadcopter drone hovering alone above the dark grid floor, slight three-quarter view.
Dark shell body, brass motor housings, four rotors motion-blurred into translucent discs, prop
guards, gimbal camera below with a green lens glow, landing skids.

SEQUENCE: frame {N} of 8 in a hover loop. The airframe rises and falls a total of 12 pixels across
the loop on a smooth sine — frame 1 lowest, frame 5 highest, frame 8 returning toward the low
point. Body tilt varies by no more than 1 degree. Rotors stay equally motion-blurred throughout —
never show individual sharp blades. The floor reflection follows the body.
LOCK: [paste the lock clause]
```

### 4.4 Neural nodes — `neural-01.png` … `neural-10.png`

```
SUBJECT: A floating neural network alone against the dark void above the grid floor. Four vertical
layers of polished gold spheres — 4, 7, 7 and 3 spheres — evenly spaced, every sphere joined to
every sphere in the next layer by a thin warm glowing filament.

SEQUENCE: frame {N} of 10. A bright signal wave travels left to right across the network. Over the
full loop the wave advances exactly ONE layer spacing, so frame 10 flows seamlessly into frame 1.
Spheres nearest the wave glow brightest; the filaments they touch brighten with them. The spheres
DO NOT MOVE — their positions, sizes and the network geometry are identical in every frame. Only
brightness changes.
LOCK: [paste the lock clause]
```

### 4.5 Backend layers — `backend-01.png` … `backend-10.png`

```
SUBJECT: A stack of six transparent glass plates alone above the dark grid floor, evenly spaced,
seen at a slight angle. Brass edge rails on each plate. The fourth plate from the top is edge-lit
amber; the others are neutral. A green light beam runs vertically down through all six.

SEQUENCE: frame {N} of 10. A small glowing green cube descends along the beam. Over the full loop
it travels exactly ONE plate gap, so frame 10 flows seamlessly into frame 1. The plate it is
currently passing brightens slightly. Plate positions, spacing and the amber plate are identical
in every frame.
LOCK: [paste the lock clause]
```

---

## 5. Also render one still of each

Frame 1 of each doubles as the reduced-motion fallback. Save separately as
`gearbox-still.png`, `humanoid-still.png`, and so on — same folder.

---

## 6. Test before you apply

Put every file in **`assets/loops/`** next to `loop-test.html`, then open it.

```
assets/loops/
  gearbox-01.png … gearbox-12.png      gearbox-still.png
  humanoid-01.png … humanoid-08.png    humanoid-still.png
  drone-01.png … drone-08.png          drone-still.png
  neural-01.png … neural-10.png        neural-still.png
  backend-01.png … backend-10.png      backend-still.png
```

The page plays each sequence, lets you scrub and step frame by frame, and reports dimensions and
weight per frame.

**Then press Seam on each card.** It flips between the last frame and the first — exactly where a
generated loop breaks. Watch for:

| Failure | What you'll see | Verdict |
|---|---|---|
| Tooth count drift | gears gain or lose teeth between frames | reject, regenerate |
| Position jump | object shifts at the seam | reject |
| Exposure shift | brightness pops at the seam | sometimes fixable by re-encoding |
| Material drift | brass turns grey, oil changes level | reject |
| Camera drift | framing creeps across frames | reject |

Also toggle **CSS motion** off and on. That's the drift, sweep and haze the portfolio applies to
plain stills. If a component looks good enough with CSS motion alone, use the still and skip the
loop — one fewer file, and it will never break.

---

## 7. Encoding, once a loop passes

```bash
ffmpeg -framerate 12 -i gearbox-%02d.png -loop 0 -q:v 72 \
       -compression_level 6 gearbox-loop.webp
```

Budget **under 900 KB** per loop. If a file is bigger, resize the frames to 800px on the long
edge and re-encode. Then switch `loop-test.html` to **Animated WebP** mode and confirm it still
looks right after compression.

---

## 8. Repo cleanup — Cursor task

```
The repo root has two portfolio files: index.html and portfolio-jovo.html.

Compare them. Determine which is the current, complete portfolio — check git log dates,
file size, whether it references scene.js, and which one vercel.json / .vercelignore point at.

Keep exactly ONE, named index.html. Delete the other. If portfolio-jovo.html turns out to be the
newer and more complete file, rename it to index.html and delete the old one.

Then verify: vercel.json, .vercelignore and README.md contain no references to the deleted file,
and the Vercel deployment still serves the correct page at the root path.

Report which file you kept and why before deleting anything.
```

---

## 9. Only after all of that

Wire the loops into the page:

```html
<div class="mv r11">
  <picture>
    <source srcset="/assets/loops/gearbox-still.png" media="(prefers-reduced-motion: reduce)">
    <img src="/assets/loops/gearbox-loop.webp"
         alt="Glass gearbox with meshing brass and steel gears above an oil bath"
         loading="lazy" decoding="async">
  </picture>
</div>
```

The `<picture>` fallback is not optional — an animated image cannot be paused, so it's the only
way a motion-sensitive visitor gets a still.

**And use at most one or two.** One moving image on a page is a focal point. Five is a slot
machine, and it will bury the thing the page is actually for.

---

# ADDENDUM — revised order of work

Your report changed the plan, correctly. Recording what actually happened and what comes next.

## What you found

Regenerating every frame as a fresh image **failed the lock immediately** — sphere counts and
cameras drifted. That is the expected result and it is why the LOCK clause exists as a test
rather than a guarantee. Your fix was the right one: take **one locked still** from
`portfolio-card.png`, then build the loop *on top of that still* so the geometry can never drift.

That inverts the guidance in section 4. Treat those prompts as a fallback, not the first choice.

**Composite on a locked still. Do not regenerate frames.**

Result, accepted: neural 446 KB · humanoid 269 KB · drone 183 KB · backend 104 KB ·
gearbox still-only. Gearbox still-only is the correct call — a generated tooth pitch would jump
teeth at the seam, and section 6 already says to skip the loop when CSS motion carries the still.

## Two bugs in the first loop-test.html — both mine, both fixed

1. **Everything vibrated.** The rAF accumulator only updated `last` conditionally, so `dt` grew
   unbounded and every card advanced on every tick — playback ran at 60fps no matter what the
   FPS slider said. Rewritten with a single accumulator updated every frame.
2. **No gearbox appeared.** Still mode read `frames[0]`, and the gearbox has no frames. Every
   slot now probes independently for a loop, a still, and an optional PNG sequence.

The rebuilt page also defaults to **Loop** mode, because WebP is what you actually built.

## Seam-testing a WebP

A browser cannot step frames inside an `<img>`. Explode it first:

```bash
ffmpeg -i neural-loop.webp neural-%02d.png
```

Drop those PNGs beside the WebP and Frames mode picks them up. That said — a loop composited
over one locked still has very low seam risk by construction, because the geometry never moved.
Spend the effort on the gearbox decision instead.

## NEXT STEP — fill the remaining slots before animating anything

The rebuilt `loop-test.html` now lists **all twelve image slots the portfolio needs**, not just
five. Generate the missing seven as plain stills using the prompts in `render-prompts.md`:

| Folder | Files |
|---|---|
| `assets/renders/` | `betk.png` · `b2s.png` · `rls.png` · `bilingual.png` · `tracking.png` · `reviewer.png` · `system-band.png` |

All static. None of them need motion — they are diagrams, and the page's CSS drift and sweep
already give them life. The test page reports a running total of filled slots and combined
weight against the 4 MB budget.

**Only once every slot is filled** do we return to per-component animation. Deciding which two
deserve a loop is much easier when you can see all twelve together.

## Vercel 404 — diagnostic

`NOT_FOUND` on a preview deploy is almost always one of five things. Check in this order:

1. **Is the file committed on the branch?** `git ls-tree -r test/render-prompts --name-only | grep loop-test`
   An untracked local file is invisible to Vercel.
2. **`.vercelignore`.** If it lists `*.html` with an exception only for `index.html`, or ignores
   `assets/`, your test page and every render is stripped from the deployment.
3. **`vercel.json` rewrites.** A catch-all `{"source":"/(.*)","destination":"/index.html"}` sends
   every path to the app — but a *missing* `outputDirectory` or a `builds` block pointing at a
   folder that no longer exists after the cleanup gives you a hard 404 at root.
4. **The deleted file.** You removed `portfolio-jovo.html`. Grep for it:
   `grep -rn "portfolio-jovo" . --exclude-dir=.git` — a stale reference in `vercel.json` builds
   will fail the whole deployment.
5. **Branch previews are per-commit URLs.** The `fra1` id in your error is a specific deployment.
   Open the Vercel dashboard, find that deployment, and read the **Build Logs** and the
   **Source** tab — Source shows exactly which files were uploaded. If `loop-test.html` is not
   in that list, it is cause 1 or 2.

Paste `vercel.json` and `.vercelignore` here and I will tell you which.
