# Render prompt pack — Jiovanny Adel portfolio

Every prompt below is built to match `portfolio-card.webp` exactly. The palette hexes were
sampled from that file, not guessed.

**Before anything else:** attach `portfolio-card.webp` to the Cursor chat as a reference image
on every generation and say *"match this exact lighting, palette and material treatment."*
A reference image holds style far better than any wording. Generate the whole set in one
session — models drift between sessions.

---

## 1. STYLE BLOCK — paste this verbatim into every prompt

```
STYLE: Photoreal product render, path-traced with full global illumination and ray-traced
reflections. Cinema-4D/Octane look, 16-bit, physically based materials.

PALETTE (strict):
  background #07080A   brass #C8A15E   warm steel #A9A296   frame metal #8E8A82
  bone shell #D6CBB6   near-black parts #24231F   amber oil #9A6218
  data glow #5FE39A    accent bronze #C08A3E
  No blue, purple, teal or magenta anywhere. Warm neutrals and one green accent only.

LIGHTING: Large rectangular softbox key from upper left producing long straight specular
streaks across metal. Cool grey fill from lower right at low intensity. Warm bronze rim
light from behind right separating the subject from the background. Deep falloff to near
black at the frame edges. Soft volumetric haze in the air, lit by the key.

SET: Dark reflective floor with a faint engraved grid, catching a soft specular reflection
of the subject. Background is empty black void with drifting smoke. Nothing else in frame.

CAMERA: 85mm, slight low angle, shallow depth of field, subject tack sharp, background
falling off. Product-photography framing with generous negative space.

FINISH: subtle film grain, faint chromatic aberration, no post text.

NEGATIVE: no text, no lettering, no numbers, no watermark, no logo, no UI overlay,
no people, no hands, no bright or white background, no cartoon or stylised look,
no clutter, no lens flare, no blue colour cast.
```

---

## 2. THE ASSET SET

Filenames matter — they're what the page will reference. Put everything in `/assets/renders/`.

### 2.1 `hero-01.png` — 16:9, 1920×1080
```
SUBJECT: Wide lineup, left to right with even spacing: a transparent glass-walled industrial
gearbox with brass and steel spur gears and a bevel pair, half-submerged in an amber oil bath;
a walking bipedal humanoid robot with bone-coloured armour panels and dark articulated joints;
a quadcopter drone hovering with motion-blurred rotors and a gimbal camera; a floating neural
network of polished gold spheres joined by thin glowing filaments; a stack of six transparent
glass data plates with a green light beam descending through them.
All five objects on the same dark reflective grid floor, receding slightly into haze.
```

### 2.2 `betk.png` — 1:1, 1024×1024
```
SUBJECT: A single brass-framed glass display panel standing upright on the dark grid floor,
showing an abstract right-to-left storefront grid of blank product tiles — no text, no letters,
just glowing rectangular tiles and bars, denser on the right side of the panel. A small green
verification indicator glows at the lower left of the panel. Brass frame, bevelled glass edges.
```

### 2.3 `b2s.png` — 1:1, 1024×1024
```
SUBJECT: One solid brass core cube floating at centre, with four smaller glass panels orbiting
around it at the corners, each panel edge-lit in a different accent — brass, cool grey, green,
pale amber. Thin glowing filaments connect the core to each panel. Dark grid floor beneath,
soft reflection.
```

### 2.4 `reviewer.png` — 21:9, 1680×720
```
SUBJECT: A horizontal industrial conveyor line. Five brass-framed glass plates advance left to
right along a machined rail. At the centre stands a taller gate mechanism with a heavy brass
stamp head poised above the line and three status lamps on its housing — one green, one amber,
one red. A thin filament loops back from the gate to an earlier station. Dark grid floor.
```

### 2.5 `rls.png` — 3:2, 1200×800
```
SUBJECT: Five horizontal glass plates stacked with even gaps, seen at a slight angle. Four
plates have a small closed brass padlock resting on them and sit dim. The middle plate is
lit from within with green light and its padlock is open. Dark grid floor, soft reflection.
```

