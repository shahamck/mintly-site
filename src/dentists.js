// "Meet The Dentists" carousel: hover or arrows pick the active card, drag to scroll.
const TEAM = [
  { img: 'doc-2', name: 'Dr. Elena Ruiz, DDS', role: 'Orthodontist · Founder' },
  { img: 'doc-1', name: 'Dr. Arjun Mehta, BDS', role: 'Implantologist' },
  { img: 'doc-3', name: 'Dr. Grace Wanjiru, DMD', role: 'Pediatric Dentist' },
  { img: 'doc-4', name: 'Dr. Marcus Bell, DDS', role: 'Endodontist' },
  { img: 'doc-5', name: 'Dr. Sofia Marin, DMD', role: 'Cosmetic Dentist' },
  { img: 'doc-6', name: 'Dr. Henrik Vos, DDS', role: 'Oral Surgeon' },
];

export function initDentists(section) {
  const track = section.querySelector('.dentists__track');
  const viewport = section.querySelector('.dentists__viewport');
  const [prev, next] = section.querySelectorAll('.dentists__nav button');

  track.innerHTML = TEAM.map((d, i) => `
    <article class="doc${i === 0 ? ' is-active' : ''}" data-i="${i}">
      <img src="img/${d.img}.webp" alt="Portrait of ${d.name}" loading="lazy" draggable="false" />
      <div class="doc__info">
        <p class="doc__name">${d.name}</p>
        <p class="doc__role">${d.role}</p>
        <div class="doc__social">
          <a href="#" aria-label="${d.name} on LinkedIn"><svg><use href="#i-in" /></svg></a>
          <a href="#" aria-label="${d.name} on Instagram"><svg><use href="#i-ig" /></svg></a>
          <a href="#book" aria-label="Book with ${d.name}"><svg><use href="#i-mail" /></svg></a>
        </div>
      </div>
    </article>`).join('');
  const cards = [...track.children];

  let active = 0, offset = 0;
  const maxOffset = () => Math.max(0, track.scrollWidth - viewport.clientWidth + 20);
  const setActive = (i) => { active = i; cards.forEach((c, j) => c.classList.toggle('is-active', j === i)); };
  const apply = () => {
    offset = Math.min(maxOffset(), Math.max(0, offset));
    track.style.transform = `translate3d(${-offset}px,0,0)`;
    prev.disabled = active === 0;
    next.disabled = active === cards.length - 1;
  };
  const go = (i) => {
    setActive(Math.min(cards.length - 1, Math.max(0, i)));
    const c = cards[active];
    const left = c.offsetLeft, right = left + c.offsetWidth;
    if (left < offset) offset = left;
    else if (right > offset + viewport.clientWidth - 40) offset = right - viewport.clientWidth + 40;
    apply();
  };
  prev.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  cards.forEach((c, i) => c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag) setActive(i), apply(); }));

  // drag / swipe
  let drag = null;
  track.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, o: offset, moved: false }; track.style.transition = 'none'; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    offset = drag.o - dx; apply();
  });
  const end = (e) => {
    if (!drag) return;
    track.style.transition = '';
    if (!drag.moved) { const c = e.target.closest('.doc'); if (c) go(+c.dataset.i); }
    else { // activate the card closest to the left edge
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft - offset); if (d < bd) { bd = d; best = i; } });
      setActive(best); apply();
    }
    drag = null;
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  addEventListener('resize', apply);
  apply();
}
