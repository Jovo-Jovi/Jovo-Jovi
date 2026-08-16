import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

function byName(root, name) {
  const o = root.getObjectByName(name);
  if (!o) throw new Error(`GLB missing node "${name}"`);
  return o;
}

function byBone(root, name) {
  let bone, any;
  root.traverse((o) => {
    if (o.name !== name) return;
    if (!any) any = o;
    if (o.isBone && !bone) bone = o;
  });
  const o = bone || any;
  if (!o) throw new Error(`GLB missing node "${name}"`);
  return o;
}

function enableShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

if (!hasWebGL()) {
  document.getElementById('fb').style.display = 'flex';
} else {
  boot().catch((err) => {
    console.error(err);
    const tel = document.getElementById('tel');
    if (tel) tel.textContent = 'scene error — scroll for the page';
  });
}

async function boot() {
  const canvas = document.getElementById('gl');
  const stageEl = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080A);
  scene.fog = new THREE.FogExp2(0x07080A, 0.0085);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);

  const key = new THREE.DirectionalLight(0xFFF1DA, 2.3);
  key.position.set(-18, 30, 20);
  key.castShadow = true;
  key.shadow.mapSize.set(innerWidth < 820 ? 1024 : 2048, innerWidth < 820 ? 1024 : 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 120;
  key.shadow.camera.left = -46;
  key.shadow.camera.right = 46;
  key.shadow.camera.top = 46;
  key.shadow.camera.bottom = -46;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 3;
  scene.add(key);
  const keyT = new THREE.Object3D();
  scene.add(keyT);
  key.target = keyT;
  const rim = new THREE.DirectionalLight(0xC08A3E, 1.4);
  rim.position.set(24, 8, -20);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x7FA0CC, 0.55);
  fill.position.set(12, -10, 22);
  scene.add(fill);
  const amb = new THREE.AmbientLight(0x2A3340, 0.5);
  scene.add(amb);

  function noiseTex(size, rep) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const d = x.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = 150 + Math.random() * 80;
      d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v;
      d.data[i * 4 + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    return t;
  }
  const floorTex = noiseTex(256, 26);
  const glowTex = (function () {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.24, 'rgba(255,255,255,.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  function glow(color, size) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.85,
    }));
    sp.scale.setScalar(size);
    return sp;
  }
  const M = {
    bronze: new THREE.MeshStandardMaterial({ color: 0xC08A3E, metalness: 1, roughness: 0.46, envMapIntensity: 1.35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x6B747F, metalness: 1, roughness: 0.62, envMapIntensity: 1.05 }),
    cast: new THREE.MeshStandardMaterial({ color: 0x2B333C, metalness: 0.55, roughness: 0.95, envMapIntensity: 0.75 }),
    emitA: new THREE.MeshStandardMaterial({ color: 0x1A1206, emissive: 0xC08A3E, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.4 }),
    emitG: new THREE.MeshStandardMaterial({ color: 0x05130C, emissive: 0x4ED18B, emissiveIntensity: 1.4, metalness: 0.3, roughness: 0.4 }),
  };
  const box = (w, h, d, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const contactTex = (function () {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,.8)');
    g.addColorStop(0.45, 'rgba(0,0,0,.34)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  function contact(w, d, x, y, z, parent) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    (parent || scene).add(m);
    return m;
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      color: 0x0A0D11, roughness: 0.42, roughnessMap: floorTex, metalness: 0.55, envMapIntensity: 0.55,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -13;
  ground.receiveShadow = true;
  scene.add(ground);
  const dustGeo = new THREE.BufferGeometry();
  (function () {
    const N = 900, a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 150;
      a[i * 3 + 1] = -14 + Math.random() * 58;
      a[i * 3 + 2] = -80 + Math.random() * 112;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  })();
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xBFCDDD, size: 0.16, transparent: true, opacity: 0.45, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dust);
  const grid = new THREE.GridHelper(240, 80, 0x1E2731, 0x141A21);
  grid.position.y = -12.95;
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  scene.add(grid);

  /* act-0 caption is already in the DOM — never leave the first screen blank */
  const cap0 = document.querySelector('.cap[data-act="0"]');
  if (cap0) {
    cap0.style.opacity = '1';
    cap0.style.transform = 'translateY(0)';
  }
  const telEarly = document.getElementById('tel');
  if (telEarly) telEarly.textContent = 'loading studio…';

  /* paint the floor/grid immediately — do not wait on the 2K HDRI */
  camera.position.set(13, 0, 15);
  camera.lookAt(8.5, 0.5, 0);
  {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  renderer.render(scene, camera);
  canvas.classList.add('ready');

  /* HDRI first among assets — environment only, never as background */
  try {
    const env = await new RGBELoader().loadAsync('/assets/hdri/brown_photostudio_02_2k.hdr');
    env.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = env;
    renderer.render(scene, camera);
  } catch (err) {
    console.warn('HDRI failed', err);
  }

  const manager = new THREE.LoadingManager();
  const draco = new DRACOLoader(manager);
  draco.setDecoderPath('https://unpkg.com/three@0.160.1/examples/jsm/libs/draco/gltf/');
  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.setDRACOLoader(draco);

  const loaded = await Promise.allSettled([
    gltfLoader.loadAsync('/assets/models/gearbox.glb'),
    gltfLoader.loadAsync('/assets/models/ur5.glb'),
    gltfLoader.loadAsync('/assets/models/humanoid.glb'),
    gltfLoader.loadAsync('/assets/models/drone.glb'),
  ]);
  loaded.forEach((r, i) => { if (r.status === 'rejected') console.warn('GLB failed', i, r.reason); });
  const gearboxGltf = loaded[0].status === 'fulfilled' ? loaded[0].value : null;
  const ur5Gltf = loaded[1].status === 'fulfilled' ? loaded[1].value : null;
  const humanoidGltf = loaded[2].status === 'fulfilled' ? loaded[2].value : null;
  const droneGltf = loaded[3].status === 'fulfilled' ? loaded[3].value : null;

  /* ================= ACT 1 — GEARBOX ================= */
  let GBOX = null;
  try {
  if (!gearboxGltf) throw new Error('gearbox.glb missing');
  GBOX = (function () {
    const g = gearboxGltf.scene;
    g.position.set(0, 2, 0);
    enableShadows(g);
    scene.add(g);
    const ped = new THREE.Group();
    ped.position.set(0, -15, 0);
    g.add(ped);
    const pBase = box(26, 0.8, 12.4, M.cast); pBase.position.y = 0.4; ped.add(pBase);
    const pCol = box(19, 3.4, 8.6, M.cast); pCol.position.y = 2.4; ped.add(pCol);
    const pTop = box(28, 0.9, 11.6, M.cast); pTop.position.y = 4.35; ped.add(pTop);
    contact(46, 25, 0, 0.06, 0, ped);
    const MOD = 0.55;
    const SP = [
      { z: 12, parent: null, ang: 0, x: -11.0, y: 4.5, mesh: byName(g, 'spur_0') },
      { z: 22, parent: 0, ang: -50, mesh: byName(g, 'spur_1') },
      { z: 12, parent: 1, ang: 55, mesh: byName(g, 'spur_2') },
    ];
    SP.forEach((s) => {
      s.rP = MOD * s.z / 2;
      s.pa = 360 / s.z;
      if (s.parent !== null) {
        const p = SP[s.parent];
        s.ratio = -p.ratio * p.z / s.z;
        const near = p.phase + Math.round((s.ang - p.phase) / p.pa) * p.pa;
        s.phase = near + 180 - s.pa / 2;
      } else {
        s.phase = 0;
        s.ratio = 1;
      }
    });
    const bevA = byName(g, 'bevel_a');
    const bevB = byName(g, 'bevel_b');
    bevA.rotation.set(0, 0, 0);
    bevB.rotation.set(Math.PI / 2, 0, 0);
    const BPHASE = Math.PI / 16;
    function update(spin) {
      SP.forEach((s) => { s.mesh.rotation.z = s.phase * Math.PI / 180 + spin * s.ratio; });
      const bs = spin * 0.62;
      bevA.rotation.z = bs;
      bevB.rotation.z = -bs + BPHASE;
    }
    return { g, update };
  })();
  } catch (err) { console.warn('GBOX', err); GBOX = null; }

  /* ================= ACT 2 — SIX-AXIS ARM ================= */
  let ARM = null;
  try {
  if (!ur5Gltf) throw new Error('ur5.glb missing');
  ARM = (function () {
    const BASE = new THREE.Vector3(36, -13, 8), L1 = 9.2, L2 = 7.6;
    const root = new THREE.Group();
    root.position.copy(BASE);
    scene.add(root);
    contact(15, 15, 0, 0.06, 0, root);
    const model = ur5Gltf.scene;
    enableShadows(model);
    root.add(model);
    const yaw = byName(model, 'yaw');
    const sh = byName(model, 'sh');
    const el = byName(model, 'el');
    const wr = byName(model, 'wr');
    const roll = byName(model, 'roll');
    const palm = box(0.7, 1.5, 1.5, M.dark);
    palm.position.x = 0.5;
    roll.add(palm);
    const fA = box(2.1, 0.32, 0.5, M.dark), fB = box(2.1, 0.32, 0.5, M.dark);
    fA.position.set(1, 0.6, 0);
    fB.position.set(1, -0.6, 0);
    roll.add(fA, fB);
    const part = box(1.5, 1.5, 1.5, M.bronze);
    part.position.set(25.5, -12.2, 4.6);
    scene.add(part);
    const WAY = [[0, 37, -6, 11, 0], [0.16, 36, -2, 11, 0], [0.34, 26.5, -8, 5.4, 0], [0.44, 25.5, -11.2, 4.6, 0],
      [0.52, 25.5, -11.2, 4.6, 1], [0.66, 27, -5, 6, 1], [0.82, 38, -6, 2, 1], [0.9, 38, -10.6, 2, 1], [1, 38, -7, 2, 0]];
    const tv = new THREE.Vector3(), gw = new THREE.Vector3();
    function target(t) {
      for (let i = 0; i < WAY.length - 1; i++) if (t <= WAY[i + 1][0]) {
        const k = smooth(seg(t, WAY[i][0], WAY[i + 1][0]));
        tv.set(lerp(WAY[i][1], WAY[i + 1][1], k), lerp(WAY[i][2], WAY[i + 1][2], k), lerp(WAY[i][3], WAY[i + 1][3], k));
        return { v: tv, g: lerp(WAY[i][4], WAY[i + 1][4], k) };
      }
      const L = WAY[WAY.length - 1];
      tv.set(L[1], L[2], L[3]);
      return { v: tv, g: 0 };
    }
    function update(t) {
      const T = target(t), dx = T.v.x - BASE.x, dz = T.v.z - BASE.z;
      const ya = Math.atan2(-dz, dx);
      yaw.rotation.y = ya;
      let r = Math.hypot(dx, dz), y = T.v.y - (BASE.y + 2.9), d = Math.hypot(r, y);
      const dmax = L1 + L2 - 0.4, dmin = Math.abs(L1 - L2) + 1.4;
      if (d > dmax) { r *= dmax / d; y *= dmax / d; d = dmax; }
      if (d < dmin) { r *= dmin / d; y *= dmin / d; d = dmin; }
      const a2 = -Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
      const a1 = Math.atan2(y, r) - Math.atan2(L2 * Math.sin(a2), L1 + L2 * Math.cos(a2));
      sh.rotation.z = a1;
      el.rotation.z = a2;
      wr.rotation.z = -(a1 + a2);
      roll.rotation.x = t * 3;
      const o = lerp(0.62, 0.28, T.g);
      fA.position.y = o;
      fB.position.y = -o;
      palm.getWorldPosition(gw);
      if (T.g > 0.5) {
        part.position.copy(gw);
        part.position.x += 1.5 * Math.cos(ya);
        part.position.z -= 1.5 * Math.sin(ya);
      } else if (t > 0.9) part.position.set(38, -12.2, 2);
      return { a1: a1 * 57.3, a2: a2 * 57.3, yaw: ya * 57.3, g: T.g };
    }
    return { root, part, update };
  })();
  } catch (err) { console.warn('ARM', err); ARM = null; }

  /* ================= ACT 3 — HUMANOID ================= */
  let HUM = null;
  try {
  if (!humanoidGltf) throw new Error('humanoid.glb missing');
  HUM = (function () {
    const root = new THREE.Group();
    root.position.set(-30, -13, 4);
    root.rotation.y = 0.5;
    scene.add(root);
    const pelvis = new THREE.Group();
    pelvis.position.y = 8.55;
    root.add(pelvis);
    const model = humanoidGltf.scene;
    enableShadows(model);
    pelvis.add(model);
    ['PoleTarget.L', 'PoleTarget.R'].forEach((n) => {
      const o = model.getObjectByName(n);
      if (o) o.visible = false;
    });
    const boneRoot = byName(model, 'Bone');
    boneRoot.updateWorldMatrix(true, true);
    const bb = new THREE.Box3().setFromObject(boneRoot);
    const size = bb.getSize(new THREE.Vector3());
    if (Number.isFinite(size.y) && size.y > 0.001) model.scale.setScalar(14.2 / size.y);
    model.updateMatrixWorld(true);
    bb.setFromObject(boneRoot);
    if (Number.isFinite(bb.min.y)) model.position.y += -8.55 - bb.min.y;
    const torso = byBone(model, 'Torso');
    const head = byBone(model, 'Head');
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.002), M.emitA);
    visor.position.set(0, 0.002, 0.01);
    head.add(visor);
    const vglow = glow(0xC08A3E, 0.004);
    visor.add(vglow);
    const legL = { a: byBone(model, 'UpperLeg.L'), b: byBone(model, 'LowerLeg.L') };
    const legR = { a: byBone(model, 'UpperLeg.R'), b: byBone(model, 'LowerLeg.R') };
    const armL = { a: byBone(model, 'UpperArm.L'), b: byBone(model, 'LowerArm.L') };
    const armR = { a: byBone(model, 'UpperArm.R'), b: byBone(model, 'LowerArm.R') };
    contact(9, 9, 0, 0.06, 0, root);
    function update(t) {
      const wake = smooth(seg(t, 0, 0.28));
      const w = t * 7;
      root.position.z = 4 + seg(t, 0.3, 1) * 7;
      pelvis.position.y = 8.55 + Math.sin(w * 2) * 0.16 * wake;
      torso.rotation.y = Math.sin(w) * 0.12 * wake;
      head.rotation.y = Math.sin(w * 0.6) * 0.22;
      visor.material.emissiveIntensity = 0.5 + wake * 1.6 + Math.sin(t * 22) * 0.12;
      const sw = wake * 0.62;
      legL.a.rotation.x = Math.sin(w) * sw;
      legR.a.rotation.x = -Math.sin(w) * sw;
      legL.b.rotation.x = Math.max(0, -Math.sin(w)) * sw * 1.3;
      legR.b.rotation.x = Math.max(0, Math.sin(w)) * sw * 1.3;
      armL.a.rotation.x = -Math.sin(w) * sw * 0.8;
      armR.a.rotation.x = Math.sin(w) * sw * 0.8;
      armL.b.rotation.x = -0.35 - Math.abs(Math.sin(w)) * 0.3;
      armR.b.rotation.x = -0.35 - Math.abs(Math.cos(w)) * 0.3;
    }
    return { root, update };
  })();
  } catch (err) { console.warn('HUM', err); HUM = null; }

  /* ================= ACT 4 — DRONE ================= */
  let DRONE = null;
  try {
  if (!droneGltf) throw new Error('drone.glb missing');
  DRONE = (function () {
    const root = droneGltf.scene;
    enableShadows(root);
    scene.add(root);
    const rotors = [0, 1, 2, 3].map((i) => byName(root, `rotor_${i}`));
    const lensNode = byName(root, 'lens');
    let lens = lensNode;
    lensNode.traverse((o) => { if (o.isMesh) lens = o; });
    if (lens.isMesh) {
      lens.material = M.emitG.clone();
    }
    const PATH = [[-34, 12, 16], [-16, 18, 6], [2, 22, -4], [20, 17, -10], [30, 11, 4], [6, 15, 18]];
    const curve = new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.4);
    const pv = new THREE.Vector3(), nv = new THREE.Vector3();
    function update(t, dt) {
      const u = (t * 0.85) % 1;
      curve.getPointAt(u, pv);
      curve.getPointAt((u + 0.01) % 1, nv);
      root.position.copy(pv);
      root.lookAt(nv);
      root.rotateY(Math.PI / 2);
      root.rotation.z = clamp((nv.x - pv.x) * 0.28, -0.5, 0.5);
      rotors.forEach((r, i) => { r.rotation.y += dt * (i % 2 ? 58 : -58); });
      if (lens.material) lens.material.emissiveIntensity = 1.1 + Math.sin(t * 30) * 0.5;
    }
    return { root, update };
  })();
  } catch (err) { console.warn('DRONE', err); DRONE = null; }

  /* ================= ACT 5 — NEURAL NETWORK ================= */
  const NET = (function () {
    const root = new THREE.Group();
    root.position.set(0, 10, -32);
    scene.add(root);
    const LAY = [4, 7, 7, 3], SPX = 7, SPY = 2.9, SEGS = 9;
    const nodes = [], pos = [];
    LAY.forEach((n, li) => {
      const arr = [];
      for (let i = 0; i < n; i++) {
        const p = new THREE.Vector3((li - (LAY.length - 1) / 2) * SPX, (i - (n - 1) / 2) * SPY, 0);
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.52, 16, 12),
          new THREE.MeshStandardMaterial({ color: 0x0B1219, emissive: 0xC08A3E, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.3 }),
        );
        m.position.copy(p);
        m.scale.setScalar(0.001);
        root.add(m);
        arr.push({ m, p });
      }
      nodes.push(arr);
    });
    const edges = [];
    for (let li = 0; li < LAY.length - 1; li++) {
      nodes[li].forEach((a) => nodes[li + 1].forEach((b) => {
        edges.push({ a: a.p, b: b.p, w: Math.random() });
        for (let s = 0; s < SEGS; s++) {
          const t0 = s / SEGS, t1 = (s + 1) / SEGS;
          pos.push(lerp(a.p.x, b.p.x, t0), lerp(a.p.y, b.p.y, t0), 0, lerp(a.p.x, b.p.x, t1), lerp(a.p.y, b.p.y, t1), 0);
        }
      }));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const col = new Float32Array(pos.length);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    root.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })));
    function update(t, now) {
      nodes.forEach((lay, li) => lay.forEach((n, i) => {
        const k = smooth(seg(t, li * 0.09 + i * 0.012, li * 0.09 + i * 0.012 + 0.3));
        n.m.scale.setScalar(Math.max(0.001, k));
        n.m.material.emissiveIntensity = 0.2 + k * (0.35 + Math.sin(now * 0.004 + li * 2 + i) * 0.3);
      }));
      const grow = smooth(seg(t, 0.15, 0.9));
      let ci = 0;
      for (let e = 0; e < edges.length; e++) {
        const learn = lerp(0.16, edges[e].w > 0.62 ? 1 : 0.14, grow);
        const ph = (now * 0.00055 + e * 0.021) % 1.6;
        for (let s = 0; s < SEGS; s++) {
          const u = (s + 0.5) / SEGS;
          const pulse = Math.exp(-(((u - ph) * 4.6) ** 2)) * grow;
          const v = learn * 0.30 + pulse * 1.25;
          for (let k2 = 0; k2 < 2; k2++) {
            col[ci++] = v * 1.0;
            col[ci++] = v * 0.72;
            col[ci++] = v * 0.34;
          }
        }
      }
      geo.attributes.color.needsUpdate = true;
    }
    return { root, update };
  })();

  /* ================= ACT 6 — BACKEND CORE ================= */
  const BACK = (function () {
    const root = new THREE.Group();
    root.position.set(0, -2, -64);
    scene.add(root);
    const LAYERS = [
      { y: 11, w: 15, label: 'client · next.js 15', col: 0x6E8DB8 },
      { y: 6.5, w: 14, label: 'edge · vercel', col: 0x6E8DB8 },
      { y: 2, w: 13, label: 'server actions · zod', col: 0xC08A3E },
      { y: -2.5, w: 12, label: 'rls gate · default-deny', col: 0xFFB020 },
      { y: -7, w: 11, label: 'postgres · 43 tables', col: 0x4ED18B },
    ];
    const plates = LAYERS.map((L) => {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(L.w, 0.42, L.w * 0.62),
        new THREE.MeshStandardMaterial({ color: 0x0F161D, metalness: 0.6, roughness: 0.28, emissive: L.col, emissiveIntensity: 0.16, transparent: true, opacity: 0.9 }),
      );
      p.position.y = L.y;
      p.castShadow = true;
      p.receiveShadow = true;
      root.add(p);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(L.w * 0.52, 0.05, 8, 48),
        new THREE.MeshBasicMaterial({ color: L.col, transparent: true, opacity: 0.35 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = L.y;
      root.add(ring);
      return { p, ring, L };
    });
    const core = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(2.6, 2.6, 0.13, 26),
      new THREE.MeshStandardMaterial({ color: 0x8FA0B4, metalness: 1, roughness: 0.3, emissive: 0x0B2E1D, emissiveIntensity: 0.3 }),
      43,
    );
    core.castShadow = true;
    core.position.y = -12;
    root.add(core);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 43; i++) {
      dummy.position.set(0, i * 0.30, 0);
      dummy.rotation.y = i * 0.19;
      dummy.scale.set(1 - Math.abs(i - 21) / 70, 1, 1 - Math.abs(i - 21) / 70);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
    }
    core.instanceMatrix.needsUpdate = true;
    const pk = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), M.emitG.clone());
    pk.castShadow = true;
    root.add(pk);
    const pglow = glow(0x4ED18B, 5.5);
    pk.add(pglow);
    const halo = new THREE.PointLight(0x4ED18B, 2.2, 26);
    root.add(halo);
    const labels = LAYERS.map((L) => {
      const d = document.createElement('div');
      d.className = 'lbl';
      d.textContent = L.label;
      stageEl.appendChild(d);
      return d;
    });
    const wp = new THREE.Vector3();
    function update(t, now, cam) {
      plates.forEach((pl, i) => {
        const k = smooth(seg(t, i * 0.07, i * 0.07 + 0.34));
        pl.p.scale.set(Math.max(0.001, k), 1, Math.max(0.001, k));
        pl.ring.scale.setScalar(Math.max(0.001, k));
        pl.ring.rotation.z = now * 0.0004 * (i % 2 ? 1 : -1);
        pl.p.material.emissiveIntensity = 0.14 + k * 0.2;
      });
      core.scale.setScalar(Math.max(0.001, smooth(seg(t, 0.34, 0.72))));
      core.rotation.y = now * 0.00028;
      const u = (now * 0.00016) % 1;
      let y, denied = false;
      if (u < 0.62) y = lerp(13, -2.5, u / 0.62);
      else if (u < 0.74) { y = -2.5; denied = (Math.floor(now * 0.00016) % 3 === 0); }
      else y = denied ? lerp(-2.5, 6, seg(u, 0.74, 1)) : lerp(-2.5, -11, seg(u, 0.74, 1));
      pk.position.set(0, y, 0);
      pk.rotation.set(now * 0.002, now * 0.0016, 0);
      const c = denied ? 0xFF5A5A : 0x4ED18B;
      pk.material.emissive.setHex(c);
      halo.color.setHex(c);
      pglow.material.color.setHex(c);
      halo.position.set(0, y, 0);
      halo.intensity = 2.2 * smooth(seg(t, 0.1, 0.5));
      plates[3].p.material.emissive.setHex(denied ? 0xFF5A5A : 0xFFB020);
      plates.forEach((pl, i) => {
        pl.p.getWorldPosition(wp);
        wp.x += LAYERS[i].w * 0.62;
        wp.project(cam);
        const k = smooth(seg(t, i * 0.07, i * 0.07 + 0.34)), el = labels[i];
        if (k > 0.1 && wp.z < 1) {
          el.style.opacity = (k * 0.95).toFixed(2);
          el.style.left = ((wp.x * 0.5 + 0.5) * 100) + '%';
          el.style.top = ((-wp.y * 0.5 + 0.5) * 100) + '%';
        } else el.style.opacity = 0;
      });
      return denied;
    }
    function hide() { labels.forEach((l) => { l.style.opacity = 0; }); }
    return { root, update, hide };
  })();

  const ACTS = [
    { n: 'IDLE · GLASS GEARBOX', a: 0, b: 0.08, cam: [13, 0, 15], look: [8.5, 0.5, 0] },
    { n: 'ACT 1 · MECHANICS', a: 0.08, b: 0.22, cam: [4, 7, 40], look: [0, 2, 0] },
    { n: 'ACT 2 · ROBOTICS', a: 0.20, b: 0.36, cam: [54, 0, 32], look: [32, -6, 6] },
    { n: 'ACT 3 · HUMANOID', a: 0.36, b: 0.50, cam: [-48, 0, 28], look: [-29, -5, 8] },
    { n: 'ACT 4 · AUTONOMY', a: 0.50, b: 0.62, cam: [8, 20, 50], look: [0, 15, 0] },
    { n: 'ACT 5 · LEARNING', a: 0.62, b: 0.76, cam: [0, 10, -2], look: [0, 10, -32] },
    { n: 'ACT 6 · BACKEND', a: 0.76, b: 0.90, cam: [22, 3, -40], look: [0, -1, -64] },
    { n: 'ACT 7 · RESOLVE', a: 0.90, b: 1, cam: [16, 16, -30], look: [0, -3, -60] },
  ];
  const rail = document.getElementById('rail');
  ACTS.slice(1).forEach(() => rail.appendChild(document.createElement('i')));
  const dots = [...rail.children];
  const caps = [...document.querySelectorAll('.cap')];
  const hudAct = document.getElementById('hudAct'), tel = document.getElementById('tel'), track = document.getElementById('track');
  const cp = new THREE.Vector3(), cl = new THREE.Vector3();
  const ACC = [0xC08A3E, 0xC08A3E, 0x9FB6CE, 0xE0A85C, 0x6FD3E8, 0xB08CFF, 0x4ED18B, 0x4ED18B];
  const acc = new THREE.Color(), acc2 = new THREE.Color(), fogC = new THREE.Color();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let baseFog = 0x07080A;
  window.__scene3DTheme = function (isLight) {
    baseFog = isLight ? 0xE7E9ED : 0x07080A;
    ground.material.color.setHex(isLight ? 0xD5DAE0 : 0x0A0D11);
    ground.material.roughness = isLight ? 0.58 : 0.42;
    ground.material.envMapIntensity = isLight ? 0.8 : 0.55;
    grid.material.color.setHex(isLight ? 0xAFB7C1 : 0x1E2731);
    dust.material.color.setHex(isLight ? 0x7C8899 : 0xBFCDDD);
    dust.material.opacity = isLight ? 0.30 : 0.45;
    amb.color.setHex(isLight ? 0xC3D2E4 : 0x2A3340);
    amb.intensity = isLight ? 1.35 : 0.5;
    key.intensity = isLight ? 2.9 : 2.3;
    renderer.toneMappingExposure = isLight ? 1.22 : 1.06;
  };
  if (document.documentElement.dataset.theme === 'light') window.__scene3DTheme(true);

  let last = 0, spin = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const r = track.getBoundingClientRect();
    const reduced = document.body.classList.contains('reduced');
    if (!reduced && (r.bottom < 0 || r.top > innerHeight)) { BACK.hide(); return; }
    const p = reduced ? 0.30 : clamp(-r.top / (r.height - innerHeight), 0, 1);

    let i = 0;
    while (i < ACTS.length - 1 && p > ACTS[i].b) i++;
    const pv = ACTS[Math.max(0, i - 1)], cu = ACTS[i], k = smooth(seg(p, pv.b - 0.055, cu.b - 0.055));
    cp.set(lerp(pv.cam[0], cu.cam[0], k), lerp(pv.cam[1], cu.cam[1], k), lerp(pv.cam[2], cu.cam[2], k));
    cl.set(lerp(pv.look[0], cu.look[0], k), lerp(pv.look[1], cu.look[1], k), lerp(pv.look[2], cu.look[2], k));
    camera.position.set(cp.x + (reduced ? 0 : Math.sin(now * 0.00035) * 0.5), cp.y + (reduced ? 0 : Math.cos(now * 0.00029) * 0.35), cp.z);
    camera.lookAt(cl);

    keyT.position.copy(cl);
    key.position.set(cl.x - 20, cl.y + 32, cl.z + 22);

    acc.setHex(ACC[Math.max(0, i - 1)]);
    acc2.setHex(ACC[i]);
    acc.lerp(acc2, k);
    rim.color.copy(acc);
    fogC.setHex(baseFog).lerp(acc, 0.09);
    scene.fog.color.copy(fogC);
    scene.background.copy(fogC);
    dust.rotation.y += dt * 0.01;

    grid.material.opacity = (0.16 + smooth(seg(p, 0, 0.12)) * 0.26) * (1 - seg(p, 0.60, 0.80));

    const gs = 1 - smooth(seg(p, 0.30, 0.345));
    if (GBOX) {
      GBOX.g.visible = gs > 0.01;
      if (GBOX.g.visible) {
        spin += dt * (smooth(seg(p, 0.03, 0.22)) * 3.2 + 0.25);
        GBOX.update(spin);
        GBOX.g.scale.setScalar(gs);
      }
    }

    const aOn = p > 0.15 && p < 0.42;
    let st = { a1: 0, a2: 0, yaw: 0, g: 0 };
    if (ARM) {
      ARM.root.visible = ARM.part.visible = aOn;
      if (aOn) {
        ARM.root.scale.setScalar(Math.max(0.001, smooth(seg(p, 0.16, 0.24))));
        st = ARM.update(clamp(seg(p, 0.19, 0.38), 0, 1));
      }
    }

    const hOn = p > 0.31 && p < 0.56;
    if (HUM) {
      HUM.root.visible = hOn;
      if (hOn) {
        HUM.root.scale.setScalar(Math.max(0.001, smooth(seg(p, 0.32, 0.40))));
        HUM.update(clamp(seg(p, 0.34, 0.52), 0, 1));
      }
    }

    const dOn = p > 0.45 && p < 0.68;
    if (DRONE) {
      DRONE.root.visible = dOn;
      if (dOn) {
        DRONE.root.scale.setScalar(Math.max(0.001, smooth(seg(p, 0.46, 0.53))));
        DRONE.update(clamp(seg(p, 0.47, 0.66), 0, 1), dt);
      }
    }

    const nOn = p > 0.57 && p < 0.82;
    NET.root.visible = nOn;
    if (nOn) NET.update(clamp(seg(p, 0.58, 0.80), 0, 1), now);

    const bOn = p > 0.70;
    BACK.root.visible = bOn;
    let denied = false;
    if (bOn) denied = BACK.update(clamp(seg(p, 0.72, 0.94), 0, 1), now, camera);
    else BACK.hide();

    if (!reduced) caps.forEach((el) => {
      const A = ACTS[+el.dataset.act];
      if (!A) return;
      const inK = A.a === 0 ? 1 : smooth(seg(p, A.a, A.a + 0.04));
      const outK = smooth(seg(p, A.b - 0.032, A.b));
      el.style.opacity = (inK * (1 - outK)).toFixed(3);
      el.style.transform = `translateY(${((1 - inK) * 24 + outK * -20).toFixed(1)}px)`;
    });

    hudAct.textContent = ACTS[i].n;
    dots.forEach((d, j) => d.classList.toggle('on', j === Math.max(0, i - 1)));
    tel.textContent = p < 0.45
      ? `θ_yaw ${st.yaw.toFixed(0)}° · θ₁ ${st.a1.toFixed(0)}° · θ₂ ${st.a2.toFixed(0)}° · grip ${(st.g * 100).toFixed(0)}%`
      : p < 0.72
        ? `alt ${((DRONE ? DRONE.root.position.y : 0) + 13).toFixed(1)} m · layers 4 · nodes 21 · epoch ${(p * 100).toFixed(0)}`
        : `${denied ? '403 · rls denied' : '200 · rls allow'} · tables 43 · roles 4 · p ${p.toFixed(3)}`;

    renderer.render(scene, camera);
  }
  canvas.classList.add('ready');
  requestAnimationFrame(frame);
}
