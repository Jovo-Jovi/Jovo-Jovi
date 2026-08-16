import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

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
const canvas=document.getElementById('gl'), stageEl=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.06;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07080A);
scene.fog=new THREE.FogExp2(0x07080A,0.0085);
const camera=new THREE.PerspectiveCamera(38,1,0.1,500);

const key=new THREE.DirectionalLight(0xFFF1DA,2.3);
key.position.set(-18,30,20); key.castShadow=true;
key.shadow.mapSize.set(innerWidth<820?1024:2048,innerWidth<820?1024:2048);
key.shadow.camera.near=1; key.shadow.camera.far=120;
key.shadow.camera.left=-46; key.shadow.camera.right=46;
key.shadow.camera.top=46; key.shadow.camera.bottom=-46;
key.shadow.bias=-0.0006; key.shadow.radius=3; scene.add(key);
const keyT=new THREE.Object3D(); scene.add(keyT); key.target=keyT;
const rim=new THREE.DirectionalLight(0xC08A3E,1.4); rim.position.set(24,8,-20); scene.add(rim);
const fill=new THREE.DirectionalLight(0x7FA0CC,0.55); fill.position.set(12,-10,22); scene.add(fill);
const amb=new THREE.AmbientLight(0x2A3340,0.5); scene.add(amb);

function noiseTex(size,rep){
  const c=document.createElement('canvas'); c.width=c.height=size;
  const x=c.getContext('2d'), d=x.createImageData(size,size);
  for(let i=0;i<size*size;i++){const v=150+Math.random()*80;
    d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v; d.data[i*4+3]=255;}
  x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep); return t;
}
const microTex=noiseTex(128,7), floorTex=noiseTex(256,26);
function brushTex(size,rp){
  const c=document.createElement('canvas'); c.width=c.height=size;
  const x=c.getContext('2d'); x.fillStyle='#8f8f8f'; x.fillRect(0,0,size,size);
  for(let i=0;i<size*9;i++){
    const y=Math.random()*size, l=18+Math.random()*size*0.75, v=100+Math.random()*115;
    x.strokeStyle='rgba('+v+','+v+','+v+',0.15)'; x.lineWidth=Math.random()*1.7+0.25;
    x.beginPath(); x.moveTo(Math.random()*size-l/2,y);
    x.lineTo(Math.random()*size+l/2,y+(Math.random()-0.5)*1.1); x.stroke();
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rp,rp); return t;
}
const brushed=brushTex(256,4);
const glowTex=(function(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d'), g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.24,'rgba(255,255,255,.5)');
  g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
})();
function glow(color,size){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,
    blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.85}));
  sp.scale.setScalar(size); return sp;
}
const M={
  steel : new THREE.MeshStandardMaterial({color:0xAEB7C2,metalness:1,roughness:0.40,roughnessMap:microTex,envMapIntensity:1.3}),
  bronze: new THREE.MeshStandardMaterial({color:0xC08A3E,metalness:1,roughness:0.46,roughnessMap:microTex,envMapIntensity:1.35}),
  dark  : new THREE.MeshStandardMaterial({color:0x6B747F,metalness:1,roughness:0.62,roughnessMap:microTex,envMapIntensity:1.05}),
  cast  : new THREE.MeshStandardMaterial({color:0x2B333C,metalness:0.55,roughness:0.95,roughnessMap:microTex,envMapIntensity:0.75}),
  brush : new THREE.MeshStandardMaterial({color:0x9AA4B0,metalness:1,roughness:0.38,roughnessMap:brushed,envMapIntensity:1.35}),
  shell : new THREE.MeshPhysicalMaterial({color:0xD8DDE3,metalness:0.05,roughness:0.34,
            clearcoat:1,clearcoatRoughness:0.08,envMapIntensity:1.1}),
  shellD: new THREE.MeshPhysicalMaterial({color:0x1C2128,metalness:0.1,roughness:0.42,
            clearcoat:1,clearcoatRoughness:0.14,envMapIntensity:0.95}),
  rubber: new THREE.MeshStandardMaterial({color:0x14171B,metalness:0,roughness:0.94,roughnessMap:microTex}),
  pane  : new THREE.MeshPhysicalMaterial({color:0xC2D8E8,metalness:0,roughness:0.04,
            transparent:true,opacity:0.15,clearcoat:1,clearcoatRoughness:0.02,
            side:THREE.DoubleSide,depthWrite:false,envMapIntensity:2.1}),
  oil   : new THREE.MeshPhysicalMaterial({color:0xC08A3E,metalness:0,roughness:0.10,
            transparent:true,opacity:0.30,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.3}),
  glass : new THREE.MeshStandardMaterial({color:0x9FC6E6,metalness:0.1,roughness:0.12,transparent:true,opacity:0.22,side:THREE.DoubleSide}),
  emitA : new THREE.MeshStandardMaterial({color:0x1A1206,emissive:0xC08A3E,emissiveIntensity:1.5,metalness:0.3,roughness:0.4}),
  emitG : new THREE.MeshStandardMaterial({color:0x05130C,emissive:0x4ED18B,emissiveIntensity:1.4,metalness:0.3,roughness:0.4})
};
/* Real objects have no perfectly sharp edges. A chamfer that catches a highlight is
   the single strongest realism cue available, so every box and cylinder gets one. */
const _gc={};
function rboxGeom(w,h,d){
  const k=w.toFixed(3)+'|'+h.toFixed(3)+'|'+d.toFixed(3);
  if(_gc[k]) return _gc[k];
  const b=Math.min(d*0.3,Math.min(w,h)*0.09,0.13);
  const bw=Math.max(w-2*b,0.012), bh=Math.max(h-2*b,0.012);
  const r=Math.min(bw,bh)*0.17, x=-bw/2, y=-bh/2;
  const sh=new THREE.Shape();
  sh.moveTo(x+r,y);
  sh.lineTo(x+bw-r,y); sh.quadraticCurveTo(x+bw,y,x+bw,y+r);
  sh.lineTo(x+bw,y+bh-r); sh.quadraticCurveTo(x+bw,y+bh,x+bw-r,y+bh);
  sh.lineTo(x+r,y+bh); sh.quadraticCurveTo(x,y+bh,x,y+bh-r);
  sh.lineTo(x,y+r); sh.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(sh,{depth:Math.max(d-2*b,0.002),bevelEnabled:true,
    bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:5,steps:1});
  g.translate(0,0,b-d/2); g.computeVertexNormals();
  _gc[k]=g; return g;
}
function cylGeom(rt,rb,h,s){
  const k='c'+rt.toFixed(3)+'|'+rb.toFixed(3)+'|'+h.toFixed(3)+'|'+s;
  if(_gc[k]) return _gc[k];
  const c=Math.min(h*0.14,Math.min(rt,rb)*0.16,0.14);
  const g=new THREE.LatheGeometry([
    new THREE.Vector2(0.001,-h/2), new THREE.Vector2(rb-c,-h/2), new THREE.Vector2(rb,-h/2+c),
    new THREE.Vector2(rt,h/2-c),   new THREE.Vector2(rt-c,h/2),  new THREE.Vector2(0.001,h/2)
  ],Math.max(s,26));
  g.computeVertexNormals(); _gc[k]=g; return g;
}
const box=(w,h,d,mat)=>{const m=new THREE.Mesh(rboxGeom(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m;};
const cyl=(rt,rb,h,s,mat)=>{const m=new THREE.Mesh(cylGeom(rt,rb,h,s),mat);m.castShadow=true;m.receiveShadow=true;return m;};
/* contact shadows: objects that don't darken the floor beneath them always read as pasted on */
const contactTex=(function(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d'), g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(0,0,0,.8)'); g.addColorStop(.45,'rgba(0,0,0,.34)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c);
})();
function contact(w,d,x,y,z,parent){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,y,z); (parent||scene).add(m); return m;
}

/* ---------- ground ---------- */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),
  new THREE.MeshStandardMaterial({color:0x0A0D11,roughness:0.42,roughnessMap:floorTex,
    metalness:0.55,envMapIntensity:0.55}));
