import test from 'node:test';
import assert from 'node:assert/strict';
import {Service,SHIFTS} from '../state.js';
import {Tomato,bandGeometry} from '../tomato.js';
import * as THREE from '../vendor/three.module.min.js';

test('Six complete shifts, guarded stations, finite cuts, ending',()=>{
 const s=new Service();assert.equal(SHIFTS.length,6);
 for(let shift=0;shift<6;shift++){
  assert.equal(s.shift,shift);assert.equal(s.act('serve').ok,false);
  assert.equal(s.act('ticket').event,'order');
  assert.equal(s.act('board').ok,false);assert.equal(s.act('basket').event,'tomatoPicked');assert.equal(s.stage,'carrying');assert.equal(s.act('board').event,'tomatoPlaced');
  assert.equal(s.cut(NaN,0),false);assert.equal(s.cut(s.cutPlanes[0],NaN),false);
  assert.equal(s.cut(s.cutPlanes[0],.4),false);assert.equal(s.cut(9,0),false);
  for(const plane of s.cutPlanes)assert.equal(s.cut(plane,.02),true);
  assert.equal(s.stage,'assemble');assert.equal(s.cut(0,0),false);
  assert.equal(s.act('grill').ok,false);assert.equal(s.act('assembly').event,'assembled');
  assert.equal(s.act('grill').event,'toasting');assert.equal(s.update(-2),false);assert.equal(s.toast,0);
  assert.equal(s.update(5.9),false);assert.equal(s.act('grill').ok,false);
  assert.equal(s.update(.2),true);assert.equal(s.act('grill').event,'pickup');
  assert.equal(s.act('serve').event,'served');
  if(shift<5){assert.equal(s.act('exit').ok,false);assert.equal(s.act('clock').event,'shift');}
 }
 assert.equal(s.stage,'exit');assert.equal(s.act('clock').ok,false);
 assert.equal(s.act('exit').event,'ending');assert.equal(s.finished,true);
 assert.equal(s.act('ticket').ok,false);
});
test('Tomato is curved indexed 3D geometry with independent internal cut faces',()=>{
 const g=bandGeometry(-.2,.2),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++)assert.ok(Math.abs(Math.hypot(p.getX(i),p.getY(i),p.getZ(i))-.39)<1e-6);
 assert.ok(g.index.count>1000);
 const material=new THREE.MeshBasicMaterial(),t=new Tomato([-.2,0,.2],{skin:material,flesh:material,stem:material});
 assert.equal(t.pieces.length,4);assert.ok(t.pieces.every(p=>p.faces.every(f=>!f.visible)));
 t.separate();assert.equal(t.pieces[0].faces[1].visible,true);assert.equal(t.pieces[1].faces[0].visible,true);
 for(let i=0;i<90;i++)t.update(1/60);
 assert.ok(t.pieces[0].offset<-.12);assert.ok(t.pieces[1].offset>.05);
 t.separate();t.separate();t.separate();assert.equal(t.cuts,3);t.dispose();g.dispose();material.dispose();
});
