import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMap } from './map.js';
import { initDentists } from './dentists.js';
import { initStatus, initBooking } from './booking.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// hero aligner (a pre-rendered still, see scripts/render-stills.mjs): pointer parallax + scroll tilt
const art = $('.hero__art');
if (!reduce) {
  const px = gsap.quickTo(art, 'x', { duration: 1.2, ease: 'power3' });
  const py = gsap.quickTo(art, 'y', { duration: 1.2, ease: 'power3' });
  const pr = gsap.quickTo(art, 'rotation', { duration: 1.2, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    px(x * -28); py(y * -18); pr(x * 2.5);
  }, { passive: true });
  gsap.to(art, { yPercent: 12, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

initMap($('.map__svg'));
initDentists($('.dentists'));
initStatus();
initBooking($('.form'));
$('[data-year]').textContent = new Date().getFullYear();

// ---------- hero intro ----------
const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
intro
  .from('.hero__title .line > span', { yPercent: 110, duration: 1.4, stagger: 0.12 }, 0.15)
  .from('.hero__art img', { autoAlpha: 0, yPercent: 10, rotation: 8, scale: 0.92, duration: 2, clearProps: 'transform' }, 0.2)
  .from('.nav', { y: -16, autoAlpha: 0, duration: 1 }, 0.3)
  .from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.1 }, 0.55);

// count-ups
$$('[data-count]').forEach((el) => {
  const end = +el.dataset.count, o = { v: 0 };
  gsap.to(o, { v: end, duration: 2.2, delay: 0.7, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
});

// ---------- reveals ----------
if (!reduce) {
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.from('.doc', { x: 120, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.dentists__viewport', start: 'top 85%' } });
  gsap.from('.footer__word span', { yPercent: 60, scaleY: 0.6, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 100%' } });
}

// ---------- nav: active section + mobile menu ----------
const links = $$('.nav__links a');
['home', 'about', 'services', 'dentists', 'book'].forEach((id) => {
  ScrollTrigger.create({
    trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
    onToggle: ({ isActive }) => { if (isActive) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`)); },
  });
});
const burger = $('.nav__burger'), menu = $('.menu');
const setMenu = (v) => {
  menu.hidden = !v; burger.setAttribute('aria-expanded', v); document.body.classList.toggle('menu-open', v);
  document.documentElement.style.overflow = v ? 'hidden' : '';
  if (v && !reduce) gsap.from('.menu > *', { y: 30, autoAlpha: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out' });
};
burger.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

// ---------- gallery ----------
const stage = $('.gallery__stage');
$$('.gallery__thumbs button').forEach((b) => b.addEventListener('click', () => {
  $$('.gallery__thumbs button').forEach((x) => x.classList.toggle('is-active', x === b));
  const src = b.dataset.src.replace(/^\//, '');
  const cur = $('img.is-shown', stage);
  if (cur && cur.getAttribute('src').replace(/^\.?\//, '') === src) return;
  const img = new Image();
  img.alt = b.dataset.alt; img.src = src;
  img.decode().catch(() => {}).then(() => {
    stage.append(img);
    requestAnimationFrame(() => { img.classList.add('is-shown'); cur?.classList.remove('is-shown'); });
    setTimeout(() => cur?.remove(), 1000);
  });
}));
// slow ken-burns on scroll
gsap.to('.gallery__stage', { yPercent: 6, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.gallery', scrub: true } });

// ---------- services: the hovered featured card is the lit one ----------
const bigs = $$('.svc-big');
bigs.forEach((c) => c.addEventListener('pointerenter', () => bigs.forEach((x) => x.classList.toggle('is-active', x === c))));

// ---------- marquee: duplicated once so the CSS loop is seamless ----------
const track = $('.marquee__track');
track.innerHTML += track.innerHTML;

// ---------- footer wordmark fits the page width ----------
const word = $('.footer__word span');
function fitWord() {
  word.style.fontSize = '100px';
  const w = word.parentElement.clientWidth;
  word.style.fontSize = `${(100 * w) / word.offsetWidth * 0.995}px`;
}
document.fonts.ready.then(() => document.fonts.load('450 100px "Inter Tight Variable"')).then(fitWord);
addEventListener('resize', fitWord);
fitWord();