ground.rotation.x=-Math.PI/2; ground.position.y=-13; ground.receiveShadow=true; scene.add(ground);
const dustGeo=new THREE.BufferGeometry();
(function(){const N=900,a=new Float32Array(N*3);
  for(let i=0;i<N;i++){a[i*3]=(Math.random()-.5)*150;a[i*3+1]=-14+Math.random()*58;a[i*3+2]=-80+Math.random()*112;}
  dustGeo.setAttribute('position',new THREE.BufferAttribute(a,3));})();
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xBFCDDD,size:0.16,
  transparent:true,opacity:.45,depthWrite:false,sizeAttenuation:true}));
scene.add(dust);
const grid=new THREE.GridHelper(240,80,0x1E2731,0x141A21);
grid.position.y=-12.95; grid.material.transparent=true; grid.material.opacity=0; scene.add(grid);

  const cap0=document.querySelector('.cap[data-act="0"]');
  if(cap0){ cap0.style.opacity='1'; cap0.style.transform='translateY(0)'; }
  camera.position.set(13,0,15);
  camera.lookAt(8.5,0.5,0);


/* ================= GEAR GEOMETRY ================= */
const MOD=0.55;
function gearGeom(z,depth,taper){
  const rP=MOD*z/2, rT=rP+MOD, rR=rP-1.25*MOD, rB=rP-0.16*MOD, pa=Math.PI*2/z;
  const sh=new THREE.Shape(); const P=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
  for(let k=0;k<z;k++){
    const a=k*pa, p0=P(rR,a+pa*.05), c1=P(rB,a+pa*.14), p1=P(rT,a+pa*.29),
          p2=P(rT,a+pa*.52), c2=P(rB,a+pa*.67), p3=P(rR,a+pa*.76);
    if(k===0) sh.moveTo(p0[0],p0[1]); else sh.lineTo(p0[0],p0[1]);
    sh.quadraticCurveTo(c1[0],c1[1],p1[0],p1[1]);
    sh.absarc(0,0,rT,a+pa*.29,a+pa*.52,false);
    sh.quadraticCurveTo(c2[0],c2[1],p3[0],p3[1]);
    sh.absarc(0,0,rR,a+pa*.76,a+pa*1.05,false);
  }
  sh.closePath();
  const bore=new THREE.Path(); bore.absarc(0,0,rP*0.18,0,Math.PI*2,true); sh.holes.push(bore);
  if(!taper){
    const nb=z>=26?8:6, rr=rP*0.58;
    for(let i=0;i<nb;i++){const a=i*Math.PI*2/nb; const h=new THREE.Path();
      h.absarc(rr*Math.cos(a),rr*Math.sin(a),rP*0.082,0,Math.PI*2,true); sh.holes.push(h);}
  }
  const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelThickness:MOD*.18,
    bevelSize:MOD*.16,bevelSegments:4,curveSegments:8,steps:1});
  g.translate(0,0,-depth/2);
  if(taper){
    const pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){
      const t=(pos.getZ(i)+depth/2)/depth, s=lerp(1,taper,clamp(t,0,1));
      pos.setX(i,pos.getX(i)*s); pos.setY(i,pos.getY(i)*s);
    }
  }
  g.computeVertexNormals(); return g;
}

