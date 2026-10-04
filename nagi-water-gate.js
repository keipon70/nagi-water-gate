import { vertexShader, fragmentShader } from './water-shader.js';

const asset = name => new URL(`./assets/${name}`, import.meta.url).href;
const clamp = x => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const arrow = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" stroke-width="1"/></svg>';

class WaterRenderer {
  constructor(canvas, images) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.program = gl.createProgram();
    this.shaders = [];
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(this.program, shader); this.shaders.push(shader);
    }
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    this.uniforms = Object.fromEntries(['resolution','progress','mobile','gateSize','heroSize'].map(n => [n, gl.getUniformLocation(this.program, `u_${n}`)]));
    const blurred = images.map(img => {
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.filter = 'blur(28px)';
      ctx.drawImage(img, -50, -50, c.width + 100, c.height + 100); return c;
    });
    this.textures = [...images, ...blurred].map((img, i) => {
      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(gl.getUniformLocation(this.program, ['u_gate','u_hero','u_gateBlur','u_heroBlur'][i]), i);
      if (i < 2) gl.uniform2f(this.uniforms[i ? 'heroSize' : 'gateSize'], img.naturalWidth, img.naturalHeight);
      return texture;
    });
    this.drawCount = 0;
  }
  resize(width, height) {
    const mobile = width <= 700;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    // Cap the raster budget as well as DPR on very large displays.
    const ratio = Math.min(dpr, Math.sqrt(2500000 / (width * height)));
    this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uniforms.mobile, mobile ? 1 : 0);
  }
  draw(progress) { this.gl.uniform1f(this.uniforms.progress, progress); this.gl.drawArrays(this.gl.TRIANGLES, 0, 6); this.drawCount++; }
  destroy() {
    const gl = this.gl;
    this.textures.forEach(t => gl.deleteTexture(t)); this.shaders.forEach(s => gl.deleteShader(s));
    gl.deleteBuffer(this.buffer); gl.deleteProgram(this.program);
  }
}

