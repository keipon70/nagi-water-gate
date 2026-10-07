// Set one booking URL here when this concept becomes a real service.
const BOOKING_URL = '';
const gate = document.querySelector('nagi-water-gate');
const dialog = document.querySelector('#reservation');
if (BOOKING_URL) gate.setAttribute('reservation-url', BOOKING_URL);
function reserve(event) {
  event?.preventDefault();
  if (BOOKING_URL) location.assign(BOOKING_URL);
  else if (!dialog.open) dialog.showModal();
}
gate.addEventListener('nagi:reserve', reserve);
document.querySelectorAll('[data-reserve]').forEach(link => {
  if (BOOKING_URL) link.href = BOOKING_URL;
  link.addEventListener('click', reserve);
});
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 768px)');
const noise = document.querySelector('.noise');
const mask = document.querySelector('.nagi-mask');
const word = document.querySelector('.mask-word');
const canvas = document.querySelector('#caustics');
const ctx = canvas.getContext('2d');
const minutes = document.querySelector('.minutes');
const stage = document.querySelector('.minutes-stage');
const track = document.querySelector('.experience-track');
const count = document.querySelector('.rail-count');
const clamp = value => Math.max(0, Math.min(1, value));
let frame = 0, visibleMask = false, time = 0, previous = 0, width = 0, height = 0, travel = 0;

// Only the letter texture is clock-driven; all scene positions use native scroll.
function drawWater(t) {
  if (!ctx || !width || !height) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#394239'; ctx.fillRect(0, 0, width, height);
  const unit = Math.max(38, width / 16);
  // Soft, intersecting cellular caustics, clipped to the type (not rain stripes).
  for (let row = -1; row < height / unit + 1; row++) {
    for (let col = -1; col < width / unit + 1; col++) {
      const phase = row * 2.3 + col * 1.7;
      const cx = col * unit + Math.sin(row + t * .14) * unit * .25;
      const cy = row * unit + Math.cos(col + t * .17) * unit * .2;
      ctx.beginPath();
      for (let step = 0; step <= 32; step++) {
        const angle = step / 32 * Math.PI * 2;
        const radius = unit * (.55 + .09 * Math.sin(angle * 3 + phase + t * .21));
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * .7;
        if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const alpha = .07 + .055 * (1 + Math.sin(phase + t * .24));
      ctx.strokeStyle = `rgba(205,215,176,${alpha})`; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.strokeStyle = `rgba(222,227,198,${alpha * .65})`; ctx.lineWidth = .8; ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'destination-in';
  const size = height * .94;
  ctx.font = `${size}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000'; ctx.fillText('NAGI', width / 2, height * .52, width * .94);
  ctx.globalCompositeOperation = 'source-over';
  word.classList.add('is-drawn');
}
function layout() {
  width = word.clientWidth; height = word.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, desktop.matches ? 1.5 : 1.25);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  travel = Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingRight));
  drawWater(time); schedule();
}
function updateScroll() {
  const viewport = innerHeight;
  const nr = noise.getBoundingClientRect();
  const np = clamp(-nr.top / (nr.height * .65));
  noise.style.setProperty('--thought-opacity', reduce.matches ? '.3' : String(.55 * (1 - np)));
  noise.style.setProperty('--thought-shift', `${-np * 55}px`);
  const mr = mask.getBoundingClientRect();
  const approach = clamp(-mr.top / Math.max(1, mr.height * .8));
  word.style.setProperty('--mask-scale', reduce.matches ? '1' : String(1 + approach * 1.8));
  if (desktop.matches && !reduce.matches) {
    const rect = minutes.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - stage.clientHeight));
    track.style.setProperty('--rail-x', `${-travel * progress}px`);
    minutes.style.setProperty('--rail-progress', String(Math.max(.02, progress)));
    count.textContent = `${String(Math.min(5, 1 + Math.floor(progress * 5))).padStart(2, '0')} — 05`;
  } else track.style.removeProperty('--rail-x');
}
function tick(now) {
  frame = 0;
  updateScroll();
  if (visibleMask && !reduce.matches && !document.hidden) {
    if (previous) time += Math.min((now - previous) / 1000, .05);
    drawWater(time); previous = now;
    frame = requestAnimationFrame(tick);
  } else previous = 0;
}
function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) {entry.target.classList.add('is-visible'); reveal.unobserve(entry.target);} });
  }, {threshold: .08});
  document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
  const waterObserver = new IntersectionObserver(entries => {
    visibleMask = entries[0].isIntersecting; schedule();
  });
  waterObserver.observe(mask);
  const dropObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { entries[0].target.classList.add('drop-play'); dropObserver.disconnect(); }
  }, {threshold: .35});
  dropObserver.observe(document.querySelector('.final'));
  document.documentElement.classList.add('motion-ready');
}
addEventListener('scroll', schedule, {passive:true});
addEventListener('resize', layout, {passive:true});
addEventListener('orientationchange', layout);
reduce.addEventListener('change', layout); desktop.addEventListener('change', layout);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {cancelAnimationFrame(frame); frame = 0; previous = 0;} else schedule();
});
layout();