/* ================= ACT 1 — GEARBOX ================= */
const GBOX=(function(){
  const g=new THREE.Group(); g.position.set(0,2,0); scene.add(g);
  const maxAniso=renderer.capabilities.getMaxAnisotropy();

  function scratchTex(size,rep,pits){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d');
    x.fillStyle='#7a7a7a'; x.fillRect(0,0,size,size);
    for(let i=0;i<size*16;i++){
      const y=Math.random()*size, v=70+Math.random()*110;
      x.strokeStyle='rgba('+v+','+v+','+v+','+(0.1+Math.random()*0.28)+')';
      x.lineWidth=Math.random()*1.6+0.2;
      x.beginPath(); x.moveTo(Math.random()*size,y);
      x.lineTo(Math.random()*size,y+(Math.random()-0.5)*1.8); x.stroke();
    }
    if(pits){
      for(let i=0;i<120;i++){
        const v=40+Math.random()*50;
        x.fillStyle='rgba('+v+','+v+','+v+','+(0.15+Math.random()*0.3)+')';
        x.beginPath(); x.arc(Math.random()*size,Math.random()*size,Math.random()*2.4+0.4,0,Math.PI*2); x.fill();
      }
    }
    const t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep);
    t.anisotropy=maxAniso; t.colorSpace=THREE.NoColorSpace;
    return t;
  }
  const steelMap=scratchTex(512,4,false);
  const bronzeMap=scratchTex(512,3.2,true);
  const castMap=scratchTex(256,8,true);

  const G={
    steel: new THREE.MeshPhysicalMaterial({color:0xC9D0D8,metalness:1,roughness:0.28,roughnessMap:steelMap,
      envMapIntensity:1.85,clearcoat:0.35,clearcoatRoughness:0.22,bumpMap:steelMap,bumpScale:0.012}),
    bronze: new THREE.MeshPhysicalMaterial({color:0xC9963A,metalness:1,roughness:0.34,roughnessMap:bronzeMap,
      envMapIntensity:1.9,clearcoat:0.22,clearcoatRoughness:0.3,bumpMap:bronzeMap,bumpScale:0.016}),
    dark: new THREE.MeshPhysicalMaterial({color:0x5C6570,metalness:1,roughness:0.48,roughnessMap:steelMap,
      envMapIntensity:1.35,clearcoat:0.12,clearcoatRoughness:0.4,bumpMap:steelMap,bumpScale:0.01}),
    cast: new THREE.MeshPhysicalMaterial({color:0x2A313A,metalness:0.62,roughness:0.78,roughnessMap:castMap,
      envMapIntensity:0.95,clearcoat:0.06,clearcoatRoughness:0.7,bumpMap:castMap,bumpScale:0.035}),
    brush: new THREE.MeshPhysicalMaterial({color:0xA7B1BC,metalness:1,roughness:0.32,roughnessMap:brushed,
      envMapIntensity:1.7,clearcoat:0.28,clearcoatRoughness:0.18,bumpMap:brushed,bumpScale:0.008}),
    glass: new THREE.MeshPhysicalMaterial({color:0xEEF6FF,metalness:0,roughness:0.025,transmission:0.94,
      thickness:0.45,ior:1.5,envMapIntensity:2.4,clearcoat:1,clearcoatRoughness:0.03,
      transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide}),
    oil: new THREE.MeshPhysicalMaterial({color:0xC48A22,metalness:0,roughness:0.08,transmission:0.7,
      thickness:4.2,ior:1.47,attenuationColor:0xB87414,attenuationDistance:3.2,
      envMapIntensity:2.0,clearcoat:0.55,clearcoatRoughness:0.12,
      transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide})
  };

  function hexBolt(r,h,mat){
    const sh=new THREE.Shape();
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3-Math.PI/6, x=r*Math.cos(a), y=r*Math.sin(a);
      if(i===0) sh.moveTo(x,y); else sh.lineTo(x,y);
    }
    sh.closePath();
    const geom=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:true,bevelThickness:r*0.1,bevelSize:r*0.08,bevelSegments:1});
    geom.translate(0,0,-h/2); geom.computeVertexNormals();
    const m=new THREE.Mesh(geom,mat); m.castShadow=true; m.receiveShadow=true; return m;
  }

  const W=30, H=20, D=11, FR=1.25;

  /* heavy back casting — gives the card's solid-box read without trapping the key light */
  const back=box(W-0.2,H-0.2,0.85,G.cast); back.position.z=-D/2+0.12; g.add(back);
  const backRib=box(W-6,0.55,0.4,G.dark); backRib.position.set(0,0,-D/2+0.55); g.add(backRib);

  const bar=(w,h,d,x,y,z,mat)=>{const m=box(w,h,d,mat||G.brush);m.position.set(x,y,z);g.add(m);};
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sy,sz])=>bar(W,FR,FR,0,sy*H/2,sz*D/2,G.brush));
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sz])=>bar(FR,H,FR,sx*W/2,0,sz*D/2,G.brush));
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>bar(FR,FR,D,sx*W/2,sy*H/2,0,G.brush));
  [-1,1].forEach(sx=>[-1,1].forEach(sy=>[-1,1].forEach(sz=>{
    const c=box(1.55,1.55,1.55,G.cast); c.position.set(sx*W/2,sy*H/2,sz*D/2); g.add(c);
  })));

  const pane=(w,h,d,x,y,z)=>{
    const m=new THREE.Mesh(rboxGeom(w,h,d),G.glass);
    m.position.set(x,y,z); m.castShadow=false; m.receiveShadow=false; m.renderOrder=2; g.add(m);
  };
  pane(W-FR*1.15,H-FR*1.15,0.22, 0,0, D/2-0.18);
  pane(W-FR*1.15,H-FR*1.15,0.22, 0,0,-D/2+0.55);
  pane(0.22,H-FR*1.15,D-FR, -W/2+0.18,0,0);
  pane(0.22,H-FR*1.15,D-FR,  W/2-0.18,0,0);
  pane(W-FR*1.15,0.22,D-FR, 0, H/2-0.18,0);

  const sump=box(W-FR,1.35,D-FR,G.cast); sump.position.y=-H/2+0.68; g.add(sump);
  const oil=new THREE.Mesh(rboxGeom(W-FR-0.7,5.4,D-FR-0.7),G.oil);
  oil.position.y=-H/2+3.55; oil.castShadow=false; oil.renderOrder=1; g.add(oil);
  for(let i=0;i<13;i++){
    const f=box(0.95,1.55,D+0.7,G.cast); f.position.set(-W/2+2.6+i*2.1,-H/2-0.7,0); g.add(f);
  }

  for(let i=0;i<9;i++){
    const px=-W/2+2.6+i*((W-5.2)/8);
    [-1,1].forEach(sy=>{
      const b=hexBolt(0.32,0.38,G.dark);
      b.rotation.x=Math.PI/2; b.position.set(px,sy*H/2,D/2+0.28); g.add(b);
    });
  }
  const plate=box(5.1,1.7,0.16,G.brush); plate.position.set(W/2-5.0,-H/2-0.02,D/2+0.36); g.add(plate);
  for(let i=0;i<3;i++){
    const l=box(3.4-(i%2)*1.15,0.12,0.05,G.dark);
    l.position.set(W/2-5.25+(i%2)*0.5,-H/2+0.42-i*0.42,D/2+0.46); g.add(l);
  }
  const fillCap=cyl(0.55,0.55,0.5,16,G.bronze); fillCap.position.set(-W/2+3.2,H/2+0.15,0); g.add(fillCap);
  const drain=cyl(0.38,0.38,0.42,12,G.dark); drain.rotation.x=Math.PI/2;
  drain.position.set(W/2-2.4,-H/2+0.2,D/2+0.15); g.add(drain);

  const ped=new THREE.Group(); ped.position.set(0,-15,0); g.add(ped);
  const pBase=box(W-3.2,0.95,D+1.8,G.cast); pBase.position.y=0.48; ped.add(pBase);
  const pCol=box(W-10,3.5,D-2.0,G.cast); pCol.position.y=2.45; ped.add(pCol);
  const pTop=box(W-1.6,1.05,D+0.8,G.cast); pTop.position.y=4.4; ped.add(pTop);
  for(let i=0;i<6;i++){
    const b=hexBolt(0.36,0.42,G.dark);
    b.position.set(-W/2+3+i*((W-6)/5),4.95,D/2-1.0); ped.add(b);
    const b2=hexBolt(0.36,0.42,G.dark);
    b2.position.set(-W/2+3+i*((W-6)/5),4.95,-D/2+1.0); ped.add(b2);
  }
  contact(W+16,D+14,0,0.06,0,ped);

  const fill=new THREE.PointLight(0xFFE2B0,1.35,32,2); fill.position.set(2,2,4.5); g.add(fill);
  const area=new THREE.RectAreaLight(0xFFF4E0,7.5,16,5.5);
  area.position.set(4,7,13); g.add(area); area.lookAt(0,0,0);

  const SPZ=1.5;
  const SP=[{z:12,mat:'steel', d:1.55,parent:null,ang:0,  x:-11.0,y:4.5},
            {z:22,mat:'bronze',d:1.7,parent:0,   ang:-50},
            {z:12,mat:'dark',  d:1.45,parent:1,   ang:55}];
  SP.forEach(s=>{
    s.rP=MOD*s.z/2; s.pa=360/s.z;
    if(s.parent!==null){
      const p=SP[s.parent], th=s.ang*Math.PI/180, dist=p.rP+s.rP;
      s.x=p.x+dist*Math.cos(th); s.y=p.y+dist*Math.sin(th);
      const near=p.phase+Math.round((s.ang-p.phase)/p.pa)*p.pa;
      s.phase=near+180-s.pa/2; s.ratio=-p.ratio*p.z/s.z;
    } else { s.phase=0; s.ratio=1; }
    const m=new THREE.Mesh(gearGeom(s.z,s.d),G[s.mat]);
    m.position.set(s.x,s.y,SPZ); m.castShadow=m.receiveShadow=true; g.add(m);
    const hub=cyl(s.rP*0.34,s.rP*0.34,s.d+0.28,20,G.dark);
    hub.rotation.x=Math.PI/2; m.add(hub);
    const sf=cyl(s.rP*0.18,s.rP*0.18,D-1.2,16,G.dark);
    sf.rotation.x=Math.PI/2; sf.position.set(s.x,s.y,SPZ-1.15); g.add(sf);
    s.mesh=m;
  });

  const BZ=16, BR=MOD*BZ/2, BD=1.45, BT=(BR-BD)/BR, APEXOFF=BR-BD/2;
  const AP={x:8.5,y:-1.5,z:0.5};
  const bevA=new THREE.Mesh(gearGeom(BZ,BD,BT),G.steel);
  bevA.position.set(AP.x,AP.y,AP.z-APEXOFF);
  bevA.castShadow=bevA.receiveShadow=true; g.add(bevA);
  const bevB=new THREE.Mesh(gearGeom(BZ,BD,BT),G.bronze);
  bevB.position.set(AP.x,AP.y+APEXOFF,AP.z);
  bevB.rotation.x=Math.PI/2;
  bevB.castShadow=bevB.receiveShadow=true; g.add(bevB);
  const BPHASE=Math.PI/BZ;

  const inShaft=cyl(0.58,0.58,7.2,18,G.dark); inShaft.rotation.x=Math.PI/2;
  inShaft.position.set(AP.x,AP.y,AP.z-APEXOFF-2.2); g.add(inShaft);
  const outShaft=cyl(0.58,0.58,9.2,18,G.dark);
  outShaft.position.set(AP.x,AP.y+APEXOFF+3.6,AP.z); g.add(outShaft);
  const bossZ=cyl(1.25,1.25,1.05,20,G.cast); bossZ.rotation.x=Math.PI/2;
  bossZ.position.set(AP.x,AP.y,-D/2+0.35); g.add(bossZ);
  const bossY=cyl(1.25,1.25,1.05,20,G.cast);
  bossY.position.set(AP.x,H/2-0.2,AP.z); g.add(bossY);

  function update(spin){
    SP.forEach(s=>{ s.mesh.rotation.z=s.phase*Math.PI/180+spin*s.ratio; });
    const bs=spin*0.62;
    bevA.rotation.z=bs;
    bevB.rotation.z=-bs+BPHASE;
  }
  return {g,update};
})();