export class NagiWaterGate extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this.progress = 0; this.frame = 0; this.generation = 0; }
  connectedCallback() { this.mount(); }
  async mount() {
    const generation = ++this.generation;
    this.abort = new AbortController();
    const { signal } = this.abort;
    const gateURL = this.getAttribute('gate-src') || asset('gate.webp');
    const heroURL = this.getAttribute('hero-src') || asset('hero.webp');
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${new URL('./nagi-water-gate.css', import.meta.url).href}">
      <section class="gate"><div class="stage">
        <div class="plate hero-plate" aria-hidden="true"></div>
        <div class="plate gate-plate" aria-hidden="true"></div>
        <canvas class="water" aria-hidden="true"></canvas>
        <button class="skip" type="button">演出をスキップしてnagiへ</button>
        <div class="cue" aria-hidden="true">SCROLL TO UNWIND<svg viewBox="0 0 12 24" fill="none"><path d="M6 0v21M2 17l4 4 4-4" stroke="currentColor" stroke-width=".7"/></svg></div>
        <div class="hero">
          <p class="brand reveal">nagi</p><p class="eyebrow reveal">PRIVATE HEAD SPA</p>
          <h1 class="headline"><span class="reveal">何もしない時間を、</span><span class="reveal">自分のために。</span></h1>
          <p class="support reveal">頭も、予定も、会話も。<br>75分だけ、そっと置いていく。</p>
          <button class="cta reveal" type="button">空き状況を見る ${arrow}</button>
        </div>
      </div></section>`;
    const root = this.shadowRoot;
    this.stage = root.querySelector('.stage'); this.zone = root.querySelector('.gate');
    this.canvas = root.querySelector('canvas'); this.cue = root.querySelector('.cue');
    this.hero = root.querySelector('.hero'); this.parts = [...root.querySelectorAll('.reveal')];
    this.gatePlate = root.querySelector('.gate-plate');
    root.querySelector('.hero-plate').style.setProperty('--hero', `url(${JSON.stringify(heroURL)})`);
    this.gatePlate.style.setProperty('--gate', `url(${JSON.stringify(gateURL)})`);
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.failed = false;
    this.motion.addEventListener('change', () => this.updateMode(), { signal });
    root.querySelector('.skip').addEventListener('click', () => { this.goTo(1); this.parts.at(-1).focus({ preventScroll: true }); }, { signal });
    this.parts.at(-1).addEventListener('click', () => {
      const url = this.getAttribute('reservation-url');
      if (url) { const parsed = new URL(url, location.href); if (/^https?:$/.test(parsed.protocol)) location.assign(parsed.href); }
      else this.dispatchEvent(new CustomEvent('nagi:reserve', { bubbles: true, composed: true }));
    }, { signal });
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.failed = true; this.updateMode(); }, { signal });
    this.canvas.addEventListener('webglcontextrestored', () => { this.disconnectedCallback(); this.mount(); }, { signal });
    window.addEventListener('scroll', () => this.schedule(), { passive: true, signal });
    window.addEventListener('resize', () => this.resize(), { passive: true, signal });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.schedule(); }, { signal });
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.stage);
    this.updateMode();
    try {
      const images = await Promise.all([gateURL, heroURL].map(url => new Promise((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Image load failed')); img.src = url;
      })));
      if (generation !== this.generation || !this.isConnected) return;
      this.renderer = new WaterRenderer(this.canvas, images);
      this.dataset.renderer = 'webgl'; this.resize();
    } catch (error) {
      if (generation !== this.generation) return;
      this.failed = true; this.dataset.reason = error.message; this.updateMode();
    }
    this.dataset.ready = 'true';
    this.dispatchEvent(new CustomEvent('nagi:ready', { bubbles: true }));
  }
  updateMode() {
    this.simplified = this.motion.matches || this.failed;
    this.classList.toggle('simplified', this.simplified);
    this.zone.style.height = this.simplified ? '120svh' : '300svh';
    this.canvas.style.display = this.simplified ? 'none' : '';
    this.dataset.mode = this.simplified ? 'simplified' : 'water';
    this.resize();
  }
  resize() {
    if (!this.stage) return;
    const { width, height } = this.stage.getBoundingClientRect();
    this.renderer?.resize(width, height); this.schedule();
  }
  schedule() {
    if (this.frame || document.hidden) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
  }
  render() {
    const rect = this.zone.getBoundingClientRect();
    const range = Math.max(1, this.zone.offsetHeight - this.stage.offsetHeight);
    this.progress = clamp(-rect.top / range);
    const p = this.progress;
    this.dataset.progress = p.toFixed(5);
    const revealP = this.simplified ? smooth(.08, .85, p) : p;
    this.gatePlate.style.opacity = String(1 - smooth(this.simplified ? .05 : .48, this.simplified ? .8 : .62, p));
    this.cue.style.opacity = String(1 - smooth(0, this.simplified ? .2 : .18, p));
    const starts = this.simplified ? [.08,.08,.08,.08,.08,.08] : [.845,.866,.885,.904,.925,.948];
    this.parts.forEach((el, i) => {
      const a = smooth(starts[i], starts[i] + (this.simplified ? .7 : .041), revealP);
      el.style.opacity = String(a);
      el.style.transform = this.simplified ? 'none' : `translateY(${(1-a)*5}px)`;
      el.style.visibility = a === 0 ? 'hidden' : 'visible';
    });
    this.parts.at(-1).tabIndex = p > (this.simplified ? .75 : .97) ? 0 : -1;
    this.parts.at(-1).style.pointerEvents = p > (this.simplified ? .75 : .97) ? 'auto' : 'none';
    if (!this.simplified && this.renderer) this.renderer.draw(p);
  }
  /** Native page scroll. Useful to integrate a skip link or a preview scrubber. */
  goTo(progress) {
    const top = window.scrollY + this.zone.getBoundingClientRect().top;
    const range = this.zone.offsetHeight - this.stage.offsetHeight;
    window.scrollTo({ top: top + clamp(progress) * range, behavior: 'instant' });
    this.render();
  }
  disconnectedCallback() {
    ++this.generation; this.abort?.abort(); this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.frame); this.frame = 0; this.renderer?.destroy(); this.renderer = null;
  }
}
if (!customElements.get('nagi-water-gate')) customElements.define('nagi-water-gate', NagiWaterGate);
