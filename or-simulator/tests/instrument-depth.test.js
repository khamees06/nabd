import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstrumentDepth } from '../src/instrument-depth.js';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  copy(v){return this.set(v.x,v.y,v.z);}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}
  normalize(){const n=Math.sqrt(this.lengthSq())||1;this.x/=n;this.y/=n;this.z/=n;return this;}
  crossVectors(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);}
  applyAxisAngle(axis,angle){
    const n=axis.clone().normalize(), c=Math.cos(angle), s=Math.sin(angle);
    const dot=this.x*n.x+this.y*n.y+this.z*n.z;
    const cx=n.y*this.z-n.z*this.y, cy=n.z*this.x-n.x*this.z, cz=n.x*this.y-n.y*this.x;
    return this.set(this.x*c+cx*s+n.x*dot*(1-c),this.y*c+cy*s+n.y*dot*(1-c),this.z*c+cz*s+n.z*dot*(1-c));
  }
  distanceTo(v){return Math.sqrt((this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2);}
}
class Plane { constructor(normal,constant){this.normal=normal;this.constant=constant;} }

function makeHarness(){
  const port=new Vec3(0.08,1.11,-0.15);
  const camera={position:new Vec3(0.78,1.6,0.2),localToWorld:(v)=>v.add(new Vec3(0.78,1.6,0.2))};
  const crew={last:null,driveHand(){return true;},aimInstrument(side,tip,direction,roll){this.last={side,tip:tip.clone(),direction:direction.clone(),roll};return true;}};
  let cursor=new Vec3(port.x,port.y,port.z);
  const line={intersectPlane(_plane,target){return target.copy(cursor);}};
  const controller=createInstrumentDepth({Vector3:Vec3,Plane,crew,camera,getPort:()=>port,getHeight:()=>port.y,updateUI(){}});
  return {port,camera,crew,line,controller,setCursor:(x,y,z)=>{cursor=new Vec3(x,y,z);}};
}

test('scope must align to the selected port before insertion',()=>{
  const h=makeHarness();
  h.setCursor(h.port.x+0.2,h.port.y,h.port.z);
  h.controller.drive(h.line,'right',false);
  assert.equal(h.controller.aligned,false);
  assert.equal(h.controller.adjust(0.04),false);
  assert.equal(h.controller.inserted,false);
});

test('scope pivots around the selected port after insertion; roll is independent',()=>{
  const h=makeHarness();
  h.controller.drive(h.line,'right',false);
  assert.equal(h.controller.aligned,true);
  assert.equal(h.controller.adjust(0.05),true);
  assert.equal(h.controller.inserted,true);
  assert.ok(Math.abs(h.crew.last.tip.distanceTo(h.port) - 0.038) < 1e-8);
  h.setCursor(h.port.x+0.10,h.port.y,h.port.z+0.08);
  h.controller.drive(h.line,'right',false);
  assert.notEqual(h.controller.angles.yaw,0);
  assert.notEqual(h.controller.angles.pitch,0);
  const expected=h.controller.angles.insertion-0.012;
  assert.ok(Math.abs(h.crew.last.tip.distanceTo(h.port)-expected)<1e-8);
  const tipBeforeRoll = h.crew.last.tip.clone();
  h.controller.adjustRoll(Math.PI/6);
  assert.equal(h.crew.last.tip.distanceTo(tipBeforeRoll),0);
  assert.equal(h.controller.angles.roll,30);
  assert.ok(Math.abs(h.crew.last.roll-Math.PI/6)<1e-8);
});
