import test from 'node:test';
import assert from 'node:assert/strict';
import { createScopeFeed } from '../src/scope-feed.js';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
}
class Quaternion { constructor(value='identity'){this.value=value;} copy(v){this.value=v.value;return this;} }
class Scene { constructor(){this.children=[];} add(v){this.children.push(v);} }
class Geometry { constructor(...args){this.args=args;} }
class Material { constructor(options){this.options=options;this.color={setHex:(v)=>{this.hex=v;}};this.side=options.side;} }
class Mesh { constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vec3();this.scale=new Vec3(1,1,1);this.isMesh=true;} }
class Camera { constructor(){this.position=new Vec3();this.quaternion=new Quaternion();this.lookTarget=null;} lookAt(...v){this.lookTarget=v;} updateMatrixWorld(){} }
class Light { constructor(...args){this.args=args;this.position=new Vec3();} }
class RenderTarget { constructor(width,height){this.width=width;this.height=height;this.texture={};} dispose(){this.disposed=true;} }
class CanvasTexture { constructor(canvas){this.canvas=canvas;this.colorSpace=null;} dispose(){this.disposed=true;} }
function createCanvas(){const ctx={fillRect(){},fillText(){},set fillStyle(v){},set font(v){},set textAlign(v){}};return {width:0,height:0,getContext:()=>ctx};}

test('both tower displays share a live render target and camera follows the scope tip',()=>{
  const renders=[];
  const renderer={getRenderTarget(){return this.target;},setRenderTarget(target){this.target=target;},clear(){},render(scene,camera){renders.push({scene,camera});}};
  const feed=createScopeFeed({renderer,RenderTarget,Scene,PerspectiveCamera:Camera,SphereGeometry:Geometry,Mesh,MeshStandardMaterial:Material,AmbientLight:Light,DirectionalLight:Light,Vector3:Vec3,DoubleSide:2,SRGBColorSpace:'srgb',CanvasTexture,createCanvas});
  const first={material:{}}, second={material:{}};
  feed.attach([first,second]);
  assert.equal(first.material.map,feed.noSignalTexture);
  assert.equal(second.material.map,feed.noSignalTexture);
  const crew={tool:{quaternion:new Quaternion('scope-orientation')},getToolTip:()=>new Vec3(0.1,1.1,-0.1)};
  feed.render(crew,true);
  assert.equal(first.material.map,feed.target.texture);
  assert.equal(second.material.map,feed.target.texture);
  assert.ok(Math.abs(feed.camera.position.x-0.1)<1e-9);
  assert.ok(Math.abs(feed.camera.position.y-0.1)<1e-9);
  assert.ok(Math.abs(feed.camera.position.z-0.05)<1e-9);
  assert.equal(feed.camera.quaternion.value,'scope-orientation');
  assert.equal(renders.length,1);
  const previousTarget = {};
  renderer.setRenderTarget(previousTarget);
  const movedPort = new Vec3(0.12,1.15,-0.16);
  feed.render(crew,true,movedPort);
  assert.ok(feed.live);
  assert.ok(Math.abs(feed.camera.position.y+0.05)<1e-9);
  assert.equal(renderer.getRenderTarget(),previousTarget);
  feed.render(crew,true,new Vec3(0.12,1.09,-0.16));
  assert.equal(feed.live,false);
  assert.equal(first.material.map,feed.noSignalTexture);
  assert.equal(renders.length,2);
  feed.render(crew,false);
  assert.equal(first.material.map,feed.noSignalTexture);
  assert.equal(second.material.map,feed.noSignalTexture);
});