### 2.6 `bilingual.png` — 3:2, 1200×800
```
SUBJECT: Two identical brass-framed glass panels standing side by side and mirrored — the left
panel's abstract bar layout runs to the right edge, the right panel's runs to the left edge.
No text or letters, only glowing bars and blocks. A small brass toggle mechanism sits between
them with a green indicator. Dark grid floor.
```

### 2.7 `tracking.png` — 3:2, 1200×800
```
SUBJECT: Three connected machine stages on the dark grid floor: a brass input tray holding a
single glass plate, feeding a rotating brass drum wrapped in glass record strips, feeding a
vertical ribbon of small green-lit glass tags rising from the third stage. Thin filaments
connect the three. Warm brass and dark steel throughout.
```

### 2.8 `system-band.png` — 21:9, 1680×720
```
SUBJECT: Five brass-framed glass slabs standing upright in a row on the dark grid floor, evenly
spaced, receding very slightly. The fourth slab from the left is edge-lit amber; all others are
neutral. A single small green glowing cube travels along a machined rail that runs through all
five slabs at their midpoint. Dark grid floor, haze behind.
```

### 2.9 `og-card.png` — 1.91:1, 1200×630
```
SUBJECT: Three-quarter close-up of the transparent glass gearbox alone, brass and steel gears
meshing, amber oil bath at the bottom, on the dark grid floor. Composed with the gearbox in the
left two thirds and empty dark space on the right.
```

---

## 3. OPTIONAL — hero frame sequence

Far better than a single hero image, and it's the technique WMF uses on the page you liked.

Generate 24 frames of `hero-01` with only the camera moving — a slow left-to-right dolly across
the lineup. Append to the subject block:

```
CAMERA MOVE: frame {N} of 24 in a slow linear dolly from the far left of the lineup to the far
right. Subject, lighting, materials and floor are IDENTICAL in every frame. Only the camera
position changes. Do not alter composition style, colour or exposure between frames.
```

Name them `hero-001.png` through `hero-024.png`, 1600×900, and I'll build the scroll scrubber.
Consistency will still wobble — pick the cleanest run of frames and discard the rest.

---

## 4. EXPORT SPEC

- Generate at the sizes above, then convert to **WebP quality 82** with a PNG fallback.
- Every card image under **250 KB**; hero under **400 KB** per frame.
- Total page weight target: **under 4 MB** including the hero.
- Keep the originals — you'll want them at full size later.

---

## 5. WIRING IT IN — paste into Cursor

```
In index.html, replace the inline <svg> inside each .mv container with an <img>.
Do not change the .mv wrapper, its aspect-ratio class, or any surrounding markup.

Mapping (card order in the .mosaic section):
  m-a  BETK              -> /assets/renders/betk.png
  m-b  B2S               -> /assets/renders/b2s.png
  m-c  Reviewer surface  -> /assets/renders/reviewer.png
  m-d  Row-level security-> /assets/renders/rls.png
  m-e  Bilingual         -> /assets/renders/bilingual.png
  m-f  Tracking systems  -> /assets/renders/tracking.png

Also replace the <svg> inside the .keyvis figure in the claim section with
  /assets/renders/system-band.png

Each <img> must be:
  <img src="..." alt="<describe the object>" loading="lazy" decoding="async"
       style="width:100%;height:100%;object-fit:cover;display:block">

Then add to <head>:
  <meta property="og:image" content="/assets/renders/og-card.png">
  <meta name="twitter:card" content="summary_large_image">

DO NOT TOUCH: the three.js scene, the .card hover and reveal JS, the theme system,
window.__scene3DTheme, the sticky sub-nav scrollspy, or the word-reveal script.
```

---

## 6. WHAT THIS COSTS YOU

Swapping the SVG diagrams for renders makes the page look far more expensive — and it removes
information. The current panels *explain* things: which rows are denied, where the verdict gate
sits, how the layout mirrors. A beautiful render of five glass slabs explains nothing.

Strongest version: keep the render as the card image, and keep the explanation in the card's
paragraph text underneath it. Don't let the picture carry the argument on its own.
