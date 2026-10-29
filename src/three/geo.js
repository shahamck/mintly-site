// Procedural tooth, aligner and dental-explorer geometry.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const spow = (v, e) => Math.sign(v) * Math.abs(v) ** e;

// A rounded, boxy crown with cusps on top. Unit-ish size, base at y≈-0.45, top at y≈0.6.
// cusps: 0 = incisor edge, 1 = canine point, 2 = premolar, 4 = molar
export function crownGeometry({ cusps = 4, w = 1, h = 1, d = 1, wedge = 0, seg = 56 } = {}) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const bx = spow(x, 0.72), bz = spow(z, 0.72);
    let s, Y;
    if (y >= 0) { s = 1 - 0.14 * y ** 6; Y = 0.6 * spow(y, 0.5); }
    else { s = 1 - 0.22 * -y; Y = 0.45 * y; }
    let X = bx * s, Z = bz * s;
    const top = smooth(0.55, 1, y);
    const th = Math.atan2(Z, X), rr = Math.hypot(X, Z);
    if (cusps >= 2) Y += top * (0.13 * Math.sin(cusps === 4 ? 2 * th : th) ** 2 * rr - 0.16 * Math.exp(-(rr * rr) / 0.12));
    else if (cusps === 1) Y += top * 0.22 * Math.exp(-(X * X) / 0.18);
    else Y += top * 0.03 * Math.cos(X * 9) * rr;
    Z *= 1 - wedge * smooth(-0.2, 1, y);
    p.setXYZ(i, X * w, Y * h, Z * d);
  }
  g.computeVertexNormals();
  return g;
}

// Full molar: crown plus two tapering roots.
export function toothGeometry() {
  const crown = crownGeometry({ cusps: 4, w: 0.95, h: 1, d: 0.85, seg: 72 });
  const roots = [-1, 1].map((side) => {
    const r = new THREE.CapsuleGeometry(0.3, 1.0, 10, 28);
    const p = r.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = 1 - 0.62 * smooth(0.6, -1.0, y);
      p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k * 1.15);
    }
    r.rotateZ(side * 0.14);
    r.translate(side * 0.36, -0.95, 0);
    r.computeVertexNormals();
    return r;
  });
  const merged = mergeGeometries([crown, ...roots]);
  merged.translate(0, 0.35, 0);
  return merged;
}

// A full upper clear aligner: 14 crowns along a U-shaped arch plus a rim.
export function alignerGeometry() {
  const types = [
    { cusps: 4, w: 0.56, h: 0.42, d: 0.6 }, { cusps: 4, w: 0.58, h: 0.44, d: 0.62 },
    { cusps: 2, w: 0.4, h: 0.48, d: 0.48 }, { cusps: 2, w: 0.38, h: 0.5, d: 0.46 },
    { cusps: 1, w: 0.36, h: 0.62, d: 0.38, wedge: 0.45 },
    { cusps: 0, w: 0.32, h: 0.6, d: 0.24, wedge: 0.6 }, { cusps: 0, w: 0.4, h: 0.66, d: 0.25, wedge: 0.65 },
  ];
  const curve = (s) => new THREE.Vector3(2.15 * Math.sin(s * 1.42), 0, 2.5 * Math.cos(s * 1.42) - 0.6);
  const parts = [];
  const n = 14;
  // walk the arch by arc length so neighbours touch
  const widths = [...types, ...types.slice().reverse()].map((t) => t.w * 2 * 0.93);
  const total = widths.reduce((a, b) => a + b, 0);
  const lut = []; let len = 0, prev = curve(-1);
  for (let i = 0; i <= 400; i++) { const s = -1 + (2 * i) / 400, c = curve(s); len += c.distanceTo(prev); prev = c; lut.push([len, s]); }
  const sAt = (L) => { const target = (L / total) * len; return lut.find((e) => e[0] >= target)?.[1] ?? 1; };
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = i < 7 ? types[i] : types[13 - i];
    acc += widths[i] / 2;
    const s = sAt(acc); acc += widths[i] / 2;
    const pos = curve(s), tan = curve(s + 0.001).sub(curve(s - 0.001)).normalize();
    const g = crownGeometry({ ...t, seg: 40 });
    g.rotateY(-Math.atan2(tan.z, tan.x));
    g.translate(pos.x, 0, pos.z);
    parts.push(g);
  }
  const pts = []; for (let i = 0; i <= 60; i++) { const c = curve(-1.02 + (2.04 * i) / 60); c.y = -0.22; pts.push(c); }
  const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.06, 10, false);
  // align attribute sets before merging
  const all = [...parts, rim].map((g) => { const ng = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(ng.attributes)) if (!['position', 'normal'].includes(k)) ng.deleteAttribute(k); return ng; });
  const merged = mergeGeometries(all);
  merged.computeBoundingBox();
  const c = merged.boundingBox.getCenter(new THREE.Vector3());
  merged.translate(-c.x, -c.y, -c.z);
  return merged;
}

// Dental explorer: knurled grip, metal handle, tapered neck ending in a hook.
export function explorer(materials) {
  const group = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.4, 40), materials.metal);
  handle.position.y = -0.6;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1.25, 48, 24), materials.grip);
  const gp = grip.geometry.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), y = gp.getY(i), r = Math.hypot(x, z);
    if (r > 0.18) { const k = 1 + 0.035 * Math.sin(Math.atan2(z, x) * 22) * Math.sin(y * 70); gp.setX(i, x * k); gp.setZ(i, z * k); }
  }
  grip.geometry.computeVertexNormals();
  grip.position.y = -1.1;
  const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.4, 32), materials.metal);
  capT.position.y = 0.8;
  const neck = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0.05, 2.05, 0),
    new THREE.Vector3(0.25, 2.3, 0), new THREE.Vector3(0.38, 2.18, 0), new THREE.Vector3(0.33, 2.02, 0),
  ]);
  const tube = new THREE.TubeGeometry(neck, 120, 0.05, 16, false);
  const tp = tube.attributes.position;
  // taper toward the tip
  const segs = 121, radial = 17;
  for (let i = 0; i < segs; i++) {
    const k = 1 - 0.75 * (i / (segs - 1)) ** 1.2;
    const c = neck.getPointAt(i / (segs - 1));
    for (let j = 0; j < radial; j++) {
      const idx = i * radial + j;
      tp.setXYZ(idx, c.x + (tp.getX(idx) - c.x) * k, c.y + (tp.getY(idx) - c.y) * k, c.z + (tp.getZ(idx) - c.z) * k);
    }
  }
  tube.computeVertexNormals();
  const tip = new THREE.Mesh(tube, materials.metal);
  const capB = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), materials.metal);
  capB.position.y = -1.8;
  group.add(handle, grip, capT, tip, capB);
  return group;
}