/* ================= ACT 2 — SIX-AXIS ARM ================= */
const ARM=(function(){
  const BASE=new THREE.Vector3(36,-13,8), L1=9.2, L2=7.6;
  const root=new THREE.Group(); root.position.copy(BASE); scene.add(root);
  const plinth=cyl(2.5,3.2,1.5,32,M.dark); plinth.position.y=.75; root.add(plinth);
  const armBase=box(7.6,0.5,7.6,M.cast); armBase.position.y=0.25; root.add(armBase);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+Math.PI/4, bl=cyl(0.3,0.3,0.4,12,M.dark);
    bl.position.set(Math.cos(a)*3.0,0.55,Math.sin(a)*3.0); root.add(bl);
  }
  contact(15,15,0,0.06,0,root);
  const yaw=new THREE.Group(); yaw.position.y=1.5; root.add(yaw);
  const shH=cyl(1.5,1.5,2.6,24,M.bronze); shH.rotation.x=Math.PI/2; shH.position.y=1.4; yaw.add(shH);
  const sh=new THREE.Group(); sh.position.y=1.4; yaw.add(sh);
  const upper=box(L1,1.9,1.5,M.steel); upper.position.x=L1/2; sh.add(upper);
  const rib=box(L1*.7,.5,1.9,M.dark); rib.position.set(L1/2,.9,0); sh.add(rib);
  const el=new THREE.Group(); el.position.x=L1; sh.add(el);
  const elH=cyl(1.1,1.1,2,20,M.bronze); elH.rotation.x=Math.PI/2; el.add(elH);
  const fore=box(L2,1.4,1.1,M.steel); fore.position.x=L2/2; el.add(fore);
  const wr=new THREE.Group(); wr.position.x=L2; el.add(wr);
  const wrH=cyl(.75,.75,1.4,18,M.dark); wrH.rotation.x=Math.PI/2; wr.add(wrH);
  const roll=new THREE.Group(); wr.add(roll);
  const palm=box(.7,1.5,1.5,M.dark); palm.position.x=.5; roll.add(palm);
  const fA=box(2.1,.32,.5,M.steel), fB=box(2.1,.32,.5,M.steel);
  fA.position.set(1,.6,0); fB.position.set(1,-.6,0); roll.add(fA,fB);
  const part=box(1.5,1.5,1.5,M.bronze); part.position.set(25.5,-12.2,4.6); scene.add(part);

  /* work envelope kept entirely x>22 so nothing sweeps through the gearbox at x<15 */
  const WAY=[[0,37,-6,11,0],[.16,36,-2,11,0],[.34,26.5,-8,5.4,0],[.44,25.5,-11.2,4.6,0],
             [.52,25.5,-11.2,4.6,1],[.66,27,-5,6,1],[.82,38,-6,2,1],[.9,38,-10.6,2,1],[1,38,-7,2,0]];
  const tv=new THREE.Vector3(), gw=new THREE.Vector3();
  function target(t){
    for(let i=0;i<WAY.length-1;i++) if(t<=WAY[i+1][0]){
      const k=smooth(seg(t,WAY[i][0],WAY[i+1][0]));
      tv.set(lerp(WAY[i][1],WAY[i+1][1],k),lerp(WAY[i][2],WAY[i+1][2],k),lerp(WAY[i][3],WAY[i+1][3],k));
      return {v:tv,g:lerp(WAY[i][4],WAY[i+1][4],k)};
    }
    const L=WAY[WAY.length-1]; tv.set(L[1],L[2],L[3]); return {v:tv,g:0};
  }
  function update(t){
    const T=target(t), dx=T.v.x-BASE.x, dz=T.v.z-BASE.z;
    const ya=Math.atan2(-dz,dx); yaw.rotation.y=ya;
    let r=Math.hypot(dx,dz), y=T.v.y-(BASE.y+2.9), d=Math.hypot(r,y);
    const dmax=L1+L2-.4, dmin=Math.abs(L1-L2)+1.4;
    if(d>dmax){r*=dmax/d;y*=dmax/d;d=dmax;} if(d<dmin){r*=dmin/d;y*=dmin/d;d=dmin;}
    const a2=-Math.acos(clamp((d*d-L1*L1-L2*L2)/(2*L1*L2),-1,1));
    const a1=Math.atan2(y,r)-Math.atan2(L2*Math.sin(a2),L1+L2*Math.cos(a2));
    sh.rotation.z=a1; el.rotation.z=a2; wr.rotation.z=-(a1+a2); roll.rotation.x=t*3;
    const o=lerp(.62,.28,T.g); fA.position.y=o; fB.position.y=-o;
    palm.getWorldPosition(gw);
    if(T.g>.5){part.position.copy(gw); part.position.x+=1.5*Math.cos(ya); part.position.z-=1.5*Math.sin(ya);}
    else if(t>.9) part.position.set(38,-12.2,2);
    return {a1:a1*57.3,a2:a2*57.3,yaw:ya*57.3,g:T.g};
  }
  return {root,part,update};
})();

