import * as THREE from './vendor/three.module.min.js';

function texture(paint,size=512){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
let seed=217;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
export function foodMaterials(){
 const skin=texture((c,n)=>{c.fillStyle='#bb2917';c.fillRect(0,0,n,n);for(let i=0;i<22000;i++){const a=random(),b=random();c.fillStyle=`rgba(${a>.45?'255,167,54':'89,8,6'},${.03+b*.1})`;c.beginPath();c.ellipse(random()*n,random()*n,.4+random()*1.3,.5+random()*1.3,0,0,Math.PI*2);c.fill();}for(let i=0;i<10;i++){c.strokeStyle='#ed4b2612';c.lineWidth=6;c.beginPath();c.moveTo(i*n/10,0);c.bezierCurveTo(i*n/10+35,150,i*n/10-35,350,i*n/10,n);c.stroke();}});
 const flesh=texture((c,n)=>{
  c.fillStyle='#dc4e34';c.fillRect(0,0,n,n);
  const rad=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);rad.addColorStop(0,'#f7a075');rad.addColorStop(.23,'#f18b64');rad.addColorStop(.45,'#e86d4e');rad.addColorStop(.9,'#cd402e');rad.addColorStop(1,'#8b1e14');c.fillStyle=rad;c.fillRect(0,0,n,n);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.23;c.save();c.translate(n/2,n/2);c.rotate(a);const gel=c.createRadialGradient(n*.26,0,5,n*.26,0,n*.13);gel.addColorStop(0,'#ad412acc');gel.addColorStop(.7,'#bf3d21');gel.addColorStop(1,'#ee8d55');c.fillStyle=gel;c.beginPath();c.ellipse(n*.285,0,n*.13,n*.095,0,0,Math.PI*2);c.fill();
   for(let j=0;j<8;j++){const sa=j*2.399,x=n*.29+Math.cos(sa)*n*(.045+random()*.028),y=Math.sin(sa)*n*.065;c.save();c.translate(x,y);c.rotate(sa+.7);c.fillStyle='#fbd292';c.beginPath();c.ellipse(0,0,4,8,0,0,Math.PI*2);c.fill();c.strokeStyle='#92432688';c.lineWidth=1.5;c.stroke();c.fillStyle='#fff1bf99';c.fillRect(-1,-5,1.5,7);c.restore();}c.restore();}
  for(let i=0;i<10000;i++){c.fillStyle=random()>.5?'#ffcc9222':'#ab211017';c.fillRect(random()*n,random()*n,1,1);}
 });
 return {skin:new THREE.MeshPhysicalMaterial({map:skin,roughness:.29,clearcoat:.6,clearcoatRoughness:.23}),flesh:new THREE.MeshPhysicalMaterial({map:flesh,roughness:.36,clearcoat:.4,side:THREE.DoubleSide}),stem:new THREE.MeshStandardMaterial({color:0x536230,roughness:.85})};
}

// Curved sphere bands with independently revealable cut faces. Axis of cutting is X.
export function bandGeometry(a,b,r=.39){
 const positions=[],uvs=[],indices=[],rings=12,sides=64;
 for(let i=0;i<=rings;i++){const x=a+(b-a)*i/rings,rho=Math.sqrt(Math.max(0,r*r-x*x));for(let j=0;j<=sides;j++){const t=j/sides*Math.PI*2;positions.push(x,rho*Math.cos(t),rho*Math.sin(t));uvs.push((x/r+1)/2,j/sides);}}
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export class Tomato {
 constructor(planes,materials){
  this.root=new THREE.Group();this.pieces=[];this.cuts=0;this.planes=planes;
  const edges=[-.39,...planes,.39];
  for(let i=0;i<edges.length-1;i++){
   const group=new THREE.Group();const shell=new THREE.Mesh(bandGeometry(edges[i],edges[i+1]),materials.skin);shell.castShadow=true;shell.receiveShadow=true;group.add(shell);
   const faces=[];for(const x of [edges[i],edges[i+1]]){const r=Math.sqrt(Math.max(0,.39**2-x*x));const disk=new THREE.Mesh(new THREE.CircleGeometry(r,64),materials.flesh);disk.rotation.y=Math.PI/2;disk.position.x=x;disk.visible=false;disk.receiveShadow=true;group.add(disk);faces.push(disk);}
   this.root.add(group);this.pieces.push({group,faces,offset:0});
  }
  this.stem=new THREE.Group();for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.034,.16,3),materials.stem);leaf.position.set(Math.sin(i*1.256)*.053,.391,Math.cos(i*1.256)*.053);leaf.rotation.set(Math.cos(i*1.256)*1.15,0,-Math.sin(i*1.256)*1.15);this.stem.add(leaf);}this.root.add(this.stem);
 }
 separate(){
  if(this.cuts>=this.planes.length)return;
  const i=this.cuts++;this.pieces[i].faces[1].visible=true;this.pieces[i+1].faces[0].visible=true;
 }
 update(dt,pressure=0){
  for(let i=0;i<this.pieces.length;i++){
   const p=this.pieces[i];const target=i<this.cuts?-.13*(this.cuts-i):.055*this.cuts;
   p.offset=THREE.MathUtils.damp(p.offset,target,9,dt);p.group.position.x=p.offset;
   p.group.rotation.z=THREE.MathUtils.damp(p.group.rotation.z,i<this.cuts?-.10:0,7,dt);
   p.group.scale.y=1-(i>=this.cuts?pressure*.028:0);
  }
  this.stem.position.x=this.pieces[Math.floor(this.pieces.length/2)].offset;
 }
 get nextX(){return (this.planes[this.cuts]??.42)+(this.pieces[this.cuts]?.offset||0);}
 dispose(){this.root.traverse(o=>o.geometry?.dispose());}
}

export function makeKnife(){
 const knife=new THREE.Group();
 // Broad stainless chef blade in YZ, sharpened belly at y=0.
 const shape=new THREE.Shape();shape.moveTo(-.48,.20);shape.lineTo(.35,.20);shape.lineTo(.35,.035);shape.quadraticCurveTo(-.05,-.015,-.48,.025);shape.quadraticCurveTo(-.59,.065,-.48,.20);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1});geo.rotateY(Math.PI/2);
 const blade=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xbfcbd0,metalness:.86,roughness:.23,side:THREE.DoubleSide}));blade.castShadow=true;knife.add(blade);
 const bevel=new THREE.Mesh(new THREE.BoxGeometry(.018,.018,.77),new THREE.MeshStandardMaterial({color:0xf2efdc,metalness:.55,roughness:.15}));bevel.position.set(0,.023,.02);knife.add(bevel);
 const handle=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.37,5,10),new THREE.MeshStandardMaterial({color:0x241c17,roughness:.48}));handle.rotation.x=Math.PI/2;handle.position.set(0,.15,-.60);knife.add(handle);
 for(const z of [-.49,-.66]){const pin=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshStandardMaterial({color:0xc7c2ad,metalness:.6,roughness:.25}));pin.position.set(.044,.15,z);knife.add(pin);}
 return knife;
}
