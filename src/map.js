// Illustrated neighbourhood map, generated as SVG from a fixed seed.
export function initMap(root) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const W = 600, H = 720;

  const blob = (cx, cy, r, n = 9, jit = 0.35) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, rr = r * (1 - jit / 2 + rnd() * jit);
      return [cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr];
    });
    // closed Catmull-Rom → cubic Béziers
    let d = `M${pts[0].join(',')}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1.map((v) => v.toFixed(1))} ${c2.map((v) => v.toFixed(1))} ${p2.map((v) => v.toFixed(1))}`;
    }
    return d + 'Z';
  };

  let streets = '';
  for (let x = -500; x < 1100; x += 34 + rnd() * 10) streets += `<line x1="${x}" y1="-400" x2="${x}" y2="1100"/>`;
  for (let y = -400; y < 1100; y += 30 + rnd() * 12) streets += `<line x1="-500" y1="${y}" x2="1100" y2="${y}"/>`;

  const parks = [[120, 120, 60], [470, 300, 70], [90, 520, 95], [500, 610, 50], [300, 200, 28], [250, 470, 34]]
    .map(([x, y, r]) => `<path d="${blob(x, y, r)}"/>`).join('');

  const roads = [
    'M-20 250 C 140 230, 260 300, 360 270 S 560 180, 640 200',
    'M210 -20 C 230 140, 180 300, 250 420 S 330 640, 300 760',
    'M-20 640 C 120 600, 260 560, 400 470 S 560 380, 640 400',
  ];
  const highway = 'M480 -20 C 450 120, 520 220, 430 360 S 380 560, 470 760';
  const river = 'M-30 400 C 40 420, 60 470, 30 560 S 60 700, 160 760';

  const labels = [[60, 60, 'Little Larch'], [380, 70, 'Mill End'], [180, 330, 'Park Extension'], [360, 380, 'Mercer Hill'], [80, 455, 'Riverside'], [420, 520, 'Old Quarry'], [200, 640, 'Northgate'], [520, 470, 'The Flats']]
    .map(([x, y, t]) => `<text x="${x}" y="${y}">${t.toUpperCase()}</text>`).join('');

  const icons = {
    cafe: '<path d="M-4 -2h7v3a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3z M3 -1h1.5a1.5 1.5 0 0 1 0 3H3" fill="none" stroke="#fff" stroke-width="1.4"/>',
    bus: '<rect x="-4" y="-4.5" width="8" height="8" rx="1.8" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M-4 0h8" stroke="#fff" stroke-width="1.2"/>',
    tree: '<path d="M0 -5 4 1h-8z M0 1v4" fill="#fff" stroke="#fff" stroke-width="1.2"/>',
    school: '<path d="M-5 -1 0 -4 5 -1 0 2z M-3 0v3c2 1.5 4 1.5 6 0v-3" fill="none" stroke="#fff" stroke-width="1.3"/>',
    plus: '<path d="M0 -4v8M-4 0h8" stroke="#fff" stroke-width="2"/>',
    shop: '<path d="M-4 -1h8l-1 5h-6z M-2 -1a2 2 0 0 1 4 0" fill="none" stroke="#fff" stroke-width="1.3"/>',
  };
  const pois = [
    [330, 60, '#6b5bd6', 'school', 'Larch Primary'], [560, 120, '#f39a3b', 'cafe', 'Grind & Co.'], [90, 250, '#1fcf7c', 'tree', 'Fern Park'],
    [430, 230, '#3f8be0', 'bus', 'Line 14 stop'], [260, 300, '#e45757', 'shop', 'Larch Market'], [540, 330, '#f39a3b', 'cafe', 'Morning Bakery'],
    [120, 390, '#6b5bd6', 'school', 'Hill Academy'], [430, 430, '#3f8be0', 'bus', 'Mercer station'], [30, 520, '#1fcf7c', 'tree', 'Riverside Green'],
    [560, 560, '#e45757', 'plus', 'Pharmacy'], [330, 590, '#3f8be0', 'bus', 'Line 6 stop'], [150, 610, '#f39a3b', 'shop', 'Book Nook'],
  ].map(([x, y, c, ic, name]) => `<g class="map__pin" transform="translate(${x} ${y})"><title>${name}</title><path d="M0 9 -5 3 a8 8 0 1 1 10 0z" fill="${c}" transform="translate(0 -12) scale(1.25)"/><g transform="translate(0 -16)">${icons[ic]}</g></g>`).join('');

  root.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the area around Mintly Dental">
  <rect width="${W}" height="${H}" fill="#eceee9"/>
  <g transform="rotate(-14 300 360)" stroke="#fbfbf9" stroke-width="2.2">${streets}</g>
  <path d="${river}" fill="none" stroke="#cfe1ea" stroke-width="30" stroke-linecap="round"/>
  <g fill="#b6dea0">${parks}</g>
  <g fill="none" stroke-linecap="round">
    ${roads.map((d) => `<path d="${d}" stroke="#dde0da" stroke-width="11"/><path d="${d}" stroke="#fff" stroke-width="8"/>`).join('')}
    <path d="${highway}" stroke="#e8d68f" stroke-width="11"/><path d="${highway}" stroke="#f7e6a6" stroke-width="8"/>
  </g>
  <g font-family="Inter Tight Variable, sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.6" fill="#8d928e">${labels}</g>
  ${pois}
  <g transform="translate(300 330)">
    <circle r="16" fill="#1fcf7c" opacity=".35"><animate attributeName="r" values="14;46" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".45;0" dur="2.4s" repeatCount="indefinite"/></circle>
    <ellipse cy="3" rx="9" ry="3" fill="#000" opacity=".15"/>
    <path d="M0 0 -11 -15 a14 14 0 1 1 22 0z" fill="#121412" transform="translate(0 2)"/>
    <g transform="translate(-8 -32) scale(.5)" color="#fff"><use href="#logo-mark" width="32" height="32"/></g>
  </g>
</svg>`;

  const svg = root.parentElement;
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    root.style.transform = `translate(${-x * 22}px, ${-y * 22}px) scale(1.03)`;
  });
  svg.addEventListener('pointerleave', () => { root.style.transform = ''; });
}