/* ================= ACT 3 — HUMANOID ================= */
const HUM=(function(){
  const root=new THREE.Group(); root.position.set(-30,-13,4); root.rotation.y=0.5; scene.add(root);
  /* hip 7.75 + thigh 3.8 + shin 3.4 + tread puts the sole at +0.03 above the floor,
     with the walk bob of 0.16 taken off. At 7.4 the feet were 1.12 units underground. */
  const pelvis=new THREE.Group(); pelvis.position.y=8.55; root.add(pelvis);
  pelvis.add(box(3,1.5,1.8,M.dark));
  const torso=new THREE.Group(); torso.position.y=1.2; pelvis.add(torso);
  const chest=box(4.2,4,2.3,M.shell); chest.position.y=1.9; torso.add(chest);
  const chestSeam=box(4.35,0.12,2.4,M.shellD); chestSeam.position.y=2.5; torso.add(chestSeam);
  const chestVent=box(1.7,0.9,0.12,M.rubber); chestVent.position.set(0,0.8,1.2); torso.add(chestVent);
  const pauL=box(1.5,1.4,2.0,M.shell); pauL.position.set(-2.6,3.4,0); torso.add(pauL);
  const pauR=box(1.5,1.4,2.0,M.shell); pauR.position.set(2.6,3.4,0); torso.add(pauR);
  const spine=box(1.1,3.4,1.1,M.bronze); spine.position.set(0,1.8,-1.1); torso.add(spine);
  for(let i=0;i<5;i++){
    const v=box(2.4,0.14,0.5,M.shellD); v.position.set(0,0.4+i*0.34,-1.32); torso.add(v);
  }
  const neck=cyl(.5,.5,.9,16,M.dark); neck.position.y=4.3; torso.add(neck);
  const head=box(1.9,1.8,1.8,M.shell); head.position.y=5.4; torso.add(head);
  const headBack=box(1.6,1.2,0.3,M.shellD); headBack.position.set(0,5.5,-0.9); torso.add(headBack);
  const earL=cyl(.24,.24,.3,14,M.bronze); earL.rotation.z=Math.PI/2; earL.position.set(-1.0,5.4,0); torso.add(earL);
  const earR=earL.clone(); earR.position.x=1.0; torso.add(earR);
  const visor=box(1.5,.55,.14,M.emitA); visor.position.set(0,5.5,.95); torso.add(visor);
  const vglow=glow(0xC08A3E,3.4); vglow.position.set(0,5.5,1.3); torso.add(vglow);

  function limb(px,py,pz,l1,l2,mat){
    const a=new THREE.Group(); a.position.set(px,py,pz);
    const s1=box(.85,l1,.85,mat); s1.position.y=-l1/2; a.add(s1);
    const jA=cyl(.55,.55,.9,14,M.bronze); jA.rotation.z=Math.PI/2; a.add(jA);
    const b=new THREE.Group(); b.position.y=-l1; a.add(b);
    const s2=box(.72,l2,.72,M.dark); s2.position.y=-l2/2; b.add(s2);
    const jB=cyl(.42,.42,.8,12,M.bronze); jB.rotation.z=Math.PI/2; b.add(jB);
    const e=new THREE.Group(); e.position.y=-l2; b.add(e);
    return {a,b,e};
  }
  const armL=limb(-2.5,3.2,0,3.2,2.9,M.shell), armR=limb(2.5,3.2,0,3.2,2.9,M.shell);
  torso.add(armL.a,armR.a);
  [armL,armR].forEach(L=>{
    L.e.add(box(.7,.9,.6,M.shellD));
    const act=cyl(.22,.22,1.8,12,M.brush); act.position.set(0,-1.5,-.55); L.a.add(act);
    const cab=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,-.2,-.5),new THREE.Vector3(.18,-1.6,-.72),new THREE.Vector3(0,-3.0,-.5)]),12,.11,7,false),M.rubber);
    L.a.add(cab);
  });
  const legL=limb(-1,-.8,0,3.8,3.4,M.shell), legR=limb(1,-.8,0,3.8,3.4,M.shell);
  pelvis.add(legL.a,legR.a);
  [legL,legR].forEach(L=>{
    const act=cyl(.28,.28,2.4,12,M.brush); act.position.set(0,-2.0,-.66); L.a.add(act);
    const shin=box(.95,2.6,.5,M.shellD); shin.position.set(0,-1.6,.42); L.b.add(shin);
    const foot=box(1.25,.42,2.3,M.shellD); foot.position.z=.5; L.e.add(foot);
    const tread=box(1.15,.16,2.1,M.rubber); tread.position.set(0,-.28,.5); L.e.add(tread);
    const ankle=cyl(.34,.34,.9,14,M.bronze); ankle.rotation.z=Math.PI/2; L.e.add(ankle);
  });
  const hshadow=contact(9,9,0,0.06,0,root);

  function update(t){
    const wake=smooth(seg(t,0,.28));
    const w=t*7;
    root.position.z=4+seg(t,.3,1)*7;
    pelvis.position.y=8.55+Math.sin(w*2)*.16*wake;
    torso.rotation.y=Math.sin(w)*.12*wake;
    head.rotation.y=Math.sin(w*.6)*.22;
    visor.material.emissiveIntensity=0.5+wake*1.6+Math.sin(t*22)*0.12;
    const sw=wake*.62;
    legL.a.rotation.x=Math.sin(w)*sw; legR.a.rotation.x=-Math.sin(w)*sw;
    legL.b.rotation.x=Math.max(0,-Math.sin(w))*sw*1.3;
    legR.b.rotation.x=Math.max(0,Math.sin(w))*sw*1.3;
    armL.a.rotation.x=-Math.sin(w)*sw*.8; armR.a.rotation.x=Math.sin(w)*sw*.8;
    armL.b.rotation.x=-.35-Math.abs(Math.sin(w))*.3;
    armR.b.rotation.x=-.35-Math.abs(Math.cos(w))*.3;
  }
  return {root,update};
})();

