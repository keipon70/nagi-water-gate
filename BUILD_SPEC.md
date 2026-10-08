# nagi — WATER GATE prototype

Current scope (2026-10-07): one complete nagi concept LP, from the existing WATER GATE / HERO through NOISE, NAGI MASK, 75 MINUTES, QUIET CHOICE, SPACE, MENU, PHILOSOPHY, FAQ and FINAL. Full implementation decisions and approved exceptions are recorded in LP_SPEC.md. The original gate implementation below is preserved as historical technical context, not a limit on the current LP scope.

Direction: start inside water, pass through a lens film, arrive at stillness. Warm ivory #F2EFE8, ink #24211E, moss #394239, stone #A9A49A. No blue, particles, remote shower approach or baked typography.

Renderer decision (Shower Zone final candidate): preserve WebGL canvas, native 300svh scroll / 100svh sticky, HTML HERO and time/progress split. Remove common-source angular fields and ballistic packets. Use independently inclined FAR/MID flow bands and large torn NEAR surfaces entering from several offscreen positions. Forward-difference normals (3 field evaluations), raster cap 1.5M pixels and DPR 1.25 desktop / 1 mobile. Canvas 2D still only prepares blur textures. No added dependencies.

Water: four layers. FAR fine/low contrast with density pockets. MID two irregular branching bands with unequal speed and inclination. NEAR noise-distorted surfaces, varying internal transparency and soft edges; no shared origin, no straight thick-line proxy. Each near surface shares its arrival position/time with local distortion, short blur and LENS residue. 3 event streams desktop, 2 mobile; mobile retains proportional surface coverage and uses two noise octaves instead of three. Scroll increases secondary event amplitude, perceived impact frequency, size and film; event clocks themselves never depend on scroll. Connected film accumulates after the initial impact, grows at 48–61%, and drains at 70–94%. Spatial scene replacement centered at 61.3%, within 52–70%. All water stops at 94.5%.

Assets: the three user-provided images are client-authorized for this prototype. Near-water image is the viewpoint reference; distant image is lighting reference only. Visual Master is the composition reference. Built-in imagegen creates text-free HERO and a clean lens room plate so baked water does not remain frozen behind the animation. Originals remain unchanged. Generated plates are derivatives, not new approved photography.

Asset manifest:
- gate: clean-site-asset; action generate; rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.
- hero: clean-site-asset; action generate (remove lettering only); rights_status client-authorized source / generated-for-project derivative; approval_state inherited; quality/optimization pending.

Desktop: 1440×900. Mobile: 390×844, portrait layout preserves subject and gives typography quiet space. Native system serif Japanese and Georgia Latin. No external font downloads.

Mobile readability repair (2026-10-08): preserve water, photos, copy and desktop layout. Add an ivory reading surface above the WebGL canvas, resolved before the first HERO letter appears; reverse scroll removes it again. Explicit dark text, 14px support/CTA, 9px eyebrow, and 10px white scroll cue on a dark backing. No-JS mobile receives the same high-contrast treatment. Source QA passed. Chrome viewport checks at 320/375/390/768/1024/1440px plus reduced motion: no horizontal overflow/page errors, CTA in view and dialog opens. Mobile entry/transition/final screenshots inspected. Physical-phone confirmation remains pending.

Fallback: reduced motion shortens the gate and uses opacity only. No WebGL/context loss gets the same simplified transition; no JS gets the final semantic HERO. CTA emits nagi:reserve unless reservation-url is supplied; demo responds with an accessible dialog explicitly stating booking is unconnected.

Validation: real browser desktop/mobile, exact reverse states, stopped frames, transition captures, keyboard, resize, reduced motion, no JS and WebGL failure. User-local acceptance pending.

Deployment: GitHub Pages at https://keipon70.github.io/nagi-water-gate/ from keipon70/nagi-water-gate. User explicitly requested Shower Zone implementation and public/review URLs. Push to main triggers the existing Pages workflow. ?review exposes 0/20/40/55/70/100% controls, labeled ZONE. Self-contained nagi-share.html is regenerated after source changes.

Revision scope: shader generation, existing review label and documentation. HERO copy/layout/CTA and downstream sections unchanged. No audio, mouse interaction, new UI, images or OGP redesign in this bounded motion-only revision. Motion QA includes fixed-time entry/near/impact/residue/drain frames and six scroll checkpoints at desktop/mobile widths. Fluid accumulation is an artistic approximation, not feedback-buffer mass conservation. Physical-device performance remains unverified.

Shower Zone validation (2026-10-07): Chrome 1440×900 and 390×844. At 0/20/40/55/70%, pixels and water time change while scroll progress stays fixed; at 100%, pixels/time stop. Reverse scrolling preserves forward water time. Reduced-motion clock/draw count stay fixed. No page or console errors; no horizontal overflow; all 6 review buttons present. Fixed-time entry, near, impact, residue, peak, drain and HERO screenshots inspected. No radial convergence; variable density, broad near distortion and smaller mid streams are visible, with a still/legible final HERO. This is visual judgment, not user acceptance of photorealism.

Coverage diagnostic: sampled the actual shader near+impact mask at 120ms intervals over 3.6 seconds, counting pixels with mask >0.2 at 160×100 / 78×169. At progress .55, peak mask coverage was 58.7% desktop / 51.9% mobile; at entry about 20.3%, at HERO 0%. This measures affected area, not opacity or a psychophysical occlusion score. No claim of physical-device FPS or user-local acceptance.
