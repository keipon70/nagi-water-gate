# nagi — WATER GATE prototype

Scope: independent, dependency-free custom element; WATER GATE → HERO → breathing space only. User authorized implementation on 2026-09-23. No existing application in workspace.

Direction: start inside water, pass through a lens film, arrive at stillness. Warm ivory #F2EFE8, ink #24211E, moss #394239, stone #A9A49A. No blue, particles, remote shower approach or baked typography.

Renderer decision: Canvas 2D compositing alone cannot directly refract image pixels continuously with the required spatially varying normals without CPU pixel work or filter approximations. Use a WebGL canvas with a deterministic GLSL height field. No Three.js/GSAP dependencies. Native scroll, 300svh region, 100svh sticky stage. Render only on changed progress/size; no clock or autonomous water animation. HERO stagger also tied to progress.

Water: multi-scale irregular vertical rivulets and broad water film; normals sample the actual background texture; highlights respond to normals. At the boundary, loss of focus and spatial masking obscure a scene replacement. Drain edge moves downward; all refraction vanishes before final typography completes.

Assets: the three user-provided images are client-authorized for this prototype. Near-water image is the viewpoint reference; distant image is lighting reference only. Visual Master is the composition reference. Built-in imagegen creates text-free HERO and a clean lens room plate so baked water does not remain frozen behind the animation. Originals remain unchanged. Generated plates are derivatives, not new approved photography.

Asset manifest:
- gate: clean-site-asset; action generate; rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.
- hero: clean-site-asset; action generate (remove lettering only); rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.

Desktop: 1440×900. Mobile: 390×844, portrait layout preserves subject and gives typography quiet space. Native system serif Japanese and Georgia Latin. No external font downloads.

Fallback: reduced motion shortens the gate and uses opacity only. No WebGL/context loss gets the same simplified transition; no JS gets the final semantic HERO. CTA emits nagi:reserve unless reservation-url is supplied; demo responds with an accessible dialog explicitly stating booking is unconnected.

Validation: real browser desktop/mobile, exact reverse states, stopped frames, transition captures, keyboard, resize, reduced motion, no JS and WebGL failure. User-local acceptance pending.

Deployment: user selected public GitHub Pages publication. Connected GitHub repository list is empty; gh is unavailable and browser connection could not be used. Destination repository/access is unresolved. No public deployment has taken place. A self-contained nagi-share.html and ZIP are provided as a durable PC file-sharing fallback, not claimed as a public URL.
