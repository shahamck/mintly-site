// Renders the 3D pieces once to WebP stills so the live site ships no WebGL.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { alignerGeometry, toothGeometry, explorer } from '../src/three/geo.js';

function shot(w, h, build, { bg, fov = 26, cam = [0, 0, 9], q = 0.86 } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !bg, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
  camera.position.set(...cam);
  camera.lookAt(0, 0, 0);
  build(scene);
  renderer.render(scene, camera);
  if (!bg) { const url = canvas.toDataURL('image/webp', q); renderer.dispose(); return url; }
  // difference matte: render on black and on white, recover colour + alpha so glass stays see-through
  const grab = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(canvas, 0, 0); return x.getImageData(0, 0, w, h); };
  scene.background = new THREE.Color('#000000'); renderer.render(scene, camera); const black = grab();
  scene.background = new THREE.Color('#ffffff'); renderer.render(scene, camera); const white = grab();
  renderer.dispose();
  const o = new ImageData(w, h), b = black.data, wh = white.data, d = o.data;
  for (let i = 0; i < d.length; i += 4) {
    const diff = ((wh[i] - b[i]) + (wh[i + 1] - b[i + 1]) + (wh[i + 2] - b[i + 2])) / 3;
    const a = Math.min(255, Math.max(0, 255 - diff));
    d[i + 3] = a;
    if (a > 0) for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, (b[i + k] * 255) / a);
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(o, 0, 0);
  return c.toDataURL('image/webp', q);
}

const out = {};
out.aligner = shot(2000, 1300, (scene) => {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.2, transmission: 0.92, thickness: 0.9, ior: 1.42,
    attenuationColor: new THREE.Color('#cfdde4'), attenuationDistance: 1.6, clearcoat: 1, clearcoatRoughness: 0.12,
    envMapIntensity: 1.25, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(alignerGeometry(), mat);
  m.rotation.set(0.42, -0.55, 0.1);
  const key = new THREE.DirectionalLight('#fff', 1.4); key.position.set(3, 6, 4);
  scene.add(m, key, new THREE.AmbientLight('#fff', 0.4));
}, { bg: 'matte', fov: 28, cam: [0, 4.6, 9.5], q: 0.85 });

out.tooth = shot(760, 760, (scene) => {
  const m = new THREE.Mesh(toothGeometry(), new THREE.MeshPhysicalMaterial({
    color: '#fbfbf9', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.4, sheenColor: new THREE.Color('#e6efff'),
  }));
  m.scale.setScalar(1.25);
  m.rotation.set(0.25, 0.4, -0.12);
  const key = new THREE.DirectionalLight('#fff', 1.6); key.position.set(-3, 4, 5);
  scene.add(m, key);
});

out.tool = shot(760, 760, (scene) => {
  const tool = explorer({
    metal: new THREE.MeshStandardMaterial({ color: '#dfe3e6', metalness: 1, roughness: 0.22 }),
    grip: new THREE.MeshStandardMaterial({ color: '#7f8a90', metalness: 0.6, roughness: 0.45 }),
  });
  tool.scale.setScalar(1.05);
  tool.position.y = -0.2;
  tool.rotation.set(0.15, 0.3, -0.75);
  const key = new THREE.DirectionalLight('#fff', 1.6); key.position.set(-3, 4, 5);
  scene.add(tool, key);
});
window.__out = out;