/* ================= ACT 4 — DRONE ================= */
const DRONE=(function(){
  const root=new THREE.Group(); scene.add(root);
  const body=box(2.9,.85,2.4,M.shellD); root.add(body);
  const canopy=box(1.7,.55,1.35,M.shell); canopy.position.y=.6; root.add(canopy);
  const batt=box(1.9,.55,1.1,M.rubber); batt.position.y=-.62; root.add(batt);
  for(let i=0;i<4;i++){
    const v=box(.9,.1,.14,M.dark); v.position.set(0,.28,-.75+i*.22); root.add(v);
  }
  const ant1=cyl(.06,.06,1.5,8,M.dark); ant1.position.set(-1.1,.9,-.9); root.add(ant1);
  const ant2=ant1.clone(); ant2.position.x=1.1; root.add(ant2);
  const gimbal=new THREE.Mesh(new THREE.SphereGeometry(.58,24,18),M.shellD);
  gimbal.position.set(0,-.6,.9); gimbal.castShadow=true; root.add(gimbal);
  const hood=cyl(.4,.32,.5,18,M.rubber); hood.rotation.x=Math.PI/2; hood.position.set(0,-.66,1.28); root.add(hood);
  const yokeL=box(.12,.9,.5,M.brush); yokeL.position.set(-.62,-.42,.9); root.add(yokeL);
  const yokeR=yokeL.clone(); yokeR.position.x=.62; root.add(yokeR);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),M.emitG.clone());
  lens.position.set(0,-.68,1.3); root.add(lens);
  const lglow=glow(0x4ED18B,2.4); lglow.position.set(0,-.68,1.55); root.add(lglow);
  const rotors=[];
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>{
    const armM=box(3.4,.3,.34,M.steel);
    armM.position.set(sx*1.7,0,sz*1.5); armM.rotation.y=sz*sx>0?-Math.PI/5:Math.PI/5; root.add(armM);
    const mx=sx*3.1, mz=sz*2.7;
    const motor=cyl(.42,.42,.8,14,M.bronze); motor.position.set(mx,.3,mz); root.add(motor);
    const r=new THREE.Group(); r.position.set(mx,.78,mz); root.add(r);
    const bl1=box(2.9,.07,.34,M.dark), bl2=box(2.9,.07,.34,M.dark);
    bl2.rotation.y=Math.PI/2; r.add(bl1,bl2);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.55,32),
      new THREE.MeshBasicMaterial({color:0x9FB6CE,transparent:true,opacity:.1,side:THREE.DoubleSide}));
    disc.rotation.x=-Math.PI/2; disc.position.y=.02; r.add(disc);
    const guard=new THREE.Mesh(new THREE.TorusGeometry(1.72,.055,7,40),M.shellD);
    guard.rotation.x=Math.PI/2; guard.position.set(mx,.78,mz); guard.castShadow=true; root.add(guard);
    for(let k=0;k<3;k++){
      const ang=k*Math.PI*2/3;
      const st=box(.09,.09,1.7,M.shellD);
      st.position.set(mx+Math.sin(ang)*0.86,.78,mz+Math.cos(ang)*0.86);
      st.rotation.y=ang; root.add(st);
    }
    const skid=box(.2,1.1,.2,M.dark); skid.position.set(sx*1.5,-.9,sz*1.2); root.add(skid);
    rotors.push(r);
  });
  const PATH=[[-34,12,16],[-16,18,6],[2,22,-4],[20,17,-10],[30,11,4],[6,15,18]];
  const curve=new THREE.CatmullRomCurve3(PATH.map(p=>new THREE.Vector3(...p)),true,'catmullrom',0.4);
  const pv=new THREE.Vector3(), nv=new THREE.Vector3();
  function update(t,dt){
    const u=(t*0.85)%1;
    curve.getPointAt(u,pv); curve.getPointAt((u+0.01)%1,nv);
    root.position.copy(pv);
    root.lookAt(nv);
    root.rotateY(Math.PI/2);
    root.rotation.z=clamp((nv.x-pv.x)*0.28,-0.5,0.5);
    rotors.forEach((r,i)=>r.rotation.y+=dt*(i%2?58:-58));
    lens.material.emissiveIntensity=1.1+Math.sin(t*30)*0.5;
  }
  return {root,update};
})();

/* ================= ACT 5 — NEURAL NETWORK ================= */
const NET=(function(){
  const root=new THREE.Group(); root.position.set(0,10,-32); scene.add(root);
  const LAY=[4,7,7,3], SPX=7, SPY=2.9, SEGS=9;
  const nodes=[], pos=[];
  LAY.forEach((n,li)=>{
    const arr=[];
    for(let i=0;i<n;i++){
      const p=new THREE.Vector3((li-(LAY.length-1)/2)*SPX,(i-(n-1)/2)*SPY,0);
      const m=new THREE.Mesh(new THREE.SphereGeometry(.52,16,12),
        new THREE.MeshStandardMaterial({color:0x0B1219,emissive:0xC08A3E,emissiveIntensity:.25,
          metalness:.4,roughness:.3}));
      m.position.copy(p); m.scale.setScalar(.001); root.add(m); arr.push({m,p});
    }
    nodes.push(arr);
  });
  const edges=[];
  for(let li=0;li<LAY.length-1;li++)
    nodes[li].forEach(a=>nodes[li+1].forEach(b=>{
      edges.push({a:a.p,b:b.p,w:Math.random()});
      for(let s=0;s<SEGS;s++){
        const t0=s/SEGS,t1=(s+1)/SEGS;
        pos.push(lerp(a.p.x,b.p.x,t0),lerp(a.p.y,b.p.y,t0),0,
                 lerp(a.p.x,b.p.x,t1),lerp(a.p.y,b.p.y,t1),0);
      }
    }));
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const col=new Float32Array(pos.length); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85}));
  root.add(lines);
  function update(t,now){
    nodes.forEach((lay,li)=>lay.forEach((n,i)=>{
      const k=smooth(seg(t,li*.09+i*.012,li*.09+i*.012+.3));
      n.m.scale.setScalar(Math.max(.001,k));
      n.m.material.emissiveIntensity=.2+k*(.35+Math.sin(now*.004+li*2+i)*.3);
    }));
    const grow=smooth(seg(t,.15,.9));
    let ci=0;
    for(let e=0;e<edges.length;e++){
      const learn=lerp(.16,edges[e].w>.62?1:.14,grow);
      const ph=(now*.00055+e*.021)%1.6;
      for(let s=0;s<SEGS;s++){
        const u=(s+.5)/SEGS;
        const pulse=Math.exp(-Math.pow((u-ph)*4.6,2))*grow;
        const v=(learn*.30+pulse*1.25);
        for(let k2=0;k2<2;k2++){
          col[ci++]=v*1.0; col[ci++]=v*.72; col[ci++]=v*.34;
        }
      }
    }
    geo.attributes.color.needsUpdate=true;
  }
  return {root,update};
})();

