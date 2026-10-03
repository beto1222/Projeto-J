import * as THREE from './vendor/three.module.min.js';
export function dressRestaurant(scene,{food,wood,steel,cream,green,wall,red,chairs}){
 const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const charcoal=mat('#25332e'),ceramic=mat('#cfcbaf',.3),brass=mat('#ac8a52',.4,.65),cloth=mat('#827760');
 const cube=(w,h,d,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const cyl=(r,h,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const sphere=(r,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=kind==='wood'?'#775436':'#d1c6aa';ctx.fillRect(0,0,512,512);let seed=72;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<1800;i++){ctx.fillStyle=kind==='wood'?(i%2?'#37291815':'#e3b77519'):'#706b5910';const x=random()*512,y=random()*512;ctx.fillRect(x,y,kind==='wood'?random()*90:2,kind==='wood'?.5+random()*2:2);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 wood.map=texture('wood');wood.color.set('#bfa487');wood.needsUpdate=true;cream.map=texture('plaster');cream.needsUpdate=true;steel.roughness=.46;
 // Reference palette: worn bottle-green plaster, red leather and floral tiles.
 function worn(base,scratches){const c=document.createElement('canvas');c.width=c.height=512;const p=c.getContext('2d');p.fillStyle=base;p.fillRect(0,0,512,512);let n=34;const rand=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};for(let i=0;i<9000;i++){p.fillStyle=i%2?'#090f0e12':'#dcc39813';const x=rand()*512,y=rand()*512;p.fillRect(x,y,rand()*8,rand()*5);}for(let i=0;i<240;i++){p.strokeStyle=scratches;p.lineWidth=rand()*1.6;p.beginPath();const x=rand()*512,y=rand()*512;p.moveTo(x,y);p.lineTo(x+rand()*25,y+rand()*8);p.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 wall.map=worn('#35584c','#10251e55');wall.color.set('#ffffff');wall.needsUpdate=true;
 red.map=worn('#8e3828','#d69b6d38');red.color.set('#ffffff');red.roughness=.46;red.needsUpdate=true;
 const tileCanvas=document.createElement('canvas');tileCanvas.width=tileCanvas.height=256;const tc=tileCanvas.getContext('2d');tc.fillStyle='#c4b18a';tc.fillRect(0,0,256,256);tc.strokeStyle='#867d65';tc.lineWidth=5;tc.strokeRect(3,3,250,250);tc.translate(128,128);for(let i=0;i<8;i++){tc.rotate(Math.PI/4);tc.fillStyle=i%2?'#9c6d45':'#3c6150';tc.beginPath();tc.ellipse(0,-58,18,43,0,0,Math.PI*2);tc.fill();}tc.fillStyle='#d2bd8c';tc.beginPath();tc.arc(0,0,24,0,7);tc.fill();const ft=new THREE.CanvasTexture(tileCanvas);ft.colorSpace=THREE.SRGBColorSpace;const floral=new THREE.MeshStandardMaterial({map:ft,roughness:.57});
 for(const side of [-1,1])for(let z=-5.5;z<7.5;z+=.4)cube(.022,.4,.395,side*5.85,1.28,z,floral);
 for(const side of [-1,1])cube(.05,.05,13.6,side*5.82,1.51,1,wood);
 // Replace each hard chair with a upholstered diner bench, preserving later rotations.
 chairs.forEach((chair,i)=>{chair.children.forEach(o=>o.visible=false);const side=i%2===0?-1:1;cube(1.76,.34,.64,0,.25,0,wood,chair);
  for(let j=0;j<8;j++){const back=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.48,6,16),red);back.scale.z=.65;back.position.set(-.735+j*.21,.86,side*.27);back.castShadow=true;chair.add(back);const seat=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.43,6,16),red);seat.rotation.x=Math.PI/2;seat.scale.z=.65;seat.position.set(-.735+j*.21,.47,-.02);seat.castShadow=true;chair.add(seat);}
  cube(1.80,.06,.17,0,1.18,side*.29,wood,chair);
 });
 // Amber pendants over each table; task lighting stays separate in the kitchen.
 for(const x of [-3.4,2.8])for(const z of [-1.35,-4]){cyl(.011,1.20,x,3.01,z,charcoal);const shade=new THREE.Mesh(new THREE.SphereGeometry(.25,32,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:'#b87632',emissive:'#aa5b17',emissiveIntensity:.28,side:THREE.DoubleSide,roughness:.47}));shade.position.set(x,2.42,z);scene.add(shade);cyl(.249,.024,x,2.42,z,brass);const bulb=sphere(.060,x,2.44,z,new THREE.MeshBasicMaterial({color:'#ffcc83'}));const light=new THREE.PointLight('#ffbb6c',6,4,2);light.position.set(x,2.34,z);scene.add(light);}
 // Cabinet divisions, toe kicks and handles make the long stainless surface readable.
 for(let x=-4.65;x<4.9;x+=.75){cube(.718,.72,.025,x,.52,6.027,steel);cube(.28,.024,.04,x,.76,5.993,charcoal);cube(.73,.026,.026,x,.28,6.01,charcoal);}
 cube(9.7,.13,.13,0,.085,6.16,charcoal);
 // Shelves, bowls, jars, cups and pantry boxes; clean work zones remain clear.
 for(const y of [1.76,2.32]){cube(3.6,.06,.34,-1.6,y,7.48,wood);for(const x of [-3.1,-.1]){cube(.025,.3,.025,x,y-.15,7.46,steel);}}
 for(let i=0;i<7;i++){cyl(.066,.15,-3.0+i*.32,1.87,7.43,ceramic);cyl(.069,.025,-3.0+i*.32,1.96,7.43,wood);cube(.085,.05,.006,-3+i*.32,1.88,7.36,mat('#e4d7b4'));}
 for(let i=0;i<5;i++){cyl(.09,.045,-2.9+i*.3,2.38,7.44,ceramic);cyl(.086,.04,-2.9+i*.3,2.42,7.44,ceramic);}
 cube(.27,.34,.22,-1.0,2.51,7.46,mat('#b89b59'));cube(.26,.25,.2,-.64,2.46,7.46,mat('#75815d'));
 // Large cold cabinet and sink on the back wall, beyond the active cooking stations.
 cube(1.05,2.45,.65,-4.8,1.225,7.34,steel);for(const y of [.64,1.78]){cube(.98,1.08,.035,-4.8,y,6.991,mat('#87998e',.42,.32));cube(.03,.34,.07,-4.39,y,6.948,charcoal);}
 cube(.18,.065,.01,-4.8,2.29,6.96,charcoal);cube(.054,.025,.012,-4.8,2.29,6.949,mat('#b5c685'));
 cube(.72,.025,.43,4.56,1.048,6.55,charcoal);cube(.65,.017,.37,4.56,1.06,6.55,steel);cyl(.018,.29,4.65,1.2,6.79,steel);const tap=cube(.22,.03,.03,4.55,1.35,6.79,steel);cube(.026,.08,.03,4.44,1.32,6.79,steel);
 // Tomato crate. Only the front fruit is consumed by the interaction each shift.
 const basket=new THREE.Group();basket.position.set(-3.55,1.04,6.20);scene.add(basket);
 cube(.40,.024,.30,0,.012,0,wood,basket);for(const side of [-1,1])for(let i=0;i<3;i++){cube(.4,.02,.02,0,.05+i*.024,side*.15,wood,basket);cube(.02,.02,.3,side*.2,.05+i*.024,0,wood,basket);}
 const tomatoes=[];for(let i=0;i<6;i++){const t=sphere(.041,(i%3-1)*.10,.074,Math.floor(i/3)*.10-.05,food.skin,basket);t.scale.y=.94;tomatoes.push(t);for(let j=0;j<4;j++){const leaf=cube(.007,.002,.024,t.position.x,.114,t.position.z,food.stem,basket);leaf.rotation.y=j*Math.PI/4;}}
 // Egg tray and linen at the preparation point.
 cube(.24,.027,.14,1.18,1.062,6.35,mat('#9a8b72'));for(let i=0;i<6;i++){const egg=sphere(.024,1.1+(i%3)*.065,1.094,6.31+Math.floor(i/3)*.065,mat('#d7c4a0'));egg.scale.y=1.32;}
 cube(.29,.012,.25,-1.75,1.049,6.37,cloth);for(let i=0;i<5;i++)cube(.012,.001,.25,-1.86+i*.05,1.056,6.37,cream);
 cyl(.085,.24,.92,1.17,6.78,ceramic);for(let i=0;i<6;i++){const spoon=cyl(.009,.30,.88+(i%3)*.032,1.34,6.76+Math.floor(i/3)*.04,steel);spoon.rotation.z=(i-2)*.05;}
 // Register, coffee station and menus give the front counter a working-diner identity.
 cube(.34,.13,.28,-3.7,1.14,1.14,charcoal);const register=cube(.30,.24,.035,-3.7,1.30,1.08,charcoal);register.rotation.x=-.18;cube(.22,.11,.012,-3.7,1.33,1.048,mat('#668279'));
 cube(.55,.54,.38,2.35,1.35,1.13,steel);cube(.41,.11,.05,2.35,1.4,.916,charcoal);cyl(.08,.12,2.34,1.16,.98,ceramic);for(let i=0;i<4;i++)cyl(.06,.10,1.73+i*.16,1.13,1.15,ceramic);
 for(const x of [-3.4,2.8])for(const z of [-1.35,-4]){cube(.18,.22,.035,x+.56,.94,z-.22,wood);cube(.15,.18,.003,x+.56,.946,z-.24,cream);cyl(.027,.083,x-.51,.893,z+.18,ceramic);cyl(.03,.013,x-.51,.94,z+.18,steel);cyl(.043,.12,x-.39,.91,z+.18,mat('#8e3529'));}
 // Brass wall lamps, timber trim and framed art break up flat walls.
 for(const side of [-1,1])for(const z of [-4.1,-1.1,3.2]){cube(.045,.22,.11,side*5.82,2.14,z,brass);sphere(.074,side*5.72,2.26,z,new THREE.MeshStandardMaterial({color:'#e9d5a6',emissive:'#d7a55b',emissiveIntensity:.55}));const l=new THREE.PointLight('#ffd09a',2.2,2.8);l.position.set(side*5.6,2.3,z);scene.add(l);}
 for(const side of [-1,1]){cube(.055,.09,13.6,side*5.86,3.35,1,wood);for(let z=-4.7;z<6.8;z+=1.0)cube(.04,.82,.025,side*5.87,.52,z,wood);}
 const art=cube(.07,.74,1.04,5.84,2.12,4.12,wood);cube(.02,.63,.91,5.79,2.12,4.12,mat('#817e58'));for(let i=0;i<5;i++)cube(.015,.13+.07*i,.08,5.772,1.95+i*.03,3.84+i*.13,mat(i%2?'#b09c71':'#4c654e'));
 // Visible rainy street through the windows, not a featureless opaque wall.
 cube(16,.03,5,0,-.03,-8,mat('#374345',.21));for(let x=-6;x<7;x+=3){cube(2.5,5,.2,x,1.9,-10,mat('#33413f'));for(const y of [1.4,2.6])cube(.65,.8,.025,x,y,-9.87,mat('#a18a64'));}
 return {basket,tomatoes};
}
