# nagi — WATER GATE prototype

Scope: independent, dependency-free custom element; WATER GATE → HERO → breathing space only. User authorized implementation on 2026-09-23. No existing application in workspace.

Direction: start inside water, pass through a lens film, arrive at stillness. Warm ivory #F2EFE8, ink #24211E, moss #394239, stone #A9A49A. No blue, particles, remote shower approach or baked typography.

Renderer decision (V2): preserve V1 WebGL canvas and HTML HERO. GLSL height fields refract actual background pixels; Canvas 2D prepares blurred textures once. No Three.js/GSAP dependencies. Native scroll, 300svh region, 100svh sticky stage. A requestAnimationFrame clock advects irregular rivulets, sparse elongated lens droplets and fine sheet variation downward independently of scroll. Progress controls water envelope, parallax, refraction intensity, exposure, spatial scene replacement, drainage and HERO stagger. Pause the continuous loop at the HERO, offscreen, hidden or reduced-motion state. Mobile uses DPR cap 1 instead of 1.5, fewer water layers and 4 rather than 9 droplets.

Water: multi-scale irregular vertical rivulets and broad water film; normals sample the actual background texture; highlights respond to normals. At the boundary, loss of focus and spatial masking obscure a scene replacement. Drain edge moves downward; all refraction vanishes before final typography completes.

Assets: the three user-provided images are client-authorized for this prototype. Near-water image is the viewpoint reference; distant image is lighting reference only. Visual Master is the composition reference. Built-in imagegen creates text-free HERO and a clean lens room plate so baked water does not remain frozen behind the animation. Originals remain unchanged. Generated plates are derivatives, not new approved photography.

Asset manifest:
- gate: clean-site-asset; action generate; rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.
- hero: clean-site-asset; action generate (remove lettering only); rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.

Desktop: 1440×900. Mobile: 390×844, portrait layout preserves subject and gives typography quiet space. Native system serif Japanese and Georgia Latin. No external font downloads.

Fallback: reduced motion shortens the gate and uses opacity only. No WebGL/context loss gets the same simplified transition; no JS gets the final semantic HERO. CTA emits nagi:reserve unless reservation-url is supplied; demo responds with an accessible dialog explicitly stating booking is unconnected.

Validation: real browser desktop/mobile, exact reverse states, stopped frames, transition captures, keyboard, resize, reduced motion, no JS and WebGL failure. User-local acceptance pending.

Deployment: GitHub Pages at https://keipon70.github.io/nagi-water-gate/ from keipon70/nagi-water-gate. Push to main triggers the existing Pages workflow. ?review exposes 0/25/55/100% controls. Self-contained nagi-share.html is the offline counterpart and is regenerated after source changes.

V2 validation: Chrome desktop 1440×900 and mobile viewport 390×844; at 0/25/55%, time and pixels change while progress remains fixed; at 100% animation stops; reverse scrolling preserves forward water time. Reduced-motion clock/draw count stay fixed. No page errors. Physical iOS/Android GPU performance and subjective shower realism remain review items; no fluid-simulation or measured-device-FPS claim.