/* ================= ACT 6 — BACKEND CORE ================= */
const BACK=(function(){
  const root=new THREE.Group(); root.position.set(0,-2,-64); scene.add(root);
  const stage=document.getElementById('stage');
  const LAYERS=[
    {y:11,  w:15,label:'client · next.js 15',col:0x6E8DB8},
    {y:6.5, w:14,label:'edge · vercel',      col:0x6E8DB8},
    {y:2,   w:13,label:'server actions · zod',col:0xC08A3E},
    {y:-2.5,w:12,label:'rls gate · default-deny',col:0xFFB020},
    {y:-7,  w:11,label:'postgres · 43 tables',col:0x4ED18B}
  ];
  const plates=LAYERS.map(L=>{
    const p=new THREE.Mesh(new THREE.BoxGeometry(L.w,.42,L.w*.62),
      new THREE.MeshStandardMaterial({color:0x0F161D,metalness:.6,roughness:.28,
        emissive:L.col,emissiveIntensity:.16,transparent:true,opacity:.9}));
    p.position.y=L.y; p.castShadow=true; p.receiveShadow=true; root.add(p);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(L.w*.52,.05,8,48),
      new THREE.MeshBasicMaterial({color:L.col,transparent:true,opacity:.35}));
    ring.rotation.x=Math.PI/2; ring.position.y=L.y; root.add(ring);
    return {p,ring,L};
  });
  /* 43 table plates forming the data core */
  const core=new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6,2.6,.13,26),
    new THREE.MeshStandardMaterial({color:0x8FA0B4,metalness:1,roughness:.3,
      emissive:0x0B2E1D,emissiveIntensity:.3}),43);
  core.castShadow=true; core.position.y=-12; root.add(core);
  const dummy=new THREE.Object3D();
  for(let i=0;i<43;i++){
    dummy.position.set(0,i*.30,0); dummy.rotation.y=i*.19;
    dummy.scale.set(1-Math.abs(i-21)/70,1,1-Math.abs(i-21)/70);
    dummy.updateMatrix(); core.setMatrixAt(i,dummy.matrix);
  }
  core.instanceMatrix.needsUpdate=true;
  /* travelling request packet */
  const pk=new THREE.Mesh(new THREE.BoxGeometry(.85,.85,.85),M.emitG.clone());
  pk.castShadow=true; root.add(pk);
  const pglow=glow(0x4ED18B,5.5); pk.add(pglow);
  const halo=new THREE.PointLight(0x4ED18B,2.2,26); root.add(halo);
  const labels=LAYERS.map(L=>{const d=document.createElement('div');d.className='lbl';
    d.textContent=L.label;stage.appendChild(d);return d;});
  const wp=new THREE.Vector3();
  function update(t,now,cam){
    plates.forEach((pl,i)=>{
      const k=smooth(seg(t,i*.07,i*.07+.34));
      pl.p.scale.set(Math.max(.001,k),1,Math.max(.001,k));
      pl.ring.scale.setScalar(Math.max(.001,k));
      pl.ring.rotation.z=now*.0004*(i%2?1:-1);
      pl.p.material.emissiveIntensity=.14+k*.2;
    });
    core.scale.setScalar(Math.max(.001,smooth(seg(t,.34,.72))));
    core.rotation.y=now*.00028;
    /* packet descends, pauses at the RLS gate, then reaches the core */
    const u=(now*.00016)%1;
    let y, denied=false;
    if(u<.62){ y=lerp(13,-2.5,u/.62); }
    else if(u<.74){ y=-2.5; denied=(Math.floor(now*.00016)%3===0); }
    else { y=denied?lerp(-2.5,6,seg(u,.74,1)) : lerp(-2.5,-11,seg(u,.74,1)); }
    pk.position.set(0,y,0); pk.rotation.set(now*.002,now*.0016,0);
    const c=denied?0xFF5A5A:0x4ED18B;
    pk.material.emissive.setHex(c); halo.color.setHex(c); pglow.material.color.setHex(c);
    halo.position.set(0,y,0);
    halo.intensity=2.2*smooth(seg(t,.1,.5));
    plates[3].p.material.emissive.setHex(denied?0xFF5A5A:0xFFB020);
    /* labels */
    plates.forEach((pl,i)=>{
      pl.p.getWorldPosition(wp); wp.x+=LAYERS[i].w*.62; wp.project(cam);
      const k=smooth(seg(t,i*.07,i*.07+.34)), el=labels[i];
      if(k>.1&&wp.z<1){el.style.opacity=(k*.95).toFixed(2);
        el.style.left=((wp.x*.5+.5)*100)+'%'; el.style.top=((-wp.y*.5+.5)*100)+'%';}
      else el.style.opacity=0;
    });
    return denied;
  }
  function hide(){labels.forEach(l=>l.style.opacity=0);}
  return {root,update,hide};
})();

/* ================= ACTS + CAMERA ================= */
const ACTS=[
  {n:'IDLE · GLASS GEARBOX',a:0, b:.08,cam:[13,0,15],  look:[8.5,.5,0]},
  {n:'ACT 1 · MECHANICS', a:.08, b:.22,cam:[4,7,40],   look:[0,2,0]},
  {n:'ACT 2 · ROBOTICS',  a:.20, b:.36,cam:[54,0,32],  look:[32,-6,6]},
  {n:'ACT 3 · HUMANOID',  a:.36, b:.50,cam:[-48,0,28], look:[-29,-5,8]},
  {n:'ACT 4 · AUTONOMY',  a:.50, b:.62,cam:[8,20,50],  look:[0,15,0]},
  {n:'ACT 5 · LEARNING',  a:.62, b:.76,cam:[0,10,-2],  look:[0,10,-32]},
  {n:'ACT 6 · BACKEND',   a:.76, b:.90,cam:[22,3,-40], look:[0,-1,-64]},
  {n:'ACT 7 · RESOLVE',   a:.90, b:1,  cam:[16,16,-30],look:[0,-3,-60]}
];
const rail=document.getElementById('rail');
ACTS.slice(1).forEach(()=>rail.appendChild(document.createElement('i')));
const dots=[...rail.children];
const caps=[...document.querySelectorAll('.cap')];
const hudAct=document.getElementById('hudAct'), tel=document.getElementById('tel'), track=document.getElementById('track');
const cp=new THREE.Vector3(), cl=new THREE.Vector3();
/* one accent per act: warm for the machine work, cool for autonomy, green for data */
const ACC=[0xC08A3E,0xC08A3E,0x9FB6CE,0xE0A85C,0x6FD3E8,0xB08CFF,0x4ED18B,0x4ED18B];
const acc=new THREE.Color(), acc2=new THREE.Color(), fogC=new THREE.Color();

