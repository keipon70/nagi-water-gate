# nagi — WATER GATE prototype

Scope: independent, dependency-free custom element; WATER GATE → HERO → breathing space only. User authorized implementation on 2026-09-23. No existing application in workspace.

Direction: start inside water, pass through a lens film, arrive at stillness. Warm ivory #F2EFE8, ink #24211E, moss #394239, stone #A9A49A. No blue, particles, remote shower approach or baked typography.

Renderer decision (V3): preserve V1 WebGL canvas, native 300svh scroll / 100svh sticky, HTML HERO and V2 time/progress split. Replace vertical rivulets with common-source angular jet fields and timed source-to-lens packets. Use forward-difference normals (3 field evaluations), cap raster at 1.5M pixels and DPR 1.25 desktop / 1 mobile. Canvas 2D still only prepares blur textures. No added dependencies.

Water: source at (64% width, -14% height), clustered nozzles with fan spread. FAR thin/slow, MID thicker/faster with splitting strands, NEAR accelerating packets which widen toward the lens. Each near event shares its trajectory, target and 0.8-second arrival time with local splash, blur and subsequent residue. Three impact event streams on mobile, five desktop. A continuous uneven film envelope approximates accumulated impacts at 40–60%; spatial scene replacement is centered at 62.5% within the requested 55–70% range. Film drains after 70%, all water stops at 94.5%. No angular splash singularities, full-screen global warp or spherical particle layer.

Assets: the three user-provided images are client-authorized for this prototype. Near-water image is the viewpoint reference; distant image is lighting reference only. Visual Master is the composition reference. Built-in imagegen creates text-free HERO and a clean lens room plate so baked water does not remain frozen behind the animation. Originals remain unchanged. Generated plates are derivatives, not new approved photography.

Asset manifest:
- gate: clean-site-asset; action generate; rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.
- hero: clean-site-asset; action generate (remove lettering only); rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.

Desktop: 1440×900. Mobile: 390×844, portrait layout preserves subject and gives typography quiet space. Native system serif Japanese and Georgia Latin. No external font downloads.

Fallback: reduced motion shortens the gate and uses opacity only. No WebGL/context loss gets the same simplified transition; no JS gets the final semantic HERO. CTA emits nagi:reserve unless reservation-url is supplied; demo responds with an accessible dialog explicitly stating booking is unconnected.

Validation: real browser desktop/mobile, exact reverse states, stopped frames, transition captures, keyboard, resize, reduced motion, no JS and WebGL failure. User-local acceptance pending.

Deployment: GitHub Pages at https://keipon70.github.io/nagi-water-gate/ from keipon70/nagi-water-gate. User explicitly requested V3 implementation and public/review URL update. Push to main triggers the existing Pages workflow. ?review exposes 0/20/40/55/70/100% controls. Self-contained nagi-share.html is regenerated after source changes.

V3 scope: shader generation, raster budget, review controls and documentation. HERO copy/layout/CTA and downstream sections unchanged. No new images or OGP redesign in this bounded motion-only revision. Motion QA includes fixed-time arrival/impact/residue frames and six scroll checkpoints at desktop/mobile widths. Fluid accumulation is an artistic approximation, not feedback-buffer mass conservation. Physical-device performance remains unverified.

V2 validation: Chrome desktop 1440×900 and mobile viewport 390×844; at 0/25/55%, time and pixels change while progress remains fixed; at 100% animation stops; reverse scrolling preserves forward water time. Reduced-motion clock/draw count stay fixed. No page errors. Physical iOS/Android GPU performance and subjective shower realism remain review items; no fluid-simulation or measured-device-FPS claim.
