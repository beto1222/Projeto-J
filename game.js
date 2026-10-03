import * as THREE from './vendor/three.module.min.js';
import {Service,SHIFTS} from './state.js';
import {Tomato,foodMaterials,makeKnife} from './tomato.js';
import {handMaterials,makeHand,knifeGrip,dinerPerson} from './character.js';
import {dressRestaurant} from './interior.js';
const $=id=>document.getElementById(id),canvas=$('world');
const service=new Service(),coarse=matchMedia('(pointer:coarse)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('error').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.4:1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#273a37');scene.fog=new THREE.FogExp2('#1d2f29',.025);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.035,65);camera.rotation.order='YXZ';scene.add(camera);
const clock=new THREE.Clock(),colliders=[],stations=[],keys={};let running=false,started=false,cutting=false,elapsed=0,shiftTime=0,yaw=Math.PI,pitch=0,target=null,subtitleTime=0,muted=false,cutDown=false,cutCommitted=false,knifeDepth=.97,knifeX=0,knifeOffset=0,drag=null,joy={x:0,y:0},walking=false,walk=0,lastStep=0,modal=null;
let returnView=null,tomato=null,sandwich=null,servedPlate=null,currentShift=-1,heardKnock=false;
const SAVE_KEY='j-o-ultimo-pedido-progress-v1',PREF_KEY='j-o-ultimo-pedido-prefs-v1';
let menuMotionLow=false;
function storedJSON(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
function storeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function savedProgress(){const v=storedJSON(SAVE_KEY,{shift:0,complete:false});const shift=Math.max(0,Math.min(5,Number(v?.shift)||0));return{shift,complete:!!v?.complete};}
function saveCheckpoint(shift=service.shift,complete=false){storeJSON(SAVE_KEY,{shift:Math.max(0,Math.min(5,shift)),complete,updated:Date.now()});updateContinueMeta();}
function savedPrefs(){const v=storedJSON(PREF_KEY,{brightness:1.1,sound:true,motion:'full'});return{brightness:Math.max(.7,Math.min(1.6,Number(v?.brightness)||1.1)),sound:v?.sound!==false,motion:v?.motion==='low'?'low':'full'};}
function savePrefs(){storeJSON(PREF_KEY,{brightness:renderer.toneMappingExposure,sound:!muted,motion:menuMotionLow?'low':'full'});}
function updateContinueMeta(){const meta=$('continueMeta');if(!meta)return;if(started&&!service.finished){meta.textContent=`TURNO ${String(service.shift+1).padStart(2,'0')} · EM ANDAMENTO`;return;}const p=savedProgress();meta.textContent=p.complete?'TURNO 06 · CONCLUÍDO':`TURNO ${String(p.shift+1).padStart(2,'0')} · SALVO`;}
function updateSoundUI(){const text=muted?'SOM: OFF':'SOM: ON';if($('sound'))$('sound').textContent=text;if($('menuSound'))$('menuSound').textContent=text;}
function updateMotionUI(){document.body.classList.toggle('menu-motion-low',menuMotionLow);if($('menuMotion'))$('menuMotion').textContent=menuMotionLow?'ANIMAÇÃO: REDUZIDA':'ANIMAÇÃO: COMPLETA';}
function applyPreferences(){const p=savedPrefs();renderer.toneMappingExposure=p.brightness;muted=!p.sound;menuMotionLow=p.motion==='low';if($('brightness'))$('brightness').value=String(p.brightness);if($('menuBrightness'))$('menuBrightness').value=String(p.brightness);if($('brightnessValue'))$('brightnessValue').textContent=`${Math.round(p.brightness*100)}%`;updateSoundUI();updateMotionUI();}

const FOOD_SCALE=.105;
const boardCenter=new THREE.Vector3(-2.5,1.068,6.18),cutView=new THREE.Vector3(-2.26,1.63,5.72),cutLook=new THREE.Vector3(-2.5,1.087,6.15);
const food=foodMaterials();
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const steel=mat('#9da7a0',.33,.62),dark=mat('#202d27'),wood=mat('#714e32'),red=mat('#733a30'),cream=mat('#d9d2b6'),green=mat('#364f40'),black=mat('#1d2421'),wall=mat('#35584c');
function box(w,h,d,x,y,z,material=steel,parent=scene,solid=false){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);if(solid)colliders.push({x,z,w,d});return m;}
function cylinder(r,h,x,y,z,material,parent=scene){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function sign(text,w,h,x,y,z,{parent=scene,rotation=0,bg='#243d31',color='#eee5c7',font=34}={}){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(12,12,c.width-24,c.height-24);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${font*2}px Georgia`;text.split('\n').forEach((s,i,a)=>ctx.fillText(s,c.width/2,c.height/2+(i-(a.length-1)/2)*(font*2+12),c.width-50));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;}
function station(id,name,x,y,z){const s={id,name,point:new THREE.Vector3(x,y,z)};stations.push(s);return s;}
function procedural(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');let n=17;const rand=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};ctx.fillStyle=kind==='board'?'#b28a56':'#dacba4';ctx.fillRect(0,0,512,512);for(let i=0;i<1800;i++){ctx.strokeStyle=kind==='board'?`rgba(74,39,17,${rand()*.16})`:`rgba(72,61,41,${rand()*.07})`;ctx.lineWidth=.3+rand();const x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(kind==='board'?rand()*100:4),y+(kind==='board'?rand()*7:4));ctx.stroke();}if(kind==='board'){for(let i=0;i<120;i++){ctx.strokeStyle='#dcd1a626';ctx.beginPath();let x=rand()*512,y=rand()*512;ctx.moveTo(x,y);ctx.lineTo(x+rand()*180-90,y+rand()*160-80);ctx.stroke();}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
// Warm, functioning diner in the first shift. Food work light never disappears.
box(12,.16,14,0,-.12,1,cream);
for(let x=-6;x<6;x+=.5)for(let z=-6;z<8;z+=.5)box(.492,.025,.492,x+.25,-.025,z+.25,Math.round((x+z)*2)%2===0?cream:green);
box(.18,3.7,14,-6,1.8,1,wall);box(.18,3.7,14,6,1.8,1,wall);box(12,3.7,.18,0,1.8,7.8,cream);box(12,.16,14,0,3.65,1,dark);
for(const x of [-5.87,5.87]){box(.03,1,14,x,.5,1,green);box(.06,.08,14,x,1,1,wood);}
box(12,1.0,.18,0,.5,-5.9,green);box(12,.55,.18,0,3.4,-5.9,green);
const glass=new THREE.MeshPhysicalMaterial({color:'#4b707c',roughness:.15,metalness:.25,transparent:true,opacity:.42});
box(12,2.15,.06,0,2.05,-5.9,glass);for(let x=-6;x<=6;x+=3)box(.08,2.15,.13,x,2.05,-5.82,steel);
for(let i=0;i<70;i++){const streak=box(.008,.12+(i%7)*.03,.006,-5.8+(i*1.731)%11.6,1.1+(i*.617)%2,-5.85,mat('#829a9d'));streak.castShadow=false;}
sign('RESTAURANTE SÃO BENTO',4.1,.44,0,3.03,-5.78,{font:35});
// Serving counter with clear right-side passage into the dining room.
box(8.1,.96,.72,-.85,.48,1.15,green,scene,true);box(8.25,.12,.91,-.85,1,1.15,wood);box(8.15,.025,.13,-.85,1.075,1.55,steel);
for(let x=-4.6;x<3.2;x+=.33)box(.025,.8,.02,x,.49,1.525,wood);
sign('ENTREGAS',1.4,.28,-.6,1.33,1.64,{rotation:Math.PI,font:38});
station('serve','Servir no balcão',-.6,1.15,1.65);
const bell=cylinder(.11,.065,.55,1.12,1.2,steel);const bellTop=new THREE.Mesh(new THREE.SphereGeometry(.09,20,12,0,Math.PI*2,0,Math.PI/2),steel);bellTop.position.set(.55,1.15,1.2);scene.add(bellTop);
// Prep counter, tiled splashback, hanging utensils and stainless fixtures.
box(9.8,.96,1.22,0,.48,6.65,steel,scene,true);box(10,.07,1.33,0,1,6.65,steel);
for(let x=-5.5;x<5.5;x+=.5)for(let y=1.1;y<2.6;y+=.25)box(.492,.242,.02,x+.25,y,7.69,cream);
box(9,.05,.05,0,2.28,7.57,steel);
for(let i=0;i<8;i++){cylinder(.016,.29,-3.6+i*.33,2.05,7.52,steel);const utensil=new THREE.Mesh(new THREE.SphereGeometry(.05,12,8),steel);utensil.scale.set(1,1.35,.2);utensil.position.set(-3.6+i*.33,1.86,7.52);scene.add(utensil);}
const boardMat=new THREE.MeshStandardMaterial({map:procedural('board'),roughness:.74});box(.64,.035,.43,boardCenter.x,1.05,boardCenter.z,boardMat);
sign('01 / TOMATE',1.55,.22,-2.5,1.53,7.55,{rotation:Math.PI,font:35});
station('board','Cortar tomate na tábua',-2.5,1.25,6.1);
const tomatoRoot=new THREE.Group();tomatoRoot.position.copy(boardCenter);tomatoRoot.position.y+=.39*FOOD_SCALE;tomatoRoot.scale.setScalar(FOOD_SCALE);scene.add(tomatoRoot);
const knife=makeKnife();knife.position.copy(boardCenter);knife.position.y+=.13;knife.scale.setScalar(.27);scene.add(knife);
const guide=new THREE.Mesh(new THREE.PlaneGeometry(.002,.18),new THREE.MeshBasicMaterial({color:'#ffe4a0',transparent:true,opacity:.5,depthWrite:false}));guide.rotation.x=-Math.PI/2;guide.position.copy(boardCenter);guide.position.y+=.006;scene.add(guide);
const juice=new THREE.Group();juice.position.copy(boardCenter);juice.scale.setScalar(FOOD_SCALE);scene.add(juice);
const handMats=handMaterials(),rightHand=knifeGrip(handMats),leftHand=makeHand(handMats,{left:true,pose:'claw'});scene.add(rightHand,leftHand);rightHand.visible=leftHand.visible=false;
const carryRig=new THREE.Group();camera.add(carryRig);carryRig.position.set(-.15,-.24,-.46);const carryHand=makeHand(handMats,{left:true,pose:'cup'});carryHand.rotation.z=Math.PI;carryHand.position.set(0,-.057,0);carryRig.add(carryHand);const heldTomato=new Tomato([],food);heldTomato.root.scale.setScalar(FOOD_SCALE);carryRig.add(heldTomato.root);carryRig.visible=false;
let pickupTime=0;
const plateMat=new THREE.MeshStandardMaterial({color:'#efe6cb',roughness:.27});
function plate(x,y,z,parent=scene){const p=cylinder(.16,.013,x,y,z,plateMat,parent);const rim=new THREE.Mesh(new THREE.TorusGeometry(.15,.006,8,48),plateMat);rim.rotation.x=Math.PI/2;rim.position.set(x,y+.009,z);parent.add(rim);return p;}
const carryPlate=new THREE.Group();camera.add(carryPlate);carryPlate.position.set(0,-.26,-.55);plate(0,0,0,carryPlate);for(const side of [-1,1]){const hand=makeHand(handMats,{left:side<0,pose:'cup'});hand.position.set(side*.115,-.043,.03);hand.rotation.z=Math.PI;carryPlate.add(hand);}carryPlate.visible=false;
plate(.3,1.06,6.25);sign('02 / MONTAGEM',1.5,.22,.35,1.53,7.55,{rotation:Math.PI,font:35});station('assembly','Montar pão e tomate',.3,1.2,6.1);
const breadMat=new THREE.MeshStandardMaterial({map:procedural('bread'),color:'#e7bd78',roughness:.95});
for(let i=0;i<4;i++)box(.13,.022,.14,-.15,1.075+i*.022,6.37,breadMat);
box(.16,.022,.12,.7,1.065,6.4,mat('#eed18a'));for(let i=0;i<4;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),mat('#718838'));leaf.scale.set(1,.16,1.3);leaf.position.set(.9+i*.04,1.1,6.96);scene.add(leaf);}
box(1.75,.12,1.05,3.3,1.1,6.33,black);for(let i=0;i<13;i++)box(.034,.025,.95,2.55+i*.123,1.17,6.33,steel);for(let i=0;i<3;i++){const k=cylinder(.05,.05,2.7+i*.45,1.09,5.78,dark);k.rotation.x=Math.PI/2;}
sign('03 / CHAPA',1.4,.22,3.3,1.53,7.55,{rotation:Math.PI,font:35});station('grill','Usar a chapa',3.3,1.2,6.05);
box(2.2,.23,1.3,3.25,2.88,6.75,steel);box(.7,.8,.65,3.25,3.2,7.1,steel);
const steam=new THREE.Group();scene.add(steam);const steamMat=new THREE.MeshBasicMaterial({color:'#e8e3ce',transparent:true,opacity:.08,depthWrite:false});for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),steamMat);m.position.set(3.3+Math.sin(i*2.5)*.18,1.5+i*.08,6.3+Math.cos(i)*.15);m.scale.set(1,2,1);steam.add(m);}steam.visible=false;
// Ticket printer and shift clock on the left: both reachable from the main aisle.
box(.7,1.1,1.6,-5.4,.55,3.55,green,scene,true);box(.58,.24,.55,-5.3,1.21,3.5,dark);sign('COMANDA',.55,.19,-4.99,1.39,3.5,{rotation:Math.PI/2,font:37});station('ticket','Retirar comanda',-5,1.35,3.5);
sign('BATER O PONTO',.92,.3,-5.87,1.8,4.8,{rotation:Math.PI/2,font:37});station('clock','Encerrar turno / bater o ponto',-5.55,1.7,4.8);
const exitDoor=new THREE.Group();exitDoor.position.set(5.84,0,.2);scene.add(exitDoor);box(.06,2.55,1.35,0,1.275,0,wood,exitDoor);box(.06,.17,.06,-.08,1.2,.42,steel,exitDoor);sign('SAÍDA',1,.25,-.1,2.83,0,{parent:exitDoor,rotation:-Math.PI/2,font:44});station('exit','Sair do restaurante',5.4,1.5,.2);
sign('SÃO BENTO\nDESDE 1978',2.1,.75,5.87,2.2,-3.3,{rotation:-Math.PI/2,font:36});
// Diner furniture and regular guests become the later anomalies.
const chairs=[],guests=[];
function guest(x,z,angle=0){const person=dinerPerson({shirt:['#586b5d','#745d4b','#526674','#746758'][guests.length%4]});person.root.position.set(x,0,z);person.root.rotation.y=angle;scene.add(person.root);guests.push(person);return person.root;}
for(const x of [-3.4,2.8])for(const z of [-1.35,-4]){
 box(1.65,.1,1.15,x,.78,z,wood,scene,true);for(const sx of [-.65,.65])for(const sz of [-.42,.42])box(.06,.75,.06,x+sx,.38,z+sz,steel);
 for(const side of [-1,1]){const chair=new THREE.Group();chair.position.set(x,0,z+side*.94);scene.add(chair);box(.75,.11,.67,0,.45,0,red,chair);box(.75,.78,.1,0,.85,side*.3,red,chair);for(const a of [-.29,.29])for(const b of [-.25,.25])box(.04,.45,.04,a,.22,b,steel,chair);chairs.push(chair);}
 plate(x,.855,z);cylinder(.045,.2,x+.51,.92,z+.1,cream);const napkin=box(.17,.008,.21,x-.51,.847,z,cream);napkin.rotation.y=.18;
 guest(x,z-.94,0);
}
const windowGhost=guest(1.4,-6.5,0);windowGhost.scale.set(1.05,1.6,1.05);windowGhost.visible=false;
const wallWriting=sign('SEMPRE CABE MAIS UM',3.1,.3,-5.87,2.5,-2.8,{rotation:Math.PI/2,color:'#9e4834',bg:'#d9d2b6',font:33});wallWriting.visible=false;
const decor=dressRestaurant(scene,{food,wood,steel,cream,green,wall,red,chairs});station('basket','Pegar tomate da cesta',-3.55,1.15,6.10);
sign('INGREDIENTES',.75,.16,-3.62,1.4,6.72,{rotation:Math.PI,font:32});
const ambient=new THREE.HemisphereLight('#fff2d4','#48574b',1.35);scene.add(ambient);const lights=[];
function lamp(x,z,color,power){const l=new THREE.PointLight(color,power,11,2);l.position.set(x,2.95,z);scene.add(l);lights.push({light:l,base:power});cylinder(.21,.12,x,3.1,z,green);const face=cylinder(.18,.02,x,3.03,z,new THREE.MeshBasicMaterial({color:'#ffe6b6'}));return l;}
lamp(-2.5,5.9,'#fff1ce',24);lamp(2.8,5.9,'#ffecbe',28);lamp(-3.5,-2.5,'#ffd4a0',24);lamp(2.8,-2.5,'#ffd4a0',24);
const prepLight=new THREE.SpotLight('#fff3df',12,5,.95,.7,1.5);prepLight.position.set(-2.4,3.15,5.8);prepLight.target.position.copy(boardCenter);prepLight.castShadow=true;prepLight.shadow.mapSize.set(1024,1024);prepLight.shadow.bias=-.0002;prepLight.shadow.normalBias=.02;scene.add(prepLight,prepLight.target);
const redLight=new THREE.PointLight('#dc2516',0,18,1.5);redLight.position.set(0,2.4,.5);scene.add(redLight);
// Procedural sound, no downloads. Text gives all cues also when muted.
let audio=null,master=null,hum=null;
function startAudio(){if(audio){audio.resume();return;}try{audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=muted?0:.35;master.connect(audio.destination);hum=audio.createOscillator();hum.frequency.value=55;const gain=audio.createGain();gain.gain.value=.012;hum.connect(gain);gain.connect(master);hum.start();audio.resume();}catch{}}
function tone(freq,duration=.2,type='sine',volume=.12,end=freq){if(!audio||muted)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(15,end),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(audio.currentTime+duration);}
function noise(duration=.14,volume=.11,filter=900){if(!audio||muted)return;const b=audio.createBuffer(1,audio.sampleRate*duration,audio.sampleRate);const a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,1.6);const s=audio.createBufferSource();s.buffer=b;const f=audio.createBiquadFilter();f.type='lowpass';f.frequency.value=filter;const g=audio.createGain();g.gain.value=volume;s.connect(f);f.connect(g);g.connect(master);s.start();}
function say(text,duration=7){$('subtitle').textContent=text;subtitleTime=elapsed+duration;}
function resetInputs(){for(const k of Object.keys(keys))keys[k]=false;joy.x=joy.y=0;drag=null;cutDown=false;knifeOffset=0;$('stick').style.transform='';}
function releasePointer(){if(document.pointerLockElement)document.exitPointerLock?.();}
function pointer(){if(location.hostname==='127.0.0.1'&&location.search==='?qa=1')return;if(!coarse&&!cutting){try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}}}
function resetTomato(){if(tomato){tomatoRoot.remove(tomato.root);tomato.dispose();}tomato=new Tomato(service.cutPlanes,food);tomatoRoot.add(tomato.root);juice.children.slice().forEach(m=>{m.geometry.dispose();m.material.dispose();juice.remove(m);});knifeDepth=.97;knifeOffset=0;cutCommitted=false;knifeX=tomato.nextX;}
function makeSandwich(){const g=new THREE.Group();box(.61,.105,.62,0,.07,0,breadMat,g);for(let i=0;i<3;i++){const slice=cylinder(.155,.04,-.17+i*.16,.15,.18,food.skin,g);const face=new THREE.Mesh(new THREE.CircleGeometry(.153,32),food.flesh);face.rotation.x=-Math.PI/2;face.position.set(slice.position.x,.172,slice.position.z);g.add(face);}for(let i=0;i<5;i++){const mark=box(.023,.002,.22,-.23+i*.11,.124,-.18,mat('#6d3e22'),g);mark.name='toast';mark.visible=false;}const egg=new THREE.Group();egg.name='egg';egg.position.set(0,.142,-.1);const whiteMat=new THREE.MeshPhysicalMaterial({color:'#dbd3aa',transparent:true,opacity:.55,roughness:.2});for(let i=0;i<6;i++){const white=new THREE.Mesh(new THREE.SphereGeometry(.135,24,12),whiteMat);white.scale.set(1.2,.12,1);white.position.set(Math.cos(i)*.083,0,Math.sin(i)*.06);white.name='eggWhite';egg.add(white);}const yolk=new THREE.Mesh(new THREE.SphereGeometry(.083,24,12),mat('#f3ac19',.24));yolk.scale.y=.5;yolk.position.y=.026;egg.add(yolk);egg.visible=false;g.add(egg);return g;}
function setShift(){currentShift=service.shift;shiftTime=0;heardKnock=false;decor.tomatoes.forEach(t=>t.visible=true);resetTomato();if(sandwich){scene.remove(sandwich);sandwich=null;}if(servedPlate){scene.remove(servedPlate);servedPlate=null;}steam.visible=false;tomatoRoot.visible=false;knife.visible=true;carryRig.visible=false;rightHand.visible=leftHand.visible=false;guide.visible=false;wallWriting.visible=service.shift>=3;
 guests.forEach(({root,shirt,skin},i)=>{root.visible=i<4&&(service.shift<4?(i===service.shift%4):service.shift===5);if(i===4)root.visible=false;shirt.color.set(service.shift===5?'#16251f':['#5b7163','#71634c','#695762'][i%3]);skin.color.set(service.shift===5?'#27372c':'#c9a47d');if(i<4){root.scale.set(1,service.shift===5?1.36:1,1);}});
 chairs.forEach((c,i)=>c.rotation.y=service.shift>=3?(i%2===0?.23:-.23):0);
 refreshHUD();say(service.order.opening,11);tone(service.shift===5?41:660,service.shift===5?2:.18,'sine',.12,service.shift===5?30:450);
}
function refreshHUD(){const s=service.stage;const titles={ticket:'Leia a comanda.',pick:'Escolha um tomate.',carrying:'Leve à tábua.',cut:'Prepare o tomate.',assemble:'Monte o pedido.',grill:'Leve à chapa.',toasting:'O pão está tostando.',ready:'Retire da chapa.',deliver:'O pedido está pronto.',clock:'Mais um turno.',exit:'Pode ir embora.'};$('chapter').textContent=`0${service.shift+1} / 06 · ${service.order.name.toUpperCase()}`;$('goal').textContent=titles[s];$('detail').textContent=service.hint();$('shiftClock').textContent=service.order.time;$('ticket').hidden=s==='ticket';$('orderNo').textContent=`Nº ${212+service.shift}`;$('customer').textContent=service.order.customer;$('orderNote').textContent=service.order.note;$('stepCut').textContent=`Tomate: ${service.cuts}/${service.order.slices} cortes`;
 const order=['ticket','cut','assemble','grill','toasting','ready','deliver','clock','exit'];const n=order.indexOf(s);$('stepCut').classList.toggle('done',n>=2);$('stepAssemble').classList.toggle('done',n>=3);$('stepToast').classList.toggle('done',n>=6);$('stepServe').classList.toggle('done',n>=7);$('inventory').textContent=s==='carrying'?'TOMATE NA MÃO':s==='grill'?'PÃO COM TOMATE':s==='deliver'?'PRATO PRONTO':n>=2&&n<3?'TOMATE CORTADO':'MÃOS LIVRES';$('cutCount').textContent=`TOMATE · ${service.cuts} / ${service.order.slices} CORTES`;
}
function enterBoard(){returnView={position:camera.position.clone(),yaw,pitch};cutting=true;cutDown=false;knifeOffset=0;knifeDepth=.97;cutCommitted=false;resetInputs();releasePointer();document.body.classList.add('cutting');$('cutUI').hidden=false;$('cutHint').textContent='Segure e arraste para baixo. Solte para erguer a faca.';guide.visible=true;rightHand.visible=leftHand.visible=true;camera.fov=52;camera.updateProjectionMatrix();camera.position.copy(cutView);camera.lookAt(cutLook);say('Apoie a lâmina na guia. Arraste para baixo até tocar a tábua. Solte entre os cortes.',8);}
function leaveBoard(){if(!cutting)return;cutting=false;cutDown=false;document.body.classList.remove('cutting');$('cutUI').hidden=true;guide.visible=false;rightHand.visible=leftHand.visible=false;camera.fov=65;camera.updateProjectionMatrix();knifeDepth=.97;if(returnView){camera.position.copy(returnView.position);yaw=returnView.yaw;pitch=returnView.pitch;camera.rotation.set(pitch,yaw,0,'YXZ');}resetInputs();pointer();}
function pauseGame(){if(!started||!running||service.finished)return;running=false;resetInputs();$('pauseScreen').hidden=false;releasePointer();audio?.suspend();}
function resume(){if(service.finished)return;$('pauseScreen').hidden=true;running=true;clock.getDelta();startAudio();pointer();}
function showReceipt(){running=false;modal='receipt';resetInputs();releasePointer();$('receiptTitle').textContent=`PEDIDO ${212+service.shift} · ENTREGUE`;$('receiptText').textContent=service.order.receipt;$('receiptFooter').textContent=service.shift===5?'A porta SAÍDA fica à direita do balcão.':'Bata o ponto na parede esquerda para iniciar o próximo turno.';$('receiptScreen').hidden=false;}
function closeReceipt(){modal=null;$('receiptScreen').hidden=true;running=true;say(service.hint(),7);pointer();}
function doAction(){if(!running)return;if(cutting){leaveBoard();return;}if(!target){say(service.hint(),4);return;}const result=service.act(target.id);if(!result.ok){say(result.message,5);return;}
 switch(result.event){
 case 'order':tone(740,.08,'square',.03,430);noise(.25,.1,2200);say(`${service.order.customer}. ${service.order.slices} cortes de tomate. ${service.order.note}`,9);break;
 case 'tomatoPicked':pickupTime=0;carryRig.visible=true;decor.tomatoes[0].visible=false;noise(.12,.04);say('Tomate na mão. Leve até a tábua de madeira.');break;
 case 'tomatoPlaced':carryRig.visible=false;tomatoRoot.visible=true;enterBoard();noise(.1,.05);break;
 case 'board':enterBoard();break;
 case 'assembled':tomatoRoot.visible=false;knife.visible=false;sandwich=makeSandwich();sandwich.scale.setScalar(.3);sandwich.position.set(.3,1.085,6.25);scene.add(sandwich);noise(.25,.07);say('Pão e tomate. Leve à chapa para tostar e fritar o ovo.');break;
 case 'toasting':sandwich.position.set(3.3,1.19,6.3);sandwich.getObjectByName('egg').visible=true;steam.visible=true;noise(.7,.12,2500);break;
 case 'pickup':camera.add(sandwich);sandwich.position.set(0,-.255,-.55);sandwich.visible=true;carryPlate.visible=true;steam.visible=false;tone(520,.1,'sine',.04);say('Prato quente. O balcão de entrega está atrás de você.');break;
 case 'served':scene.add(sandwich);carryPlate.visible=false;sandwich.visible=true;sandwich.position.set(-.6,1.09,1.18);servedPlate=new THREE.Group();plate(0,0,0,servedPlate);servedPlate.position.set(-.6,1.085,1.18);scene.add(servedPlate);tone(1250,.7,'sine',.12,950);if(service.shift>=4)sandwich.visible=false;if(service.shift===5){guests.forEach(g=>g.root.visible=false);redLight.intensity=0;}say(service.order.after,9);showReceipt();break;
 case 'shift':saveCheckpoint(service.shift);setShift();break;
 case 'ending':running=false;saveCheckpoint(5,true);releasePointer();$('hud').hidden=true;$('ending').hidden=false;tone(440,2,'sine',.06,220);break;
 }refreshHUD();}
// Contact is required; one full downstroke can release only one slice.
function performCut(){const current=tomato.pieces[service.cuts];const localX=knifeX-(current?.offset||0);if(!service.cut(localX,knifeDepth))return false;tomato.separate();cutCommitted=true;noise(.17,.13,1350);tone(155,.07,'triangle',.09,60);
 for(let i=0;i<5;i++){const drop=new THREE.Mesh(new THREE.CircleGeometry(.011+Math.random()*.018,10),new THREE.MeshPhysicalMaterial({color:'#b84427',transparent:true,opacity:.38,roughness:.13,depthWrite:false}));drop.rotation.x=-Math.PI/2;drop.position.set(knifeX+(Math.random()-.5)*.13,.005,(Math.random()-.5)*.62);juice.add(drop);}refreshHUD();
 if(service.stage==='assemble'){$('cutHint').textContent='Tomate pronto. Veja as fatias e volte à cozinha para montar o pão.';say('O tomate está pronto. Volte à cozinha (E) e monte o pedido ao lado.',7);}return true;}
function updateKnife(dt){if(!tomato)return;const pressing=cutting&&cutDown&&!cutCommitted&&service.stage==='cut';let next=tomato.nextX;const goal=next+knifeOffset;knifeX=THREE.MathUtils.damp(knifeX,goal,18,dt);
 const desired=pressing?(drag?.kind==='cut'?drag.depth:.017):.97;knifeDepth=THREE.MathUtils.damp(knifeDepth,desired,pressing?18:11,dt);
 if(pressing&&knifeDepth<.035){if(!performCut())$('cutHint').textContent='Alinhe a lâmina com a linha clara. Solte e tente novamente.';if(drag?.released){cutDown=false;drag=null;}}
 if(!cutDown&&knifeDepth>.8){cutCommitted=false;knifeOffset=0;}
 const contact=Math.max(0,1-Math.abs(knifeDepth-.45)/.38);tomato.update(dt,pressing?contact:0);
 knife.position.set(boardCenter.x+knifeX*FOOD_SCALE,boardCenter.y+knifeDepth*.13-.006,boardCenter.z);knife.rotation.x=pressing?-.045:0;guide.position.x=boardCenter.x+next*FOOD_SCALE;guide.visible=cutting&&service.stage==='cut';$('cutProgress').style.width=`${Math.max(0,Math.min(1,1-knifeDepth/.97))*100}%`;
 rightHand.position.set(knife.position.x,knife.position.y+.15*.27,boardCenter.z-.60*.27);rightHand.rotation.x=knife.rotation.x;
 leftHand.position.set(boardCenter.x+.058+Math.min(service.cuts,5)*.003,boardCenter.y+.087,boardCenter.z-.045);leftHand.rotation.set(.12,Math.PI-.3,.08);leftHand.visible=rightHand.visible=cutting;
 if(!cutting){knife.position.set(boardCenter.x+.20,boardCenter.y+.015,boardCenter.z-.01);knife.rotation.z=-Math.PI/2;knife.rotation.y=-.2;}else{knife.rotation.z=0;knife.rotation.y=0;}
}
function canMove(x,z){if(Math.abs(x)>5.7||z<-5.6||z>7.5)return false;return !colliders.some(c=>Math.abs(x-c.x)<c.w/2+.23&&Math.abs(z-c.z)<c.d/2+.23);}
const facing=new THREE.Vector3();
function findTarget(){if(cutting)return;camera.getWorldDirection(facing);let best=Infinity;target=null;for(const s of stations){const delta=s.point.clone().sub(camera.position);const distance=delta.length();const dot=delta.normalize().dot(facing);if(distance<2.15&&dot>.6&&distance<best){target=s;best=distance;}}$('reticle').classList.toggle('active',!!target);$('prompt').textContent=target?`${coarse?'USAR':'[ E ]'} · ${target.name}`:'';}
function updateMood(dt){shiftTime+=dt;const sh=service.shift;const levels=[1,.91,.78,.6,.38,.25];ambient.intensity=sh===5&&service.stage==='exit'?.85:1.35*levels[sh];for(let i=0;i<lights.length;i++){let power=i<2?Math.max(.75,levels[sh]):levels[sh];if(!reduced&&sh>=1&&i===2)power*=.86+.14*Math.sin(shiftTime*(sh===1?.7:1.4));lights[i].light.intensity=lights[i].base*power;}
 redLight.intensity=sh===5&&service.stage!=='exit'?15+(reduced?0:Math.sin(shiftTime*.7)*3):0;windowGhost.visible=sh===2&&shiftTime>13&&shiftTime<25;
 if(sh===2&&!heardKnock&&shiftTime>13){heardKnock=true;tone(90,.2,'triangle',.14,35);say('TOC. TOC. TOC. Alguém está do lado de fora da janela.',8);}
 if(sh===4&&!heardKnock&&shiftTime>18){heardKnock=true;noise(.3,.09,430);say('Passos no salão. Todas as mesas continuam vazias.',8);}
 if(sh===5&&service.stage==='cut'&&!heardKnock&&service.cuts>=2){heardKnock=true;tone(37,2.5,'sawtooth',.025,29);say('As cadeiras arrastam ao mesmo tempo. Continue. Não leve o prato para você.',9);guests.forEach(({root},i)=>{if(i<4)root.rotation.y=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z);});}
 if(service.stage==='toasting'){sandwich?.traverse(o=>{if(o.name==='eggWhite'){o.material.opacity=.55+.45*Math.min(1,service.toast/5);o.material.color.lerp(new THREE.Color('#fff2ce'),dt*.4);}});steam.children.forEach((m,i)=>{m.position.y=1.4+((elapsed*.35+i*.13)%.8);m.scale.x=1+(m.position.y-1.4);});if(Math.floor(elapsed*3)!==Math.floor((elapsed-dt)*3))noise(.2,.025,2700);}
}
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(running){elapsed+=dt;updateMood(dt);if(service.update(dt)){steam.visible=false;sandwich?.traverse(o=>{if(o.name==='toast')o.visible=true;});tone(830,.25,'sine',.06);say('O pão está dourado. Recolha o pedido da chapa.');refreshHUD();}
 if(cutting){if(keys.ArrowLeft)knifeOffset=Math.max(-.16,knifeOffset-dt*.3);if(keys.ArrowRight)knifeOffset=Math.min(.16,knifeOffset+dt*.3);camera.position.lerp(cutView,1-Math.exp(-dt*12));camera.lookAt(cutLook);}
 else{let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+joy.y,r=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;const len=Math.hypot(f,r);if(len>1){f/=len;r/=len;}if(keys.ArrowLeft)yaw+=dt*1.5;if(keys.ArrowRight)yaw-=dt*1.5;const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*dt*2.7,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dt*2.7;walking=Math.abs(f)+Math.abs(r)>.01;if(canMove(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canMove(camera.position.x,camera.position.z+dz))camera.position.z+=dz;walk+=walking?dt*8:0;camera.position.y=1.67+(walking&&!reduced?Math.sin(walk)*.012:0);camera.rotation.set(pitch,yaw,0,'YXZ');if(walking&&elapsed-lastStep>.46){lastStep=elapsed;noise(.055,.028,250);}findTarget();}
 updateKnife(dt);carryRig.visible=service.stage==='carrying';if(carryRig.visible){pickupTime=Math.min(1,pickupTime+dt*2);carryRig.position.y=-.24-Math.sin((1-pickupTime)*Math.PI/2)*.25+(walking?Math.sin(walk)*.004:0);}if(elapsed>subtitleTime)$('subtitle').textContent='';}
 if(!started){camera.position.set(4.8,1.83,-3.6);camera.lookAt(-1.4,1.2,3.2);tomato?.update(dt);}
 renderer.render(scene,camera);}
// Mouse, keyboard and touch share the same actions and cutting contact rules.
function closeMenuPanels(){for(const id of ['menuSettings','menuStory','menuExit'])$(id).hidden=true;}
function animateMenuButton(button,after,{leave=false}={}){if(!button)return after?.();startAudio();tone(310,.055,'triangle',.025,225);button.classList.add('menu-click');if(leave){$('menu').classList.add('menu-transition');document.querySelector('.menu-nav')?.classList.add('menu-leaving');}const wait=(reduced||menuMotionLow)?40:leave?430:250;setTimeout(()=>{button.classList.remove('menu-click');after?.();},wait);}
function openMenuPanel(id,button){animateMenuButton(button,()=>{closeMenuPanels();$(id).hidden=false;$(id).querySelector('button,input')?.focus();});}
function resetSessionState(shift=0){running=false;resetInputs();releasePointer();cutting=false;cutDown=false;modal=null;document.body.classList.remove('cutting');$('cutUI').hidden=true;$('pauseScreen').hidden=true;$('receiptScreen').hidden=true;$('ending').hidden=true;service.shift=Math.max(0,Math.min(5,shift));service.stage='ticket';service.cuts=0;service.toast=0;service.finished=false;currentShift=-1;}
function enterGame(shift=0,{resetSave=false}={}){resetSessionState(shift);if(resetSave)saveCheckpoint(0,false);else saveCheckpoint(service.shift,false);started=true;running=true;closeMenuPanels();$('sessionEnded').hidden=true;$('menu').hidden=true;$('menu').classList.remove('menu-transition');document.querySelector('.menu-nav')?.classList.remove('menu-leaving');$('hud').hidden=false;camera.position.set(-3.25,1.67,3.6);yaw=Math.PI/2;pitch=-.04;camera.rotation.set(pitch,yaw,0,'YXZ');setShift();startAudio();clock.getDelta();pointer();}
function continueGame(){if(started&&!service.finished){closeMenuPanels();$('sessionEnded').hidden=true;$('menu').hidden=true;$('hud').hidden=false;$('pauseScreen').hidden=true;running=true;clock.getDelta();startAudio();pointer();return;}const p=savedProgress();enterGame(p.complete?5:p.shift);}
function returnToMainMenu(){if(started&&!service.finished)saveCheckpoint(service.shift,false);running=false;resetInputs();releasePointer();audio?.suspend();$('pauseScreen').hidden=true;$('receiptScreen').hidden=true;$('hud').hidden=true;$('menu').hidden=false;$('menu').classList.remove('menu-transition');document.querySelector('.menu-nav')?.classList.remove('menu-leaving');closeMenuPanels();$('sessionEnded').hidden=true;updateContinueMeta();setTimeout(()=>$('continueGame')?.focus(),40);}
function newTurn(){enterGame(0,{resetSave:true});}

const menuButtons=[...document.querySelectorAll('.menu-action')];
menuButtons.forEach(button=>{const select=()=>{menuButtons.forEach(b=>b.classList.toggle('selected',b===button));};button.addEventListener('pointerenter',select);button.addEventListener('focus',select);});
$('continueGame').onclick=()=>animateMenuButton($('continueGame'),continueGame,{leave:true});
$('newTurn').onclick=()=>animateMenuButton($('newTurn'),newTurn,{leave:true});
$('openSettings').onclick=()=>openMenuPanel('menuSettings',$('openSettings'));
$('openStory').onclick=()=>openMenuPanel('menuStory',$('openStory'));
$('exitGame').onclick=()=>openMenuPanel('menuExit',$('exitGame'));
document.querySelectorAll('[data-menu-close]').forEach(b=>b.onclick=()=>{closeMenuPanels();$('continueGame')?.focus();});
$('confirmExit').onclick=()=>{if(started&&!service.finished)saveCheckpoint(service.shift,false);running=false;releasePointer();audio?.suspend();closeMenuPanels();document.querySelector('.menu-nav').hidden=true;document.querySelector('.menu-foot').hidden=true;$('sessionEnded').hidden=false;try{window.close();}catch{}};
$('reopenMenu').onclick=()=>{$('sessionEnded').hidden=true;document.querySelector('.menu-nav').hidden=false;document.querySelector('.menu-foot').hidden=false;updateContinueMeta();$('continueGame')?.focus();};
$('menuFromPause').onclick=returnToMainMenu;
$('pause').onclick=pauseGame;$('resume').onclick=resume;$('use').onclick=doAction;$('leaveBoard').onclick=doAction;$('closeReceipt').onclick=closeReceipt;
$('restart').onclick=()=>enterGame(0,{resetSave:true});$('again').onclick=()=>{ $('ending').hidden=true;$('menu').hidden=false;started=false;updateContinueMeta(); };
$('menuBrightness').oninput=e=>{const v=Number(e.target.value);renderer.toneMappingExposure=v;$('brightness').value=String(v);$('brightnessValue').textContent=`${Math.round(v*100)}%`;savePrefs();};
$('brightness').oninput=e=>{const v=Number(e.target.value);renderer.toneMappingExposure=v;$('menuBrightness').value=String(v);$('brightnessValue').textContent=`${Math.round(v*100)}%`;savePrefs();};
function toggleSound(){muted=!muted;if(master)master.gain.value=muted?0:.35;updateSoundUI();savePrefs();}
$('sound').onclick=toggleSound;$('menuSound').onclick=toggleSound;
$('menuMotion').onclick=()=>{menuMotionLow=!menuMotionLow;updateMotionUI();savePrefs();};
applyPreferences();updateContinueMeta();
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(!$('menu').hidden){closeMenuPanels();$('continueGame')?.focus();return;}if(modal)closeReceipt();else if(running)pauseGame();else if(started&&!service.finished)resume();return;}if(!running)return;keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)doAction();if(e.code==='Space'&&cutting&&!e.repeat){cutDown=true;drag=null;}});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')cutDown=false;});
canvas.addEventListener('pointerdown',e=>{if(!running)return;canvas.setPointerCapture(e.pointerId);if(cutting){if(service.stage!=='cut')return;cutDown=true;drag={kind:'cut',id:e.pointerId,startX:e.clientX,startY:e.clientY,depth:.97};}else{drag={kind:'look',id:e.pointerId,x:e.clientX,y:e.clientY};if(e.pointerType==='mouse')pointer();}});
window.addEventListener('pointermove',e=>{if(!running)return;if(cutting){if(drag?.kind==='cut'&&drag.id===e.pointerId){drag.depth=THREE.MathUtils.clamp(.97-(e.clientY-drag.startY)/Math.min(innerHeight*.28,190),.014,.97);if(knifeDepth>.65)knifeOffset=THREE.MathUtils.clamp((e.clientX-drag.startX)/700,-.16,.16);}return;}let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(drag?.kind==='look'&&drag.id===e.pointerId){dx=e.clientX-drag.x;dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;}yaw-=dx*.0026;pitch=THREE.MathUtils.clamp(pitch-dy*.0026,-1.2,1.2);});
const endPointer=e=>{if(drag?.id===e.pointerId){if(e.type==='pointerup'&&drag.kind==='cut'&&drag.depth<.035&&!cutCommitted){drag.released=true;return;}drag=null;cutDown=false;}};window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);
const joyEl=$('joystick');function joyMove(e){const r=joyEl.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const len=Math.hypot(x,y);if(len>34){x*=34/len;y*=34/len;}joy.x=x/34;joy.y=-y/34;$('stick').style.transform=`translate(${x}px,${y}px)`;}let joyId=null;joyEl.onpointerdown=e=>{joyId=e.pointerId;joyEl.setPointerCapture(e.pointerId);joyMove(e);};joyEl.onpointermove=e=>{if(joyId===e.pointerId)joyMove(e);};joyEl.onpointerup=joyEl.onpointercancel=()=>{joyId=null;joy.x=joy.y=0;$('stick').style.transform='';};
window.addEventListener('blur',pauseGame);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&running&&!cutting&&!coarse)pauseGame();});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('error',e=>{console.error('Sexto Turno:',e.message);$('error').hidden=false;$('errorText').textContent='Não foi possível continuar. Recarregue o jogo. '+e.message;});
resetTomato();frame();

// Read-only progress for accessibility/agents; no play-skipping controls in the shipped UI.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_restaurant_progress',description:'Lê turno, pedido, cortes e objetivo do restaurante sem alterar a partida.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){return{title:'O Último Pedido — Sexto Turno',version:11,shift:service.shift+1,totalShifts:6,stage:service.stage,cuts:service.cuts,requiredCuts:service.order.slices,objective:service.hint(),paused:!running,finished:service.finished};}})).catch(()=>{});}catch{}}
// Local-only integration fixture. Not enabled at the hosted origin.
if(location.hostname==='127.0.0.1'&&location.search==='?qa=1')import('./tests/browser-check.js').then(({install})=>install({service,start:()=>enterGame(0,{resetSave:true}),action:id=>{if(cutting){doAction();return;}const s=stations.find(s=>s.id===id);camera.position.set(s.point.x,1.67,s.point.z-1);if(id==='ticket'||id==='clock')camera.position.set(-4.15,1.67,s.point.z);if(id==='serve')camera.position.set(-.6,1.67,2.65);if(id==='exit')camera.position.set(4.35,1.67,.2);camera.lookAt(s.point);yaw=camera.rotation.y;pitch=camera.rotation.x;findTarget();window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE',bubbles:true}));},closeReceipt,cutting:()=>cutting,knife:()=>knifeDepth,tomato:()=>tomato,canMove}));