function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h) return;
  renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
}
resize(); addEventListener('resize',resize);

/* the scene has to re-grade too, or a light page keeps a black hole at the top */
let baseFog=0x07080A;
window.__scene3DTheme=function(isLight){
  baseFog = isLight?0xE7E9ED:0x07080A;
  ground.material.color.setHex(isLight?0xD5DAE0:0x0A0D11);
  ground.material.roughness = isLight?0.58:0.42;
  ground.material.envMapIntensity = isLight?0.8:0.55;
  grid.material.color.setHex(isLight?0xAFB7C1:0x1E2731);
  dust.material.color.setHex(isLight?0x7C8899:0xBFCDDD);
  dust.material.opacity = isLight?0.30:0.45;
  amb.color.setHex(isLight?0xC3D2E4:0x2A3340);
  amb.intensity = isLight?1.35:0.5;
  key.intensity = isLight?2.9:2.3;
  renderer.toneMappingExposure = isLight?1.22:1.06;
};
if(document.documentElement.dataset.theme==='light') window.__scene3DTheme(true);

let last=0, spin=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.05); last=now;
  const r=track.getBoundingClientRect();
  const reduced=document.body.classList.contains('reduced');
  if(!reduced&&(r.bottom<0||r.top>innerHeight)){BACK.hide();return;}
  const p=reduced?.30:clamp(-r.top/(r.height-innerHeight),0,1);

  let i=0; while(i<ACTS.length-1&&p>ACTS[i].b) i++;
  const pv=ACTS[Math.max(0,i-1)], cu=ACTS[i], k=smooth(seg(p,pv.b-.055,cu.b-.055));
  cp.set(lerp(pv.cam[0],cu.cam[0],k),lerp(pv.cam[1],cu.cam[1],k),lerp(pv.cam[2],cu.cam[2],k));
  cl.set(lerp(pv.look[0],cu.look[0],k),lerp(pv.look[1],cu.look[1],k),lerp(pv.look[2],cu.look[2],k));
  camera.position.set(cp.x+(reduced?0:Math.sin(now*.00035)*.5),cp.y+(reduced?0:Math.cos(now*.00029)*.35),cp.z);
  camera.lookAt(cl);

  /* key light follows the act so shadows stay sharp instead of one map covering 100 units */
  keyT.position.copy(cl);
  key.position.set(cl.x-20,cl.y+32,cl.z+22);

  acc.setHex(ACC[Math.max(0,i-1)]); acc2.setHex(ACC[i]); acc.lerp(acc2,k);
  rim.color.copy(acc);
  fogC.setHex(baseFog).lerp(acc,0.09);
  scene.fog.color.copy(fogC); scene.background.copy(fogC);
  dust.rotation.y+=dt*0.01;

  grid.material.opacity=(0.16+smooth(seg(p,0,.12))*0.26)*(1-seg(p,.60,.80));

  /* act 1 */
  const gs=1-smooth(seg(p,.30,.345));
  GBOX.g.visible=gs>0.01;
  if(GBOX.g.visible){
    spin+=dt*(smooth(seg(p,.03,.22))*3.2+.25); GBOX.update(spin);
    GBOX.g.scale.setScalar(gs);
  }

  /* act 2 */
  const aOn=p>.15&&p<.42;
  ARM.root.visible=ARM.part.visible=aOn;
  let st={a1:0,a2:0,yaw:0,g:0};
  if(aOn){ ARM.root.scale.setScalar(Math.max(.001,smooth(seg(p,.16,.24))));
    st=ARM.update(clamp(seg(p,.19,.38),0,1)); }

  /* act 3 */
  const hOn=p>.31&&p<.56;
  HUM.root.visible=hOn;
  if(hOn){ HUM.root.scale.setScalar(Math.max(.001,smooth(seg(p,.32,.40))));
    HUM.update(clamp(seg(p,.34,.52),0,1)); }

  /* act 4 */
  const dOn=p>.45&&p<.68;
  DRONE.root.visible=dOn;
  if(dOn){ DRONE.root.scale.setScalar(Math.max(.001,smooth(seg(p,.46,.53))));
    DRONE.update(clamp(seg(p,.47,.66),0,1),dt); }

  /* act 5 */
  const nOn=p>.57&&p<.82;
  NET.root.visible=nOn;
  if(nOn) NET.update(clamp(seg(p,.58,.80),0,1),now);

  /* act 6 */
  const bOn=p>.70;
  BACK.root.visible=bOn;
  let denied=false;
  if(bOn) denied=BACK.update(clamp(seg(p,.72,.94),0,1),now,camera); else BACK.hide();

  if(!reduced) caps.forEach(el=>{
    const A=ACTS[+el.dataset.act];
    const inK = A.a===0 ? 1 : smooth(seg(p,A.a,A.a+.04));
    const outK=smooth(seg(p,A.b-.032,A.b));
    el.style.opacity=(inK*(1-outK)).toFixed(3);
    el.style.transform=`translateY(${((1-inK)*24+outK*-20).toFixed(1)}px)`;
  });

  hudAct.textContent=ACTS[i].n;
  dots.forEach((d,j)=>d.classList.toggle('on',j===Math.max(0,i-1)));
  tel.textContent = p<.45
    ? `θ_yaw ${st.yaw.toFixed(0)}° · θ₁ ${st.a1.toFixed(0)}° · θ₂ ${st.a2.toFixed(0)}° · grip ${(st.g*100).toFixed(0)}%`
    : p<.72 ? `alt ${(DRONE.root.position.y+13).toFixed(1)} m · layers 4 · nodes 21 · epoch ${(p*100).toFixed(0)}`
            : `${denied?'403 · rls denied':'200 · rls allow'} · tables 43 · roles 4 · p ${p.toFixed(3)}`;

  renderer.render(scene,camera);
}

  canvas.classList.add('ready');
  requestAnimationFrame(frame);

  new RGBELoader().load('/assets/hdri/brown_photostudio_02_2k.hdr', (env) => {
    env.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = env;
  }, undefined, (err) => console.warn('HDRI failed', err));
}
