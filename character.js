import * as THREE from './vendor/three.module.min.js';

function skinMap(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#bf896c';x.fillRect(0,0,256,256);let n=74;for(let i=0;i<9000;i++){n=(n*1664525+1013904223)>>>0;const u=n/4294967296;n=(n*1664525+1013904223)>>>0;const v=n/4294967296;x.fillStyle=i%3?'#dbab8518':'#76472e15';x.fillRect(u*256,v*256,1.3,1.3);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function handMaterials(){return {skin:new THREE.MeshStandardMaterial({map:skinMap(),roughness:.64}),nail:new THREE.MeshStandardMaterial({color:'#cfa98c',roughness:.47}),cuff:new THREE.MeshStandardMaterial({color:'#d2cbb0',roughness:.93}),cloth:new THREE.MeshStandardMaterial({color:'#435746',roughness:.93}),crease:new THREE.MeshStandardMaterial({color:'#926449',roughness:.87})};}
function oval(root,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function bone(root,a,b,r,material){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.001,d.length()-r*1.3),5,12),material);m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;root.add(m);return m;}
// Dimensions are in metres: palm 8 cm, fingers 7–9 cm, forearm 29 cm.
export function makeHand(materials,{left=false,pose='open',sleeve=true}={}){
 const g=new THREE.Group(),s=left?-1:1,m=materials;
 oval(g,m.skin,0,0,0,.043,.017,.049);oval(g,m.skin,s*.022,-.002,.013,.026,.019,.035);
 bone(g,[0,0,.035],[0,-.015,.13],.026,m.skin);
 if(sleeve){bone(g,[0,-.016,.11],[s*.045,-.065,.38],.043,m.cloth);bone(g,[0,-.015,.095],[0,-.016,.13],.03,m.cuff);}
 for(let i=0;i<4;i++){
  const x=(-.030+i*.019)*s,length=[.064,.077,.073,.056][i],z=-.032;
  const curl=pose==='claw'?.055:pose==='cup'?.027:0;
  const points=[[x,0,z],[x,-curl*.12,z-length*.42],[x,-curl*.65,z-length*.75],[x,-curl,z-length*.86]];
  for(let j=0;j<3;j++)bone(g,points[j],points[j+1],.009-j*.0007,m.skin);
  oval(g,m.skin,...points[1],.010,.010,.010);
  const tip=points[3];const nail=oval(g,m.nail,tip[0],tip[1]+.006,tip[2]+.004,.0055,.0014,.0075);nail.rotation.x=pose==='claw'?-.9:0;
 }
 const thumb=[[s*.033,-.004,.017],[s*.056,-.005,-.008],[s*.06,-.02,-.034]];bone(g,thumb[0],thumb[1],.012,m.skin);bone(g,thumb[1],thumb[2],.01,m.skin);oval(g,m.nail,s*.061,-.012,-.032,.006,.0015,.008);
 return g;
}
// Right hand wraps the knife's longitudinal grip; no floating tool overlay.
export function knifeGrip(materials){
 const g=new THREE.Group(),m=materials;
 oval(g,m.skin,.024,.006,0,.027,.024,.053);
 for(let i=0;i<4;i++){const z=-.038+i*.023;const points=[[.026,.02,z],[-.003,.030,z],[-.024,.009,z],[-.013,-.014,z]];for(let j=0;j<3;j++)bone(g,points[j],points[j+1],.008,m.skin);oval(g,m.nail,-.015,-.01,z,.007,.003,.008);}
 bone(g,[.042,.014,-.035],[.005,.035,-.052],.011,m.skin);bone(g,[.005,.035,-.052],[-.014,.024,-.04],.01,m.skin);
 bone(g,[.035,-.002,.04],[.06,-.035,-.105],.025,m.skin);bone(g,[.06,-.035,-.105],[.14,-.12,-.38],.043,m.cloth);bone(g,[.054,-.031,-.084],[.064,-.041,-.125],.030,m.cuff);return g;
}

export function dinerPerson({shirt='#5b7163',skin='#b68b69',hair='#392d24'}={}){
 const g=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:shirt,roughness:.93}),face=new THREE.MeshStandardMaterial({color:skin,roughness:.76}),hairMat=new THREE.MeshStandardMaterial({color:hair,roughness:1}),pants=new THREE.MeshStandardMaterial({color:'#303c37',roughness:.9});
 oval(g,cloth,0,1.04,0,.23,.32,.135);oval(g,cloth,0,1.23,0,.27,.10,.14);bone(g,[0,1.26,0],[0,1.38,0],.064,face);
 oval(g,face,0,1.52,.02,.118,.162,.112);oval(g,hairMat,0,1.61,-.012,.121,.08,.117);oval(g,face,0,1.51,.13,.025,.038,.034);
 const eyeMat=new THREE.MeshStandardMaterial({color:'#302a24'});
 for(const side of [-1,1]){oval(g,face,side*.119,1.51,.008,.018,.039,.022);oval(g,eyeMat,side*.043,1.556,.121,.015,.005,.007);bone(g,[side*.22,1.22,0],[side*.28,.99,.08],.060,cloth);bone(g,[side*.28,.99,.08],[side*.23,.87,.28],.043,cloth);oval(g,face,side*.22,.87,.31,.039,.02,.059);bone(g,[side*.13,.8,.02],[side*.14,.52,.32],.075,pants);bone(g,[side*.14,.52,.32],[side*.14,.12,.29],.064,pants);oval(g,pants,side*.14,.085,.36,.076,.065,.14);}
 bone(g,[-.027,1.452,.122],[.027,1.452,.122],.003,hairMat);
 return {root:g,shirt:cloth,skin:face};
}
