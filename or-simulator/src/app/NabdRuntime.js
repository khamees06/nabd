import { createForearmContact } from '../interaction/ForearmContact.js';
import { createInstrumentDepth } from '../instruments/InstrumentKinematics.js';
import { createWorkWalk } from '../core/WorkstationNavigation.js';
import { createAbdomenSurface } from '../patient/AbdomenSurface.js';
import { installSkinPickCache, skinPickCacheStats } from '../patient/SkinPickCache.js';
import { loadInternalAnatomy } from '../patient/InternalAnatomy.js';
import { createBedside } from '../interaction/BedsideInteraction.js';
import { loadCrew } from '../staff/CrewController.js';
import { createVitals } from '../ui/MonitorUI.js';
import { createScopeFeed } from '../instruments/EndoscopeFeed.js';
import { createSceneManager } from '../core/SceneManager.js';
import { createEventBus } from '../core/EventBus.js';
import { SimulationManager } from '../simulation/SimulationManager.js';
import { createDiagnosticsPanel } from '../ui/DiagnosticsPanel.js';

const nabdEventBus = createEventBus();
const nabdSimulation = new SimulationManager({ eventBus: nabdEventBus });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'NabdSimulation', {
    configurable: true,
    value: Object.freeze({
      getState: () => nabdSimulation.snapshot(),
      getEvents: () => nabdSimulation.getEvents(),
      exportEvents: () => nabdSimulation.logger.exportJSON(),
      clear: () => nabdSimulation.reset(),
    }),
  });
}

(()=>{var hi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ui={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Lh=0,Sc=1,Dh=2;var vr=1,Nh=2,Dn=3,mn=0,kt=1,rn=2,Kn=0,Si=1,bc=2,Ec=3,Tc=4,Uh=5,ai=100,Fh=101,Oh=102,Bh=103,zh=104,kh=200,Hh=201,Vh=202,Gh=203,ro=204,oo=205,Wh=206,Xh=207,qh=208,Yh=209,Zh=210,Kh=211,Jh=212,$h=213,jh=214,To=0,wo=1,Ao=2,bi=3,Ro=4,Co=5,Io=6,Po=7,wc=0,Qh=1,eu=2,Jn=0,tu=1,nu=2,iu=3,Lo=4,su=5,ru=6,ou=7,hc="attached",au="detached",Ac=300,Di=301,Ni=302,Do=303,No=304,Mr=306,gn=1e3,bn=1001,os=1002,Rt=1003,Uo=1004;var Ui=1005;var Ct=1006,Ms=1007;var yn=1008;var vn=1009,Rc=1010,Cc=1011,Ss=1012,Fo=1013,di=1014,on=1015,bs=1016,Oo=1017,Bo=1018,Es=1020,Ic=35902,Pc=35899,Lc=1021,Dc=1022,en=1023,as=1026,Ts=1027,ws=1028,zo=1029,Nc=1030,ko=1031;var Ho=1033,Sr=33776,br=33777,Er=33778,Tr=33779,Vo=35840,Go=35841,Wo=35842,Xo=35843,qo=36196,Yo=37492,Zo=37496,Ko=37808,Jo=37809,$o=37810,jo=37811,Qo=37812,ea=37813,ta=37814,na=37815,ia=37816,sa=37817,ra=37818,oa=37819,aa=37820,ca=37821,la=36492,ha=36494,ua=36495,da=36283,fa=36284,pa=36285,ma=36286;var Ei=2300,Ti=2301,so=2302,uc=2400,dc=2401,fc=2402,cu=2500;var Uc=0,wr=1,As=2,lu=3200,hu=3201;var Fc=0,uu=1,$n="",ut="srgb",It="srgb-linear",Xs="linear",Qe="srgb";var Mi=7680;var pc=519,du=512,fu=513,pu=514,Oc=515,mu=516,gu=517,_u=518,xu=519,ao=35044;var Bc="300 es",fn=2e3,qs=2001;var Tn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}},Lt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Zl=1234567,Gs=Math.PI/180,wi=180/Math.PI;function pn(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Lt[s&255]+Lt[s>>8&255]+Lt[s>>16&255]+Lt[s>>24&255]+"-"+Lt[e&255]+Lt[e>>8&255]+"-"+Lt[e>>16&15|64]+Lt[e>>24&255]+"-"+Lt[t&63|128]+Lt[t>>8&255]+"-"+Lt[t>>16&255]+Lt[t>>24&255]+Lt[n&255]+Lt[n>>8&255]+Lt[n>>16&255]+Lt[n>>24&255]).toLowerCase()}function We(s,e,t){return Math.max(e,Math.min(t,s))}function zc(s,e){return(s%e+e)%e}function Sd(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function bd(s,e,t){return s!==e?(t-s)/(e-s):0}function Ws(s,e,t){return(1-t)*s+t*e}function Ed(s,e,t,n){return Ws(s,e,1-Math.exp(-t*n))}function Td(s,e=1){return e-Math.abs(zc(s,e*2)-e)}function wd(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function Ad(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Rd(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Cd(s,e){return s+Math.random()*(e-s)}function Id(s){return s*(.5-Math.random())}function Pd(s){s!==void 0&&(Zl=s);let e=Zl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ld(s){return s*Gs}function Dd(s){return s*wi}function Nd(s){return(s&s-1)===0&&s!==0}function Ud(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Fd(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Od(s,e,t,n,i){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+n)/2),u=o((e+n)/2),h=r((e-n)/2),d=o((e-n)/2),p=r((n-e)/2),g=o((n-e)/2);switch(i){case"XYX":s.set(a*u,l*h,l*d,a*c);break;case"YZY":s.set(l*d,a*u,l*h,a*c);break;case"ZXZ":s.set(l*h,l*d,a*u,a*c);break;case"XZX":s.set(a*u,l*g,l*p,a*c);break;case"YXY":s.set(l*p,a*u,l*g,a*c);break;case"ZYZ":s.set(l*g,l*p,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function dn(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function $e(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}var Pt={DEG2RAD:Gs,RAD2DEG:wi,generateUUID:pn,clamp:We,euclideanModulo:zc,mapLinear:Sd,inverseLerp:bd,lerp:Ws,damp:Ed,pingpong:Td,smoothstep:wd,smootherstep:Ad,randInt:Rd,randFloat:Cd,randFloatSpread:Id,seededRandom:Pd,degToRad:Ld,radToDeg:Dd,isPowerOfTwo:Nd,ceilPowerOfTwo:Ud,floorPowerOfTwo:Fd,setQuaternionFromProperEuler:Od,normalize:$e,denormalize:dn},Ie=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},tt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let l=n[i+0],c=n[i+1],u=n[i+2],h=n[i+3],d=r[o+0],p=r[o+1],g=r[o+2],_=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=p,e[t+2]=g,e[t+3]=_;return}if(h!==_||l!==d||c!==p||u!==g){let m=1-a,f=l*d+c*p+u*g+h*_,b=f>=0?1:-1,E=1-f*f;if(E>Number.EPSILON){let C=Math.sqrt(E),R=Math.atan2(C,f*b);m=Math.sin(m*R)/C,a=Math.sin(a*R)/C}let v=a*b;if(l=l*m+d*v,c=c*m+p*v,u=u*m+g*v,h=h*m+_*v,m===1-a){let C=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=C,c*=C,u*=C,h*=C}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,r,o){let a=n[i],l=n[i+1],c=n[i+2],u=n[i+3],h=r[o],d=r[o+1],p=r[o+2],g=r[o+3];return e[t]=a*g+u*h+l*p-c*d,e[t+1]=l*g+u*d+c*h-a*p,e[t+2]=c*g+u*p+a*d-l*h,e[t+3]=u*g-a*h-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(i/2),h=a(r/2),d=l(n/2),p=l(i/2),g=l(r/2);switch(o){case"XYZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"YXZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"ZXY":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"ZYX":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"YZX":this._x=d*u*h+c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h-d*p*g;break;case"XZY":this._x=d*u*h-c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(r-c)*p,this._z=(o-i)*p}else if(n>a&&n>h){let p=2*Math.sqrt(1+n-a-h);this._w=(u-l)/p,this._x=.25*p,this._y=(i+o)/p,this._z=(r+c)/p}else if(a>h){let p=2*Math.sqrt(1+a-n-h);this._w=(r-c)/p,this._x=(i+o)/p,this._y=.25*p,this._z=(l+u)/p}else{let p=2*Math.sqrt(1+h-n-a);this._w=(o-i)/p,this._x=(r+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+o*a+i*c-r*l,this._y=i*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-i*a,this._w=o*u-n*a-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let p=1-t;return this._w=p*o+t*this._w,this._x=p*n+t*this._x,this._y=p*i+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-t)*u)/c,d=Math.sin(t*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=i*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Kl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Kl.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*i-a*n),u=2*(a*t-r*i),h=2*(r*n-o*t);return this.x=t+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=i+l*h+r*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=i*l-r*a,this.y=r*o-n*l,this.z=n*a-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Oa.copy(this).projectOnVector(e),this.sub(Oa)}reflect(e){return this.sub(Oa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Oa=new L,Kl=new tt,ke=class s{constructor(e,t,n,i,r,o,a,l,c){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,l,c)}set(e,t,n,i,r,o,a,l,c){let u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],p=n[5],g=n[8],_=i[0],m=i[3],f=i[6],b=i[1],E=i[4],v=i[7],C=i[2],R=i[5],I=i[8];return r[0]=o*_+a*b+l*C,r[3]=o*m+a*E+l*R,r[6]=o*f+a*v+l*I,r[1]=c*_+u*b+h*C,r[4]=c*m+u*E+h*R,r[7]=c*f+u*v+h*I,r[2]=d*_+p*b+g*C,r[5]=d*m+p*E+g*R,r[8]=d*f+p*v+g*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-n*r*u+n*a*l+i*r*c-i*o*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,d=a*l-u*r,p=c*r-o*l,g=t*h+n*d+i*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/g;return e[0]=h*_,e[1]=(i*c-u*n)*_,e[2]=(a*n-i*o)*_,e[3]=d*_,e[4]=(u*t-i*l)*_,e[5]=(i*r-a*t)*_,e[6]=p*_,e[7]=(n*l-c*t)*_,e[8]=(o*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-i*c,i*l,-i*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ba.makeScale(e,t)),this}rotate(e){return this.premultiply(Ba.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ba.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ba=new ke;function kc(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function cs(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function yu(){let s=cs("canvas");return s.style.display="block",s}var Jl={};function ls(s){s in Jl||(Jl[s]=!0,console.warn(s))}function vu(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var $l=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),jl=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Bd(){let s={enabled:!0,workingColorSpace:It,spaces:{},convert:function(i,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Qe&&(i.r=Wn(i.r),i.g=Wn(i.g),i.b=Wn(i.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Qe&&(i.r=rs(i.r),i.g=rs(i.g),i.b=rs(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===$n?Xs:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,o){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return ls("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return ls("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[It]:{primaries:e,whitePoint:n,transfer:Xs,toXYZ:$l,fromXYZ:jl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:ut},outputColorSpaceConfig:{drawingBufferColorSpace:ut}},[ut]:{primaries:e,whitePoint:n,transfer:Qe,toXYZ:$l,fromXYZ:jl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:ut}}}),s}var Ye=Bd();function Wn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function rs(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var Xi,co=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Xi===void 0&&(Xi=cs("canvas")),Xi.width=e.width,Xi.height=e.height;let i=Xi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=Xi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=cs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Wn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Wn(t[n]/255)*255):t[n]=Wn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},zd=0,hs=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=pn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(za(i[o].image)):r.push(za(i[o]))}else r=za(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function za(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?co.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var kd=0,ka=new L,St=class s extends Tn{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=bn,i=bn,r=Ct,o=yn,a=en,l=vn,c=s.DEFAULT_ANISOTROPY,u=$n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=pn(),this.name="",this.source=new hs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Ie(0,0),this.repeat=new Ie(1,1),this.center=new Ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(ka).x}get height(){return this.source.getSize(ka).y}get depth(){return this.source.getSize(ka).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ac)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case gn:e.x=e.x-Math.floor(e.x);break;case bn:e.x=e.x<0?0:1;break;case os:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case gn:e.y=e.y-Math.floor(e.y);break;case bn:e.y=e.y<0?0:1;break;case os:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};St.DEFAULT_IMAGE=null;St.DEFAULT_MAPPING=Ac;St.DEFAULT_ANISOTROPY=1;var Ke=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],p=l[5],g=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(c+1)/2,v=(p+1)/2,C=(f+1)/2,R=(u+d)/4,I=(h+_)/4,D=(g+m)/4;return E>v&&E>C?E<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(E),i=R/n,r=I/n):v>C?v<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(v),n=R/i,r=D/i):C<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(C),n=I/r,i=D/r),this.set(n,i,r,t),this}let b=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(h-_)/b,this.z=(d-u)/b,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},lo=class extends Tn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ct,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Ke(0,0,e,t),this.scissorTest=!1,this.viewport=new Ke(0,0,e,t);let i={width:e,height:t,depth:n.depth},r=new St(i);this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:Ct,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new hs(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},wn=class extends lo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ys=class extends St{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ho=class extends St{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var zt=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,ln):ln.fromBufferAttribute(r,o),ln.applyMatrix4(e.matrixWorld),this.expandByPoint(ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Nr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Nr.copy(n.boundingBox)),Nr.applyMatrix4(e.matrixWorld),this.union(Nr)}let i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ln),ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Us),Ur.subVectors(this.max,Us),qi.subVectors(e.a,Us),Yi.subVectors(e.b,Us),Zi.subVectors(e.c,Us),ei.subVectors(Yi,qi),ti.subVectors(Zi,Yi),_i.subVectors(qi,Zi);let t=[0,-ei.z,ei.y,0,-ti.z,ti.y,0,-_i.z,_i.y,ei.z,0,-ei.x,ti.z,0,-ti.x,_i.z,0,-_i.x,-ei.y,ei.x,0,-ti.y,ti.x,0,-_i.y,_i.x,0];return!Ha(t,qi,Yi,Zi,Ur)||(t=[1,0,0,0,1,0,0,0,1],!Ha(t,qi,Yi,Zi,Ur))?!1:(Fr.crossVectors(ei,ti),t=[Fr.x,Fr.y,Fr.z],Ha(t,qi,Yi,Zi,Ur))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Bn=[new L,new L,new L,new L,new L,new L,new L,new L],ln=new L,Nr=new zt,qi=new L,Yi=new L,Zi=new L,ei=new L,ti=new L,_i=new L,Us=new L,Ur=new L,Fr=new L,xi=new L;function Ha(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){xi.fromArray(s,r);let a=i.x*Math.abs(xi.x)+i.y*Math.abs(xi.y)+i.z*Math.abs(xi.z),l=e.dot(xi),c=t.dot(xi),u=n.dot(xi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}var Hd=new zt,Fs=new L,Va=new L,Gt=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Hd.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fs.subVectors(e,this.center);let t=Fs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Fs,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Va.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fs.copy(e.center).add(Va)),this.expandByPoint(Fs.copy(e.center).sub(Va))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},zn=new L,Ga=new L,Or=new L,ni=new L,Wa=new L,Br=new L,Xa=new L,An=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(zn.copy(this.origin).addScaledVector(this.direction,t),zn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Ga.copy(e).add(t).multiplyScalar(.5),Or.copy(t).sub(e).normalize(),ni.copy(this.origin).sub(Ga);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Or),a=ni.dot(this.direction),l=-ni.dot(Or),c=ni.lengthSq(),u=Math.abs(1-o*o),h,d,p,g;if(u>0)if(h=o*l-a,d=o*a-l,g=r*u,h>=0)if(d>=-g)if(d<=g){let _=1/u;h*=_,d*=_,p=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=r,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;else d=-r,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-l),r),p=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-l),r),p=-h*h+d*(d+2*l)+c);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(Ga).addScaledVector(Or,d),p}intersectSphere(e,t){zn.subVectors(e.center,this.origin);let n=zn.dot(this.direction),i=zn.dot(zn)-n*n,r=e.radius*e.radius;if(i>r)return null;let o=Math.sqrt(r-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,l,c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),h>=0?(a=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,zn)!==null}intersectTriangle(e,t,n,i,r){Wa.subVectors(t,e),Br.subVectors(n,e),Xa.crossVectors(Wa,Br);let o=this.direction.dot(Xa),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ni.subVectors(this.origin,e);let l=a*this.direction.dot(Br.crossVectors(ni,Br));if(l<0)return null;let c=a*this.direction.dot(Wa.cross(ni));if(c<0||l+c>o)return null;let u=-a*ni.dot(Xa);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ze=class s{constructor(e,t,n,i,r,o,a,l,c,u,h,d,p,g,_,m){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,l,c,u,h,d,p,g,_,m)}set(e,t,n,i,r,o,a,l,c,u,h,d,p,g,_,m){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=i,f[1]=r,f[5]=o,f[9]=a,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=g,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/Ki.setFromMatrixColumn(e,0).length(),r=1/Ki.setFromMatrixColumn(e,1).length(),o=1/Ki.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){let d=o*u,p=o*h,g=a*u,_=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=p+g*c,t[5]=d-_*c,t[9]=-a*l,t[2]=_-d*c,t[6]=g+p*c,t[10]=o*l}else if(e.order==="YXZ"){let d=l*u,p=l*h,g=c*u,_=c*h;t[0]=d+_*a,t[4]=g*a-p,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=p*a-g,t[6]=_+d*a,t[10]=o*l}else if(e.order==="ZXY"){let d=l*u,p=l*h,g=c*u,_=c*h;t[0]=d-_*a,t[4]=-o*h,t[8]=g+p*a,t[1]=p+g*a,t[5]=o*u,t[9]=_-d*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let d=o*u,p=o*h,g=a*u,_=a*h;t[0]=l*u,t[4]=g*c-p,t[8]=d*c+_,t[1]=l*h,t[5]=_*c+d,t[9]=p*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let d=o*l,p=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=_-d*h,t[8]=g*h+p,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=p*h+g,t[10]=d-_*h}else if(e.order==="XZY"){let d=o*l,p=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+_,t[5]=o*u,t[9]=p*h-g,t[2]=g*h-p,t[6]=a*u,t[10]=_*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Vd,e,Gd)}lookAt(e,t,n){let i=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),ii.crossVectors(n,$t),ii.lengthSq()===0&&(Math.abs(n.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),ii.crossVectors(n,$t)),ii.normalize(),zr.crossVectors($t,ii),i[0]=ii.x,i[4]=zr.x,i[8]=$t.x,i[1]=ii.y,i[5]=zr.y,i[9]=$t.y,i[2]=ii.z,i[6]=zr.z,i[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],p=n[13],g=n[2],_=n[6],m=n[10],f=n[14],b=n[3],E=n[7],v=n[11],C=n[15],R=i[0],I=i[4],D=i[8],S=i[12],x=i[1],w=i[5],A=i[9],U=i[13],F=i[2],G=i[6],V=i[10],$=i[14],H=i[3],ee=i[7],k=i[11],J=i[15];return r[0]=o*R+a*x+l*F+c*H,r[4]=o*I+a*w+l*G+c*ee,r[8]=o*D+a*A+l*V+c*k,r[12]=o*S+a*U+l*$+c*J,r[1]=u*R+h*x+d*F+p*H,r[5]=u*I+h*w+d*G+p*ee,r[9]=u*D+h*A+d*V+p*k,r[13]=u*S+h*U+d*$+p*J,r[2]=g*R+_*x+m*F+f*H,r[6]=g*I+_*w+m*G+f*ee,r[10]=g*D+_*A+m*V+f*k,r[14]=g*S+_*U+m*$+f*J,r[3]=b*R+E*x+v*F+C*H,r[7]=b*I+E*w+v*G+C*ee,r[11]=b*D+E*A+v*V+C*k,r[15]=b*S+E*U+v*$+C*J,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],p=e[14],g=e[3],_=e[7],m=e[11],f=e[15];return g*(+r*l*h-i*c*h-r*a*d+n*c*d+i*a*p-n*l*p)+_*(+t*l*p-t*c*d+r*o*d-i*o*p+i*c*u-r*l*u)+m*(+t*c*h-t*a*p-r*o*h+n*o*p+r*a*u-n*c*u)+f*(-i*a*u-t*l*h+t*a*d+i*o*h-n*o*d+n*l*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],p=e[11],g=e[12],_=e[13],m=e[14],f=e[15],b=h*m*c-_*d*c+_*l*p-a*m*p-h*l*f+a*d*f,E=g*d*c-u*m*c-g*l*p+o*m*p+u*l*f-o*d*f,v=u*_*c-g*h*c+g*a*p-o*_*p-u*a*f+o*h*f,C=g*h*l-u*_*l-g*a*d+o*_*d+u*a*m-o*h*m,R=t*b+n*E+i*v+r*C;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let I=1/R;return e[0]=b*I,e[1]=(_*d*r-h*m*r-_*i*p+n*m*p+h*i*f-n*d*f)*I,e[2]=(a*m*r-_*l*r+_*i*c-n*m*c-a*i*f+n*l*f)*I,e[3]=(h*l*r-a*d*r-h*i*c+n*d*c+a*i*p-n*l*p)*I,e[4]=E*I,e[5]=(u*m*r-g*d*r+g*i*p-t*m*p-u*i*f+t*d*f)*I,e[6]=(g*l*r-o*m*r-g*i*c+t*m*c+o*i*f-t*l*f)*I,e[7]=(o*d*r-u*l*r+u*i*c-t*d*c-o*i*p+t*l*p)*I,e[8]=v*I,e[9]=(g*h*r-u*_*r-g*n*p+t*_*p+u*n*f-t*h*f)*I,e[10]=(o*_*r-g*a*r+g*n*c-t*_*c-o*n*f+t*a*f)*I,e[11]=(u*a*r-o*h*r-u*n*c+t*h*c+o*n*p-t*a*p)*I,e[12]=C*I,e[13]=(u*_*i-g*h*i+g*n*d-t*_*d-u*n*m+t*h*m)*I,e[14]=(g*a*i-o*_*i-g*n*l+t*_*l+o*n*m-t*a*m)*I,e[15]=(o*h*i-u*a*i+u*n*l-t*h*l-o*n*d+t*a*d)*I,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,u*a+n,u*l-i*o,0,c*l-i*a,u*l+i*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,u=o+o,h=a+a,d=r*c,p=r*u,g=r*h,_=o*u,m=o*h,f=a*h,b=l*c,E=l*u,v=l*h,C=n.x,R=n.y,I=n.z;return i[0]=(1-(_+f))*C,i[1]=(p+v)*C,i[2]=(g-E)*C,i[3]=0,i[4]=(p-v)*R,i[5]=(1-(d+f))*R,i[6]=(m+b)*R,i[7]=0,i[8]=(g+E)*I,i[9]=(m-b)*I,i[10]=(1-(d+_))*I,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=Ki.set(i[0],i[1],i[2]).length(),o=Ki.set(i[4],i[5],i[6]).length(),a=Ki.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],hn.copy(this);let c=1/r,u=1/o,h=1/a;return hn.elements[0]*=c,hn.elements[1]*=c,hn.elements[2]*=c,hn.elements[4]*=u,hn.elements[5]*=u,hn.elements[6]*=u,hn.elements[8]*=h,hn.elements[9]*=h,hn.elements[10]*=h,t.setFromRotationMatrix(hn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o,a=fn,l=!1){let c=this.elements,u=2*r/(t-e),h=2*r/(n-i),d=(t+e)/(t-e),p=(n+i)/(n-i),g,_;if(l)g=r/(o-r),_=o*r/(o-r);else if(a===fn)g=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===qs)g=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,o,a=fn,l=!1){let c=this.elements,u=2/(t-e),h=2/(n-i),d=-(t+e)/(t-e),p=-(n+i)/(n-i),g,_;if(l)g=1/(o-r),_=o/(o-r);else if(a===fn)g=-2/(o-r),_=-(o+r)/(o-r);else if(a===qs)g=-1/(o-r),_=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=h,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ki=new L,hn=new ze,Vd=new L(0,0,0),Gd=new L(1,1,1),ii=new L,zr=new L,$t=new L,Ql=new ze,eh=new tt,Wt=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],o=i[4],a=i[8],l=i[1],c=i[5],u=i[9],h=i[2],d=i[6],p=i[10];switch(t){case"XYZ":this._y=Math.asin(We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-We(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-We(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ql.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ql,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return eh.setFromEuler(this),this.setFromQuaternion(eh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Wt.DEFAULT_ORDER="XYZ";var us=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Wd=0,th=new L,Ji=new tt,kn=new ze,kr=new L,Os=new L,Xd=new L,qd=new tt,nh=new L(1,0,0),ih=new L(0,1,0),sh=new L(0,0,1),rh={type:"added"},Yd={type:"removed"},$i={type:"childadded",child:null},qa={type:"childremoved",child:null},ct=class s extends Tn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wd++}),this.uuid=pn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new L,t=new Wt,n=new tt,i=new L(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ze},normalMatrix:{value:new ke}}),this.matrix=new ze,this.matrixWorld=new ze,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new us,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.multiply(Ji),this}rotateOnWorldAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.premultiply(Ji),this}rotateX(e){return this.rotateOnAxis(nh,e)}rotateY(e){return this.rotateOnAxis(ih,e)}rotateZ(e){return this.rotateOnAxis(sh,e)}translateOnAxis(e,t){return th.copy(e).applyQuaternion(this.quaternion),this.position.add(th.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(nh,e)}translateY(e){return this.translateOnAxis(ih,e)}translateZ(e){return this.translateOnAxis(sh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(kn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?kr.copy(e):kr.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?kn.lookAt(Os,kr,this.up):kn.lookAt(kr,Os,this.up),this.quaternion.setFromRotationMatrix(kn),i&&(kn.extractRotation(i.matrixWorld),Ji.setFromRotationMatrix(kn),this.quaternion.premultiply(Ji.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(rh),$i.child=e,this.dispatchEvent($i),$i.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Yd),qa.child=e,this.dispatchEvent(qa),qa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),kn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),kn.multiply(e.parent.matrixWorld)),e.applyMatrix4(kn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(rh),$i.child=e,this.dispatchEvent($i),$i.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Os,e,Xd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Os,qd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(a=>({...a})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let h=l[c];r(e.shapes,h)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];i.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),p=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=i,n;function o(a){let l=[];for(let c in a){let u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};ct.DEFAULT_UP=new L(0,1,0);ct.DEFAULT_MATRIX_AUTO_UPDATE=!0;ct.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var un=new L,Hn=new L,Ya=new L,Vn=new L,ji=new L,Qi=new L,oh=new L,Za=new L,Ka=new L,Ja=new L,$a=new Ke,ja=new Ke,Qa=new Ke,oi=class s{constructor(e=new L,t=new L,n=new L){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),un.subVectors(e,t),i.cross(un);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){un.subVectors(i,t),Hn.subVectors(n,t),Ya.subVectors(e,t);let o=un.dot(un),a=un.dot(Hn),l=un.dot(Ya),c=Hn.dot(Hn),u=Hn.dot(Ya),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;let d=1/h,p=(c*l-a*u)*d,g=(o*u-a*l)*d;return r.set(1-p-g,g,p)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Vn)===null?!1:Vn.x>=0&&Vn.y>=0&&Vn.x+Vn.y<=1}static getInterpolation(e,t,n,i,r,o,a,l){return this.getBarycoord(e,t,n,i,Vn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Vn.x),l.addScaledVector(o,Vn.y),l.addScaledVector(a,Vn.z),l)}static getInterpolatedAttribute(e,t,n,i,r,o){return $a.setScalar(0),ja.setScalar(0),Qa.setScalar(0),$a.fromBufferAttribute(e,t),ja.fromBufferAttribute(e,n),Qa.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector($a,r.x),o.addScaledVector(ja,r.y),o.addScaledVector(Qa,r.z),o}static isFrontFacing(e,t,n,i){return un.subVectors(n,t),Hn.subVectors(e,t),un.cross(Hn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return un.subVectors(this.c,this.b),Hn.subVectors(this.a,this.b),un.cross(Hn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,o,a;ji.subVectors(i,n),Qi.subVectors(r,n),Za.subVectors(e,n);let l=ji.dot(Za),c=Qi.dot(Za);if(l<=0&&c<=0)return t.copy(n);Ka.subVectors(e,i);let u=ji.dot(Ka),h=Qi.dot(Ka);if(u>=0&&h<=u)return t.copy(i);let d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(n).addScaledVector(ji,o);Ja.subVectors(e,r);let p=ji.dot(Ja),g=Qi.dot(Ja);if(g>=0&&p<=g)return t.copy(r);let _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(n).addScaledVector(Qi,a);let m=u*g-p*h;if(m<=0&&h-u>=0&&p-g>=0)return oh.subVectors(r,i),a=(h-u)/(h-u+(p-g)),t.copy(i).addScaledVector(oh,a);let f=1/(m+_+d);return o=_*f,a=d*f,t.copy(n).addScaledVector(ji,o).addScaledVector(Qi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Mu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},Hr={h:0,s:0,l:0};function ec(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var Ce=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ye.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=Ye.workingColorSpace){if(e=zc(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=ec(o,r,e+1/3),this.g=ec(o,r,e),this.b=ec(o,r,e-1/3)}return Ye.colorSpaceToWorking(this,i),this}setStyle(e,t=ut){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ut){let n=Mu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Wn(e.r),this.g=Wn(e.g),this.b=Wn(e.b),this}copyLinearToSRGB(e){return this.r=rs(e.r),this.g=rs(e.g),this.b=rs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ut){return Ye.workingToColorSpace(Dt.copy(this),e),Math.round(We(Dt.r*255,0,255))*65536+Math.round(We(Dt.g*255,0,255))*256+Math.round(We(Dt.b*255,0,255))}getHexString(e=ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.workingToColorSpace(Dt.copy(this),t);let n=Dt.r,i=Dt.g,r=Dt.b,o=Math.max(n,i,r),a=Math.min(n,i,r),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else{let h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(i-r)/h+(i<r?6:0);break;case i:l=(r-n)/h+2;break;case r:l=(n-i)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Ye.workingColorSpace){return Ye.workingToColorSpace(Dt.copy(this),t),e.r=Dt.r,e.g=Dt.g,e.b=Dt.b,e}getStyle(e=ut){Ye.workingToColorSpace(Dt.copy(this),e);let t=Dt.r,n=Dt.g,i=Dt.b;return e!==ut?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(si),this.setHSL(si.h+e,si.s+t,si.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(si),e.getHSL(Hr);let n=Ws(si.h,Hr.h,t),i=Ws(si.s,Hr.s,t),r=Ws(si.l,Hr.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Dt=new Ce;Ce.NAMES=Mu;var Zd=0,Xt=class extends Tn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Zd++}),this.uuid=pn(),this.name="",this.type="Material",this.blending=Si,this.side=mn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ro,this.blendDst=oo,this.blendEquation=ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ce(0,0,0),this.blendAlpha=0,this.depthFunc=bi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=pc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Mi,this.stencilZFail=Mi,this.stencilZPass=Mi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Si&&(n.blending=this.blending),this.side!==mn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ro&&(n.blendSrc=this.blendSrc),this.blendDst!==oo&&(n.blendDst=this.blendDst),this.blendEquation!==ai&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==bi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==pc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Mi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Mi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Mi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Qt=class extends Xt{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ce(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.combine=wc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var _t=new L,Vr=new Ie,Kd=0,yt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Kd++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ao,this.updateRanges=[],this.gpuType=on,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Vr.fromBufferAttribute(this,t),Vr.applyMatrix3(e),this.setXY(t,Vr.x,Vr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix3(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix4(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyNormalMatrix(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.transformDirection(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=dn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=dn(t,this.array)),t}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=dn(t,this.array)),t}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=dn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=dn(t,this.array)),t}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),i=$e(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),i=$e(i,this.array),r=$e(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ao&&(e.usage=this.usage),e}};var Zs=class extends yt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Ks=class extends yt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var mt=class extends yt{constructor(e,t,n){super(new Float32Array(e),t,n)}},Jd=0,sn=new ze,tc=new ct,es=new L,jt=new zt,Bs=new zt,At=new L,Nt=class s extends Tn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jd++}),this.uuid=pn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(kc(e)?Ks:Zs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ke().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return sn.makeRotationFromQuaternion(e),this.applyMatrix4(sn),this}rotateX(e){return sn.makeRotationX(e),this.applyMatrix4(sn),this}rotateY(e){return sn.makeRotationY(e),this.applyMatrix4(sn),this}rotateZ(e){return sn.makeRotationZ(e),this.applyMatrix4(sn),this}translate(e,t,n){return sn.makeTranslation(e,t,n),this.applyMatrix4(sn),this}scale(e,t,n){return sn.makeScale(e,t,n),this.applyMatrix4(sn),this}lookAt(e){return tc.lookAt(e),tc.updateMatrix(),this.applyMatrix4(tc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(es).negate(),this.translate(es.x,es.y,es.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let o=e[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new mt(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new zt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];jt.setFromBufferAttribute(r),this.morphTargetsRelative?(At.addVectors(this.boundingBox.min,jt.min),this.boundingBox.expandByPoint(At),At.addVectors(this.boundingBox.max,jt.max),this.boundingBox.expandByPoint(At)):(this.boundingBox.expandByPoint(jt.min),this.boundingBox.expandByPoint(jt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Gt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){let n=this.boundingSphere.center;if(jt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Bs.setFromBufferAttribute(a),this.morphTargetsRelative?(At.addVectors(jt.min,Bs.min),jt.expandByPoint(At),At.addVectors(jt.max,Bs.max),jt.expandByPoint(At)):(jt.expandByPoint(Bs.min),jt.expandByPoint(Bs.max))}jt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)At.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(At));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)At.fromBufferAttribute(a,c),l&&(es.fromBufferAttribute(e,c),At.add(es)),i=Math.max(i,n.distanceToSquared(At))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new yt(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let D=0;D<n.count;D++)a[D]=new L,l[D]=new L;let c=new L,u=new L,h=new L,d=new Ie,p=new Ie,g=new Ie,_=new L,m=new L;function f(D,S,x){c.fromBufferAttribute(n,D),u.fromBufferAttribute(n,S),h.fromBufferAttribute(n,x),d.fromBufferAttribute(r,D),p.fromBufferAttribute(r,S),g.fromBufferAttribute(r,x),u.sub(c),h.sub(c),p.sub(d),g.sub(d);let w=1/(p.x*g.y-g.x*p.y);isFinite(w)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(h,-p.y).multiplyScalar(w),m.copy(h).multiplyScalar(p.x).addScaledVector(u,-g.x).multiplyScalar(w),a[D].add(_),a[S].add(_),a[x].add(_),l[D].add(m),l[S].add(m),l[x].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let D=0,S=b.length;D<S;++D){let x=b[D],w=x.start,A=x.count;for(let U=w,F=w+A;U<F;U+=3)f(e.getX(U+0),e.getX(U+1),e.getX(U+2))}let E=new L,v=new L,C=new L,R=new L;function I(D){C.fromBufferAttribute(i,D),R.copy(C);let S=a[D];E.copy(S),E.sub(C.multiplyScalar(C.dot(S))).normalize(),v.crossVectors(R,S);let w=v.dot(l[D])<0?-1:1;o.setXYZW(D,E.x,E.y,E.z,w)}for(let D=0,S=b.length;D<S;++D){let x=b[D],w=x.start,A=x.count;for(let U=w,F=w+A;U<F;U+=3)I(e.getX(U+0)),I(e.getX(U+1)),I(e.getX(U+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new yt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);let i=new L,r=new L,o=new L,a=new L,l=new L,c=new L,u=new L,h=new L;if(e)for(let d=0,p=e.count;d<p;d+=3){let g=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,g),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,m),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)At.fromBufferAttribute(e,t),At.normalize(),e.setXYZ(t,At.x,At.y,At.z)}toNonIndexed(){function e(a,l){let c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u),p=0,g=0;for(let _=0,m=l.length;_<m;_++){a.isInterleavedBufferAttribute?p=l[_]*a.data.stride+a.offset:p=l[_]*u;for(let f=0;f<u;f++)d[g++]=c[p++]}return new yt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let a in i){let l=i[a],c=e(l,n);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){let d=c[u],p=e(d,n);l.push(p)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){let p=c[h];u.push(p.toJSON(e.data))}u.length>0&&(i[l]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let c in i){let u=i[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],h=r[c];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,u=o.length;c<u;c++){let h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},ah=new ze,yi=new An,Gr=new Gt,ch=new L,Wr=new L,Xr=new L,qr=new L,nc=new L,Yr=new L,lh=new L,Zr=new L,gt=class extends ct{constructor(e=new Nt,t=new Qt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let a=this.morphTargetInfluences;if(r&&a){Yr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=a[l],h=r[l];u!==0&&(nc.fromBufferAttribute(h,e),o?Yr.addScaledVector(nc,u):Yr.addScaledVector(nc.sub(t),u))}t.add(Yr)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Gr.copy(n.boundingSphere),Gr.applyMatrix4(r),yi.copy(e.ray).recast(e.near),!(Gr.containsPoint(yi.origin)===!1&&(yi.intersectSphere(Gr,ch)===null||yi.origin.distanceToSquared(ch)>(e.far-e.near)**2))&&(ah.copy(r).invert(),yi.copy(e.ray).applyMatrix4(ah),!(n.boundingBox!==null&&yi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,yi)))}_computeIntersections(e,t,n){let i,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){let m=d[g],f=o[m.materialIndex],b=Math.max(m.start,p.start),E=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let v=b,C=E;v<C;v+=3){let R=a.getX(v),I=a.getX(v+1),D=a.getX(v+2);i=Kr(this,f,e,n,c,u,h,R,I,D),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{let g=Math.max(0,p.start),_=Math.min(a.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){let b=a.getX(m),E=a.getX(m+1),v=a.getX(m+2);i=Kr(this,o,e,n,c,u,h,b,E,v),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){let m=d[g],f=o[m.materialIndex],b=Math.max(m.start,p.start),E=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let v=b,C=E;v<C;v+=3){let R=v,I=v+1,D=v+2;i=Kr(this,f,e,n,c,u,h,R,I,D),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{let g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){let b=m,E=m+1,v=m+2;i=Kr(this,o,e,n,c,u,h,b,E,v),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}}};function $d(s,e,t,n,i,r,o,a){let l;if(e.side===kt?l=n.intersectTriangle(o,r,i,!0,a):l=n.intersectTriangle(i,r,o,e.side===mn,a),l===null)return null;Zr.copy(a),Zr.applyMatrix4(s.matrixWorld);let c=t.ray.origin.distanceTo(Zr);return c<t.near||c>t.far?null:{distance:c,point:Zr.clone(),object:s}}function Kr(s,e,t,n,i,r,o,a,l,c){s.getVertexPosition(a,Wr),s.getVertexPosition(l,Xr),s.getVertexPosition(c,qr);let u=$d(s,e,t,n,Wr,Xr,qr,lh);if(u){let h=new L;oi.getBarycoord(lh,Wr,Xr,qr,h),i&&(u.uv=oi.getInterpolatedAttribute(i,a,l,c,h,new Ie)),r&&(u.uv1=oi.getInterpolatedAttribute(r,a,l,c,h,new Ie)),o&&(u.normal=oi.getInterpolatedAttribute(o,a,l,c,h,new L),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new L,materialIndex:0};oi.getNormal(Wr,Xr,qr,d.normal),u.face=d,u.barycoord=h}return u}var Rn=class s extends Nt{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};let a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],u=[],h=[],d=0,p=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,i,o,2),g("x","z","y",1,-1,e,n,-t,i,o,3),g("x","y","z",1,-1,e,t,n,i,r,4),g("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(u,3)),this.setAttribute("uv",new mt(h,2));function g(_,m,f,b,E,v,C,R,I,D,S){let x=v/I,w=C/D,A=v/2,U=C/2,F=R/2,G=I+1,V=D+1,$=0,H=0,ee=new L;for(let k=0;k<V;k++){let J=k*w-U;for(let le=0;le<G;le++){let de=le*x-A;ee[_]=de*b,ee[m]=J*E,ee[f]=F,c.push(ee.x,ee.y,ee.z),ee[_]=0,ee[m]=0,ee[f]=R>0?1:-1,u.push(ee.x,ee.y,ee.z),h.push(le/I),h.push(1-k/D),$+=1}}for(let k=0;k<D;k++)for(let J=0;J<I;J++){let le=d+J+G*k,de=d+J+G*(k+1),me=d+(J+1)+G*(k+1),Ae=d+(J+1)+G*k;l.push(le,de,Ae),l.push(de,me,Ae),H+=6}a.addGroup(p,H,S),p+=H,d+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Fi(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Ft(s){let e={};for(let t=0;t<s.length;t++){let n=Fi(s[t]);for(let i in n)e[i]=n[i]}return e}function jd(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Hc(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var Su={clone:Fi,merge:Ft},Qd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ef=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,_n=class extends Xt{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Qd,this.fragmentShader=ef,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Fi(e.uniforms),this.uniformsGroups=jd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Js=class extends ct{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ze,this.projectionMatrix=new ze,this.projectionMatrixInverse=new ze,this.coordinateSystem=fn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ri=new L,hh=new Ie,uh=new Ie,xt=class extends Js{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=wi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Gs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return wi*2*Math.atan(Math.tan(Gs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ri.x,ri.y).multiplyScalar(-e/ri.z),ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ri.x,ri.y).multiplyScalar(-e/ri.z)}getViewSize(e,t){return this.getViewBounds(e,hh,uh),t.subVectors(uh,hh)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Gs*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*i/l,t-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ts=-90,ns=1,uo=class extends ct{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new xt(ts,ns,e,t);i.layers=this.layers,this.add(i);let r=new xt(ts,ns,e,t);r.layers=this.layers,this.add(r);let o=new xt(ts,ns,e,t);o.layers=this.layers,this.add(o);let a=new xt(ts,ns,e,t);a.layers=this.layers,this.add(a);let l=new xt(ts,ns,e,t);l.layers=this.layers,this.add(l);let c=new xt(ts,ns,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===fn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,o),e.setRenderTarget(n,2,i),e.render(t,a),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,i),e.render(t,u),e.setRenderTarget(h,d,p),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},$s=class extends St{constructor(e=[],t=Di,n,i,r,o,a,l,c,u){super(e,t,n,i,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},fo=class extends wn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new $s(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Rn(5,5,5),r=new _n({name:"CubemapFromEquirect",uniforms:Fi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:kt,blending:Kn});r.uniforms.tEquirect.value=t;let o=new gt(i,r),a=t.minFilter;return t.minFilter===yn&&(t.minFilter=Ct),new uo(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}},Mt=class extends ct{constructor(){super(),this.isGroup=!0,this.type="Group"}},tf={type:"move"},ds=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Mt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Mt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Mt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,n),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(tf)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Mt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var js=class s{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ce(e),this.near=t,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Qs=class extends ct{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wt,this.environmentIntensity=1,this.environmentRotation=new Wt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},fs=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=ao,this.updateRanges=[],this.version=0,this.uuid=pn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=pn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=pn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Bt=new L,ps=class s{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.applyMatrix4(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.applyNormalMatrix(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Bt.fromBufferAttribute(this,t),Bt.transformDirection(e),this.setXYZ(t,Bt.x,Bt.y,Bt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=dn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=dn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=dn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=dn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=dn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),i=$e(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),i=$e(i,this.array),r=$e(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new yt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new s(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var dh=new L,fh=new Ke,ph=new Ke,nf=new L,mh=new ze,Jr=new L,ic=new Gt,gh=new ze,sc=new An,er=class extends gt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=hc,this.bindMatrix=new ze,this.bindMatrixInverse=new ze,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new zt),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Jr),this.boundingBox.expandByPoint(Jr)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Gt),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Jr),this.boundingSphere.expandByPoint(Jr)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ic.copy(this.boundingSphere),ic.applyMatrix4(i),e.ray.intersectsSphere(ic)!==!1&&(gh.copy(i).invert(),sc.copy(e.ray).applyMatrix4(gh),!(this.boundingBox!==null&&sc.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,sc)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Ke,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===hc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===au?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,i=this.geometry;fh.fromBufferAttribute(i.attributes.skinIndex,e),ph.fromBufferAttribute(i.attributes.skinWeight,e),dh.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=ph.getComponent(r);if(o!==0){let a=fh.getComponent(r);mh.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(nf.copy(dh).applyMatrix4(mh),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},ms=class extends ct{constructor(){super(),this.isBone=!0,this.type="Bone"}},Ai=class extends St{constructor(e=null,t=1,n=1,i,r,o,a,l,c=Rt,u=Rt,h,d){super(null,o,a,l,c,u,i,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},_h=new ze,sf=new ze,tr=class s{constructor(e=[],t=[]){this.uuid=pn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new ze)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new ze;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:sf;_h.multiplyMatrices(a,t[r]),_h.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new s(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new Ai(t,e,e,en,on);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=e.bones[n],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new ms),this.bones.push(o),this.boneInverses.push(new ze().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){let o=t[i];e.bones.push(o.uuid);let a=n[i];e.boneInverses.push(a.toArray())}return e}},ci=class extends yt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},is=new ze,xh=new ze,$r=[],yh=new zt,rf=new ze,zs=new gt,ks=new Gt,nr=class extends gt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ci(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,rf)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new zt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,is),yh.copy(e.boundingBox).applyMatrix4(is),this.boundingBox.union(yh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Gt),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,is),ks.copy(e.boundingSphere).applyMatrix4(is),this.boundingSphere.union(ks)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(zs.geometry=this.geometry,zs.material=this.material,zs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ks.copy(this.boundingSphere),ks.applyMatrix4(n),e.ray.intersectsSphere(ks)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,is),xh.multiplyMatrices(n,is),zs.matrixWorld=xh,zs.raycast(e,$r);for(let o=0,a=$r.length;o<a;o++){let l=$r[o];l.instanceId=r,l.object=this,t.push(l)}$r.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new ci(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ai(new Float32Array(i*this.count),i,this.count,ws,on));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<n.length;c++)o+=n[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=i*e;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},rc=new L,of=new L,af=new ke,Vt=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=rc.subVectors(n,t).cross(of.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(rc),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||af.getNormalMatrix(e),i=this.coplanarPoint(rc).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},vi=new Gt,cf=new Ie(.5,.5),jr=new L,gs=class{constructor(e=new Vt,t=new Vt,n=new Vt,i=new Vt,r=new Vt,o=new Vt){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=fn,n=!1){let i=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],h=r[5],d=r[6],p=r[7],g=r[8],_=r[9],m=r[10],f=r[11],b=r[12],E=r[13],v=r[14],C=r[15];if(i[0].setComponents(c-o,p-u,f-g,C-b).normalize(),i[1].setComponents(c+o,p+u,f+g,C+b).normalize(),i[2].setComponents(c+a,p+h,f+_,C+E).normalize(),i[3].setComponents(c-a,p-h,f-_,C-E).normalize(),n)i[4].setComponents(l,d,m,v).normalize(),i[5].setComponents(c-l,p-d,f-m,C-v).normalize();else if(i[4].setComponents(c-l,p-d,f-m,C-v).normalize(),t===fn)i[5].setComponents(c+l,p+d,f+m,C+v).normalize();else if(t===qs)i[5].setComponents(l,d,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),vi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),vi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(vi)}intersectsSprite(e){vi.center.set(0,0,0);let t=cf.distanceTo(e.center);return vi.radius=.7071067811865476+t,vi.applyMatrix4(e.matrixWorld),this.intersectsSphere(vi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(jr.x=i.normal.x>0?e.max.x:e.min.x,jr.y=i.normal.y>0?e.max.y:e.min.y,jr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(jr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ri=class extends Xt{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ce(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},po=new L,mo=new L,vh=new ze,Hs=new An,Qr=new Gt,oc=new L,Mh=new L,Ci=class extends ct{constructor(e=new Nt,t=new Ri){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)po.fromBufferAttribute(t,i-1),mo.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=po.distanceTo(mo);e.setAttribute("lineDistance",new mt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Qr.copy(n.boundingSphere),Qr.applyMatrix4(i),Qr.radius+=r,e.ray.intersectsSphere(Qr)===!1)return;vh.copy(i).invert(),Hs.copy(e.ray).applyMatrix4(vh);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){let p=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let _=p,m=g-1;_<m;_+=c){let f=u.getX(_),b=u.getX(_+1),E=eo(this,e,Hs,l,f,b,_);E&&t.push(E)}if(this.isLineLoop){let _=u.getX(g-1),m=u.getX(p),f=eo(this,e,Hs,l,_,m,g-1);f&&t.push(f)}}else{let p=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let _=p,m=g-1;_<m;_+=c){let f=eo(this,e,Hs,l,_,_+1,_);f&&t.push(f)}if(this.isLineLoop){let _=eo(this,e,Hs,l,g-1,p,g-1);_&&t.push(_)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function eo(s,e,t,n,i,r,o){let a=s.geometry.attributes.position;if(po.fromBufferAttribute(a,i),mo.fromBufferAttribute(a,r),t.distanceSqToSegment(po,mo,oc,Mh)>n)return;oc.applyMatrix4(s.matrixWorld);let c=e.ray.origin.distanceTo(oc);if(!(c<e.near||c>e.far))return{distance:c,point:Mh.clone().applyMatrix4(s.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:s}}var Sh=new L,bh=new L,_s=class extends Ci{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)Sh.fromBufferAttribute(t,i),bh.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Sh.distanceTo(bh);e.setAttribute("lineDistance",new mt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},ir=class extends Ci{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},xs=class extends Xt{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ce(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Eh=new ze,mc=new An,to=new Gt,no=new L,sr=class extends ct{constructor(e=new Nt,t=new xs){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),to.copy(n.boundingSphere),to.applyMatrix4(i),to.radius+=r,e.ray.intersectsSphere(to)===!1)return;Eh.copy(i).invert(),mc.copy(e.ray).applyMatrix4(Eh);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){let d=Math.max(0,o.start),p=Math.min(c.count,o.start+o.count);for(let g=d,_=p;g<_;g++){let m=c.getX(g);no.fromBufferAttribute(h,m),Th(no,m,l,i,e,t,this)}}else{let d=Math.max(0,o.start),p=Math.min(h.count,o.start+o.count);for(let g=d,_=p;g<_;g++)no.fromBufferAttribute(h,g),Th(no,g,l,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Th(s,e,t,n,i,r,o){let a=mc.distanceSqToPoint(s);if(a<t){let l=new L;mc.closestPointToPoint(s,l),l.applyMatrix4(n);let c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var rr=class extends St{constructor(e,t,n,i,r,o,a,l,c){super(e,t,n,i,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},or=class extends St{constructor(e,t,n=di,i,r,o,a=Rt,l=Rt,c,u=as,h=1){if(u!==as&&u!==Ts)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:h};super(d,i,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new hs(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ar=class extends St{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var Ii=class s extends Nt{constructor(e=1,t=1,n=1,i=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;i=Math.floor(i),r=Math.floor(r);let u=[],h=[],d=[],p=[],g=0,_=[],m=n/2,f=0;b(),o===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new mt(h,3)),this.setAttribute("normal",new mt(d,3)),this.setAttribute("uv",new mt(p,2));function b(){let v=new L,C=new L,R=0,I=(t-e)/n;for(let D=0;D<=r;D++){let S=[],x=D/r,w=x*(t-e)+e;for(let A=0;A<=i;A++){let U=A/i,F=U*l+a,G=Math.sin(F),V=Math.cos(F);C.x=w*G,C.y=-x*n+m,C.z=w*V,h.push(C.x,C.y,C.z),v.set(G,I,V).normalize(),d.push(v.x,v.y,v.z),p.push(U,1-x),S.push(g++)}_.push(S)}for(let D=0;D<i;D++)for(let S=0;S<r;S++){let x=_[S][D],w=_[S+1][D],A=_[S+1][D+1],U=_[S][D+1];(e>0||S!==0)&&(u.push(x,w,U),R+=3),(t>0||S!==r-1)&&(u.push(w,A,U),R+=3)}c.addGroup(f,R,0),f+=R}function E(v){let C=g,R=new Ie,I=new L,D=0,S=v===!0?e:t,x=v===!0?1:-1;for(let A=1;A<=i;A++)h.push(0,m*x,0),d.push(0,x,0),p.push(.5,.5),g++;let w=g;for(let A=0;A<=i;A++){let F=A/i*l+a,G=Math.cos(F),V=Math.sin(F);I.x=S*V,I.y=m*x,I.z=S*G,h.push(I.x,I.y,I.z),d.push(0,x,0),R.x=G*.5+.5,R.y=V*.5*x+.5,p.push(R.x,R.y),g++}for(let A=0;A<i;A++){let U=C+A,F=w+A;v===!0?u.push(F,F+1,U):u.push(F+1,F,U),D+=3}c.addGroup(f,D,v===!0?1:2),f+=D}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var xn=class s extends Nt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(i),c=a+1,u=l+1,h=e/a,d=t/l,p=[],g=[],_=[],m=[];for(let f=0;f<u;f++){let b=f*d-o;for(let E=0;E<c;E++){let v=E*h-r;g.push(v,-b,0),_.push(0,0,1),m.push(E/a),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let b=0;b<a;b++){let E=b+c*f,v=b+c*(f+1),C=b+1+c*(f+1),R=b+1+c*f;p.push(E,v,R),p.push(v,C,R)}this.setIndex(p),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(_,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}};var cr=class s extends Nt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,u=[],h=new L,d=new L,p=[],g=[],_=[],m=[];for(let f=0;f<=n;f++){let b=[],E=f/n,v=0;f===0&&o===0?v=.5/t:f===n&&l===Math.PI&&(v=-.5/t);for(let C=0;C<=t;C++){let R=C/t;h.x=-e*Math.cos(i+R*r)*Math.sin(o+E*a),h.y=e*Math.cos(o+E*a),h.z=e*Math.sin(i+R*r)*Math.sin(o+E*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),_.push(d.x,d.y,d.z),m.push(R+v,1-E),b.push(c++)}u.push(b)}for(let f=0;f<n;f++)for(let b=0;b<t;b++){let E=u[f][b+1],v=u[f][b],C=u[f+1][b],R=u[f+1][b+1];(f!==0||o>0)&&p.push(E,v,R),(f!==n-1||l<Math.PI)&&p.push(v,C,R)}this.setIndex(p),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(_,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ut=class extends Xt{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ce(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ce(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Fc,this.normalScale=new Ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},qt=class extends Ut{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Ie(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return We(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ce(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ce(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ce(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var go=class extends Xt{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},_o=class extends Xt{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function io(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function lf(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function hf(s){function e(i,r){return s[i]-s[r]}let t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function wh(s,e,t){let n=s.length,i=new s.constructor(n);for(let r=0,o=0;o!==n;++r){let a=t[r]*e;for(let l=0;l!==e;++l)i[o++]=s[a+l]}return i}function bu(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push(...o)),r=s[i++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=s[i++];while(r!==void 0)}var Xn=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<i)){for(let a=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=i,i=t[++n],e<i)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let o=0;o!==i;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},xo=class extends Xn{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:uc,endingEnd:uc}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,o=e+1,a=i[r],l=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case dc:r=e,a=2*t-n;break;case fc:r=i.length-2,a=t+i[r]-i[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case dc:o=e,l=2*n-t;break;case fc:o=1,l=n+i[1]-i[0];break;default:o=e-1,l=t}let c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,p=this._weightNext,g=(n-t)/(i-t),_=g*g,m=_*g,f=-d*m+2*d*_-d*g,b=(1+d)*m+(-1.5-2*d)*_+(-.5+d)*g+1,E=(-1-p)*m+(1.5+p)*_+.5*g,v=p*m-p*_;for(let C=0;C!==a;++C)r[C]=f*o[u+C]+b*o[c+C]+E*o[l+C]+v*o[h+C];return r}},yo=class extends Xn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=(n-t)/(i-t),h=1-u;for(let d=0;d!==a;++d)r[d]=o[c+d]*h+o[l+d]*u;return r}},vo=class extends Xn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},Yt=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=io(t,this.TimeBufferType),this.values=io(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:io(e.times,Array),values:io(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new vo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new yo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new xo(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ei:t=this.InterpolantFactoryMethodDiscrete;break;case Ti:t=this.InterpolantFactoryMethodLinear;break;case so:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ei;case this.InterpolantFactoryMethodLinear:return Ti;case this.InterpolantFactoryMethodSmooth:return so}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,o=i-1;for(;r!==i&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==i){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(i!==void 0&&lf(i))for(let a=0,l=i.length;a!==l;++a){let c=i[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===so,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],u=e[a+1];if(c!==u&&(a!==1||c!==e[0]))if(i)l=!0;else{let h=a*n,d=h-n,p=h+n;for(let g=0;g!==n;++g){let _=t[h+g];if(_!==t[d+g]||_!==t[p+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let h=a*n,d=o*n;for(let p=0;p!==n;++p)t[d+p]=t[h+p]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};Yt.prototype.ValueTypeName="";Yt.prototype.TimeBufferType=Float32Array;Yt.prototype.ValueBufferType=Float32Array;Yt.prototype.DefaultInterpolation=Ti;var qn=class extends Yt{constructor(e,t,n){super(e,t,n)}};qn.prototype.ValueTypeName="bool";qn.prototype.ValueBufferType=Array;qn.prototype.DefaultInterpolation=Ei;qn.prototype.InterpolantFactoryMethodLinear=void 0;qn.prototype.InterpolantFactoryMethodSmooth=void 0;var lr=class extends Yt{constructor(e,t,n,i){super(e,t,n,i)}};lr.prototype.ValueTypeName="color";var Cn=class extends Yt{constructor(e,t,n,i){super(e,t,n,i)}};Cn.prototype.ValueTypeName="number";var Mo=class extends Xn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(i-t),c=e*a;for(let u=c+a;c!==u;c+=4)tt.slerpFlat(r,0,o,c-a,o,c,l);return r}},In=class extends Yt{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new Mo(this.times,this.values,this.getValueSize(),e)}};In.prototype.ValueTypeName="quaternion";In.prototype.InterpolantFactoryMethodSmooth=void 0;var Yn=class extends Yt{constructor(e,t,n){super(e,t,n)}};Yn.prototype.ValueTypeName="string";Yn.prototype.ValueBufferType=Array;Yn.prototype.DefaultInterpolation=Ei;Yn.prototype.InterpolantFactoryMethodLinear=void 0;Yn.prototype.InterpolantFactoryMethodSmooth=void 0;var Pn=class extends Yt{constructor(e,t,n,i){super(e,t,n,i)}};Pn.prototype.ValueTypeName="vector";var hr=class{constructor(e="",t=-1,n=[],i=cu){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=pn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,i=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(df(n[o]).scale(i));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,o=n.length;r!==o;++r)t.push(Yt.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){let r=t.length,o=[];for(let a=0;a<r;a++){let l=[],c=[];l.push((a+r-1)%r,a,(a+1)%r),c.push(0,1,0);let u=hf(l);l=wh(l,1,u),c=wh(c,1,u),!i&&l[0]===0&&(l.push(r),c.push(c[0])),o.push(new Cn(".morphTargetInfluences["+t[a].name+"]",l,c).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,l=e.length;a<l;a++){let c=e[a],u=c.name.match(r);if(u&&u.length>1){let h=u[1],d=i[h];d||(i[h]=d=[]),d.push(c)}}let o=[];for(let a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],t,n));return o}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let n=function(h,d,p,g,_){if(p.length!==0){let m=[],f=[];bu(p,m,f,g),m.length!==0&&_.push(new h(d,m,f))}},i=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,l=e.length||-1,c=e.hierarchy||[];for(let h=0;h<c.length;h++){let d=c[h].keys;if(!(!d||d.length===0))if(d[0].morphTargets){let p={},g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let _=0;_<d[g].morphTargets.length;_++)p[d[g].morphTargets[_]]=-1;for(let _ in p){let m=[],f=[];for(let b=0;b!==d[g].morphTargets.length;++b){let E=d[g];m.push(E.time),f.push(E.morphTarget===_?1:0)}i.push(new Cn(".morphTargetInfluence["+_+"]",m,f))}l=p.length*o}else{let p=".bones["+t[h].name+"]";n(Pn,p+".position",d,"pos",i),n(In,p+".quaternion",d,"rot",i),n(Pn,p+".scale",d,"scl",i)}}return i.length===0?null:new this(r,l,i,a)}resetDuration(){let e=this.tracks,t=0;for(let n=0,i=e.length;n!==i;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function uf(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Cn;case"vector":case"vector2":case"vector3":case"vector4":return Pn;case"color":return lr;case"quaternion":return In;case"bool":case"boolean":return qn;case"string":return Yn}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function df(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=uf(s.type);if(s.times===void 0){let t=[],n=[];bu(s.keys,t,n,"value"),s.times=t,s.values=n}return e.parse!==void 0?e.parse(s):new e(s.name,s.times,s.values,s.interpolation)}var En={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}},So=class{constructor(e,t,n){let i=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(u){a++,r===!1&&i.onStart!==void 0&&i.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,i.onProgress!==void 0&&i.onProgress(u,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){let h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=c.length;h<d;h+=2){let p=c[h],g=c[h+1];if(p.global&&(p.lastIndex=0),p.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Eu=new So,Ln=class{constructor(e){this.manager=e!==void 0?e:Eu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ln.DEFAULT_MATERIAL_NAME="__DEFAULT";var Gn={},gc=class extends Error{constructor(e,t){super(e),this.response=t}},ys=class extends Ln{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=En.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(Gn[e]!==void 0){Gn[e].push({onLoad:t,onProgress:n,onError:i});return}Gn[e]=[],Gn[e].push({onLoad:t,onProgress:n,onError:i});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,l=this.responseType;fetch(o).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let u=Gn[e],h=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),p=d?parseInt(d):0,g=p!==0,_=0,m=new ReadableStream({start(f){b();function b(){h.read().then(({done:E,value:v})=>{if(E)f.close();else{_+=v.byteLength;let C=new ProgressEvent("progress",{lengthComputable:g,loaded:_,total:p});for(let R=0,I=u.length;R<I;R++){let D=u[R];D.onProgress&&D.onProgress(C)}f.enqueue(v),b()}},E=>{f.error(E)})}}});return new Response(m)}else throw new gc(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return c.json();default:if(a==="")return c.text();{let h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,p=new TextDecoder(d);return c.arrayBuffer().then(g=>p.decode(g))}}}).then(c=>{En.add(`file:${e}`,c);let u=Gn[e];delete Gn[e];for(let h=0,d=u.length;h<d;h++){let p=u[h];p.onLoad&&p.onLoad(c)}}).catch(c=>{let u=Gn[e];if(u===void 0)throw this.manager.itemError(e),c;delete Gn[e];for(let h=0,d=u.length;h<d;h++){let p=u[h];p.onError&&p.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var ss=new WeakMap,bo=class extends Ln{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=En.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let h=ss.get(o);h===void 0&&(h=[],ss.set(o,h)),h.push({onLoad:t,onError:i})}return o}let a=cs("img");function l(){u(),t&&t(this);let h=ss.get(this)||[];for(let d=0;d<h.length;d++){let p=h[d];p.onLoad&&p.onLoad(this)}ss.delete(this),r.manager.itemEnd(e)}function c(h){u(),i&&i(h),En.remove(`image:${e}`);let d=ss.get(this)||[];for(let p=0;p<d.length;p++){let g=d[p];g.onError&&g.onError(h)}ss.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),En.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var ur=class extends Ln{constructor(e){super(e)}load(e,t,n,i){let r=new St,o=new bo(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}},Pi=class extends ct{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ce(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},dr=class extends Pi{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ct.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ce(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},ac=new ze,Ah=new L,Rh=new L,fr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ie(512,512),this.mapType=vn,this.map=null,this.mapPass=null,this.matrix=new ze,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new gs,this._frameExtents=new Ie(1,1),this._viewportCount=1,this._viewports=[new Ke(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Ah.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ah),Rh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Rh),t.updateMatrixWorld(),ac.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ac,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ac)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},_c=class extends fr{constructor(){super(new xt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=wi*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},pr=class extends Pi{constructor(e,t,n=0,i=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ct.DEFAULT_UP),this.updateMatrix(),this.target=new ct,this.distance=n,this.angle=i,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new _c}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Ch=new ze,Vs=new L,cc=new L,xc=class extends fr{constructor(){super(new xt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ie(4,2),this._viewportCount=6,this._viewports=[new Ke(2,1,1,1),new Ke(0,1,1,1),new Ke(3,1,1,1),new Ke(1,1,1,1),new Ke(3,0,1,1),new Ke(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Vs.setFromMatrixPosition(e.matrixWorld),n.position.copy(Vs),cc.copy(n.position),cc.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(cc),n.updateMatrixWorld(),i.makeTranslation(-Vs.x,-Vs.y,-Vs.z),Ch.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ch,n.coordinateSystem,n.reversedDepth)}},mr=class extends Pi{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new xc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Li=class extends Js{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,o=n+e,a=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},yc=class extends fr{constructor(){super(new Li(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},li=class extends Pi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ct.DEFAULT_UP),this.updateMatrix(),this.target=new ct,this.shadow=new yc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Zn=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var lc=new WeakMap,gr=class extends Ln{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=En.get(`image-bitmap:${e}`);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(c=>{if(lc.has(o)===!0)i&&i(lc.get(o)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(c),r.manager.itemEnd(e),c});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let l=fetch(e,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){return En.add(`image-bitmap:${e}`,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){i&&i(c),lc.set(l,c),En.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});En.add(`image-bitmap:${e}`,l),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Eo=class extends xt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Vc="\\[\\]\\.:\\/",ff=new RegExp("["+Vc+"]","g"),Gc="[^"+Vc+"]",pf="[^"+Vc.replace("\\.","")+"]",mf=/((?:WC+[\/:])*)/.source.replace("WC",Gc),gf=/(WCOD+)?/.source.replace("WCOD",pf),_f=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Gc),xf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Gc),yf=new RegExp("^"+mf+gf+_f+xf+"$"),vf=["material","materials","bones","map"],vc=class{constructor(e,t,n){let i=n||je.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},je=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ff,"")}static parseTrackName(e){let t=yf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);vf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[i];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};je.Composite=vc;je.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};je.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};je.prototype.GetterByBindingType=[je.prototype._getValue_direct,je.prototype._getValue_array,je.prototype._getValue_arrayElement,je.prototype._getValue_toArray];je.prototype.SetterByBindingTypeAndVersioning=[[je.prototype._setValue_direct,je.prototype._setValue_direct_setNeedsUpdate,je.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[je.prototype._setValue_array,je.prototype._setValue_array_setNeedsUpdate,je.prototype._setValue_array_setMatrixWorldNeedsUpdate],[je.prototype._setValue_arrayElement,je.prototype._setValue_arrayElement_setNeedsUpdate,je.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[je.prototype._setValue_fromArray,je.prototype._setValue_fromArray_setNeedsUpdate,je.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var I0=new Float32Array(1);var Ih=new ze,_r=class{constructor(e,t,n=0,i=1/0){this.ray=new An(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new us,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Ih.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ih),this}intersectObject(e,t=!0,n=[]){return Mc(e,this,n,t),n.sort(Ph),n}intersectObjects(e,t=!0,n=[]){for(let i=0,r=e.length;i<r;i++)Mc(e[i],this,n,t);return n.sort(Ph),n}};function Ph(s,e){return s.distance-e.distance}function Mc(s,e,t,n){let i=!0;if(s.layers.test(e.layers)&&s.raycast(e,t)===!1&&(i=!1),i===!0&&n===!0){let r=s.children;for(let o=0,a=r.length;o<a;o++)Mc(r[o],e,t,!0)}}var vs=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(We(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var xr=class extends _s{constructor(e=10,t=10,n=4473924,i=8947848){n=new Ce(n),i=new Ce(i);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let d=0,p=0,g=-a;d<=t;d++,g+=o){l.push(-a,0,g,a,0,g),l.push(g,0,-a,g,0,a);let _=d===r?n:i;_.toArray(c,p),p+=3,_.toArray(c,p),p+=3,_.toArray(c,p),p+=3,_.toArray(c,p),p+=3}let u=new Nt;u.setAttribute("position",new mt(l,3)),u.setAttribute("color",new mt(c,3));let h=new Ri({vertexColors:!0,toneMapped:!1});super(u,h),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};var yr=class extends Tn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Wc(s,e,t,n){let i=Mf(n);switch(t){case Lc:return s*e;case ws:return s*e/i.components*i.byteLength;case zo:return s*e/i.components*i.byteLength;case Nc:return s*e*2/i.components*i.byteLength;case ko:return s*e*2/i.components*i.byteLength;case Dc:return s*e*3/i.components*i.byteLength;case en:return s*e*4/i.components*i.byteLength;case Ho:return s*e*4/i.components*i.byteLength;case Sr:case br:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Er:case Tr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Go:case Xo:return Math.max(s,16)*Math.max(e,8)/4;case Vo:case Wo:return Math.max(s,8)*Math.max(e,8)/2;case qo:case Yo:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Zo:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Ko:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Jo:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case $o:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case jo:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case ea:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case ta:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case na:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case ia:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case sa:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case ra:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case oa:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case aa:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case ca:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case la:case ha:case ua:return Math.ceil(s/4)*Math.ceil(e/4)*16;case da:case fa:return Math.ceil(s/4)*Math.ceil(e/4)*8;case pa:case ma:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Mf(s){switch(s){case vn:case Rc:return{byteLength:1,components:1};case Ss:case Cc:case bs:return{byteLength:2,components:1};case Oo:case Bo:return{byteLength:2,components:4};case di:case Fo:case on:return{byteLength:4,components:1};case Ic:case Pc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function Zu(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function bf(s){let e=new WeakMap;function t(a,l){let c=a.array,u=a.usage,h=c.byteLength,d=s.createBuffer();s.bindBuffer(l,d),s.bufferData(l,c,u),a.onUploadCallback();let p;if(c instanceof Float32Array)p=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=s.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=s.HALF_FLOAT:p=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=s.SHORT;else if(c instanceof Uint32Array)p=s.UNSIGNED_INT;else if(c instanceof Int32Array)p=s.INT;else if(c instanceof Int8Array)p=s.BYTE;else if(c instanceof Uint8Array)p=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){let u=l.array,h=l.updateRanges;if(s.bindBuffer(c,a),h.length===0)s.bufferSubData(c,0,u);else{h.sort((p,g)=>p.start-g.start);let d=0;for(let p=1;p<h.length;p++){let g=h[d],_=h[p];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++d,h[d]=_)}h.length=d+1;for(let p=0,g=h.length;p<g;p++){let _=h[p];s.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(s.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:i,remove:r,update:o}}var Ef=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Tf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,wf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Af=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Rf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Cf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,If=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Pf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Lf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Df=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Nf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Uf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ff=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Of=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Bf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,zf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,kf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Hf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Vf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Gf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Wf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Xf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,qf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Yf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Zf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Kf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Jf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$f=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,jf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Qf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ep="gl_FragColor = linearToOutputTexel( gl_FragColor );",tp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,np=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ip=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,sp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,rp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,op=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,ap=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,cp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,lp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,hp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,up=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,dp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,fp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,pp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,mp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,gp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,_p=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,xp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,yp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,vp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Mp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Sp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,bp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ep=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Tp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,wp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ap=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Rp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Cp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ip=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Pp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Lp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Dp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Np=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Up=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Fp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Op=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Bp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,kp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Vp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Gp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Xp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,qp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Yp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Zp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Kp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Jp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$p=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,jp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Qp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,em=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,tm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,nm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,im=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,sm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,rm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,om=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,am=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,cm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,lm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,um=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,dm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,fm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,pm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,mm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,gm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,_m=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,xm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,ym=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Mm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Sm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,bm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Em=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Am=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Im=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Pm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Lm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Dm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Nm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Um=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Fm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Om=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Bm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,km=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Vm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Wm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Xm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ym=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Zm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Km=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$m=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,jm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,eg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,tg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ng=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ge={alphahash_fragment:Ef,alphahash_pars_fragment:Tf,alphamap_fragment:wf,alphamap_pars_fragment:Af,alphatest_fragment:Rf,alphatest_pars_fragment:Cf,aomap_fragment:If,aomap_pars_fragment:Pf,batching_pars_vertex:Lf,batching_vertex:Df,begin_vertex:Nf,beginnormal_vertex:Uf,bsdfs:Ff,iridescence_fragment:Of,bumpmap_pars_fragment:Bf,clipping_planes_fragment:zf,clipping_planes_pars_fragment:kf,clipping_planes_pars_vertex:Hf,clipping_planes_vertex:Vf,color_fragment:Gf,color_pars_fragment:Wf,color_pars_vertex:Xf,color_vertex:qf,common:Yf,cube_uv_reflection_fragment:Zf,defaultnormal_vertex:Kf,displacementmap_pars_vertex:Jf,displacementmap_vertex:$f,emissivemap_fragment:jf,emissivemap_pars_fragment:Qf,colorspace_fragment:ep,colorspace_pars_fragment:tp,envmap_fragment:np,envmap_common_pars_fragment:ip,envmap_pars_fragment:sp,envmap_pars_vertex:rp,envmap_physical_pars_fragment:gp,envmap_vertex:op,fog_vertex:ap,fog_pars_vertex:cp,fog_fragment:lp,fog_pars_fragment:hp,gradientmap_pars_fragment:up,lightmap_pars_fragment:dp,lights_lambert_fragment:fp,lights_lambert_pars_fragment:pp,lights_pars_begin:mp,lights_toon_fragment:_p,lights_toon_pars_fragment:xp,lights_phong_fragment:yp,lights_phong_pars_fragment:vp,lights_physical_fragment:Mp,lights_physical_pars_fragment:Sp,lights_fragment_begin:bp,lights_fragment_maps:Ep,lights_fragment_end:Tp,logdepthbuf_fragment:wp,logdepthbuf_pars_fragment:Ap,logdepthbuf_pars_vertex:Rp,logdepthbuf_vertex:Cp,map_fragment:Ip,map_pars_fragment:Pp,map_particle_fragment:Lp,map_particle_pars_fragment:Dp,metalnessmap_fragment:Np,metalnessmap_pars_fragment:Up,morphinstance_vertex:Fp,morphcolor_vertex:Op,morphnormal_vertex:Bp,morphtarget_pars_vertex:zp,morphtarget_vertex:kp,normal_fragment_begin:Hp,normal_fragment_maps:Vp,normal_pars_fragment:Gp,normal_pars_vertex:Wp,normal_vertex:Xp,normalmap_pars_fragment:qp,clearcoat_normal_fragment_begin:Yp,clearcoat_normal_fragment_maps:Zp,clearcoat_pars_fragment:Kp,iridescence_pars_fragment:Jp,opaque_fragment:$p,packing:jp,premultiplied_alpha_fragment:Qp,project_vertex:em,dithering_fragment:tm,dithering_pars_fragment:nm,roughnessmap_fragment:im,roughnessmap_pars_fragment:sm,shadowmap_pars_fragment:rm,shadowmap_pars_vertex:om,shadowmap_vertex:am,shadowmask_pars_fragment:cm,skinbase_vertex:lm,skinning_pars_vertex:hm,skinning_vertex:um,skinnormal_vertex:dm,specularmap_fragment:fm,specularmap_pars_fragment:pm,tonemapping_fragment:mm,tonemapping_pars_fragment:gm,transmission_fragment:_m,transmission_pars_fragment:xm,uv_pars_fragment:ym,uv_pars_vertex:vm,uv_vertex:Mm,worldpos_vertex:Sm,background_vert:bm,background_frag:Em,backgroundCube_vert:Tm,backgroundCube_frag:wm,cube_vert:Am,cube_frag:Rm,depth_vert:Cm,depth_frag:Im,distanceRGBA_vert:Pm,distanceRGBA_frag:Lm,equirect_vert:Dm,equirect_frag:Nm,linedashed_vert:Um,linedashed_frag:Fm,meshbasic_vert:Om,meshbasic_frag:Bm,meshlambert_vert:zm,meshlambert_frag:km,meshmatcap_vert:Hm,meshmatcap_frag:Vm,meshnormal_vert:Gm,meshnormal_frag:Wm,meshphong_vert:Xm,meshphong_frag:qm,meshphysical_vert:Ym,meshphysical_frag:Zm,meshtoon_vert:Km,meshtoon_frag:Jm,points_vert:$m,points_frag:jm,shadow_vert:Qm,shadow_frag:eg,sprite_vert:tg,sprite_frag:ng},ce={common:{diffuse:{value:new Ce(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new Ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ce(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ce(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new Ce(16777215)},opacity:{value:1},center:{value:new Ie(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},Nn={basic:{uniforms:Ft([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ge.meshbasic_vert,fragmentShader:Ge.meshbasic_frag},lambert:{uniforms:Ft([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ce(0)}}]),vertexShader:Ge.meshlambert_vert,fragmentShader:Ge.meshlambert_frag},phong:{uniforms:Ft([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ce(0)},specular:{value:new Ce(1118481)},shininess:{value:30}}]),vertexShader:Ge.meshphong_vert,fragmentShader:Ge.meshphong_frag},standard:{uniforms:Ft([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new Ce(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag},toon:{uniforms:Ft([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new Ce(0)}}]),vertexShader:Ge.meshtoon_vert,fragmentShader:Ge.meshtoon_frag},matcap:{uniforms:Ft([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ge.meshmatcap_vert,fragmentShader:Ge.meshmatcap_frag},points:{uniforms:Ft([ce.points,ce.fog]),vertexShader:Ge.points_vert,fragmentShader:Ge.points_frag},dashed:{uniforms:Ft([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ge.linedashed_vert,fragmentShader:Ge.linedashed_frag},depth:{uniforms:Ft([ce.common,ce.displacementmap]),vertexShader:Ge.depth_vert,fragmentShader:Ge.depth_frag},normal:{uniforms:Ft([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ge.meshnormal_vert,fragmentShader:Ge.meshnormal_frag},sprite:{uniforms:Ft([ce.sprite,ce.fog]),vertexShader:Ge.sprite_vert,fragmentShader:Ge.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ge.background_vert,fragmentShader:Ge.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:Ge.backgroundCube_vert,fragmentShader:Ge.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ge.cube_vert,fragmentShader:Ge.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ge.equirect_vert,fragmentShader:Ge.equirect_frag},distanceRGBA:{uniforms:Ft([ce.common,ce.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ge.distanceRGBA_vert,fragmentShader:Ge.distanceRGBA_frag},shadow:{uniforms:Ft([ce.lights,ce.fog,{color:{value:new Ce(0)},opacity:{value:1}}]),vertexShader:Ge.shadow_vert,fragmentShader:Ge.shadow_frag}};Nn.physical={uniforms:Ft([Nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new Ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new Ce(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new Ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new Ce(0)},specularColor:{value:new Ce(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new Ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag};var ga={r:0,b:0,g:0},Oi=new Wt,ig=new ze;function sg(s,e,t,n,i,r,o){let a=new Ce(0),l=r===!0?0:1,c,u,h=null,d=0,p=null;function g(E){let v=E.isScene===!0?E.background:null;return v&&v.isTexture&&(v=(E.backgroundBlurriness>0?t:e).get(v)),v}function _(E){let v=!1,C=g(E);C===null?f(a,l):C&&C.isColor&&(f(C,1),v=!0);let R=s.xr.getEnvironmentBlendMode();R==="additive"?n.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(s.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function m(E,v){let C=g(v);C&&(C.isCubeTexture||C.mapping===Mr)?(u===void 0&&(u=new gt(new Rn(1,1,1),new _n({name:"BackgroundCubeMaterial",uniforms:Fi(Nn.backgroundCube.uniforms),vertexShader:Nn.backgroundCube.vertexShader,fragmentShader:Nn.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(R,I,D){this.matrixWorld.copyPosition(D.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),Oi.copy(v.backgroundRotation),Oi.x*=-1,Oi.y*=-1,Oi.z*=-1,C.isCubeTexture&&C.isRenderTargetTexture===!1&&(Oi.y*=-1,Oi.z*=-1),u.material.uniforms.envMap.value=C,u.material.uniforms.flipEnvMap.value=C.isCubeTexture&&C.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(ig.makeRotationFromEuler(Oi)),u.material.toneMapped=Ye.getTransfer(C.colorSpace)!==Qe,(h!==C||d!==C.version||p!==s.toneMapping)&&(u.material.needsUpdate=!0,h=C,d=C.version,p=s.toneMapping),u.layers.enableAll(),E.unshift(u,u.geometry,u.material,0,0,null)):C&&C.isTexture&&(c===void 0&&(c=new gt(new xn(2,2),new _n({name:"BackgroundMaterial",uniforms:Fi(Nn.background.uniforms),vertexShader:Nn.background.vertexShader,fragmentShader:Nn.background.fragmentShader,side:mn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=C,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=Ye.getTransfer(C.colorSpace)!==Qe,C.matrixAutoUpdate===!0&&C.updateMatrix(),c.material.uniforms.uvTransform.value.copy(C.matrix),(h!==C||d!==C.version||p!==s.toneMapping)&&(c.material.needsUpdate=!0,h=C,d=C.version,p=s.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}function f(E,v){E.getRGB(ga,Hc(s)),n.buffers.color.setClear(ga.r,ga.g,ga.b,v,o)}function b(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(E,v=1){a.set(E),l=v,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(E){l=E,f(a,l)},render:_,addToRenderList:m,dispose:b}}function rg(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null),r=i,o=!1;function a(x,w,A,U,F){let G=!1,V=h(U,A,w);r!==V&&(r=V,c(r.object)),G=p(x,U,A,F),G&&g(x,U,A,F),F!==null&&e.update(F,s.ELEMENT_ARRAY_BUFFER),(G||o)&&(o=!1,v(x,w,A,U),F!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return s.createVertexArray()}function c(x){return s.bindVertexArray(x)}function u(x){return s.deleteVertexArray(x)}function h(x,w,A){let U=A.wireframe===!0,F=n[x.id];F===void 0&&(F={},n[x.id]=F);let G=F[w.id];G===void 0&&(G={},F[w.id]=G);let V=G[U];return V===void 0&&(V=d(l()),G[U]=V),V}function d(x){let w=[],A=[],U=[];for(let F=0;F<t;F++)w[F]=0,A[F]=0,U[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:w,enabledAttributes:A,attributeDivisors:U,object:x,attributes:{},index:null}}function p(x,w,A,U){let F=r.attributes,G=w.attributes,V=0,$=A.getAttributes();for(let H in $)if($[H].location>=0){let k=F[H],J=G[H];if(J===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(J=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(J=x.instanceColor)),k===void 0||k.attribute!==J||J&&k.data!==J.data)return!0;V++}return r.attributesNum!==V||r.index!==U}function g(x,w,A,U){let F={},G=w.attributes,V=0,$=A.getAttributes();for(let H in $)if($[H].location>=0){let k=G[H];k===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(k=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(k=x.instanceColor));let J={};J.attribute=k,k&&k.data&&(J.data=k.data),F[H]=J,V++}r.attributes=F,r.attributesNum=V,r.index=U}function _(){let x=r.newAttributes;for(let w=0,A=x.length;w<A;w++)x[w]=0}function m(x){f(x,0)}function f(x,w){let A=r.newAttributes,U=r.enabledAttributes,F=r.attributeDivisors;A[x]=1,U[x]===0&&(s.enableVertexAttribArray(x),U[x]=1),F[x]!==w&&(s.vertexAttribDivisor(x,w),F[x]=w)}function b(){let x=r.newAttributes,w=r.enabledAttributes;for(let A=0,U=w.length;A<U;A++)w[A]!==x[A]&&(s.disableVertexAttribArray(A),w[A]=0)}function E(x,w,A,U,F,G,V){V===!0?s.vertexAttribIPointer(x,w,A,F,G):s.vertexAttribPointer(x,w,A,U,F,G)}function v(x,w,A,U){_();let F=U.attributes,G=A.getAttributes(),V=w.defaultAttributeValues;for(let $ in G){let H=G[$];if(H.location>=0){let ee=F[$];if(ee===void 0&&($==="instanceMatrix"&&x.instanceMatrix&&(ee=x.instanceMatrix),$==="instanceColor"&&x.instanceColor&&(ee=x.instanceColor)),ee!==void 0){let k=ee.normalized,J=ee.itemSize,le=e.get(ee);if(le===void 0)continue;let de=le.buffer,me=le.type,Ae=le.bytesPerElement,W=me===s.INT||me===s.UNSIGNED_INT||ee.gpuType===Fo;if(ee.isInterleavedBufferAttribute){let Z=ee.data,oe=Z.stride,Te=ee.offset;if(Z.isInstancedInterleavedBuffer){for(let pe=0;pe<H.locationSize;pe++)f(H.location+pe,Z.meshPerAttribute);x.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let pe=0;pe<H.locationSize;pe++)m(H.location+pe);s.bindBuffer(s.ARRAY_BUFFER,de);for(let pe=0;pe<H.locationSize;pe++)E(H.location+pe,J/H.locationSize,me,k,oe*Ae,(Te+J/H.locationSize*pe)*Ae,W)}else{if(ee.isInstancedBufferAttribute){for(let Z=0;Z<H.locationSize;Z++)f(H.location+Z,ee.meshPerAttribute);x.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let Z=0;Z<H.locationSize;Z++)m(H.location+Z);s.bindBuffer(s.ARRAY_BUFFER,de);for(let Z=0;Z<H.locationSize;Z++)E(H.location+Z,J/H.locationSize,me,k,J*Ae,J/H.locationSize*Z*Ae,W)}}else if(V!==void 0){let k=V[$];if(k!==void 0)switch(k.length){case 2:s.vertexAttrib2fv(H.location,k);break;case 3:s.vertexAttrib3fv(H.location,k);break;case 4:s.vertexAttrib4fv(H.location,k);break;default:s.vertexAttrib1fv(H.location,k)}}}}b()}function C(){D();for(let x in n){let w=n[x];for(let A in w){let U=w[A];for(let F in U)u(U[F].object),delete U[F];delete w[A]}delete n[x]}}function R(x){if(n[x.id]===void 0)return;let w=n[x.id];for(let A in w){let U=w[A];for(let F in U)u(U[F].object),delete U[F];delete w[A]}delete n[x.id]}function I(x){for(let w in n){let A=n[w];if(A[x.id]===void 0)continue;let U=A[x.id];for(let F in U)u(U[F].object),delete U[F];delete A[x.id]}}function D(){S(),o=!0,r!==i&&(r=i,c(r.object))}function S(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:D,resetDefaultState:S,dispose:C,releaseStatesOfGeometry:R,releaseStatesOfProgram:I,initAttributes:_,enableAttribute:m,disableUnusedAttributes:b}}function og(s,e,t){let n;function i(c){n=c}function r(c,u){s.drawArrays(n,c,u),t.update(u,n,1)}function o(c,u,h){h!==0&&(s.drawArraysInstanced(n,c,u,h),t.update(u,n,h))}function a(c,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let p=0;for(let g=0;g<h;g++)p+=u[g];t.update(p,n,1)}function l(c,u,h,d){if(h===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)o(c[g],u[g],d[g]);else{p.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let _=0;_<h;_++)g+=u[_]*d[_];t.update(g,n,1)}}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function ag(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let I=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(I){return!(I!==en&&n.convert(I)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(I){let D=I===bs&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==vn&&n.convert(I)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==on&&!D)}function l(I){if(I==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),p=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),f=s.getParameter(s.MAX_VERTEX_ATTRIBS),b=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),E=s.getParameter(s.MAX_VARYING_VECTORS),v=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),C=g>0,R=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:b,maxVaryings:E,maxFragmentUniforms:v,vertexTextures:C,maxSamples:R}}function cg(s){let e=this,t=null,n=0,i=!1,r=!1,o=new Vt,a=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){let p=h.length!==0||d||n!==0||i;return i=d,n=h.length,p},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,p){let g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,f=s.get(h);if(!i||g===null||g.length===0||r&&!m)r?u(null):c();else{let b=r?0:n,E=b*4,v=f.clippingState||null;l.value=v,v=u(g,d,E,p);for(let C=0;C!==E;++C)v[C]=t[C];f.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,p,g){let _=h!==null?h.length:0,m=null;if(_!==0){if(m=l.value,g!==!0||m===null){let f=p+_*4,b=d.matrixWorldInverse;a.getNormalMatrix(b),(m===null||m.length<f)&&(m=new Float32Array(f));for(let E=0,v=p;E!==_;++E,v+=4)o.copy(h[E]).applyMatrix4(b,a),o.normal.toArray(m,v),m[v+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function lg(s){let e=new WeakMap;function t(o,a){return a===Do?o.mapping=Di:a===No&&(o.mapping=Ni),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Do||a===No)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new fo(l.height);return c.fromEquirectangularTexture(s,o),e.set(o,c),o.addEventListener("dispose",i),t(c.texture,o.mapping)}else return null}}return o}function i(o){let a=o.target;a.removeEventListener("dispose",i);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Cs=4,Tu=[.125,.215,.35,.446,.526,.582],ki=20,Xc=new Li,wu=new Ce,qc=null,Yc=0,Zc=0,Kc=!1,zi=(1+Math.sqrt(5))/2,Rs=1/zi,Au=[new L(-zi,Rs,0),new L(zi,Rs,0),new L(-Rs,0,zi),new L(Rs,0,zi),new L(0,zi,-Rs),new L(0,zi,Rs),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],hg=new L,ya=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100,r={}){let{size:o=256,position:a=hg}=r;qc=this._renderer.getRenderTarget(),Yc=this._renderer.getActiveCubeFace(),Zc=this._renderer.getActiveMipmapLevel(),Kc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,i,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Iu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Cu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(qc,Yc,Zc),this._renderer.xr.enabled=Kc,e.scissorTest=!1,_a(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Di||e.mapping===Ni?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),qc=this._renderer.getRenderTarget(),Yc=this._renderer.getActiveCubeFace(),Zc=this._renderer.getActiveMipmapLevel(),Kc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Ct,minFilter:Ct,generateMipmaps:!1,type:bs,format:en,colorSpace:It,depthBuffer:!1},i=Ru(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ru(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=ug(r)),this._blurMaterial=dg(r,e,t)}return i}_compileMaterial(e){let t=new gt(this._lodPlanes[0],e);this._renderer.compile(t,Xc)}_sceneToCubeUV(e,t,n,i,r){let l=new xt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,p=h.toneMapping;h.getClearColor(wu),h.toneMapping=Jn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(i),h.clearDepth(),h.setRenderTarget(null));let _=new Qt({name:"PMREM.Background",side:kt,depthWrite:!1,depthTest:!1}),m=new gt(new Rn,_),f=!1,b=e.background;b?b.isColor&&(_.color.copy(b),e.background=null,f=!0):(_.color.copy(wu),f=!0);for(let E=0;E<6;E++){let v=E%3;v===0?(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[E],r.y,r.z)):v===1?(l.up.set(0,0,c[E]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[E],r.z)):(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[E]));let C=this._cubeSize;_a(i,v*C,E>2?C:0,C,C),h.setRenderTarget(i),f&&h.render(m,l),h.render(e,l)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=p,h.autoClear=d,e.background=b}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===Di||e.mapping===Ni;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Iu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Cu());let r=i?this._cubemapMaterial:this._equirectMaterial,o=new gt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;_a(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,Xc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let r=1;r<i;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Au[(i-r-1)%Au.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,i,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,h=new gt(this._lodPlanes[i],c),d=c.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*ki-1),_=r/g,m=isFinite(r)?1+Math.floor(u*_):ki;m>ki&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${ki}`);let f=[],b=0;for(let I=0;I<ki;++I){let D=I/_,S=Math.exp(-D*D/2);f.push(S),I===0?b+=S:I<m&&(b+=2*S)}for(let I=0;I<f.length;I++)f[I]=f[I]/b;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:E}=this;d.dTheta.value=g,d.mipInt.value=E-n;let v=this._sizeLods[i],C=3*v*(i>E-Cs?i-E+Cs:0),R=4*(this._cubeSize-v);_a(t,C,R,3*v,2*v),l.setRenderTarget(t),l.render(h,Xc)}};function ug(s){let e=[],t=[],n=[],i=s,r=s-Cs+1+Tu.length;for(let o=0;o<r;o++){let a=Math.pow(2,i);t.push(a);let l=1/a;o>s-Cs?l=Tu[o-s+Cs-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,g=6,_=3,m=2,f=1,b=new Float32Array(_*g*p),E=new Float32Array(m*g*p),v=new Float32Array(f*g*p);for(let R=0;R<p;R++){let I=R%3*2/3-1,D=R>2?0:-1,S=[I,D,0,I+2/3,D,0,I+2/3,D+1,0,I,D,0,I+2/3,D+1,0,I,D+1,0];b.set(S,_*g*R),E.set(d,m*g*R);let x=[R,R,R,R,R,R];v.set(x,f*g*R)}let C=new Nt;C.setAttribute("position",new yt(b,_)),C.setAttribute("uv",new yt(E,m)),C.setAttribute("faceIndex",new yt(v,f)),e.push(C),i>Cs&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Ru(s,e,t){let n=new wn(s,e,t);return n.texture.mapping=Mr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function _a(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function dg(s,e,t){let n=new Float32Array(ki),i=new L(0,1,0);return new _n({name:"SphericalGaussianBlur",defines:{n:ki,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function Cu(){return new _n({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function Iu(){return new _n({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function rl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function fg(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Do||l===No,u=l===Di||l===Ni;if(c||u){let h=e.get(a),d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new ya(s)),h=c?t.fromEquirectangular(a,h):t.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),h.texture;if(h!==void 0)return h.texture;{let p=a.image;return c&&p&&p.height>0||u&&p&&i(p)?(t===null&&(t=new ya(s)),h=c?t.fromEquirectangular(a):t.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function i(a){let l=0,c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function pg(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&ls("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function mg(s,e,t,n){let i={},r=new WeakMap;function o(h){let d=h.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete i[d.id];let p=r.get(d);p&&(e.remove(p),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function l(h){let d=h.attributes;for(let p in d)e.update(d[p],s.ARRAY_BUFFER)}function c(h){let d=[],p=h.index,g=h.attributes.position,_=0;if(p!==null){let b=p.array;_=p.version;for(let E=0,v=b.length;E<v;E+=3){let C=b[E+0],R=b[E+1],I=b[E+2];d.push(C,R,R,I,I,C)}}else if(g!==void 0){let b=g.array;_=g.version;for(let E=0,v=b.length/3-1;E<v;E+=3){let C=E+0,R=E+1,I=E+2;d.push(C,R,R,I,I,C)}}else return;let m=new(kc(d)?Ks:Zs)(d,1);m.version=_;let f=r.get(h);f&&e.remove(f),r.set(h,m)}function u(h){let d=r.get(h);if(d){let p=h.index;p!==null&&d.version<p.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function gg(s,e,t){let n;function i(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,p){s.drawElements(n,p,r,d*o),t.update(p,n,1)}function c(d,p,g){g!==0&&(s.drawElementsInstanced(n,p,r,d*o,g),t.update(p,n,g))}function u(d,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,d,0,g);let m=0;for(let f=0;f<g;f++)m+=p[f];t.update(m,n,1)}function h(d,p,g,_){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<d.length;f++)c(d[f]/o,p[f],_[f]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,r,d,0,_,0,g);let f=0;for(let b=0;b<g;b++)f+=p[b]*_[b];t.update(f,n,1)}}this.setMode=i,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function _g(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=a*(r/3);break;case s.LINES:t.lines+=a*(r/2);break;case s.LINE_STRIP:t.lines+=a*(r-1);break;case s.LINE_LOOP:t.lines+=a*r;break;case s.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function xg(s,e,t){let n=new WeakMap,i=new Ke;function r(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0,d=n.get(a);if(d===void 0||d.count!==h){let S=function(){I.dispose(),n.delete(a),a.removeEventListener("dispose",S)};d!==void 0&&d.texture.dispose();let p=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],b=a.morphAttributes.color||[],E=0;p===!0&&(E=1),g===!0&&(E=2),_===!0&&(E=3);let v=a.attributes.position.count*E,C=1;v>e.maxTextureSize&&(C=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let R=new Float32Array(v*C*4*h),I=new Ys(R,v,C,h);I.type=on,I.needsUpdate=!0;let D=E*4;for(let x=0;x<h;x++){let w=m[x],A=f[x],U=b[x],F=v*C*4*x;for(let G=0;G<w.count;G++){let V=G*D;p===!0&&(i.fromBufferAttribute(w,G),R[F+V+0]=i.x,R[F+V+1]=i.y,R[F+V+2]=i.z,R[F+V+3]=0),g===!0&&(i.fromBufferAttribute(A,G),R[F+V+4]=i.x,R[F+V+5]=i.y,R[F+V+6]=i.z,R[F+V+7]=0),_===!0&&(i.fromBufferAttribute(U,G),R[F+V+8]=i.x,R[F+V+9]=i.y,R[F+V+10]=i.z,R[F+V+11]=U.itemSize===4?i.w:1)}}d={count:h,texture:I,size:new Ie(v,C)},n.set(a,d),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",o.morphTexture,t);else{let p=0;for(let _=0;_<c.length;_++)p+=c[_];let g=a.morphTargetsRelative?1:1-p;l.getUniforms().setValue(s,"morphTargetBaseInfluence",g),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function yg(s,e,t,n){let i=new WeakMap;function r(l){let c=n.render.frame,u=l.geometry,h=e.get(l,u);if(i.get(h)!==c&&(e.update(h),i.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),i.get(l)!==c&&(t.update(l.instanceMatrix,s.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,s.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;i.get(d)!==c&&(d.update(),i.set(d,c))}return h}function o(){i=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Ku=new St,Pu=new or(1,1),Ju=new Ys,$u=new ho,ju=new $s,Lu=[],Du=[],Nu=new Float32Array(16),Uu=new Float32Array(9),Fu=new Float32Array(4);function Ps(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Lu[i];if(r===void 0&&(r=new Float32Array(i),Lu[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function bt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Et(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Ma(s,e){let t=Du[e];t===void 0&&(t=new Int32Array(e),Du[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function vg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function Mg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;s.uniform2fv(this.addr,e),Et(t,e)}}function Sg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(bt(t,e))return;s.uniform3fv(this.addr,e),Et(t,e)}}function bg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;s.uniform4fv(this.addr,e),Et(t,e)}}function Eg(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Et(t,e)}else{if(bt(t,n))return;Fu.set(n),s.uniformMatrix2fv(this.addr,!1,Fu),Et(t,n)}}function Tg(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Et(t,e)}else{if(bt(t,n))return;Uu.set(n),s.uniformMatrix3fv(this.addr,!1,Uu),Et(t,n)}}function wg(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Et(t,e)}else{if(bt(t,n))return;Nu.set(n),s.uniformMatrix4fv(this.addr,!1,Nu),Et(t,n)}}function Ag(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function Rg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;s.uniform2iv(this.addr,e),Et(t,e)}}function Cg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;s.uniform3iv(this.addr,e),Et(t,e)}}function Ig(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;s.uniform4iv(this.addr,e),Et(t,e)}}function Pg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function Lg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;s.uniform2uiv(this.addr,e),Et(t,e)}}function Dg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;s.uniform3uiv(this.addr,e),Et(t,e)}}function Ng(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;s.uniform4uiv(this.addr,e),Et(t,e)}}function Ug(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Pu.compareFunction=Oc,r=Pu):r=Ku,t.setTexture2D(e||r,i)}function Fg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||$u,i)}function Og(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||ju,i)}function Bg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Ju,i)}function zg(s){switch(s){case 5126:return vg;case 35664:return Mg;case 35665:return Sg;case 35666:return bg;case 35674:return Eg;case 35675:return Tg;case 35676:return wg;case 5124:case 35670:return Ag;case 35667:case 35671:return Rg;case 35668:case 35672:return Cg;case 35669:case 35673:return Ig;case 5125:return Pg;case 36294:return Lg;case 36295:return Dg;case 36296:return Ng;case 35678:case 36198:case 36298:case 36306:case 35682:return Ug;case 35679:case 36299:case 36307:return Fg;case 35680:case 36300:case 36308:case 36293:return Og;case 36289:case 36303:case 36311:case 36292:return Bg}}function kg(s,e){s.uniform1fv(this.addr,e)}function Hg(s,e){let t=Ps(e,this.size,2);s.uniform2fv(this.addr,t)}function Vg(s,e){let t=Ps(e,this.size,3);s.uniform3fv(this.addr,t)}function Gg(s,e){let t=Ps(e,this.size,4);s.uniform4fv(this.addr,t)}function Wg(s,e){let t=Ps(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Xg(s,e){let t=Ps(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function qg(s,e){let t=Ps(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Yg(s,e){s.uniform1iv(this.addr,e)}function Zg(s,e){s.uniform2iv(this.addr,e)}function Kg(s,e){s.uniform3iv(this.addr,e)}function Jg(s,e){s.uniform4iv(this.addr,e)}function $g(s,e){s.uniform1uiv(this.addr,e)}function jg(s,e){s.uniform2uiv(this.addr,e)}function Qg(s,e){s.uniform3uiv(this.addr,e)}function e_(s,e){s.uniform4uiv(this.addr,e)}function t_(s,e,t){let n=this.cache,i=e.length,r=Ma(t,i);bt(n,r)||(s.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||Ku,r[o])}function n_(s,e,t){let n=this.cache,i=e.length,r=Ma(t,i);bt(n,r)||(s.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||$u,r[o])}function i_(s,e,t){let n=this.cache,i=e.length,r=Ma(t,i);bt(n,r)||(s.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||ju,r[o])}function s_(s,e,t){let n=this.cache,i=e.length,r=Ma(t,i);bt(n,r)||(s.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||Ju,r[o])}function r_(s){switch(s){case 5126:return kg;case 35664:return Hg;case 35665:return Vg;case 35666:return Gg;case 35674:return Wg;case 35675:return Xg;case 35676:return qg;case 5124:case 35670:return Yg;case 35667:case 35671:return Zg;case 35668:case 35672:return Kg;case 35669:case 35673:return Jg;case 5125:return $g;case 36294:return jg;case 36295:return Qg;case 36296:return e_;case 35678:case 36198:case 36298:case 36306:case 35682:return t_;case 35679:case 36299:case 36307:return n_;case 35680:case 36300:case 36308:case 36293:return i_;case 36289:case 36303:case 36311:case 36292:return s_}}var $c=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=zg(t.type)}},jc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=r_(t.type)}},Qc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,o=i.length;r!==o;++r){let a=i[r];a.setValue(e,t[a.id],n)}}},Jc=/(\w+)(\])?(\[|\.)?/g;function Ou(s,e){s.seq.push(e),s.map[e.id]=e}function o_(s,e,t){let n=s.name,i=n.length;for(Jc.lastIndex=0;;){let r=Jc.exec(n),o=Jc.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){Ou(t,c===void 0?new $c(a,s,e):new jc(a,s,e));break}else{let h=t.map[a];h===void 0&&(h=new Qc(a),Ou(t,h)),t=h}}}var Is=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);o_(r,o,this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function Bu(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var a_=37297,c_=0;function l_(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var zu=new ke;function h_(s){Ye._getMatrix(zu,Ye.workingColorSpace,s);let e=`mat3( ${zu.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(s)){case Xs:return[e,"LinearTransferOETF"];case Qe:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function ku(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+l_(s.getShaderSource(e),a)}else return r}function u_(s,e){let t=h_(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function d_(s,e){let t;switch(e){case tu:t="Linear";break;case nu:t="Reinhard";break;case iu:t="Cineon";break;case Lo:t="ACESFilmic";break;case ru:t="AgX";break;case ou:t="Neutral";break;case su:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var xa=new L;function f_(){Ye.getLuminanceCoefficients(xa);let s=xa.x.toFixed(4),e=xa.y.toFixed(4),t=xa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function p_(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ar).join(`
`)}function m_(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function g_(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),o=r.name,a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function Ar(s){return s!==""}function Hu(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Vu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var __=/^[ \t]*#include +<([\w\d./]+)>/gm;function el(s){return s.replace(__,y_)}var x_=new Map;function y_(s,e){let t=Ge[e];if(t===void 0){let n=x_.get(e);if(n!==void 0)t=Ge[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return el(t)}var v_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Gu(s){return s.replace(v_,M_)}function M_(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Wu(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function S_(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===vr?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===Nh?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Dn&&(e="SHADOWMAP_TYPE_VSM"),e}function b_(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Di:case Ni:e="ENVMAP_TYPE_CUBE";break;case Mr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function E_(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case Ni:e="ENVMAP_MODE_REFRACTION";break}return e}function T_(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case wc:e="ENVMAP_BLENDING_MULTIPLY";break;case Qh:e="ENVMAP_BLENDING_MIX";break;case eu:e="ENVMAP_BLENDING_ADD";break}return e}function w_(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function A_(s,e,t,n){let i=s.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=S_(t),c=b_(t),u=E_(t),h=T_(t),d=w_(t),p=p_(t),g=m_(r),_=i.createProgram(),m,f,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ar).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ar).join(`
`),f.length>0&&(f+=`
`)):(m=[Wu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ar).join(`
`),f=[Wu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Jn?"#define TONE_MAPPING":"",t.toneMapping!==Jn?Ge.tonemapping_pars_fragment:"",t.toneMapping!==Jn?d_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ge.colorspace_pars_fragment,u_("linearToOutputTexel",t.outputColorSpace),f_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ar).join(`
`)),o=el(o),o=Hu(o,t),o=Vu(o,t),a=el(a),a=Hu(a,t),a=Vu(a,t),o=Gu(o),a=Gu(a),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",t.glslVersion===Bc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Bc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let E=b+m+o,v=b+f+a,C=Bu(i,i.VERTEX_SHADER,E),R=Bu(i,i.FRAGMENT_SHADER,v);i.attachShader(_,C),i.attachShader(_,R),t.index0AttributeName!==void 0?i.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function I(w){if(s.debug.checkShaderErrors){let A=i.getProgramInfoLog(_)||"",U=i.getShaderInfoLog(C)||"",F=i.getShaderInfoLog(R)||"",G=A.trim(),V=U.trim(),$=F.trim(),H=!0,ee=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(H=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,_,C,R);else{let k=ku(i,C,"vertex"),J=ku(i,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+w.name+`
Material Type: `+w.type+`

Program Info Log: `+G+`
`+k+`
`+J)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(V===""||$==="")&&(ee=!1);ee&&(w.diagnostics={runnable:H,programLog:G,vertexShader:{log:V,prefix:m},fragmentShader:{log:$,prefix:f}})}i.deleteShader(C),i.deleteShader(R),D=new Is(i,_),S=g_(i,_)}let D;this.getUniforms=function(){return D===void 0&&I(this),D};let S;this.getAttributes=function(){return S===void 0&&I(this),S};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=i.getProgramParameter(_,a_)),x},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=c_++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=C,this.fragmentShader=R,this}var R_=0,tl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new nl(e),t.set(e,n)),n}},nl=class{constructor(e){this.id=R_++,this.code=e,this.usedTimes=0}};function C_(s,e,t,n,i,r,o){let a=new us,l=new tl,c=new Set,u=[],h=i.logarithmicDepthBuffer,d=i.vertexTextures,p=i.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return c.add(S),S===0?"uv":`uv${S}`}function m(S,x,w,A,U){let F=A.fog,G=U.geometry,V=S.isMeshStandardMaterial?A.environment:null,$=(S.isMeshStandardMaterial?t:e).get(S.envMap||V),H=$&&$.mapping===Mr?$.image.height:null,ee=g[S.type];S.precision!==null&&(p=i.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));let k=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,J=k!==void 0?k.length:0,le=0;G.morphAttributes.position!==void 0&&(le=1),G.morphAttributes.normal!==void 0&&(le=2),G.morphAttributes.color!==void 0&&(le=3);let de,me,Ae,W;if(ee){let Je=Nn[ee];de=Je.vertexShader,me=Je.fragmentShader}else de=S.vertexShader,me=S.fragmentShader,l.update(S),Ae=l.getVertexShaderID(S),W=l.getFragmentShaderID(S);let Z=s.getRenderTarget(),oe=s.state.buffers.depth.getReversed(),Te=U.isInstancedMesh===!0,pe=U.isBatchedMesh===!0,Be=!!S.map,ft=!!S.matcap,P=!!$,it=!!S.aoMap,Fe=!!S.lightMap,Ne=!!S.bumpMap,ve=!!S.normalMap,at=!!S.displacementMap,Me=!!S.emissiveMap,Ve=!!S.metalnessMap,wt=!!S.roughnessMap,pt=S.anisotropy>0,T=S.clearcoat>0,y=S.dispersion>0,z=S.iridescence>0,K=S.sheen>0,Q=S.transmission>0,Y=pt&&!!S.anisotropyMap,we=T&&!!S.clearcoatMap,re=T&&!!S.clearcoatNormalMap,Se=T&&!!S.clearcoatRoughnessMap,be=z&&!!S.iridescenceMap,ie=z&&!!S.iridescenceThicknessMap,fe=K&&!!S.sheenColorMap,De=K&&!!S.sheenRoughnessMap,Ee=!!S.specularMap,he=!!S.specularColorMap,He=!!S.specularIntensityMap,N=Q&&!!S.transmissionMap,se=Q&&!!S.thicknessMap,ae=!!S.gradientMap,_e=!!S.alphaMap,te=S.alphaTest>0,j=!!S.alphaHash,ye=!!S.extensions,Oe=Jn;S.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(Oe=s.toneMapping);let rt={shaderID:ee,shaderType:S.type,shaderName:S.name,vertexShader:de,fragmentShader:me,defines:S.defines,customVertexShaderID:Ae,customFragmentShaderID:W,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:pe,batchingColor:pe&&U._colorsTexture!==null,instancing:Te,instancingColor:Te&&U.instanceColor!==null,instancingMorph:Te&&U.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Z===null?s.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:It,alphaToCoverage:!!S.alphaToCoverage,map:Be,matcap:ft,envMap:P,envMapMode:P&&$.mapping,envMapCubeUVHeight:H,aoMap:it,lightMap:Fe,bumpMap:Ne,normalMap:ve,displacementMap:d&&at,emissiveMap:Me,normalMapObjectSpace:ve&&S.normalMapType===uu,normalMapTangentSpace:ve&&S.normalMapType===Fc,metalnessMap:Ve,roughnessMap:wt,anisotropy:pt,anisotropyMap:Y,clearcoat:T,clearcoatMap:we,clearcoatNormalMap:re,clearcoatRoughnessMap:Se,dispersion:y,iridescence:z,iridescenceMap:be,iridescenceThicknessMap:ie,sheen:K,sheenColorMap:fe,sheenRoughnessMap:De,specularMap:Ee,specularColorMap:he,specularIntensityMap:He,transmission:Q,transmissionMap:N,thicknessMap:se,gradientMap:ae,opaque:S.transparent===!1&&S.blending===Si&&S.alphaToCoverage===!1,alphaMap:_e,alphaTest:te,alphaHash:j,combine:S.combine,mapUv:Be&&_(S.map.channel),aoMapUv:it&&_(S.aoMap.channel),lightMapUv:Fe&&_(S.lightMap.channel),bumpMapUv:Ne&&_(S.bumpMap.channel),normalMapUv:ve&&_(S.normalMap.channel),displacementMapUv:at&&_(S.displacementMap.channel),emissiveMapUv:Me&&_(S.emissiveMap.channel),metalnessMapUv:Ve&&_(S.metalnessMap.channel),roughnessMapUv:wt&&_(S.roughnessMap.channel),anisotropyMapUv:Y&&_(S.anisotropyMap.channel),clearcoatMapUv:we&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:re&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Se&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:be&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:De&&_(S.sheenRoughnessMap.channel),specularMapUv:Ee&&_(S.specularMap.channel),specularColorMapUv:he&&_(S.specularColorMap.channel),specularIntensityMapUv:He&&_(S.specularIntensityMap.channel),transmissionMapUv:N&&_(S.transmissionMap.channel),thicknessMapUv:se&&_(S.thicknessMap.channel),alphaMapUv:_e&&_(S.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(ve||pt),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!G.attributes.uv&&(Be||_e),fog:!!F,useFog:S.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:S.flatShading===!0&&S.wireframe===!1,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:oe,skinning:U.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:le,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:s.shadowMap.enabled&&w.length>0,shadowMapType:s.shadowMap.type,toneMapping:Oe,decodeVideoTexture:Be&&S.map.isVideoTexture===!0&&Ye.getTransfer(S.map.colorSpace)===Qe,decodeVideoTextureEmissive:Me&&S.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(S.emissiveMap.colorSpace)===Qe,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===rn,flipSided:S.side===kt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ye&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ye&&S.extensions.multiDraw===!0||pe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return rt.vertexUv1s=c.has(1),rt.vertexUv2s=c.has(2),rt.vertexUv3s=c.has(3),c.clear(),rt}function f(S){let x=[];if(S.shaderID?x.push(S.shaderID):(x.push(S.customVertexShaderID),x.push(S.customFragmentShaderID)),S.defines!==void 0)for(let w in S.defines)x.push(w),x.push(S.defines[w]);return S.isRawShaderMaterial===!1&&(b(x,S),E(x,S),x.push(s.outputColorSpace)),x.push(S.customProgramCacheKey),x.join()}function b(S,x){S.push(x.precision),S.push(x.outputColorSpace),S.push(x.envMapMode),S.push(x.envMapCubeUVHeight),S.push(x.mapUv),S.push(x.alphaMapUv),S.push(x.lightMapUv),S.push(x.aoMapUv),S.push(x.bumpMapUv),S.push(x.normalMapUv),S.push(x.displacementMapUv),S.push(x.emissiveMapUv),S.push(x.metalnessMapUv),S.push(x.roughnessMapUv),S.push(x.anisotropyMapUv),S.push(x.clearcoatMapUv),S.push(x.clearcoatNormalMapUv),S.push(x.clearcoatRoughnessMapUv),S.push(x.iridescenceMapUv),S.push(x.iridescenceThicknessMapUv),S.push(x.sheenColorMapUv),S.push(x.sheenRoughnessMapUv),S.push(x.specularMapUv),S.push(x.specularColorMapUv),S.push(x.specularIntensityMapUv),S.push(x.transmissionMapUv),S.push(x.thicknessMapUv),S.push(x.combine),S.push(x.fogExp2),S.push(x.sizeAttenuation),S.push(x.morphTargetsCount),S.push(x.morphAttributeCount),S.push(x.numDirLights),S.push(x.numPointLights),S.push(x.numSpotLights),S.push(x.numSpotLightMaps),S.push(x.numHemiLights),S.push(x.numRectAreaLights),S.push(x.numDirLightShadows),S.push(x.numPointLightShadows),S.push(x.numSpotLightShadows),S.push(x.numSpotLightShadowsWithMaps),S.push(x.numLightProbes),S.push(x.shadowMapType),S.push(x.toneMapping),S.push(x.numClippingPlanes),S.push(x.numClipIntersection),S.push(x.depthPacking)}function E(S,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),x.gradientMap&&a.enable(22),S.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reversedDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),S.push(a.mask)}function v(S){let x=g[S.type],w;if(x){let A=Nn[x];w=Su.clone(A.uniforms)}else w=S.uniforms;return w}function C(S,x){let w;for(let A=0,U=u.length;A<U;A++){let F=u[A];if(F.cacheKey===x){w=F,++w.usedTimes;break}}return w===void 0&&(w=new A_(s,x,S,r),u.push(w)),w}function R(S){if(--S.usedTimes===0){let x=u.indexOf(S);u[x]=u[u.length-1],u.pop(),S.destroy()}}function I(S){l.remove(S)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:v,acquireProgram:C,releaseProgram:R,releaseShaderCache:I,programs:u,dispose:D}}function I_(){let s=new WeakMap;function e(o){return s.has(o)}function t(o){let a=s.get(o);return a===void 0&&(a={},s.set(o,a)),a}function n(o){s.delete(o)}function i(o,a,l){s.get(o)[a]=l}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function P_(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function Xu(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function qu(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(h,d,p,g,_,m){let f=s[e];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},s[e]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=_,f.group=m),e++,f}function a(h,d,p,g,_,m){let f=o(h,d,p,g,_,m);p.transmission>0?n.push(f):p.transparent===!0?i.push(f):t.push(f)}function l(h,d,p,g,_,m){let f=o(h,d,p,g,_,m);p.transmission>0?n.unshift(f):p.transparent===!0?i.unshift(f):t.unshift(f)}function c(h,d){t.length>1&&t.sort(h||P_),n.length>1&&n.sort(d||Xu),i.length>1&&i.sort(d||Xu)}function u(){for(let h=e,d=s.length;h<d;h++){let p=s[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:l,finish:u,sort:c}}function L_(){let s=new WeakMap;function e(n,i){let r=s.get(n),o;return r===void 0?(o=new qu,s.set(n,[o])):i>=r.length?(o=new qu,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function D_(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Ce};break;case"SpotLight":t={position:new L,direction:new L,color:new Ce,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Ce,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Ce,groundColor:new Ce};break;case"RectAreaLight":t={color:new Ce,position:new L,halfWidth:new L,halfHeight:new L};break}return s[e.id]=t,t}}}function N_(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ie,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var U_=0;function F_(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function O_(s){let e=new D_,t=N_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new L);let i=new L,r=new ze,o=new ze;function a(c){let u=0,h=0,d=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let p=0,g=0,_=0,m=0,f=0,b=0,E=0,v=0,C=0,R=0,I=0;c.sort(F_);for(let S=0,x=c.length;S<x;S++){let w=c[S],A=w.color,U=w.intensity,F=w.distance,G=w.shadow&&w.shadow.map?w.shadow.map.texture:null;if(w.isAmbientLight)u+=A.r*U,h+=A.g*U,d+=A.b*U;else if(w.isLightProbe){for(let V=0;V<9;V++)n.probe[V].addScaledVector(w.sh.coefficients[V],U);I++}else if(w.isDirectionalLight){let V=e.get(w);if(V.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){let $=w.shadow,H=t.get(w);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,n.directionalShadow[p]=H,n.directionalShadowMap[p]=G,n.directionalShadowMatrix[p]=w.shadow.matrix,b++}n.directional[p]=V,p++}else if(w.isSpotLight){let V=e.get(w);V.position.setFromMatrixPosition(w.matrixWorld),V.color.copy(A).multiplyScalar(U),V.distance=F,V.coneCos=Math.cos(w.angle),V.penumbraCos=Math.cos(w.angle*(1-w.penumbra)),V.decay=w.decay,n.spot[_]=V;let $=w.shadow;if(w.map&&(n.spotLightMap[C]=w.map,C++,$.updateMatrices(w),w.castShadow&&R++),n.spotLightMatrix[_]=$.matrix,w.castShadow){let H=t.get(w);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,n.spotShadow[_]=H,n.spotShadowMap[_]=G,v++}_++}else if(w.isRectAreaLight){let V=e.get(w);V.color.copy(A).multiplyScalar(U),V.halfWidth.set(w.width*.5,0,0),V.halfHeight.set(0,w.height*.5,0),n.rectArea[m]=V,m++}else if(w.isPointLight){let V=e.get(w);if(V.color.copy(w.color).multiplyScalar(w.intensity),V.distance=w.distance,V.decay=w.decay,w.castShadow){let $=w.shadow,H=t.get(w);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,H.shadowCameraNear=$.camera.near,H.shadowCameraFar=$.camera.far,n.pointShadow[g]=H,n.pointShadowMap[g]=G,n.pointShadowMatrix[g]=w.shadow.matrix,E++}n.point[g]=V,g++}else if(w.isHemisphereLight){let V=e.get(w);V.skyColor.copy(w.color).multiplyScalar(U),V.groundColor.copy(w.groundColor).multiplyScalar(U),n.hemi[f]=V,f++}}m>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ce.LTC_FLOAT_1,n.rectAreaLTC2=ce.LTC_FLOAT_2):(n.rectAreaLTC1=ce.LTC_HALF_1,n.rectAreaLTC2=ce.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;let D=n.hash;(D.directionalLength!==p||D.pointLength!==g||D.spotLength!==_||D.rectAreaLength!==m||D.hemiLength!==f||D.numDirectionalShadows!==b||D.numPointShadows!==E||D.numSpotShadows!==v||D.numSpotMaps!==C||D.numLightProbes!==I)&&(n.directional.length=p,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=v+C-R,n.spotLightMap.length=C,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=I,D.directionalLength=p,D.pointLength=g,D.spotLength=_,D.rectAreaLength=m,D.hemiLength=f,D.numDirectionalShadows=b,D.numPointShadows=E,D.numSpotShadows=v,D.numSpotMaps=C,D.numLightProbes=I,n.version=U_++)}function l(c,u){let h=0,d=0,p=0,g=0,_=0,m=u.matrixWorldInverse;for(let f=0,b=c.length;f<b;f++){let E=c[f];if(E.isDirectionalLight){let v=n.directional[h];v.direction.setFromMatrixPosition(E.matrixWorld),i.setFromMatrixPosition(E.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(m),h++}else if(E.isSpotLight){let v=n.spot[p];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(E.matrixWorld),i.setFromMatrixPosition(E.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(m),p++}else if(E.isRectAreaLight){let v=n.rectArea[g];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(E.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(E.width*.5,0,0),v.halfHeight.set(0,E.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(E.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(m),d++}else if(E.isHemisphereLight){let v=n.hemi[_];v.direction.setFromMatrixPosition(E.matrixWorld),v.direction.transformDirection(m),_++}}}return{setup:a,setupView:l,state:n}}function Yu(s){let e=new O_(s),t=[],n=[];function i(u){c.camera=u,t.length=0,n.length=0}function r(u){t.push(u)}function o(u){n.push(u)}function a(){e.setup(t)}function l(u){e.setupView(t,u)}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function B_(s){let e=new WeakMap;function t(i,r=0){let o=e.get(i),a;return o===void 0?(a=new Yu(s),e.set(i,[a])):r>=o.length?(a=new Yu(s),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var z_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,k_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function H_(s,e,t){let n=new gs,i=new Ie,r=new Ie,o=new Ke,a=new go({depthPacking:hu}),l=new _o,c={},u=t.maxTextureSize,h={[mn]:kt,[kt]:mn,[rn]:rn},d=new _n({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ie},radius:{value:4}},vertexShader:z_,fragmentShader:k_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let g=new Nt;g.setAttribute("position",new yt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new gt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vr;let f=this.type;this.render=function(R,I,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;let S=s.getRenderTarget(),x=s.getActiveCubeFace(),w=s.getActiveMipmapLevel(),A=s.state;A.setBlending(Kn),A.buffers.depth.getReversed()===!0?A.buffers.color.setClear(0,0,0,0):A.buffers.color.setClear(1,1,1,1),A.buffers.depth.setTest(!0),A.setScissorTest(!1);let U=f!==Dn&&this.type===Dn,F=f===Dn&&this.type!==Dn;for(let G=0,V=R.length;G<V;G++){let $=R[G],H=$.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;i.copy(H.mapSize);let ee=H.getFrameExtents();if(i.multiply(ee),r.copy(H.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/ee.x),i.x=r.x*ee.x,H.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/ee.y),i.y=r.y*ee.y,H.mapSize.y=r.y)),H.map===null||U===!0||F===!0){let J=this.type!==Dn?{minFilter:Rt,magFilter:Rt}:{};H.map!==null&&H.map.dispose(),H.map=new wn(i.x,i.y,J),H.map.texture.name=$.name+".shadowMap",H.camera.updateProjectionMatrix()}s.setRenderTarget(H.map),s.clear();let k=H.getViewportCount();for(let J=0;J<k;J++){let le=H.getViewport(J);o.set(r.x*le.x,r.y*le.y,r.x*le.z,r.y*le.w),A.viewport(o),H.updateMatrices($,J),n=H.getFrustum(),v(I,D,H.camera,$,this.type)}H.isPointLightShadow!==!0&&this.type===Dn&&b(H,D),H.needsUpdate=!1}f=this.type,m.needsUpdate=!1,s.setRenderTarget(S,x,w)};function b(R,I){let D=e.update(_);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,p.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new wn(i.x,i.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,s.setRenderTarget(R.mapPass),s.clear(),s.renderBufferDirect(I,null,D,d,_,null),p.uniforms.shadow_pass.value=R.mapPass.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,s.setRenderTarget(R.map),s.clear(),s.renderBufferDirect(I,null,D,p,_,null)}function E(R,I,D,S){let x=null,w=D.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(w!==void 0)x=w;else if(x=D.isPointLight===!0?l:a,s.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){let A=x.uuid,U=I.uuid,F=c[A];F===void 0&&(F={},c[A]=F);let G=F[U];G===void 0&&(G=x.clone(),F[U]=G,I.addEventListener("dispose",C)),x=G}if(x.visible=I.visible,x.wireframe=I.wireframe,S===Dn?x.side=I.shadowSide!==null?I.shadowSide:I.side:x.side=I.shadowSide!==null?I.shadowSide:h[I.side],x.alphaMap=I.alphaMap,x.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,x.map=I.map,x.clipShadows=I.clipShadows,x.clippingPlanes=I.clippingPlanes,x.clipIntersection=I.clipIntersection,x.displacementMap=I.displacementMap,x.displacementScale=I.displacementScale,x.displacementBias=I.displacementBias,x.wireframeLinewidth=I.wireframeLinewidth,x.linewidth=I.linewidth,D.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let A=s.properties.get(x);A.light=D}return x}function v(R,I,D,S,x){if(R.visible===!1)return;if(R.layers.test(I.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&x===Dn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,R.matrixWorld);let U=e.update(R),F=R.material;if(Array.isArray(F)){let G=U.groups;for(let V=0,$=G.length;V<$;V++){let H=G[V],ee=F[H.materialIndex];if(ee&&ee.visible){let k=E(R,ee,S,x);R.onBeforeShadow(s,R,I,D,U,k,H),s.renderBufferDirect(D,null,U,k,R,H),R.onAfterShadow(s,R,I,D,U,k,H)}}}else if(F.visible){let G=E(R,F,S,x);R.onBeforeShadow(s,R,I,D,U,G,null),s.renderBufferDirect(D,null,U,G,R,null),R.onAfterShadow(s,R,I,D,U,G,null)}}let A=R.children;for(let U=0,F=A.length;U<F;U++)v(A[U],I,D,S,x)}function C(R){R.target.removeEventListener("dispose",C);for(let D in c){let S=c[D],x=R.target.uuid;x in S&&(S[x].dispose(),delete S[x])}}}var V_={[To]:wo,[Ao]:Io,[Ro]:Po,[bi]:Co,[wo]:To,[Io]:Ao,[Po]:Ro,[Co]:bi};function G_(s,e){function t(){let N=!1,se=new Ke,ae=null,_e=new Ke(0,0,0,0);return{setMask:function(te){ae!==te&&!N&&(s.colorMask(te,te,te,te),ae=te)},setLocked:function(te){N=te},setClear:function(te,j,ye,Oe,rt){rt===!0&&(te*=Oe,j*=Oe,ye*=Oe),se.set(te,j,ye,Oe),_e.equals(se)===!1&&(s.clearColor(te,j,ye,Oe),_e.copy(se))},reset:function(){N=!1,ae=null,_e.set(-1,0,0,0)}}}function n(){let N=!1,se=!1,ae=null,_e=null,te=null;return{setReversed:function(j){if(se!==j){let ye=e.get("EXT_clip_control");j?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),se=j;let Oe=te;te=null,this.setClear(Oe)}},getReversed:function(){return se},setTest:function(j){j?Z(s.DEPTH_TEST):oe(s.DEPTH_TEST)},setMask:function(j){ae!==j&&!N&&(s.depthMask(j),ae=j)},setFunc:function(j){if(se&&(j=V_[j]),_e!==j){switch(j){case To:s.depthFunc(s.NEVER);break;case wo:s.depthFunc(s.ALWAYS);break;case Ao:s.depthFunc(s.LESS);break;case bi:s.depthFunc(s.LEQUAL);break;case Ro:s.depthFunc(s.EQUAL);break;case Co:s.depthFunc(s.GEQUAL);break;case Io:s.depthFunc(s.GREATER);break;case Po:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}_e=j}},setLocked:function(j){N=j},setClear:function(j){te!==j&&(se&&(j=1-j),s.clearDepth(j),te=j)},reset:function(){N=!1,ae=null,_e=null,te=null,se=!1}}}function i(){let N=!1,se=null,ae=null,_e=null,te=null,j=null,ye=null,Oe=null,rt=null;return{setTest:function(Je){N||(Je?Z(s.STENCIL_TEST):oe(s.STENCIL_TEST))},setMask:function(Je){se!==Je&&!N&&(s.stencilMask(Je),se=Je)},setFunc:function(Je,On,Sn){(ae!==Je||_e!==On||te!==Sn)&&(s.stencilFunc(Je,On,Sn),ae=Je,_e=On,te=Sn)},setOp:function(Je,On,Sn){(j!==Je||ye!==On||Oe!==Sn)&&(s.stencilOp(Je,On,Sn),j=Je,ye=On,Oe=Sn)},setLocked:function(Je){N=Je},setClear:function(Je){rt!==Je&&(s.clearStencil(Je),rt=Je)},reset:function(){N=!1,se=null,ae=null,_e=null,te=null,j=null,ye=null,Oe=null,rt=null}}}let r=new t,o=new n,a=new i,l=new WeakMap,c=new WeakMap,u={},h={},d=new WeakMap,p=[],g=null,_=!1,m=null,f=null,b=null,E=null,v=null,C=null,R=null,I=new Ce(0,0,0),D=0,S=!1,x=null,w=null,A=null,U=null,F=null,G=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,$=0,H=s.getParameter(s.VERSION);H.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(H)[1]),V=$>=1):H.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),V=$>=2);let ee=null,k={},J=s.getParameter(s.SCISSOR_BOX),le=s.getParameter(s.VIEWPORT),de=new Ke().fromArray(J),me=new Ke().fromArray(le);function Ae(N,se,ae,_e){let te=new Uint8Array(4),j=s.createTexture();s.bindTexture(N,j),s.texParameteri(N,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(N,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let ye=0;ye<ae;ye++)N===s.TEXTURE_3D||N===s.TEXTURE_2D_ARRAY?s.texImage3D(se,0,s.RGBA,1,1,_e,0,s.RGBA,s.UNSIGNED_BYTE,te):s.texImage2D(se+ye,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,te);return j}let W={};W[s.TEXTURE_2D]=Ae(s.TEXTURE_2D,s.TEXTURE_2D,1),W[s.TEXTURE_CUBE_MAP]=Ae(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),W[s.TEXTURE_2D_ARRAY]=Ae(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),W[s.TEXTURE_3D]=Ae(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Z(s.DEPTH_TEST),o.setFunc(bi),Ne(!1),ve(Sc),Z(s.CULL_FACE),it(Kn);function Z(N){u[N]!==!0&&(s.enable(N),u[N]=!0)}function oe(N){u[N]!==!1&&(s.disable(N),u[N]=!1)}function Te(N,se){return h[N]!==se?(s.bindFramebuffer(N,se),h[N]=se,N===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=se),N===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=se),!0):!1}function pe(N,se){let ae=p,_e=!1;if(N){ae=d.get(se),ae===void 0&&(ae=[],d.set(se,ae));let te=N.textures;if(ae.length!==te.length||ae[0]!==s.COLOR_ATTACHMENT0){for(let j=0,ye=te.length;j<ye;j++)ae[j]=s.COLOR_ATTACHMENT0+j;ae.length=te.length,_e=!0}}else ae[0]!==s.BACK&&(ae[0]=s.BACK,_e=!0);_e&&s.drawBuffers(ae)}function Be(N){return g!==N?(s.useProgram(N),g=N,!0):!1}let ft={[ai]:s.FUNC_ADD,[Fh]:s.FUNC_SUBTRACT,[Oh]:s.FUNC_REVERSE_SUBTRACT};ft[Bh]=s.MIN,ft[zh]=s.MAX;let P={[kh]:s.ZERO,[Hh]:s.ONE,[Vh]:s.SRC_COLOR,[ro]:s.SRC_ALPHA,[Zh]:s.SRC_ALPHA_SATURATE,[qh]:s.DST_COLOR,[Wh]:s.DST_ALPHA,[Gh]:s.ONE_MINUS_SRC_COLOR,[oo]:s.ONE_MINUS_SRC_ALPHA,[Yh]:s.ONE_MINUS_DST_COLOR,[Xh]:s.ONE_MINUS_DST_ALPHA,[Kh]:s.CONSTANT_COLOR,[Jh]:s.ONE_MINUS_CONSTANT_COLOR,[$h]:s.CONSTANT_ALPHA,[jh]:s.ONE_MINUS_CONSTANT_ALPHA};function it(N,se,ae,_e,te,j,ye,Oe,rt,Je){if(N===Kn){_===!0&&(oe(s.BLEND),_=!1);return}if(_===!1&&(Z(s.BLEND),_=!0),N!==Uh){if(N!==m||Je!==S){if((f!==ai||v!==ai)&&(s.blendEquation(s.FUNC_ADD),f=ai,v=ai),Je)switch(N){case Si:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case bc:s.blendFunc(s.ONE,s.ONE);break;case Ec:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Tc:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case Si:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case bc:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Ec:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Tc:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}b=null,E=null,C=null,R=null,I.set(0,0,0),D=0,m=N,S=Je}return}te=te||se,j=j||ae,ye=ye||_e,(se!==f||te!==v)&&(s.blendEquationSeparate(ft[se],ft[te]),f=se,v=te),(ae!==b||_e!==E||j!==C||ye!==R)&&(s.blendFuncSeparate(P[ae],P[_e],P[j],P[ye]),b=ae,E=_e,C=j,R=ye),(Oe.equals(I)===!1||rt!==D)&&(s.blendColor(Oe.r,Oe.g,Oe.b,rt),I.copy(Oe),D=rt),m=N,S=!1}function Fe(N,se){N.side===rn?oe(s.CULL_FACE):Z(s.CULL_FACE);let ae=N.side===kt;se&&(ae=!ae),Ne(ae),N.blending===Si&&N.transparent===!1?it(Kn):it(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),o.setFunc(N.depthFunc),o.setTest(N.depthTest),o.setMask(N.depthWrite),r.setMask(N.colorWrite);let _e=N.stencilWrite;a.setTest(_e),_e&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Me(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?Z(s.SAMPLE_ALPHA_TO_COVERAGE):oe(s.SAMPLE_ALPHA_TO_COVERAGE)}function Ne(N){x!==N&&(N?s.frontFace(s.CW):s.frontFace(s.CCW),x=N)}function ve(N){N!==Lh?(Z(s.CULL_FACE),N!==w&&(N===Sc?s.cullFace(s.BACK):N===Dh?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):oe(s.CULL_FACE),w=N}function at(N){N!==A&&(V&&s.lineWidth(N),A=N)}function Me(N,se,ae){N?(Z(s.POLYGON_OFFSET_FILL),(U!==se||F!==ae)&&(s.polygonOffset(se,ae),U=se,F=ae)):oe(s.POLYGON_OFFSET_FILL)}function Ve(N){N?Z(s.SCISSOR_TEST):oe(s.SCISSOR_TEST)}function wt(N){N===void 0&&(N=s.TEXTURE0+G-1),ee!==N&&(s.activeTexture(N),ee=N)}function pt(N,se,ae){ae===void 0&&(ee===null?ae=s.TEXTURE0+G-1:ae=ee);let _e=k[ae];_e===void 0&&(_e={type:void 0,texture:void 0},k[ae]=_e),(_e.type!==N||_e.texture!==se)&&(ee!==ae&&(s.activeTexture(ae),ee=ae),s.bindTexture(N,se||W[N]),_e.type=N,_e.texture=se)}function T(){let N=k[ee];N!==void 0&&N.type!==void 0&&(s.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function y(){try{s.compressedTexImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function z(){try{s.compressedTexImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function K(){try{s.texSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Q(){try{s.texSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Y(){try{s.compressedTexSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function we(){try{s.compressedTexSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function re(){try{s.texStorage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Se(){try{s.texStorage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function be(){try{s.texImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ie(){try{s.texImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function fe(N){de.equals(N)===!1&&(s.scissor(N.x,N.y,N.z,N.w),de.copy(N))}function De(N){me.equals(N)===!1&&(s.viewport(N.x,N.y,N.z,N.w),me.copy(N))}function Ee(N,se){let ae=c.get(se);ae===void 0&&(ae=new WeakMap,c.set(se,ae));let _e=ae.get(N);_e===void 0&&(_e=s.getUniformBlockIndex(se,N.name),ae.set(N,_e))}function he(N,se){let _e=c.get(se).get(N);l.get(se)!==_e&&(s.uniformBlockBinding(se,_e,N.__bindingPointIndex),l.set(se,_e))}function He(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),o.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),u={},ee=null,k={},h={},d=new WeakMap,p=[],g=null,_=!1,m=null,f=null,b=null,E=null,v=null,C=null,R=null,I=new Ce(0,0,0),D=0,S=!1,x=null,w=null,A=null,U=null,F=null,de.set(0,0,s.canvas.width,s.canvas.height),me.set(0,0,s.canvas.width,s.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:Z,disable:oe,bindFramebuffer:Te,drawBuffers:pe,useProgram:Be,setBlending:it,setMaterial:Fe,setFlipSided:Ne,setCullFace:ve,setLineWidth:at,setPolygonOffset:Me,setScissorTest:Ve,activeTexture:wt,bindTexture:pt,unbindTexture:T,compressedTexImage2D:y,compressedTexImage3D:z,texImage2D:be,texImage3D:ie,updateUBOMapping:Ee,uniformBlockBinding:he,texStorage2D:re,texStorage3D:Se,texSubImage2D:K,texSubImage3D:Q,compressedTexSubImage2D:Y,compressedTexSubImage3D:we,scissor:fe,viewport:De,reset:He}}function W_(s,e,t,n,i,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ie,u=new WeakMap,h,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,y){return p?new OffscreenCanvas(T,y):cs("canvas")}function _(T,y,z){let K=1,Q=pt(T);if((Q.width>z||Q.height>z)&&(K=z/Math.max(Q.width,Q.height)),K<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let Y=Math.floor(K*Q.width),we=Math.floor(K*Q.height);h===void 0&&(h=g(Y,we));let re=y?g(Y,we):h;return re.width=Y,re.height=we,re.getContext("2d").drawImage(T,0,0,Y,we),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+Y+"x"+we+")."),re}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),T;return T}function m(T){return T.generateMipmaps}function f(T){s.generateMipmap(T)}function b(T){return T.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?s.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function E(T,y,z,K,Q=!1){if(T!==null){if(s[T]!==void 0)return s[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let Y=y;if(y===s.RED&&(z===s.FLOAT&&(Y=s.R32F),z===s.HALF_FLOAT&&(Y=s.R16F),z===s.UNSIGNED_BYTE&&(Y=s.R8)),y===s.RED_INTEGER&&(z===s.UNSIGNED_BYTE&&(Y=s.R8UI),z===s.UNSIGNED_SHORT&&(Y=s.R16UI),z===s.UNSIGNED_INT&&(Y=s.R32UI),z===s.BYTE&&(Y=s.R8I),z===s.SHORT&&(Y=s.R16I),z===s.INT&&(Y=s.R32I)),y===s.RG&&(z===s.FLOAT&&(Y=s.RG32F),z===s.HALF_FLOAT&&(Y=s.RG16F),z===s.UNSIGNED_BYTE&&(Y=s.RG8)),y===s.RG_INTEGER&&(z===s.UNSIGNED_BYTE&&(Y=s.RG8UI),z===s.UNSIGNED_SHORT&&(Y=s.RG16UI),z===s.UNSIGNED_INT&&(Y=s.RG32UI),z===s.BYTE&&(Y=s.RG8I),z===s.SHORT&&(Y=s.RG16I),z===s.INT&&(Y=s.RG32I)),y===s.RGB_INTEGER&&(z===s.UNSIGNED_BYTE&&(Y=s.RGB8UI),z===s.UNSIGNED_SHORT&&(Y=s.RGB16UI),z===s.UNSIGNED_INT&&(Y=s.RGB32UI),z===s.BYTE&&(Y=s.RGB8I),z===s.SHORT&&(Y=s.RGB16I),z===s.INT&&(Y=s.RGB32I)),y===s.RGBA_INTEGER&&(z===s.UNSIGNED_BYTE&&(Y=s.RGBA8UI),z===s.UNSIGNED_SHORT&&(Y=s.RGBA16UI),z===s.UNSIGNED_INT&&(Y=s.RGBA32UI),z===s.BYTE&&(Y=s.RGBA8I),z===s.SHORT&&(Y=s.RGBA16I),z===s.INT&&(Y=s.RGBA32I)),y===s.RGB&&(z===s.UNSIGNED_INT_5_9_9_9_REV&&(Y=s.RGB9_E5),z===s.UNSIGNED_INT_10F_11F_11F_REV&&(Y=s.R11F_G11F_B10F)),y===s.RGBA){let we=Q?Xs:Ye.getTransfer(K);z===s.FLOAT&&(Y=s.RGBA32F),z===s.HALF_FLOAT&&(Y=s.RGBA16F),z===s.UNSIGNED_BYTE&&(Y=we===Qe?s.SRGB8_ALPHA8:s.RGBA8),z===s.UNSIGNED_SHORT_4_4_4_4&&(Y=s.RGBA4),z===s.UNSIGNED_SHORT_5_5_5_1&&(Y=s.RGB5_A1)}return(Y===s.R16F||Y===s.R32F||Y===s.RG16F||Y===s.RG32F||Y===s.RGBA16F||Y===s.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function v(T,y){let z;return T?y===null||y===di||y===Es?z=s.DEPTH24_STENCIL8:y===on?z=s.DEPTH32F_STENCIL8:y===Ss&&(z=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===di||y===Es?z=s.DEPTH_COMPONENT24:y===on?z=s.DEPTH_COMPONENT32F:y===Ss&&(z=s.DEPTH_COMPONENT16),z}function C(T,y){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Rt&&T.minFilter!==Ct?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function R(T){let y=T.target;y.removeEventListener("dispose",R),D(y),y.isVideoTexture&&u.delete(y)}function I(T){let y=T.target;y.removeEventListener("dispose",I),x(y)}function D(T){let y=n.get(T);if(y.__webglInit===void 0)return;let z=T.source,K=d.get(z);if(K){let Q=K[y.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&S(T),Object.keys(K).length===0&&d.delete(z)}n.remove(T)}function S(T){let y=n.get(T);s.deleteTexture(y.__webglTexture);let z=T.source,K=d.get(z);delete K[y.__cacheKey],o.memory.textures--}function x(T){let y=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(y.__webglFramebuffer[K]))for(let Q=0;Q<y.__webglFramebuffer[K].length;Q++)s.deleteFramebuffer(y.__webglFramebuffer[K][Q]);else s.deleteFramebuffer(y.__webglFramebuffer[K]);y.__webglDepthbuffer&&s.deleteRenderbuffer(y.__webglDepthbuffer[K])}else{if(Array.isArray(y.__webglFramebuffer))for(let K=0;K<y.__webglFramebuffer.length;K++)s.deleteFramebuffer(y.__webglFramebuffer[K]);else s.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&s.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&s.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let K=0;K<y.__webglColorRenderbuffer.length;K++)y.__webglColorRenderbuffer[K]&&s.deleteRenderbuffer(y.__webglColorRenderbuffer[K]);y.__webglDepthRenderbuffer&&s.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let z=T.textures;for(let K=0,Q=z.length;K<Q;K++){let Y=n.get(z[K]);Y.__webglTexture&&(s.deleteTexture(Y.__webglTexture),o.memory.textures--),n.remove(z[K])}n.remove(T)}let w=0;function A(){w=0}function U(){let T=w;return T>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+i.maxTextures),w+=1,T}function F(T){let y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function G(T,y){let z=n.get(T);if(T.isVideoTexture&&Ve(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&z.__version!==T.version){let K=T.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{W(z,T,y);return}}else T.isExternalTexture&&(z.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,z.__webglTexture,s.TEXTURE0+y)}function V(T,y){let z=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){W(z,T,y);return}t.bindTexture(s.TEXTURE_2D_ARRAY,z.__webglTexture,s.TEXTURE0+y)}function $(T,y){let z=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){W(z,T,y);return}t.bindTexture(s.TEXTURE_3D,z.__webglTexture,s.TEXTURE0+y)}function H(T,y){let z=n.get(T);if(T.version>0&&z.__version!==T.version){Z(z,T,y);return}t.bindTexture(s.TEXTURE_CUBE_MAP,z.__webglTexture,s.TEXTURE0+y)}let ee={[gn]:s.REPEAT,[bn]:s.CLAMP_TO_EDGE,[os]:s.MIRRORED_REPEAT},k={[Rt]:s.NEAREST,[Uo]:s.NEAREST_MIPMAP_NEAREST,[Ui]:s.NEAREST_MIPMAP_LINEAR,[Ct]:s.LINEAR,[Ms]:s.LINEAR_MIPMAP_NEAREST,[yn]:s.LINEAR_MIPMAP_LINEAR},J={[du]:s.NEVER,[xu]:s.ALWAYS,[fu]:s.LESS,[Oc]:s.LEQUAL,[pu]:s.EQUAL,[_u]:s.GEQUAL,[mu]:s.GREATER,[gu]:s.NOTEQUAL};function le(T,y){if(y.type===on&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===Ct||y.magFilter===Ms||y.magFilter===Ui||y.magFilter===yn||y.minFilter===Ct||y.minFilter===Ms||y.minFilter===Ui||y.minFilter===yn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(T,s.TEXTURE_WRAP_S,ee[y.wrapS]),s.texParameteri(T,s.TEXTURE_WRAP_T,ee[y.wrapT]),(T===s.TEXTURE_3D||T===s.TEXTURE_2D_ARRAY)&&s.texParameteri(T,s.TEXTURE_WRAP_R,ee[y.wrapR]),s.texParameteri(T,s.TEXTURE_MAG_FILTER,k[y.magFilter]),s.texParameteri(T,s.TEXTURE_MIN_FILTER,k[y.minFilter]),y.compareFunction&&(s.texParameteri(T,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(T,s.TEXTURE_COMPARE_FUNC,J[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Rt||y.minFilter!==Ui&&y.minFilter!==yn||y.type===on&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");s.texParameterf(T,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,i.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function de(T,y){let z=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",R));let K=y.source,Q=d.get(K);Q===void 0&&(Q={},d.set(K,Q));let Y=F(y);if(Y!==T.__cacheKey){Q[Y]===void 0&&(Q[Y]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,z=!0),Q[Y].usedTimes++;let we=Q[T.__cacheKey];we!==void 0&&(Q[T.__cacheKey].usedTimes--,we.usedTimes===0&&S(y)),T.__cacheKey=Y,T.__webglTexture=Q[Y].texture}return z}function me(T,y,z){return Math.floor(Math.floor(T/z)/y)}function Ae(T,y,z,K){let Y=T.updateRanges;if(Y.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,y.width,y.height,z,K,y.data);else{Y.sort((ie,fe)=>ie.start-fe.start);let we=0;for(let ie=1;ie<Y.length;ie++){let fe=Y[we],De=Y[ie],Ee=fe.start+fe.count,he=me(De.start,y.width,4),He=me(fe.start,y.width,4);De.start<=Ee+1&&he===He&&me(De.start+De.count-1,y.width,4)===he?fe.count=Math.max(fe.count,De.start+De.count-fe.start):(++we,Y[we]=De)}Y.length=we+1;let re=s.getParameter(s.UNPACK_ROW_LENGTH),Se=s.getParameter(s.UNPACK_SKIP_PIXELS),be=s.getParameter(s.UNPACK_SKIP_ROWS);s.pixelStorei(s.UNPACK_ROW_LENGTH,y.width);for(let ie=0,fe=Y.length;ie<fe;ie++){let De=Y[ie],Ee=Math.floor(De.start/4),he=Math.ceil(De.count/4),He=Ee%y.width,N=Math.floor(Ee/y.width),se=he,ae=1;s.pixelStorei(s.UNPACK_SKIP_PIXELS,He),s.pixelStorei(s.UNPACK_SKIP_ROWS,N),t.texSubImage2D(s.TEXTURE_2D,0,He,N,se,ae,z,K,y.data)}T.clearUpdateRanges(),s.pixelStorei(s.UNPACK_ROW_LENGTH,re),s.pixelStorei(s.UNPACK_SKIP_PIXELS,Se),s.pixelStorei(s.UNPACK_SKIP_ROWS,be)}}function W(T,y,z){let K=s.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(K=s.TEXTURE_2D_ARRAY),y.isData3DTexture&&(K=s.TEXTURE_3D);let Q=de(T,y),Y=y.source;t.bindTexture(K,T.__webglTexture,s.TEXTURE0+z);let we=n.get(Y);if(Y.version!==we.__version||Q===!0){t.activeTexture(s.TEXTURE0+z);let re=Ye.getPrimaries(Ye.workingColorSpace),Se=y.colorSpace===$n?null:Ye.getPrimaries(y.colorSpace),be=y.colorSpace===$n||re===Se?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let ie=_(y.image,!1,i.maxTextureSize);ie=wt(y,ie);let fe=r.convert(y.format,y.colorSpace),De=r.convert(y.type),Ee=E(y.internalFormat,fe,De,y.colorSpace,y.isVideoTexture);le(K,y);let he,He=y.mipmaps,N=y.isVideoTexture!==!0,se=we.__version===void 0||Q===!0,ae=Y.dataReady,_e=C(y,ie);if(y.isDepthTexture)Ee=v(y.format===Ts,y.type),se&&(N?t.texStorage2D(s.TEXTURE_2D,1,Ee,ie.width,ie.height):t.texImage2D(s.TEXTURE_2D,0,Ee,ie.width,ie.height,0,fe,De,null));else if(y.isDataTexture)if(He.length>0){N&&se&&t.texStorage2D(s.TEXTURE_2D,_e,Ee,He[0].width,He[0].height);for(let te=0,j=He.length;te<j;te++)he=He[te],N?ae&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,De,he.data):t.texImage2D(s.TEXTURE_2D,te,Ee,he.width,he.height,0,fe,De,he.data);y.generateMipmaps=!1}else N?(se&&t.texStorage2D(s.TEXTURE_2D,_e,Ee,ie.width,ie.height),ae&&Ae(y,ie,fe,De)):t.texImage2D(s.TEXTURE_2D,0,Ee,ie.width,ie.height,0,fe,De,ie.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){N&&se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,_e,Ee,He[0].width,He[0].height,ie.depth);for(let te=0,j=He.length;te<j;te++)if(he=He[te],y.format!==en)if(fe!==null)if(N){if(ae)if(y.layerUpdates.size>0){let ye=Wc(he.width,he.height,y.format,y.type);for(let Oe of y.layerUpdates){let rt=he.data.subarray(Oe*ye/he.data.BYTES_PER_ELEMENT,(Oe+1)*ye/he.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,Oe,he.width,he.height,1,fe,rt)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,he.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,te,Ee,he.width,he.height,ie.depth,0,he.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else N?ae&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,De,he.data):t.texImage3D(s.TEXTURE_2D_ARRAY,te,Ee,he.width,he.height,ie.depth,0,fe,De,he.data)}else{N&&se&&t.texStorage2D(s.TEXTURE_2D,_e,Ee,He[0].width,He[0].height);for(let te=0,j=He.length;te<j;te++)he=He[te],y.format!==en?fe!==null?N?ae&&t.compressedTexSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,he.data):t.compressedTexImage2D(s.TEXTURE_2D,te,Ee,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):N?ae&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,De,he.data):t.texImage2D(s.TEXTURE_2D,te,Ee,he.width,he.height,0,fe,De,he.data)}else if(y.isDataArrayTexture)if(N){if(se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,_e,Ee,ie.width,ie.height,ie.depth),ae)if(y.layerUpdates.size>0){let te=Wc(ie.width,ie.height,y.format,y.type);for(let j of y.layerUpdates){let ye=ie.data.subarray(j*te/ie.data.BYTES_PER_ELEMENT,(j+1)*te/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,j,ie.width,ie.height,1,fe,De,ye)}y.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,fe,De,ie.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Ee,ie.width,ie.height,ie.depth,0,fe,De,ie.data);else if(y.isData3DTexture)N?(se&&t.texStorage3D(s.TEXTURE_3D,_e,Ee,ie.width,ie.height,ie.depth),ae&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,fe,De,ie.data)):t.texImage3D(s.TEXTURE_3D,0,Ee,ie.width,ie.height,ie.depth,0,fe,De,ie.data);else if(y.isFramebufferTexture){if(se)if(N)t.texStorage2D(s.TEXTURE_2D,_e,Ee,ie.width,ie.height);else{let te=ie.width,j=ie.height;for(let ye=0;ye<_e;ye++)t.texImage2D(s.TEXTURE_2D,ye,Ee,te,j,0,fe,De,null),te>>=1,j>>=1}}else if(He.length>0){if(N&&se){let te=pt(He[0]);t.texStorage2D(s.TEXTURE_2D,_e,Ee,te.width,te.height)}for(let te=0,j=He.length;te<j;te++)he=He[te],N?ae&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,fe,De,he):t.texImage2D(s.TEXTURE_2D,te,Ee,fe,De,he);y.generateMipmaps=!1}else if(N){if(se){let te=pt(ie);t.texStorage2D(s.TEXTURE_2D,_e,Ee,te.width,te.height)}ae&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,fe,De,ie)}else t.texImage2D(s.TEXTURE_2D,0,Ee,fe,De,ie);m(y)&&f(K),we.__version=Y.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function Z(T,y,z){if(y.image.length!==6)return;let K=de(T,y),Q=y.source;t.bindTexture(s.TEXTURE_CUBE_MAP,T.__webglTexture,s.TEXTURE0+z);let Y=n.get(Q);if(Q.version!==Y.__version||K===!0){t.activeTexture(s.TEXTURE0+z);let we=Ye.getPrimaries(Ye.workingColorSpace),re=y.colorSpace===$n?null:Ye.getPrimaries(y.colorSpace),Se=y.colorSpace===$n||we===re?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se);let be=y.isCompressedTexture||y.image[0].isCompressedTexture,ie=y.image[0]&&y.image[0].isDataTexture,fe=[];for(let j=0;j<6;j++)!be&&!ie?fe[j]=_(y.image[j],!0,i.maxCubemapSize):fe[j]=ie?y.image[j].image:y.image[j],fe[j]=wt(y,fe[j]);let De=fe[0],Ee=r.convert(y.format,y.colorSpace),he=r.convert(y.type),He=E(y.internalFormat,Ee,he,y.colorSpace),N=y.isVideoTexture!==!0,se=Y.__version===void 0||K===!0,ae=Q.dataReady,_e=C(y,De);le(s.TEXTURE_CUBE_MAP,y);let te;if(be){N&&se&&t.texStorage2D(s.TEXTURE_CUBE_MAP,_e,He,De.width,De.height);for(let j=0;j<6;j++){te=fe[j].mipmaps;for(let ye=0;ye<te.length;ye++){let Oe=te[ye];y.format!==en?Ee!==null?N?ae&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye,0,0,Oe.width,Oe.height,Ee,Oe.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye,He,Oe.width,Oe.height,0,Oe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye,0,0,Oe.width,Oe.height,Ee,he,Oe.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye,He,Oe.width,Oe.height,0,Ee,he,Oe.data)}}}else{if(te=y.mipmaps,N&&se){te.length>0&&_e++;let j=pt(fe[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,_e,He,j.width,j.height)}for(let j=0;j<6;j++)if(ie){N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,fe[j].width,fe[j].height,Ee,he,fe[j].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,He,fe[j].width,fe[j].height,0,Ee,he,fe[j].data);for(let ye=0;ye<te.length;ye++){let rt=te[ye].image[j].image;N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye+1,0,0,rt.width,rt.height,Ee,he,rt.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye+1,He,rt.width,rt.height,0,Ee,he,rt.data)}}else{N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Ee,he,fe[j]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,He,Ee,he,fe[j]);for(let ye=0;ye<te.length;ye++){let Oe=te[ye];N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye+1,0,0,Ee,he,Oe.image[j]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,ye+1,He,Ee,he,Oe.image[j])}}}m(y)&&f(s.TEXTURE_CUBE_MAP),Y.__version=Q.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function oe(T,y,z,K,Q,Y){let we=r.convert(z.format,z.colorSpace),re=r.convert(z.type),Se=E(z.internalFormat,we,re,z.colorSpace),be=n.get(y),ie=n.get(z);if(ie.__renderTarget=y,!be.__hasExternalTextures){let fe=Math.max(1,y.width>>Y),De=Math.max(1,y.height>>Y);Q===s.TEXTURE_3D||Q===s.TEXTURE_2D_ARRAY?t.texImage3D(Q,Y,Se,fe,De,y.depth,0,we,re,null):t.texImage2D(Q,Y,Se,fe,De,0,we,re,null)}t.bindFramebuffer(s.FRAMEBUFFER,T),Me(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,K,Q,ie.__webglTexture,0,at(y)):(Q===s.TEXTURE_2D||Q>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,K,Q,ie.__webglTexture,Y),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Te(T,y,z){if(s.bindRenderbuffer(s.RENDERBUFFER,T),y.depthBuffer){let K=y.depthTexture,Q=K&&K.isDepthTexture?K.type:null,Y=v(y.stencilBuffer,Q),we=y.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,re=at(y);Me(y)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,re,Y,y.width,y.height):z?s.renderbufferStorageMultisample(s.RENDERBUFFER,re,Y,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,Y,y.width,y.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,we,s.RENDERBUFFER,T)}else{let K=y.textures;for(let Q=0;Q<K.length;Q++){let Y=K[Q],we=r.convert(Y.format,Y.colorSpace),re=r.convert(Y.type),Se=E(Y.internalFormat,we,re,Y.colorSpace),be=at(y);z&&Me(y)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,be,Se,y.width,y.height):Me(y)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,be,Se,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,Se,y.width,y.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function pe(T,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=n.get(y.depthTexture);K.__renderTarget=y,(!K.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),G(y.depthTexture,0);let Q=K.__webglTexture,Y=at(y);if(y.depthTexture.format===as)Me(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,Q,0,Y):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,Q,0);else if(y.depthTexture.format===Ts)Me(y)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,Q,0,Y):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Be(T){let y=n.get(T),z=T.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==T.depthTexture){let K=T.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),K){let Q=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,K.removeEventListener("dispose",Q)};K.addEventListener("dispose",Q),y.__depthDisposeCallback=Q}y.__boundDepthTexture=K}if(T.depthTexture&&!y.__autoAllocateDepthBuffer){if(z)throw new Error("target.depthTexture not supported in Cube render targets");let K=T.texture.mipmaps;K&&K.length>0?pe(y.__webglFramebuffer[0],T):pe(y.__webglFramebuffer,T)}else if(z){y.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer[K]),y.__webglDepthbuffer[K]===void 0)y.__webglDepthbuffer[K]=s.createRenderbuffer(),Te(y.__webglDepthbuffer[K],T,!1);else{let Q=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Y=y.__webglDepthbuffer[K];s.bindRenderbuffer(s.RENDERBUFFER,Y),s.framebufferRenderbuffer(s.FRAMEBUFFER,Q,s.RENDERBUFFER,Y)}}else{let K=T.texture.mipmaps;if(K&&K.length>0?t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=s.createRenderbuffer(),Te(y.__webglDepthbuffer,T,!1);else{let Q=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Y=y.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,Y),s.framebufferRenderbuffer(s.FRAMEBUFFER,Q,s.RENDERBUFFER,Y)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function ft(T,y,z){let K=n.get(T);y!==void 0&&oe(K.__webglFramebuffer,T,T.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),z!==void 0&&Be(T)}function P(T){let y=T.texture,z=n.get(T),K=n.get(y);T.addEventListener("dispose",I);let Q=T.textures,Y=T.isWebGLCubeRenderTarget===!0,we=Q.length>1;if(we||(K.__webglTexture===void 0&&(K.__webglTexture=s.createTexture()),K.__version=y.version,o.memory.textures++),Y){z.__webglFramebuffer=[];for(let re=0;re<6;re++)if(y.mipmaps&&y.mipmaps.length>0){z.__webglFramebuffer[re]=[];for(let Se=0;Se<y.mipmaps.length;Se++)z.__webglFramebuffer[re][Se]=s.createFramebuffer()}else z.__webglFramebuffer[re]=s.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){z.__webglFramebuffer=[];for(let re=0;re<y.mipmaps.length;re++)z.__webglFramebuffer[re]=s.createFramebuffer()}else z.__webglFramebuffer=s.createFramebuffer();if(we)for(let re=0,Se=Q.length;re<Se;re++){let be=n.get(Q[re]);be.__webglTexture===void 0&&(be.__webglTexture=s.createTexture(),o.memory.textures++)}if(T.samples>0&&Me(T)===!1){z.__webglMultisampledFramebuffer=s.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let re=0;re<Q.length;re++){let Se=Q[re];z.__webglColorRenderbuffer[re]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,z.__webglColorRenderbuffer[re]);let be=r.convert(Se.format,Se.colorSpace),ie=r.convert(Se.type),fe=E(Se.internalFormat,be,ie,Se.colorSpace,T.isXRRenderTarget===!0),De=at(T);s.renderbufferStorageMultisample(s.RENDERBUFFER,De,fe,T.width,T.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+re,s.RENDERBUFFER,z.__webglColorRenderbuffer[re])}s.bindRenderbuffer(s.RENDERBUFFER,null),T.depthBuffer&&(z.__webglDepthRenderbuffer=s.createRenderbuffer(),Te(z.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(Y){t.bindTexture(s.TEXTURE_CUBE_MAP,K.__webglTexture),le(s.TEXTURE_CUBE_MAP,y);for(let re=0;re<6;re++)if(y.mipmaps&&y.mipmaps.length>0)for(let Se=0;Se<y.mipmaps.length;Se++)oe(z.__webglFramebuffer[re][Se],T,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+re,Se);else oe(z.__webglFramebuffer[re],T,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);m(y)&&f(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(we){for(let re=0,Se=Q.length;re<Se;re++){let be=Q[re],ie=n.get(be),fe=s.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(fe=T.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(fe,ie.__webglTexture),le(fe,be),oe(z.__webglFramebuffer,T,be,s.COLOR_ATTACHMENT0+re,fe,0),m(be)&&f(fe)}t.unbindTexture()}else{let re=s.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(re=T.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(re,K.__webglTexture),le(re,y),y.mipmaps&&y.mipmaps.length>0)for(let Se=0;Se<y.mipmaps.length;Se++)oe(z.__webglFramebuffer[Se],T,y,s.COLOR_ATTACHMENT0,re,Se);else oe(z.__webglFramebuffer,T,y,s.COLOR_ATTACHMENT0,re,0);m(y)&&f(re),t.unbindTexture()}T.depthBuffer&&Be(T)}function it(T){let y=T.textures;for(let z=0,K=y.length;z<K;z++){let Q=y[z];if(m(Q)){let Y=b(T),we=n.get(Q).__webglTexture;t.bindTexture(Y,we),f(Y),t.unbindTexture()}}}let Fe=[],Ne=[];function ve(T){if(T.samples>0){if(Me(T)===!1){let y=T.textures,z=T.width,K=T.height,Q=s.COLOR_BUFFER_BIT,Y=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,we=n.get(T),re=y.length>1;if(re)for(let be=0;be<y.length;be++)t.bindFramebuffer(s.FRAMEBUFFER,we.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+be,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,we.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+be,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,we.__webglMultisampledFramebuffer);let Se=T.texture.mipmaps;Se&&Se.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,we.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,we.__webglFramebuffer);for(let be=0;be<y.length;be++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(Q|=s.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(Q|=s.STENCIL_BUFFER_BIT)),re){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,we.__webglColorRenderbuffer[be]);let ie=n.get(y[be]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,ie,0)}s.blitFramebuffer(0,0,z,K,0,0,z,K,Q,s.NEAREST),l===!0&&(Fe.length=0,Ne.length=0,Fe.push(s.COLOR_ATTACHMENT0+be),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Fe.push(Y),Ne.push(Y),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Ne)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Fe))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),re)for(let be=0;be<y.length;be++){t.bindFramebuffer(s.FRAMEBUFFER,we.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+be,s.RENDERBUFFER,we.__webglColorRenderbuffer[be]);let ie=n.get(y[be]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,we.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+be,s.TEXTURE_2D,ie,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,we.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let y=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[y])}}}function at(T){return Math.min(i.maxSamples,T.samples)}function Me(T){let y=n.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Ve(T){let y=o.render.frame;u.get(T)!==y&&(u.set(T,y),T.update())}function wt(T,y){let z=T.colorSpace,K=T.format,Q=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||z!==It&&z!==$n&&(Ye.getTransfer(z)===Qe?(K!==en||Q!==vn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",z)),y}function pt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=U,this.resetTextureUnits=A,this.setTexture2D=G,this.setTexture2DArray=V,this.setTexture3D=$,this.setTextureCube=H,this.rebindTextures=ft,this.setupRenderTarget=P,this.updateRenderTargetMipmap=it,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=Be,this.setupFrameBufferTexture=oe,this.useMultisampledRTT=Me}function X_(s,e){function t(n,i=$n){let r,o=Ye.getTransfer(i);if(n===vn)return s.UNSIGNED_BYTE;if(n===Oo)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Bo)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Ic)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===Pc)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===Rc)return s.BYTE;if(n===Cc)return s.SHORT;if(n===Ss)return s.UNSIGNED_SHORT;if(n===Fo)return s.INT;if(n===di)return s.UNSIGNED_INT;if(n===on)return s.FLOAT;if(n===bs)return s.HALF_FLOAT;if(n===Lc)return s.ALPHA;if(n===Dc)return s.RGB;if(n===en)return s.RGBA;if(n===as)return s.DEPTH_COMPONENT;if(n===Ts)return s.DEPTH_STENCIL;if(n===ws)return s.RED;if(n===zo)return s.RED_INTEGER;if(n===Nc)return s.RG;if(n===ko)return s.RG_INTEGER;if(n===Ho)return s.RGBA_INTEGER;if(n===Sr||n===br||n===Er||n===Tr)if(o===Qe)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Sr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Tr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Sr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Er)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Tr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Vo||n===Go||n===Wo||n===Xo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Vo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Go)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Wo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===qo||n===Yo||n===Zo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===qo||n===Yo)return o===Qe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Zo)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Ko||n===Jo||n===$o||n===jo||n===Qo||n===ea||n===ta||n===na||n===ia||n===sa||n===ra||n===oa||n===aa||n===ca)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ko)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Jo)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===$o)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===jo)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Qo)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ea)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ta)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===na)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ia)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===sa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ra)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===oa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===aa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ca)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===la||n===ha||n===ua)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===la)return o===Qe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ha)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ua)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===da||n===fa||n===pa||n===ma)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===da)return r.COMPRESSED_RED_RGTC1_EXT;if(n===fa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===pa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ma)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Es?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var q_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Y_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,il=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ar(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new _n({vertexShader:q_,fragmentShader:Y_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new gt(new xn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},sl=class extends Tn{constructor(e,t){super();let n=this,i=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,p=null,g=null,_=typeof XRWebGLBinding<"u",m=new il,f={},b=t.getContextAttributes(),E=null,v=null,C=[],R=[],I=new Ie,D=null,S=new xt;S.viewport=new Ke;let x=new xt;x.viewport=new Ke;let w=[S,x],A=new Eo,U=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let Z=C[W];return Z===void 0&&(Z=new ds,C[W]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(W){let Z=C[W];return Z===void 0&&(Z=new ds,C[W]=Z),Z.getGripSpace()},this.getHand=function(W){let Z=C[W];return Z===void 0&&(Z=new ds,C[W]=Z),Z.getHandSpace()};function G(W){let Z=R.indexOf(W.inputSource);if(Z===-1)return;let oe=C[Z];oe!==void 0&&(oe.update(W.inputSource,W.frame,c||o),oe.dispatchEvent({type:W.type,data:W.inputSource}))}function V(){i.removeEventListener("select",G),i.removeEventListener("selectstart",G),i.removeEventListener("selectend",G),i.removeEventListener("squeeze",G),i.removeEventListener("squeezestart",G),i.removeEventListener("squeezeend",G),i.removeEventListener("end",V),i.removeEventListener("inputsourceschange",$);for(let W=0;W<C.length;W++){let Z=R[W];Z!==null&&(R[W]=null,C[W].disconnect(Z))}U=null,F=null,m.reset();for(let W in f)delete f[W];e.setRenderTarget(E),p=null,d=null,h=null,i=null,v=null,Ae.stop(),n.isPresenting=!1,e.setPixelRatio(D),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h===null&&_&&(h=new XRWebGLBinding(i,t)),h},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(W){if(i=W,i!==null){if(E=e.getRenderTarget(),i.addEventListener("select",G),i.addEventListener("selectstart",G),i.addEventListener("selectend",G),i.addEventListener("squeeze",G),i.addEventListener("squeezestart",G),i.addEventListener("squeezeend",G),i.addEventListener("end",V),i.addEventListener("inputsourceschange",$),b.xrCompatible!==!0&&await t.makeXRCompatible(),D=e.getPixelRatio(),e.getSize(I),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let oe=null,Te=null,pe=null;b.depth&&(pe=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,oe=b.stencil?Ts:as,Te=b.stencil?Es:di);let Be={colorFormat:t.RGBA8,depthFormat:pe,scaleFactor:r};h=this.getBinding(),d=h.createProjectionLayer(Be),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new wn(d.textureWidth,d.textureHeight,{format:en,type:vn,depthTexture:new or(d.textureWidth,d.textureHeight,Te,void 0,void 0,void 0,void 0,void 0,void 0,oe),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let oe={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(i,t,oe),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),v=new wn(p.framebufferWidth,p.framebufferHeight,{format:en,type:vn,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),Ae.setContext(i),Ae.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function $(W){for(let Z=0;Z<W.removed.length;Z++){let oe=W.removed[Z],Te=R.indexOf(oe);Te>=0&&(R[Te]=null,C[Te].disconnect(oe))}for(let Z=0;Z<W.added.length;Z++){let oe=W.added[Z],Te=R.indexOf(oe);if(Te===-1){for(let Be=0;Be<C.length;Be++)if(Be>=R.length){R.push(oe),Te=Be;break}else if(R[Be]===null){R[Be]=oe,Te=Be;break}if(Te===-1)break}let pe=C[Te];pe&&pe.connect(oe)}}let H=new L,ee=new L;function k(W,Z,oe){H.setFromMatrixPosition(Z.matrixWorld),ee.setFromMatrixPosition(oe.matrixWorld);let Te=H.distanceTo(ee),pe=Z.projectionMatrix.elements,Be=oe.projectionMatrix.elements,ft=pe[14]/(pe[10]-1),P=pe[14]/(pe[10]+1),it=(pe[9]+1)/pe[5],Fe=(pe[9]-1)/pe[5],Ne=(pe[8]-1)/pe[0],ve=(Be[8]+1)/Be[0],at=ft*Ne,Me=ft*ve,Ve=Te/(-Ne+ve),wt=Ve*-Ne;if(Z.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(wt),W.translateZ(Ve),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),pe[10]===-1)W.projectionMatrix.copy(Z.projectionMatrix),W.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{let pt=ft+Ve,T=P+Ve,y=at-wt,z=Me+(Te-wt),K=it*P/T*pt,Q=Fe*P/T*pt;W.projectionMatrix.makePerspective(y,z,K,Q,pt,T),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function J(W,Z){Z===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(Z.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(i===null)return;let Z=W.near,oe=W.far;m.texture!==null&&(m.depthNear>0&&(Z=m.depthNear),m.depthFar>0&&(oe=m.depthFar)),A.near=x.near=S.near=Z,A.far=x.far=S.far=oe,(U!==A.near||F!==A.far)&&(i.updateRenderState({depthNear:A.near,depthFar:A.far}),U=A.near,F=A.far),A.layers.mask=W.layers.mask|6,S.layers.mask=A.layers.mask&3,x.layers.mask=A.layers.mask&5;let Te=W.parent,pe=A.cameras;J(A,Te);for(let Be=0;Be<pe.length;Be++)J(pe[Be],Te);pe.length===2?k(A,S,x):A.projectionMatrix.copy(S.projectionMatrix),le(W,A,Te)};function le(W,Z,oe){oe===null?W.matrix.copy(Z.matrixWorld):(W.matrix.copy(oe.matrixWorld),W.matrix.invert(),W.matrix.multiply(Z.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(Z.projectionMatrix),W.projectionMatrixInverse.copy(Z.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=wi*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return A},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(W){l=W,d!==null&&(d.fixedFoveation=W),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=W)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(A)},this.getCameraTexture=function(W){return f[W]};let de=null;function me(W,Z){if(u=Z.getViewerPose(c||o),g=Z,u!==null){let oe=u.views;p!==null&&(e.setRenderTargetFramebuffer(v,p.framebuffer),e.setRenderTarget(v));let Te=!1;oe.length!==A.cameras.length&&(A.cameras.length=0,Te=!0);for(let P=0;P<oe.length;P++){let it=oe[P],Fe=null;if(p!==null)Fe=p.getViewport(it);else{let ve=h.getViewSubImage(d,it);Fe=ve.viewport,P===0&&(e.setRenderTargetTextures(v,ve.colorTexture,ve.depthStencilTexture),e.setRenderTarget(v))}let Ne=w[P];Ne===void 0&&(Ne=new xt,Ne.layers.enable(P),Ne.viewport=new Ke,w[P]=Ne),Ne.matrix.fromArray(it.transform.matrix),Ne.matrix.decompose(Ne.position,Ne.quaternion,Ne.scale),Ne.projectionMatrix.fromArray(it.projectionMatrix),Ne.projectionMatrixInverse.copy(Ne.projectionMatrix).invert(),Ne.viewport.set(Fe.x,Fe.y,Fe.width,Fe.height),P===0&&(A.matrix.copy(Ne.matrix),A.matrix.decompose(A.position,A.quaternion,A.scale)),Te===!0&&A.cameras.push(Ne)}let pe=i.enabledFeatures;if(pe&&pe.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){h=n.getBinding();let P=h.getDepthInformation(oe[0]);P&&P.isValid&&P.texture&&m.init(P,i.renderState)}if(pe&&pe.includes("camera-access")&&_){e.state.unbindTexture(),h=n.getBinding();for(let P=0;P<oe.length;P++){let it=oe[P].camera;if(it){let Fe=f[it];Fe||(Fe=new ar,f[it]=Fe);let Ne=h.getCameraImage(it);Fe.sourceTexture=Ne}}}}for(let oe=0;oe<C.length;oe++){let Te=R[oe],pe=C[oe];Te!==null&&pe!==void 0&&pe.update(Te,Z,c||o)}de&&de(W,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),g=null}let Ae=new Zu;Ae.setAnimationLoop(me),this.setAnimationLoop=function(W){de=W},this.dispose=function(){}}},Bi=new Wt,Z_=new ze;function K_(s,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,Hc(s)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function i(m,f,b,E,v){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(m,f):f.isMeshToonMaterial?(r(m,f),h(m,f)):f.isMeshPhongMaterial?(r(m,f),u(m,f)):f.isMeshStandardMaterial?(r(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,v)):f.isMeshMatcapMaterial?(r(m,f),g(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),_(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&a(m,f)):f.isPointsMaterial?l(m,f,b,E):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===kt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===kt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let b=e.get(f),E=b.envMap,v=b.envMapRotation;E&&(m.envMap.value=E,Bi.copy(v),Bi.x*=-1,Bi.y*=-1,Bi.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(Bi.y*=-1,Bi.z*=-1),m.envMapRotation.value.setFromMatrix4(Z_.makeRotationFromEuler(Bi)),m.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function a(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,b,E){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*b,m.scale.value=E*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function h(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,b){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===kt&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){let b=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function J_(s,e,t,n){let i={},r={},o=[],a=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,E){let v=E.program;n.uniformBlockBinding(b,v)}function c(b,E){let v=i[b.id];v===void 0&&(g(b),v=u(b),i[b.id]=v,b.addEventListener("dispose",m));let C=E.program;n.updateUBOMapping(b,C);let R=e.render.frame;r[b.id]!==R&&(d(b),r[b.id]=R)}function u(b){let E=h();b.__bindingPointIndex=E;let v=s.createBuffer(),C=b.__size,R=b.usage;return s.bindBuffer(s.UNIFORM_BUFFER,v),s.bufferData(s.UNIFORM_BUFFER,C,R),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,E,v),v}function h(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){let E=i[b.id],v=b.uniforms,C=b.__cache;s.bindBuffer(s.UNIFORM_BUFFER,E);for(let R=0,I=v.length;R<I;R++){let D=Array.isArray(v[R])?v[R]:[v[R]];for(let S=0,x=D.length;S<x;S++){let w=D[S];if(p(w,R,S,C)===!0){let A=w.__offset,U=Array.isArray(w.value)?w.value:[w.value],F=0;for(let G=0;G<U.length;G++){let V=U[G],$=_(V);typeof V=="number"||typeof V=="boolean"?(w.__data[0]=V,s.bufferSubData(s.UNIFORM_BUFFER,A+F,w.__data)):V.isMatrix3?(w.__data[0]=V.elements[0],w.__data[1]=V.elements[1],w.__data[2]=V.elements[2],w.__data[3]=0,w.__data[4]=V.elements[3],w.__data[5]=V.elements[4],w.__data[6]=V.elements[5],w.__data[7]=0,w.__data[8]=V.elements[6],w.__data[9]=V.elements[7],w.__data[10]=V.elements[8],w.__data[11]=0):(V.toArray(w.__data,F),F+=$.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,A,w.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function p(b,E,v,C){let R=b.value,I=E+"_"+v;if(C[I]===void 0)return typeof R=="number"||typeof R=="boolean"?C[I]=R:C[I]=R.clone(),!0;{let D=C[I];if(typeof R=="number"||typeof R=="boolean"){if(D!==R)return C[I]=R,!0}else if(D.equals(R)===!1)return D.copy(R),!0}return!1}function g(b){let E=b.uniforms,v=0,C=16;for(let I=0,D=E.length;I<D;I++){let S=Array.isArray(E[I])?E[I]:[E[I]];for(let x=0,w=S.length;x<w;x++){let A=S[x],U=Array.isArray(A.value)?A.value:[A.value];for(let F=0,G=U.length;F<G;F++){let V=U[F],$=_(V),H=v%C,ee=H%$.boundary,k=H+ee;v+=ee,k!==0&&C-k<$.storage&&(v+=C-k),A.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),A.__offset=v,v+=$.storage}}}let R=v%C;return R>0&&(v+=C-R),b.__size=v,b.__cache={},this}function _(b){let E={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(E.boundary=4,E.storage=4):b.isVector2?(E.boundary=8,E.storage=8):b.isVector3||b.isColor?(E.boundary=16,E.storage=12):b.isVector4?(E.boundary=16,E.storage=16):b.isMatrix3?(E.boundary=48,E.storage=48):b.isMatrix4?(E.boundary=64,E.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),E}function m(b){let E=b.target;E.removeEventListener("dispose",m);let v=o.indexOf(E.__bindingPointIndex);o.splice(v,1),s.deleteBuffer(i[E.id]),delete i[E.id],delete r[E.id]}function f(){for(let b in i)s.deleteBuffer(i[b]);o=[],i={},r={}}return{bind:l,update:c,dispose:f}}var va=class{constructor(e={}){let{canvas:t=yu(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=o;let g=new Uint32Array(4),_=new Int32Array(4),m=null,f=null,b=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Jn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let v=this,C=!1;this._outputColorSpace=ut;let R=0,I=0,D=null,S=-1,x=null,w=new Ke,A=new Ke,U=null,F=new Ce(0),G=0,V=t.width,$=t.height,H=1,ee=null,k=null,J=new Ke(0,0,V,$),le=new Ke(0,0,V,$),de=!1,me=new gs,Ae=!1,W=!1,Z=new ze,oe=new L,Te=new Ke,pe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Be=!1;function ft(){return D===null?H:1}let P=n;function it(M,O){return t.getContext(M,O)}try{let M={alpha:!0,depth:i,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",ae,!1),t.addEventListener("webglcontextrestored",_e,!1),t.addEventListener("webglcontextcreationerror",te,!1),P===null){let O="webgl2";if(P=it(O,M),P===null)throw it(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Fe,Ne,ve,at,Me,Ve,wt,pt,T,y,z,K,Q,Y,we,re,Se,be,ie,fe,De,Ee,he,He;function N(){Fe=new pg(P),Fe.init(),Ee=new X_(P,Fe),Ne=new ag(P,Fe,e,Ee),ve=new G_(P,Fe),Ne.reversedDepthBuffer&&d&&ve.buffers.depth.setReversed(!0),at=new _g(P),Me=new I_,Ve=new W_(P,Fe,ve,Me,Ne,Ee,at),wt=new lg(v),pt=new fg(v),T=new bf(P),he=new rg(P,T),y=new mg(P,T,at,he),z=new yg(P,y,T,at),ie=new xg(P,Ne,Ve),re=new cg(Me),K=new C_(v,wt,pt,Fe,Ne,he,re),Q=new K_(v,Me),Y=new L_,we=new B_(Fe),be=new sg(v,wt,pt,ve,z,p,l),Se=new H_(v,z,Ne),He=new J_(P,at,Ne,ve),fe=new og(P,Fe,at),De=new gg(P,Fe,at),at.programs=K.programs,v.capabilities=Ne,v.extensions=Fe,v.properties=Me,v.renderLists=Y,v.shadowMap=Se,v.state=ve,v.info=at}N();let se=new sl(v,P);this.xr=se,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let M=Fe.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Fe.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(M){M!==void 0&&(H=M,this.setSize(V,$,!1))},this.getSize=function(M){return M.set(V,$)},this.setSize=function(M,O,X=!0){if(se.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}V=M,$=O,t.width=Math.floor(M*H),t.height=Math.floor(O*H),X===!0&&(t.style.width=M+"px",t.style.height=O+"px"),this.setViewport(0,0,M,O)},this.getDrawingBufferSize=function(M){return M.set(V*H,$*H).floor()},this.setDrawingBufferSize=function(M,O,X){V=M,$=O,H=X,t.width=Math.floor(M*X),t.height=Math.floor(O*X),this.setViewport(0,0,M,O)},this.getCurrentViewport=function(M){return M.copy(w)},this.getViewport=function(M){return M.copy(J)},this.setViewport=function(M,O,X,q){M.isVector4?J.set(M.x,M.y,M.z,M.w):J.set(M,O,X,q),ve.viewport(w.copy(J).multiplyScalar(H).round())},this.getScissor=function(M){return M.copy(le)},this.setScissor=function(M,O,X,q){M.isVector4?le.set(M.x,M.y,M.z,M.w):le.set(M,O,X,q),ve.scissor(A.copy(le).multiplyScalar(H).round())},this.getScissorTest=function(){return de},this.setScissorTest=function(M){ve.setScissorTest(de=M)},this.setOpaqueSort=function(M){ee=M},this.setTransparentSort=function(M){k=M},this.getClearColor=function(M){return M.copy(be.getClearColor())},this.setClearColor=function(){be.setClearColor(...arguments)},this.getClearAlpha=function(){return be.getClearAlpha()},this.setClearAlpha=function(){be.setClearAlpha(...arguments)},this.clear=function(M=!0,O=!0,X=!0){let q=0;if(M){let B=!1;if(D!==null){let ne=D.texture.format;B=ne===Ho||ne===ko||ne===zo}if(B){let ne=D.texture.type,ue=ne===vn||ne===di||ne===Ss||ne===Es||ne===Oo||ne===Bo,xe=be.getClearColor(),ge=be.getClearAlpha(),Le=xe.r,Ue=xe.g,Re=xe.b;ue?(g[0]=Le,g[1]=Ue,g[2]=Re,g[3]=ge,P.clearBufferuiv(P.COLOR,0,g)):(_[0]=Le,_[1]=Ue,_[2]=Re,_[3]=ge,P.clearBufferiv(P.COLOR,0,_))}else q|=P.COLOR_BUFFER_BIT}O&&(q|=P.DEPTH_BUFFER_BIT),X&&(q|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),P.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ae,!1),t.removeEventListener("webglcontextrestored",_e,!1),t.removeEventListener("webglcontextcreationerror",te,!1),be.dispose(),Y.dispose(),we.dispose(),Me.dispose(),wt.dispose(),pt.dispose(),z.dispose(),he.dispose(),He.dispose(),K.dispose(),se.dispose(),se.removeEventListener("sessionstart",Sn),se.removeEventListener("sessionend",Vl),mi.stop()};function ae(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),C=!0}function _e(){console.log("THREE.WebGLRenderer: Context Restored."),C=!1;let M=at.autoReset,O=Se.enabled,X=Se.autoUpdate,q=Se.needsUpdate,B=Se.type;N(),at.autoReset=M,Se.enabled=O,Se.autoUpdate=X,Se.needsUpdate=q,Se.type=B}function te(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function j(M){let O=M.target;O.removeEventListener("dispose",j),ye(O)}function ye(M){Oe(M),Me.remove(M)}function Oe(M){let O=Me.get(M).programs;O!==void 0&&(O.forEach(function(X){K.releaseProgram(X)}),M.isShaderMaterial&&K.releaseShaderCache(M))}this.renderBufferDirect=function(M,O,X,q,B,ne){O===null&&(O=pe);let ue=B.isMesh&&B.matrixWorld.determinant()<0,xe=gd(M,O,X,q,B);ve.setMaterial(q,ue);let ge=X.index,Le=1;if(q.wireframe===!0){if(ge=y.getWireframeAttribute(X),ge===void 0)return;Le=2}let Ue=X.drawRange,Re=X.attributes.position,qe=Ue.start*Le,et=(Ue.start+Ue.count)*Le;ne!==null&&(qe=Math.max(qe,ne.start*Le),et=Math.min(et,(ne.start+ne.count)*Le)),ge!==null?(qe=Math.max(qe,0),et=Math.min(et,ge.count)):Re!=null&&(qe=Math.max(qe,0),et=Math.min(et,Re.count));let dt=et-qe;if(dt<0||dt===1/0)return;he.setup(B,q,xe,X,ge);let ot,st=fe;if(ge!==null&&(ot=T.get(ge),st=De,st.setIndex(ot)),B.isMesh)q.wireframe===!0?(ve.setLineWidth(q.wireframeLinewidth*ft()),st.setMode(P.LINES)):st.setMode(P.TRIANGLES);else if(B.isLine){let Pe=q.linewidth;Pe===void 0&&(Pe=1),ve.setLineWidth(Pe*ft()),B.isLineSegments?st.setMode(P.LINES):B.isLineLoop?st.setMode(P.LINE_LOOP):st.setMode(P.LINE_STRIP)}else B.isPoints?st.setMode(P.POINTS):B.isSprite&&st.setMode(P.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)ls("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(Fe.get("WEBGL_multi_draw"))st.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Pe=B._multiDrawStarts,lt=B._multiDrawCounts,Ze=B._multiDrawCount,Kt=ge?T.get(ge).bytesPerElement:1,Wi=Me.get(q).currentProgram.getUniforms();for(let Jt=0;Jt<Ze;Jt++)Wi.setValue(P,"_gl_DrawID",Jt),st.render(Pe[Jt]/Kt,lt[Jt])}else if(B.isInstancedMesh)st.renderInstances(qe,dt,B.count);else if(X.isInstancedBufferGeometry){let Pe=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,lt=Math.min(X.instanceCount,Pe);st.renderInstances(qe,dt,lt)}else st.render(qe,dt)};function rt(M,O,X){M.transparent===!0&&M.side===rn&&M.forceSinglePass===!1?(M.side=kt,M.needsUpdate=!0,Dr(M,O,X),M.side=mn,M.needsUpdate=!0,Dr(M,O,X),M.side=rn):Dr(M,O,X)}this.compile=function(M,O,X=null){X===null&&(X=M),f=we.get(X),f.init(O),E.push(f),X.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),M!==X&&M.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),f.setupLights();let q=new Set;return M.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ne=B.material;if(ne)if(Array.isArray(ne))for(let ue=0;ue<ne.length;ue++){let xe=ne[ue];rt(xe,X,B),q.add(xe)}else rt(ne,X,B),q.add(ne)}),f=E.pop(),q},this.compileAsync=function(M,O,X=null){let q=this.compile(M,O,X);return new Promise(B=>{function ne(){if(q.forEach(function(ue){Me.get(ue).currentProgram.isReady()&&q.delete(ue)}),q.size===0){B(M);return}setTimeout(ne,10)}Fe.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Je=null;function On(M){Je&&Je(M)}function Sn(){mi.stop()}function Vl(){mi.start()}let mi=new Zu;mi.setAnimationLoop(On),typeof self<"u"&&mi.setContext(self),this.setAnimationLoop=function(M){Je=M,se.setAnimationLoop(M),M===null?mi.stop():mi.start()},se.addEventListener("sessionstart",Sn),se.addEventListener("sessionend",Vl),this.render=function(M,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(se.cameraAutoUpdate===!0&&se.updateCamera(O),O=se.getCamera()),M.isScene===!0&&M.onBeforeRender(v,M,O,D),f=we.get(M,E.length),f.init(O),E.push(f),Z.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),me.setFromProjectionMatrix(Z,fn,O.reversedDepth),W=this.localClippingEnabled,Ae=re.init(this.clippingPlanes,W),m=Y.get(M,b.length),m.init(),b.push(m),se.enabled===!0&&se.isPresenting===!0){let ne=v.xr.getDepthSensingMesh();ne!==null&&Ua(ne,O,-1/0,v.sortObjects)}Ua(M,O,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(ee,k),Be=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,Be&&be.addToRenderList(m,M),this.info.render.frame++,Ae===!0&&re.beginShadows();let X=f.state.shadowsArray;Se.render(X,M,O),Ae===!0&&re.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=m.opaque,B=m.transmissive;if(f.setupLights(),O.isArrayCamera){let ne=O.cameras;if(B.length>0)for(let ue=0,xe=ne.length;ue<xe;ue++){let ge=ne[ue];Wl(q,B,M,ge)}Be&&be.render(M);for(let ue=0,xe=ne.length;ue<xe;ue++){let ge=ne[ue];Gl(m,M,ge,ge.viewport)}}else B.length>0&&Wl(q,B,M,O),Be&&be.render(M),Gl(m,M,O);D!==null&&I===0&&(Ve.updateMultisampleRenderTarget(D),Ve.updateRenderTargetMipmap(D)),M.isScene===!0&&M.onAfterRender(v,M,O),he.resetDefaultState(),S=-1,x=null,E.pop(),E.length>0?(f=E[E.length-1],Ae===!0&&re.setGlobalState(v.clippingPlanes,f.state.camera)):f=null,b.pop(),b.length>0?m=b[b.length-1]:m=null};function Ua(M,O,X,q){if(M.visible===!1)return;if(M.layers.test(O.layers)){if(M.isGroup)X=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(O);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||me.intersectsSprite(M)){q&&Te.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Z);let ue=z.update(M),xe=M.material;xe.visible&&m.push(M,ue,xe,X,Te.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||me.intersectsObject(M))){let ue=z.update(M),xe=M.material;if(q&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Te.copy(M.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),Te.copy(ue.boundingSphere.center)),Te.applyMatrix4(M.matrixWorld).applyMatrix4(Z)),Array.isArray(xe)){let ge=ue.groups;for(let Le=0,Ue=ge.length;Le<Ue;Le++){let Re=ge[Le],qe=xe[Re.materialIndex];qe&&qe.visible&&m.push(M,ue,qe,X,Te.z,Re)}}else xe.visible&&m.push(M,ue,xe,X,Te.z,null)}}let ne=M.children;for(let ue=0,xe=ne.length;ue<xe;ue++)Ua(ne[ue],O,X,q)}function Gl(M,O,X,q){let B=M.opaque,ne=M.transmissive,ue=M.transparent;f.setupLightsView(X),Ae===!0&&re.setGlobalState(v.clippingPlanes,X),q&&ve.viewport(w.copy(q)),B.length>0&&Lr(B,O,X),ne.length>0&&Lr(ne,O,X),ue.length>0&&Lr(ue,O,X),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function Wl(M,O,X,q){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[q.id]===void 0&&(f.state.transmissionRenderTarget[q.id]=new wn(1,1,{generateMipmaps:!0,type:Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float")?bs:vn,minFilter:yn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace}));let ne=f.state.transmissionRenderTarget[q.id],ue=q.viewport||w;ne.setSize(ue.z*v.transmissionResolutionScale,ue.w*v.transmissionResolutionScale);let xe=v.getRenderTarget(),ge=v.getActiveCubeFace(),Le=v.getActiveMipmapLevel();v.setRenderTarget(ne),v.getClearColor(F),G=v.getClearAlpha(),G<1&&v.setClearColor(16777215,.5),v.clear(),Be&&be.render(X);let Ue=v.toneMapping;v.toneMapping=Jn;let Re=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),f.setupLightsView(q),Ae===!0&&re.setGlobalState(v.clippingPlanes,q),Lr(M,X,q),Ve.updateMultisampleRenderTarget(ne),Ve.updateRenderTargetMipmap(ne),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let qe=!1;for(let et=0,dt=O.length;et<dt;et++){let ot=O[et],st=ot.object,Pe=ot.geometry,lt=ot.material,Ze=ot.group;if(lt.side===rn&&st.layers.test(q.layers)){let Kt=lt.side;lt.side=kt,lt.needsUpdate=!0,Xl(st,X,q,Pe,lt,Ze),lt.side=Kt,lt.needsUpdate=!0,qe=!0}}qe===!0&&(Ve.updateMultisampleRenderTarget(ne),Ve.updateRenderTargetMipmap(ne))}v.setRenderTarget(xe,ge,Le),v.setClearColor(F,G),Re!==void 0&&(q.viewport=Re),v.toneMapping=Ue}function Lr(M,O,X){let q=O.isScene===!0?O.overrideMaterial:null;for(let B=0,ne=M.length;B<ne;B++){let ue=M[B],xe=ue.object,ge=ue.geometry,Le=ue.group,Ue=ue.material;Ue.allowOverride===!0&&q!==null&&(Ue=q),xe.layers.test(X.layers)&&Xl(xe,O,X,ge,Ue,Le)}}function Xl(M,O,X,q,B,ne){M.onBeforeRender(v,O,X,q,B,ne),M.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(v,O,X,q,M,ne),B.transparent===!0&&B.side===rn&&B.forceSinglePass===!1?(B.side=kt,B.needsUpdate=!0,v.renderBufferDirect(X,O,q,B,M,ne),B.side=mn,B.needsUpdate=!0,v.renderBufferDirect(X,O,q,B,M,ne),B.side=rn):v.renderBufferDirect(X,O,q,B,M,ne),M.onAfterRender(v,O,X,q,B,ne)}function Dr(M,O,X){O.isScene!==!0&&(O=pe);let q=Me.get(M),B=f.state.lights,ne=f.state.shadowsArray,ue=B.state.version,xe=K.getParameters(M,B.state,ne,O,X),ge=K.getProgramCacheKey(xe),Le=q.programs;q.environment=M.isMeshStandardMaterial?O.environment:null,q.fog=O.fog,q.envMap=(M.isMeshStandardMaterial?pt:wt).get(M.envMap||q.environment),q.envMapRotation=q.environment!==null&&M.envMap===null?O.environmentRotation:M.envMapRotation,Le===void 0&&(M.addEventListener("dispose",j),Le=new Map,q.programs=Le);let Ue=Le.get(ge);if(Ue!==void 0){if(q.currentProgram===Ue&&q.lightsStateVersion===ue)return Yl(M,xe),Ue}else xe.uniforms=K.getUniforms(M),M.onBeforeCompile(xe,v),Ue=K.acquireProgram(xe,ge),Le.set(ge,Ue),q.uniforms=xe.uniforms;let Re=q.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Re.clippingPlanes=re.uniform),Yl(M,xe),q.needsLights=xd(M),q.lightsStateVersion=ue,q.needsLights&&(Re.ambientLightColor.value=B.state.ambient,Re.lightProbe.value=B.state.probe,Re.directionalLights.value=B.state.directional,Re.directionalLightShadows.value=B.state.directionalShadow,Re.spotLights.value=B.state.spot,Re.spotLightShadows.value=B.state.spotShadow,Re.rectAreaLights.value=B.state.rectArea,Re.ltc_1.value=B.state.rectAreaLTC1,Re.ltc_2.value=B.state.rectAreaLTC2,Re.pointLights.value=B.state.point,Re.pointLightShadows.value=B.state.pointShadow,Re.hemisphereLights.value=B.state.hemi,Re.directionalShadowMap.value=B.state.directionalShadowMap,Re.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Re.spotShadowMap.value=B.state.spotShadowMap,Re.spotLightMatrix.value=B.state.spotLightMatrix,Re.spotLightMap.value=B.state.spotLightMap,Re.pointShadowMap.value=B.state.pointShadowMap,Re.pointShadowMatrix.value=B.state.pointShadowMatrix),q.currentProgram=Ue,q.uniformsList=null,Ue}function ql(M){if(M.uniformsList===null){let O=M.currentProgram.getUniforms();M.uniformsList=Is.seqWithValue(O.seq,M.uniforms)}return M.uniformsList}function Yl(M,O){let X=Me.get(M);X.outputColorSpace=O.outputColorSpace,X.batching=O.batching,X.batchingColor=O.batchingColor,X.instancing=O.instancing,X.instancingColor=O.instancingColor,X.instancingMorph=O.instancingMorph,X.skinning=O.skinning,X.morphTargets=O.morphTargets,X.morphNormals=O.morphNormals,X.morphColors=O.morphColors,X.morphTargetsCount=O.morphTargetsCount,X.numClippingPlanes=O.numClippingPlanes,X.numIntersection=O.numClipIntersection,X.vertexAlphas=O.vertexAlphas,X.vertexTangents=O.vertexTangents,X.toneMapping=O.toneMapping}function gd(M,O,X,q,B){O.isScene!==!0&&(O=pe),Ve.resetTextureUnits();let ne=O.fog,ue=q.isMeshStandardMaterial?O.environment:null,xe=D===null?v.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:It,ge=(q.isMeshStandardMaterial?pt:wt).get(q.envMap||ue),Le=q.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,Ue=!!X.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Re=!!X.morphAttributes.position,qe=!!X.morphAttributes.normal,et=!!X.morphAttributes.color,dt=Jn;q.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(dt=v.toneMapping);let ot=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,st=ot!==void 0?ot.length:0,Pe=Me.get(q),lt=f.state.lights;if(Ae===!0&&(W===!0||M!==x)){let Ot=M===x&&q.id===S;re.setState(q,M,Ot)}let Ze=!1;q.version===Pe.__version?(Pe.needsLights&&Pe.lightsStateVersion!==lt.state.version||Pe.outputColorSpace!==xe||B.isBatchedMesh&&Pe.batching===!1||!B.isBatchedMesh&&Pe.batching===!0||B.isBatchedMesh&&Pe.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Pe.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Pe.instancing===!1||!B.isInstancedMesh&&Pe.instancing===!0||B.isSkinnedMesh&&Pe.skinning===!1||!B.isSkinnedMesh&&Pe.skinning===!0||B.isInstancedMesh&&Pe.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Pe.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Pe.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Pe.instancingMorph===!1&&B.morphTexture!==null||Pe.envMap!==ge||q.fog===!0&&Pe.fog!==ne||Pe.numClippingPlanes!==void 0&&(Pe.numClippingPlanes!==re.numPlanes||Pe.numIntersection!==re.numIntersection)||Pe.vertexAlphas!==Le||Pe.vertexTangents!==Ue||Pe.morphTargets!==Re||Pe.morphNormals!==qe||Pe.morphColors!==et||Pe.toneMapping!==dt||Pe.morphTargetsCount!==st)&&(Ze=!0):(Ze=!0,Pe.__version=q.version);let Kt=Pe.currentProgram;Ze===!0&&(Kt=Dr(q,O,B));let Wi=!1,Jt=!1,Ns=!1,ht=Kt.getUniforms(),tn=Pe.uniforms;if(ve.useProgram(Kt.program)&&(Wi=!0,Jt=!0,Ns=!0),q.id!==S&&(S=q.id,Jt=!0),Wi||x!==M){ve.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),ht.setValue(P,"projectionMatrix",M.projectionMatrix),ht.setValue(P,"viewMatrix",M.matrixWorldInverse);let Ht=ht.map.cameraPosition;Ht!==void 0&&Ht.setValue(P,oe.setFromMatrixPosition(M.matrixWorld)),Ne.logarithmicDepthBuffer&&ht.setValue(P,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&ht.setValue(P,"isOrthographic",M.isOrthographicCamera===!0),x!==M&&(x=M,Jt=!0,Ns=!0)}if(B.isSkinnedMesh){ht.setOptional(P,B,"bindMatrix"),ht.setOptional(P,B,"bindMatrixInverse");let Ot=B.skeleton;Ot&&(Ot.boneTexture===null&&Ot.computeBoneTexture(),ht.setValue(P,"boneTexture",Ot.boneTexture,Ve))}B.isBatchedMesh&&(ht.setOptional(P,B,"batchingTexture"),ht.setValue(P,"batchingTexture",B._matricesTexture,Ve),ht.setOptional(P,B,"batchingIdTexture"),ht.setValue(P,"batchingIdTexture",B._indirectTexture,Ve),ht.setOptional(P,B,"batchingColorTexture"),B._colorsTexture!==null&&ht.setValue(P,"batchingColorTexture",B._colorsTexture,Ve));let nn=X.morphAttributes;if((nn.position!==void 0||nn.normal!==void 0||nn.color!==void 0)&&ie.update(B,X,Kt),(Jt||Pe.receiveShadow!==B.receiveShadow)&&(Pe.receiveShadow=B.receiveShadow,ht.setValue(P,"receiveShadow",B.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(tn.envMap.value=ge,tn.flipEnvMap.value=ge.isCubeTexture&&ge.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&O.environment!==null&&(tn.envMapIntensity.value=O.environmentIntensity),Jt&&(ht.setValue(P,"toneMappingExposure",v.toneMappingExposure),Pe.needsLights&&_d(tn,Ns),ne&&q.fog===!0&&Q.refreshFogUniforms(tn,ne),Q.refreshMaterialUniforms(tn,q,H,$,f.state.transmissionRenderTarget[M.id]),Is.upload(P,ql(Pe),tn,Ve)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Is.upload(P,ql(Pe),tn,Ve),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&ht.setValue(P,"center",B.center),ht.setValue(P,"modelViewMatrix",B.modelViewMatrix),ht.setValue(P,"normalMatrix",B.normalMatrix),ht.setValue(P,"modelMatrix",B.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Ot=q.uniformsGroups;for(let Ht=0,Fa=Ot.length;Ht<Fa;Ht++){let gi=Ot[Ht];He.update(gi,Kt),He.bind(gi,Kt)}}return Kt}function _d(M,O){M.ambientLightColor.needsUpdate=O,M.lightProbe.needsUpdate=O,M.directionalLights.needsUpdate=O,M.directionalLightShadows.needsUpdate=O,M.pointLights.needsUpdate=O,M.pointLightShadows.needsUpdate=O,M.spotLights.needsUpdate=O,M.spotLightShadows.needsUpdate=O,M.rectAreaLights.needsUpdate=O,M.hemisphereLights.needsUpdate=O}function xd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return I},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(M,O,X){let q=Me.get(M);q.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),Me.get(M.texture).__webglTexture=O,Me.get(M.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:X,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,O){let X=Me.get(M);X.__webglFramebuffer=O,X.__useDefaultFramebuffer=O===void 0};let yd=P.createFramebuffer();this.setRenderTarget=function(M,O=0,X=0){D=M,R=O,I=X;let q=!0,B=null,ne=!1,ue=!1;if(M){let ge=Me.get(M);if(ge.__useDefaultFramebuffer!==void 0)ve.bindFramebuffer(P.FRAMEBUFFER,null),q=!1;else if(ge.__webglFramebuffer===void 0)Ve.setupRenderTarget(M);else if(ge.__hasExternalTextures)Ve.rebindTextures(M,Me.get(M.texture).__webglTexture,Me.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Re=M.depthTexture;if(ge.__boundDepthTexture!==Re){if(Re!==null&&Me.has(Re)&&(M.width!==Re.image.width||M.height!==Re.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ve.setupDepthRenderbuffer(M)}}let Le=M.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(ue=!0);let Ue=Me.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ue[O])?B=Ue[O][X]:B=Ue[O],ne=!0):M.samples>0&&Ve.useMultisampledRTT(M)===!1?B=Me.get(M).__webglMultisampledFramebuffer:Array.isArray(Ue)?B=Ue[X]:B=Ue,w.copy(M.viewport),A.copy(M.scissor),U=M.scissorTest}else w.copy(J).multiplyScalar(H).floor(),A.copy(le).multiplyScalar(H).floor(),U=de;if(X!==0&&(B=yd),ve.bindFramebuffer(P.FRAMEBUFFER,B)&&q&&ve.drawBuffers(M,B),ve.viewport(w),ve.scissor(A),ve.setScissorTest(U),ne){let ge=Me.get(M.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+O,ge.__webglTexture,X)}else if(ue){let ge=O;for(let Le=0;Le<M.textures.length;Le++){let Ue=Me.get(M.textures[Le]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+Le,Ue.__webglTexture,X,ge)}}else if(M!==null&&X!==0){let ge=Me.get(M.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,ge.__webglTexture,X)}S=-1},this.readRenderTargetPixels=function(M,O,X,q,B,ne,ue,xe=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=Me.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge){ve.bindFramebuffer(P.FRAMEBUFFER,ge);try{let Le=M.textures[xe],Ue=Le.format,Re=Le.type;if(!Ne.textureFormatReadable(Ue)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ne.textureTypeReadable(Re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=M.width-q&&X>=0&&X<=M.height-B&&(M.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+xe),P.readPixels(O,X,q,B,Ee.convert(Ue),Ee.convert(Re),ne))}finally{let Le=D!==null?Me.get(D).__webglFramebuffer:null;ve.bindFramebuffer(P.FRAMEBUFFER,Le)}}},this.readRenderTargetPixelsAsync=async function(M,O,X,q,B,ne,ue,xe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=Me.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge)if(O>=0&&O<=M.width-q&&X>=0&&X<=M.height-B){ve.bindFramebuffer(P.FRAMEBUFFER,ge);let Le=M.textures[xe],Ue=Le.format,Re=Le.type;if(!Ne.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ne.textureTypeReadable(Re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let qe=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,qe),P.bufferData(P.PIXEL_PACK_BUFFER,ne.byteLength,P.STREAM_READ),M.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+xe),P.readPixels(O,X,q,B,Ee.convert(Ue),Ee.convert(Re),0);let et=D!==null?Me.get(D).__webglFramebuffer:null;ve.bindFramebuffer(P.FRAMEBUFFER,et);let dt=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await vu(P,dt,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,qe),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,ne),P.deleteBuffer(qe),P.deleteSync(dt),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,O=null,X=0){let q=Math.pow(2,-X),B=Math.floor(M.image.width*q),ne=Math.floor(M.image.height*q),ue=O!==null?O.x:0,xe=O!==null?O.y:0;Ve.setTexture2D(M,0),P.copyTexSubImage2D(P.TEXTURE_2D,X,0,0,ue,xe,B,ne),ve.unbindTexture()};let vd=P.createFramebuffer(),Md=P.createFramebuffer();this.copyTextureToTexture=function(M,O,X=null,q=null,B=0,ne=null){ne===null&&(B!==0?(ls("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),ne=B,B=0):ne=0);let ue,xe,ge,Le,Ue,Re,qe,et,dt,ot=M.isCompressedTexture?M.mipmaps[ne]:M.image;if(X!==null)ue=X.max.x-X.min.x,xe=X.max.y-X.min.y,ge=X.isBox3?X.max.z-X.min.z:1,Le=X.min.x,Ue=X.min.y,Re=X.isBox3?X.min.z:0;else{let nn=Math.pow(2,-B);ue=Math.floor(ot.width*nn),xe=Math.floor(ot.height*nn),M.isDataArrayTexture?ge=ot.depth:M.isData3DTexture?ge=Math.floor(ot.depth*nn):ge=1,Le=0,Ue=0,Re=0}q!==null?(qe=q.x,et=q.y,dt=q.z):(qe=0,et=0,dt=0);let st=Ee.convert(O.format),Pe=Ee.convert(O.type),lt;O.isData3DTexture?(Ve.setTexture3D(O,0),lt=P.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(Ve.setTexture2DArray(O,0),lt=P.TEXTURE_2D_ARRAY):(Ve.setTexture2D(O,0),lt=P.TEXTURE_2D),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,O.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,O.unpackAlignment);let Ze=P.getParameter(P.UNPACK_ROW_LENGTH),Kt=P.getParameter(P.UNPACK_IMAGE_HEIGHT),Wi=P.getParameter(P.UNPACK_SKIP_PIXELS),Jt=P.getParameter(P.UNPACK_SKIP_ROWS),Ns=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,ot.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,ot.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Le),P.pixelStorei(P.UNPACK_SKIP_ROWS,Ue),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Re);let ht=M.isDataArrayTexture||M.isData3DTexture,tn=O.isDataArrayTexture||O.isData3DTexture;if(M.isDepthTexture){let nn=Me.get(M),Ot=Me.get(O),Ht=Me.get(nn.__renderTarget),Fa=Me.get(Ot.__renderTarget);ve.bindFramebuffer(P.READ_FRAMEBUFFER,Ht.__webglFramebuffer),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,Fa.__webglFramebuffer);for(let gi=0;gi<ge;gi++)ht&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Me.get(M).__webglTexture,B,Re+gi),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Me.get(O).__webglTexture,ne,dt+gi)),P.blitFramebuffer(Le,Ue,ue,xe,qe,et,ue,xe,P.DEPTH_BUFFER_BIT,P.NEAREST);ve.bindFramebuffer(P.READ_FRAMEBUFFER,null),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(B!==0||M.isRenderTargetTexture||Me.has(M)){let nn=Me.get(M),Ot=Me.get(O);ve.bindFramebuffer(P.READ_FRAMEBUFFER,vd),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,Md);for(let Ht=0;Ht<ge;Ht++)ht?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,nn.__webglTexture,B,Re+Ht):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,nn.__webglTexture,B),tn?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Ot.__webglTexture,ne,dt+Ht):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,Ot.__webglTexture,ne),B!==0?P.blitFramebuffer(Le,Ue,ue,xe,qe,et,ue,xe,P.COLOR_BUFFER_BIT,P.NEAREST):tn?P.copyTexSubImage3D(lt,ne,qe,et,dt+Ht,Le,Ue,ue,xe):P.copyTexSubImage2D(lt,ne,qe,et,Le,Ue,ue,xe);ve.bindFramebuffer(P.READ_FRAMEBUFFER,null),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else tn?M.isDataTexture||M.isData3DTexture?P.texSubImage3D(lt,ne,qe,et,dt,ue,xe,ge,st,Pe,ot.data):O.isCompressedArrayTexture?P.compressedTexSubImage3D(lt,ne,qe,et,dt,ue,xe,ge,st,ot.data):P.texSubImage3D(lt,ne,qe,et,dt,ue,xe,ge,st,Pe,ot):M.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,ne,qe,et,ue,xe,st,Pe,ot.data):M.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,ne,qe,et,ot.width,ot.height,st,ot.data):P.texSubImage2D(P.TEXTURE_2D,ne,qe,et,ue,xe,st,Pe,ot);P.pixelStorei(P.UNPACK_ROW_LENGTH,Ze),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,Kt),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Wi),P.pixelStorei(P.UNPACK_SKIP_ROWS,Jt),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Ns),ne===0&&O.generateMipmaps&&P.generateMipmap(lt),ve.unbindTexture()},this.initRenderTarget=function(M){Me.get(M).__webglFramebuffer===void 0&&Ve.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Ve.setTextureCube(M,0):M.isData3DTexture?Ve.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Ve.setTexture2DArray(M,0):Ve.setTexture2D(M,0),ve.unbindTexture()},this.resetState=function(){R=0,I=0,D=null,ve.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return fn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}};var Qu={type:"change"},al={type:"start"},td={type:"end"},ba=new An,ed=new Vt,$_=Math.cos(70*Pt.DEG2RAD),Tt=new L,Zt=2*Math.PI,nt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ol=1e-6,Ea=class extends yr{constructor(e,t=null){super(e,t),this.state=nt.NONE,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:hi.ROTATE,MIDDLE:hi.DOLLY,RIGHT:hi.PAN},this.touches={ONE:ui.ROTATE,TWO:ui.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new L,this._lastQuaternion=new tt,this._lastTargetPosition=new L,this._quat=new tt().setFromUnitVectors(e.up,new L(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new vs,this._sphericalDelta=new vs,this._scale=1,this._panOffset=new L,this._rotateStart=new Ie,this._rotateEnd=new Ie,this._rotateDelta=new Ie,this._panStart=new Ie,this._panEnd=new Ie,this._panDelta=new Ie,this._dollyStart=new Ie,this._dollyEnd=new Ie,this._dollyDelta=new Ie,this._dollyDirection=new L,this._mouse=new Ie,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Q_.bind(this),this._onPointerDown=j_.bind(this),this._onPointerUp=e0.bind(this),this._onContextMenu=a0.bind(this),this._onMouseWheel=i0.bind(this),this._onKeyDown=s0.bind(this),this._onTouchStart=r0.bind(this),this._onTouchMove=o0.bind(this),this._onMouseDown=t0.bind(this),this._onMouseMove=n0.bind(this),this._interceptControlDown=c0.bind(this),this._interceptControlUp=l0.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Qu),this.update(),this.state=nt.NONE}update(e=null){let t=this.object.position;Tt.copy(t).sub(this.target),Tt.applyQuaternion(this._quat),this._spherical.setFromVector3(Tt),this.autoRotate&&this.state===nt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=Zt:n>Math.PI&&(n-=Zt),i<-Math.PI?i+=Zt:i>Math.PI&&(i-=Zt),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Tt.setFromSpherical(this._spherical),Tt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Tt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Tt.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new L(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new L(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Tt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(ba.origin.copy(this.object.position),ba.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(ba.direction))<$_?this.object.lookAt(this.target):(ed.setFromNormalAndCoplanarPoint(this.object.up,this.target),ba.intersectPlane(ed,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>ol||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ol||this._lastTargetPosition.distanceToSquared(this.target)>ol?(this.dispatchEvent(Qu),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Zt/60*this.autoRotateSpeed*e:Zt/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Tt.setFromMatrixColumn(t,0),Tt.multiplyScalar(-e),this._panOffset.add(Tt)}_panUp(e,t){this.screenSpacePanning===!0?Tt.setFromMatrixColumn(t,1):(Tt.setFromMatrixColumn(t,0),Tt.crossVectors(this.object.up,Tt)),Tt.multiplyScalar(e),this._panOffset.add(Tt)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;Tt.copy(i).sub(this.target);let r=Tt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=i/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Zt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Zt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Zt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Zt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Zt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Zt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Zt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Zt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Ie,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function j_(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s)))}function Q_(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function e0(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(td),this.state=nt.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function t0(s){let e;switch(s.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case hi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=nt.DOLLY;break;case hi.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=nt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=nt.ROTATE}break;case hi.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=nt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=nt.PAN}break;default:this.state=nt.NONE}this.state!==nt.NONE&&this.dispatchEvent(al)}function n0(s){switch(this.state){case nt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case nt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case nt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function i0(s){this.enabled===!1||this.enableZoom===!1||this.state!==nt.NONE||(s.preventDefault(),this.dispatchEvent(al),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(td))}function s0(s){this.enabled!==!1&&this._handleKeyDown(s)}function r0(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case ui.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(s),this.state=nt.TOUCH_ROTATE;break;case ui.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(s),this.state=nt.TOUCH_PAN;break;default:this.state=nt.NONE}break;case 2:switch(this.touches.TWO){case ui.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=nt.TOUCH_DOLLY_PAN;break;case ui.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=nt.TOUCH_DOLLY_ROTATE;break;default:this.state=nt.NONE}break;default:this.state=nt.NONE}this.state!==nt.NONE&&this.dispatchEvent(al)}function o0(s){switch(this._trackPointer(s),this.state){case nt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case nt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case nt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case nt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=nt.NONE}}function a0(s){this.enabled!==!1&&s.preventDefault()}function c0(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function l0(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Rr=new L;function an(s,e,t,n,i,r){let o=2*Math.PI*i/4,a=Math.max(r-2*i,0),l=Math.PI/4;Rr.copy(e),Rr[n]=0,Rr.normalize();let c=.5*o/(o+a),u=1-Rr.angleTo(s)/l;return Math.sign(Rr[t])===1?u*c:a/(o+a)+c+c*(1-u)}var Ta=class s extends Rn{constructor(e=1,t=1,n=1,i=2,r=.1){let o=i*2+1;if(r=Math.min(e/2,t/2,n/2,r),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:i,radius:r},o===1)return;let a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;let l=new L,c=new L,u=new L(e,t,n).divideScalar(2).subScalar(r),h=this.attributes.position.array,d=this.attributes.normal.array,p=this.attributes.uv.array,g=h.length/6,_=new L,m=.5/o;for(let f=0,b=0;f<h.length;f+=3,b+=2)switch(l.fromArray(h,f),c.copy(l),c.x-=Math.sign(c.x)*m,c.y-=Math.sign(c.y)*m,c.z-=Math.sign(c.z)*m,c.normalize(),h[f+0]=u.x*Math.sign(l.x)+c.x*r,h[f+1]=u.y*Math.sign(l.y)+c.y*r,h[f+2]=u.z*Math.sign(l.z)+c.z*r,d[f+0]=c.x,d[f+1]=c.y,d[f+2]=c.z,Math.floor(f/g)){case 0:_.set(1,0,0),p[b+0]=an(_,c,"z","y",r,n),p[b+1]=1-an(_,c,"y","z",r,t);break;case 1:_.set(-1,0,0),p[b+0]=1-an(_,c,"z","y",r,n),p[b+1]=1-an(_,c,"y","z",r,t);break;case 2:_.set(0,1,0),p[b+0]=1-an(_,c,"x","z",r,e),p[b+1]=an(_,c,"z","x",r,n);break;case 3:_.set(0,-1,0),p[b+0]=1-an(_,c,"x","z",r,e),p[b+1]=1-an(_,c,"z","x",r,n);break;case 4:_.set(0,0,1),p[b+0]=1-an(_,c,"x","y",r,e),p[b+1]=1-an(_,c,"y","x",r,t);break;case 5:_.set(0,0,-1),p[b+0]=an(_,c,"x","y",r,e),p[b+1]=1-an(_,c,"y","x",r,t);break}}static fromJSON(e){return new s(e.width,e.height,e.depth,e.segments,e.radius)}};var Hi=new Ut({color:11780037,metalness:.43,roughness:.33}),cl=new Ut({color:3361880,metalness:.44,roughness:.38}),wa=new Ut({color:15002604,metalness:.12,roughness:.54}),h0=new Ut({color:2506053,roughness:.82}),Aa=(s,e=.9)=>new Ut({color:s,roughness:e});function jn(s,e,t,n,i=!0){let r=new gt(e,t);return r.position.set(...n),r.castShadow=i,r.receiveShadow=!0,s.add(r),r}function vt(s,e,t,n,i=0,r=!0){let o=i?new Ta(...e,3,i):new Rn(...e);return jn(s,o,n,t,r)}function ll(s,e,t,n,i){let r=new L(...e),o=new L(...t),a=o.clone().sub(r),l=jn(s,new Ii(n,n,a.length(),16),i,r.add(o).multiplyScalar(.5).toArray());return l.quaternion.setFromUnitVectors(new L(0,1,0),a.normalize()),l}function u0(){let e=document.createElement("canvas");e.width=e.height=512;let t=e.getContext("2d");t.fillStyle="#c4cfce",t.fillRect(0,0,512,512);let n=83,i=()=>(n=1664525*n+1013904223>>>0)/4294967296;for(let o=0;o<11e3;o++)t.fillStyle=i()<.55?"rgba(82,112,111,0.055)":"rgba(255,255,255,0.12)",t.fillRect(i()*512,i()*512,.6+i()*2,.6+i()*1.6);t.fillStyle="rgba(85,106,108,0.19)",t.fillRect(0,0,512,1.5),t.fillRect(0,0,1.5,512);let r=new rr(e);return r.colorSpace=ut,r.wrapS=r.wrapT=gn,r.repeat.set(22,22),r.anisotropy=8,new Ut({map:r,roughness:.91})}function hl(s){let t=new Uint8Array(16384);for(let i=0;i<128;i++)for(let r=0;r<128;r++)t[i*128+r]=120+Math.sin(r*Math.PI/2)*12+Math.cos(i*Math.PI/2)*11;let n=new Ai(t,128,128,ws);return n.wrapS=n.wrapT=gn,n.repeat.set(5,5),n.magFilter=Ct,n.needsUpdate=!0,new Ut({color:s,roughness:.91,bumpMap:n,bumpScale:.001})}var Un={halfWidth:.47,halfLength:1.06,high:.9,low:.58},Cr={halfWidth:.26,minZ:-.91,maxZ:-.57,rise:.041};async function nd(s,e,vitalTexture){
  const scene=new Mt;
  s.add(scene);
  let assetTableTop=null;
  const assetStatus={operatingTable:false,surgicalLightsAndPendant:false,anesthesiaWorkstation:false};
  s.background=new Ce(16250871);
  s.fog=new js(16250871,14,30);

  // Room envelope: 7.16 m x 7.98 m conceptual internal clear dimensions.
  const floorMat=u0();
  floorMat.roughness=.88;
  if(floorMat.map) floorMat.map.repeat.set(8,9);
  const floor=jn(scene,new xn(7.16,7.98),floorMat,[0,-.025,.81],!1);
  floor.rotation.x=-Math.PI/2;
  const wallMain=Aa(15921906,.92), wallSide=Aa(15592941,.9), wallAccent=Aa(14671839,.72);
  const wallTrim=Aa(12371672,.48), darkTrim=Aa(8553090,.42), steel=new Ut({color:14540253,metalness:.72,roughness:.3});
  const wallBack=jn(scene,new xn(7.16,3.9),wallMain,[0,1.94,-3.18],!1);
  const wallLeft=jn(scene,new xn(7.98,3.9),wallSide,[-3.58,1.94,.81],!1); wallLeft.rotation.y=Math.PI/2;
  const wallRight=jn(scene,new xn(7.98,3.9),wallSide,[3.58,1.94,.81],!1); wallRight.rotation.y=-Math.PI/2;
  // Front wall is split around a double-leaf automatic door.
  jn(scene,new xn(2.45,3.9),wallMain,[-2.355,1.94,4.8],!1);
  jn(scene,new xn(2.45,3.9),wallMain,[2.355,1.94,4.8],!1);
  jn(scene,new xn(2.26,1.42),wallMain,[0,3.17,4.8],!1);
  for(const x of [-3.5,3.5]) vt(scene,[.09,3.8,.08],[x,1.92,-3.16],wallTrim,.018,!1);
  // Continuous hygienic wall protection and restrained vertical panel joints.
  vt(scene,[7.1,.18,.07],[0,.12,-3.12],wallTrim,.018,!1);
  vt(scene,[7.1,.18,.07],[0,.12,4.73],wallTrim,.018,!1);
  for(const x of [-2.4,-1.2,0,1.2,2.4]) vt(scene,[.008,3.7,.008],[x,1.94,-3.16],wallAccent,0,!1);
  for(const z of [-2.2,-.8,.6,2.0,3.4]){
    vt(scene,[.008,3.7,.008],[-3.56,1.94,z],wallAccent,0,!1);
    vt(scene,[.008,3.7,.008],[3.56,1.94,z],wallAccent,0,!1);
  }

  // Double sliding entrance with observation glass and recessed handles.
  const doorFrame=new Ut({color:12566463,metalness:.66,roughness:.3});
  const doorLeaf=new Ut({color:15199445,metalness:.12,roughness:.34});
  const doorGlass=new Ut({color:11786198,metalness:.08,roughness:.16,transparent:!0,opacity:.58});
  vt(scene,[2.34,.075,.12],[0,2.34,4.73],doorFrame,.02,!1);
  for(const x of [-1.16,1.16]) vt(scene,[.075,2.35,.12],[x,1.18,4.73],doorFrame,.02,!1);
  for(const x of [-.54,.54]){
    vt(scene,[1.06,2.26,.075],[x,1.14,4.72],doorLeaf,.025,!1);
    vt(scene,[.82,.62,.018],[x,1.58,4.675],doorGlass,.012,!1);
    vt(scene,[.035,.36,.035],[x+(x<0?.39:-.39),1.12,4.66],doorFrame,.008,!1);
    vt(scene,[.045,.12,.035],[x+(x<0?.39:-.39),1.12,4.635],darkTrim,.008,!1);
  }
  vt(scene,[.035,2.22,.04],[0,1.13,4.64],darkTrim,.008,!1);

  // Ceiling cassette system and central filtered supply diffuser.
  const ceilingShell=new Mt; scene.add(ceilingShell);
  const ceilingTile=Aa(16250871,.72), ceilingFrame=Aa(13882323,.48), diffuserMat=new Ut({color:15199445,metalness:.12,roughness:.68});
  for(const x of [-3,-1.8,-.6,.6,1.8,3]) for(const z of [-2.4,-1.2,0,1.2,2.4,3.6]){
    vt(ceilingShell,[1.14,.035,1.14],[x,3.86,z],ceilingTile,.008,!1);
  }
  vt(ceilingShell,[7.12,.1,.12],[0,3.89,-3.13],ceilingFrame,.015,!1);
  vt(ceilingShell,[7.12,.1,.12],[0,3.89,4.74],ceilingFrame,.015,!1);
  vt(ceilingShell,[.12,.1,7.8],[-3.53,3.89,.8],ceilingFrame,.015,!1);
  vt(ceilingShell,[.12,.1,7.8],[3.53,3.89,.8],ceilingFrame,.015,!1);
  // HEPA / filtered supply diffuser over the operative field (visual representation only).
  vt(ceilingShell,[2.55,.055,1.95],[0,3.81,.12],ceilingFrame,.018,!1);
  vt(ceilingShell,[2.43,.025,1.83],[0,3.77,.12],diffuserMat,.012,!1);
  const grilleMat=Aa(12566463,.58);
  for(let x=-1.05;x<=1.05;x+=.21) vt(ceilingShell,[.012,.012,1.7],[x,3.752,.12],grilleMat,.002,!1);
  for(let z=-.65;z<=.9;z+=.21) vt(ceilingShell,[2.3,.012,.012],[0,3.752,z],grilleMat,.002,!1);
  // Recessed clinical ceiling panels and perimeter return-air grilles.
  for(const x of [-2.55,2.55]) for(const z of [-1.75,2.65]){
    vt(ceilingShell,[.78,.035,.42],[x,3.79,z],ceilingFrame,.012,!1);
    vt(ceilingShell,[.68,.018,.32],[x,3.765,z],new Ut({color:16382457,emissive:15790320,emissiveIntensity:.16,roughness:.25}),.008,!1);
  }
  for(const x of [-2.85,2.85]){
    vt(ceilingShell,[.42,.035,1.18],[x,3.79,.8],ceilingFrame,.012,!1);
    for(let z=-.15;z<1.75;z+=.16) vt(ceilingShell,[.34,.012,.018],[x,3.765,z],darkTrim,.003,!1);
  }
  const coveLight=new Ut({color:16645367,emissive:16250360,emissiveIntensity:.22,roughness:.22,metalness:.02});
  vt(ceilingShell,[6.34,.018,.06],[0,3.705,-2.98],coveLight,.004,!1);
  vt(ceilingShell,[6.34,.018,.06],[0,3.705,4.56],coveLight,.004,!1);
  vt(ceilingShell,[.06,.018,7.26],[-3.36,3.705,.78],coveLight,.004,!1);
  vt(ceilingShell,[.06,.018,7.26],[3.36,3.705,.78],coveLight,.004,!1);

  // Recessed head-wall medical service panel: outlets and gas terminal points.
  const service=new Mt; scene.add(service); service.position.set(0,1.68,-3.13);
  const serviceFrame=Aa(13290970,.48), serviceFace=Aa(15396854,.56), serviceDark=Aa(3751494,.42);
  vt(service,[1.9,1.12,.045],[0,0,0],serviceFrame,.018,!1);
  vt(service,[1.82,1.04,.025],[0,0,.03],serviceFace,.01,!1);
  vt(service,[1.55,.035,.018],[0,.38,.052],wallTrim,.006,!1);
  for(let x of [-.64,-.32,0,.32,.64]){
    vt(service,[.2,.17,.018],[x,.12,.052],serviceDark,.006,!1);
    vt(service,[.13,.025,.02],[x,.32,.054],Hi,.006,!1);
    for(let z=0;z<2;z++){
      const port=jn(service,new Ii(.022,.022,.018,18),new Ut({color:z===0?14474460:11119017,metalness:.38,roughness:.3}),[x-.035+z*.07,-.13,.064],!1);
      port.rotation.x=Math.PI/2;
    }
  }
  vt(service,[.42,.045,.02],[0,-.36,.052],wallTrim,.008,!1);

  // Wall-integrated clean storage, positioned outside the immediate work envelope.
  const storage=new Mt; scene.add(storage); storage.position.set(3.48,1.72,-1.95); storage.rotation.y=-Math.PI/2;
  const cabinetMat=new Ut({color:15724527,metalness:.12,roughness:.52}), cabinetTrim=new Ut({color:12105912,metalness:.72,roughness:.28});
  vt(storage,[1.9,1.35,.2],[0,0,0],cabinetMat,.035,!1);
  for(const x of [-.62,0,.62]){
    vt(storage,[.58,1.18,.025],[x,0,.115],new Ut({color:16250871,roughness:.48,metalness:.08}),.012,!1);
    vt(storage,[.025,.11,.025],[x+.21,0,.145],cabinetTrim,.006,!1);
  }
  vt(storage,[1.92,.045,.23],[0,.7,0],cabinetTrim,.012,!1);
  vt(storage,[1.92,.045,.23],[0,-.7,0],cabinetTrim,.012,!1);

  // Operating table remains the central reference; patient rig and positioning stay unchanged.
  const table=new Mt; scene.add(table);
  const steelDark=new Ut({color:6579300,metalness:.76,roughness:.32});
  const mattress=new Ut({color:3235431,roughness:.76,metalness:.02});
  const padEdge=new Ut({color:11456716,roughness:.7,metalness:.02});
  const baseCover=new Ut({color:12900861,roughness:.56,metalness:.12});
  const top=new Mt; table.add(top);
  vt(top,[.94,.085,2.12],[0,-.0425,0],mattress,.035);
  vt(top,[.92,.025,2.1],[0,-.092,.002],padEdge,.01);
  vt(top,[.9,.026,2.08],[0,-.119,.002],cl,.01);
  vt(top,[.91,.008,2.079],[0,-.105,.002],Hi,.003);
  vt(top,[.49,.045,.34],[0,.018,-.74],baseCover,.02);
  vt(top,[.47,.012,.322],[0,.017,-.74],padEdge,.005);
  for(const side of [-.49,.49]){
    vt(top,[.025,.035,1.02],[side,-.135,.05],steel,.012);
    for(const z of [-.4,.47]) vt(top,[.046,.055,.065],[side*.97,-.133,z],steelDark,.018);
  }
  for(const z of [-1.06,1.06]){
    const end=z+Math.sign(z)*.065;
    ll(top,[-.28,-.095,z],[-.28,-.095,end],.012,steelDark);
    ll(top,[.28,-.095,z],[.28,-.095,end],.012,steelDark);
    ll(top,[-.28,-.095,end],[.28,-.095,end],.012,steelDark);
  }
  vt(table,[.74,.07,1.46],[0,.095,0],steel,.025);
  vt(table,[.77,.026,1.47],[0,.052,0],steelDark,.01);
  vt(table,[.49,.15,.52],[0,.19,0],baseCover,.045);
  vt(table,[.32,.5,.34],[0,.49,0],steel,.055);
  vt(table,[.38,.055,.48],[0,.75,0],steelDark,.02);
  for(const x of [-.31,.31]) for(const z of [-.6,.6]){
    const caster=jn(table,new Ii(.043,.043,.035,20),steelDark,[x,.045,z]); caster.rotation.z=Math.PI/2;
  }
  const deckBase=new Mt; table.add(deckBase);
  vt(deckBase,[.37,1,.39],[0,.5,0],steel,.05);
  const deckOffset=.19;
  function setDeckHeight(y){top.position.y=y;deckBase.scale.y=y-.12-deckOffset;deckBase.position.y=deckOffset;if(assetTableTop)assetTableTop.position.y=y;}

  // 2027 surgical lighting upgrade: slimmer articulated arms and LED array heads.
  const fixtures=new Mt; scene.add(fixtures);
  const armMat=new Ut({color:13952748,metalness:.82,roughness:.24});
  const lampHousing=new Ut({color:15856113,metalness:.34,roughness:.22});
  const diffuser=new Ut({color:16514809,roughness:.16,metalness:.02,emissive:16053492,emissiveIntensity:.36});
  const ledPod=new Ut({color:16775918,roughness:.18,emissive:16775918,emissiveIntensity:.92});
  const sterileHandle=new Ut({color:16382457,roughness:.42,metalness:.06});
  ll(fixtures,[0,3.73,-.15],[0,3.56,-.15],.055,armMat);
  jn(fixtures,new Ii(.072,.072,.085,24),armMat,[0,3.54,-.15]);
  ll(fixtures,[0,3.54,-.15],[-.34,3.4,-.08],.044,armMat);
  ll(fixtures,[-.34,3.4,-.08],[-.72,3.22,.03],.032,armMat);
  ll(fixtures,[-.72,3.22,.03],[-.8,3.05,.03],.024,armMat);
  ll(fixtures,[0,3.54,-.15],[.34,3.4,-.22],.044,armMat);
  ll(fixtures,[.34,3.4,-.22],[.72,3.22,-.32],.032,armMat);
  ll(fixtures,[.72,3.22,-.32],[.8,3.05,-.32],.024,armMat);
  const focusSpotLights=[];
  function lampHead(x,z,scale,ry=0){
    const head=new Mt; fixtures.add(head); head.position.set(x,3.02,z); head.scale.setScalar(scale); head.rotation.y=ry;
    const hub=jn(head,new Ii(.065,.065,.08,24),armMat,[0,.075,0]); hub.rotation.x=Math.PI/2;
    vt(head,[.78,.095,.78],[0,0,0],lampHousing,.055,!1);
    vt(head,[.66,.028,.66],[0,-.058,.002],diffuser,.014,!1);
    vt(head,[.18,.05,.18],[0,.042,0],lampHousing,.03,!1);
    for(let k=0;k<12;k++){
      const a=k*Math.PI/6, r=.24;
      const pod=jn(head,new Ii(.022,.022,.016,16),ledPod,[Math.cos(a)*r,-.08,Math.sin(a)*r],!1);
      pod.rotation.x=Math.PI/2;
    }
    for(const a of [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4]){
      ll(head,[Math.cos(a)*.15,-.084,Math.sin(a)*.15],[Math.cos(a+Math.PI)*.15,-.084,Math.sin(a+Math.PI)*.15],.008,sterileHandle);
    }
    ll(head,[0,-.018,0],[0,-.17,0],.02,sterileHandle);
    jn(head,new Ii(.028,.028,.055,16),sterileHandle,[0,-.2,0]);
    // A spot light (pr = SpotLight): the cone set here (angle, penumbra, decay, distance) only acts on a spot
    // light; as a DirectionalLight it lit every surface in the room (F26, measured +21 % room brightness).
    const spot=new pr(16776177,1.18); head.add(spot); spot.position.set(0,-.11,0); spot.target=table; spot.angle=.44; spot.penumbra=.78; spot.decay=1.35; spot.distance=4.9; spot.name='NabdLampTaskLight'+focusSpotLights.length; focusSpotLights.push(spot);
  }
  lampHead(-.8,.03,1.0,.12); lampHead(.8,-.32,.94,-.18);
  const focusLightTarget=new Mt(); focusLightTarget.name='NabdWorkFocusLightTarget'; focusLightTarget.position.set(0,.95,-.15); scene.add(focusLightTarget);
  focusSpotLights.forEach(spot=>{spot.target=focusLightTarget;});

  // Ceiling-mounted service pendants: one anesthesia side, one surgical equipment side.
  const pendants=new Mt; scene.add(pendants);
  const pendantMetal=new Ut({color:13290970,metalness:.78,roughness:.28}), pendantBody=new Ut({color:15199445,metalness:.18,roughness:.38}), pendantDark=new Ut({color:3751494,metalness:.42,roughness:.34});
  function makePendant(x,z,side){
    const group=new Mt; pendants.add(group); group.position.set(x,0,z);
    ll(group,[0,3.78,0],[side*.24,3.58,.02],.052,pendantMetal);
    jn(group,new Ii(.07,.07,.07,22),pendantMetal,[side*.24,3.57,.02]);
    ll(group,[side*.24,3.58,.02],[side*.52,3.35,.08],.04,pendantMetal);
    ll(group,[side*.52,3.35,.08],[side*.58,2.72,.08],.035,pendantMetal);
    vt(group,[.46,.54,.28],[side*.58,2.38,.08],pendantBody,.035);
    vt(group,[.5,.045,.34],[side*.58,2.08,.1],pendantMetal,.012);
    vt(group,[.36,.025,.22],[side*.58,2.05,.1],pendantDark,.008);
    for(const xx of [-.12,0,.12]){
      const port=jn(group,new Ii(.025,.025,.018,16),Hi,[side*.58+xx,2.37,.226],!1); port.rotation.x=Math.PI/2;
    }
    vt(group,[.09,.16,.09],[side*.58-.15,2.06,.1],pendantMetal,.015);
    for(let k=0;k<3;k++){
      const socket=jn(group,new Ii(.018,.018,.02,16),serviceDark,[side*.58-.12+k*.12,2.34,.232],!1);socket.rotation.x=Math.PI/2;
    }
    return group;
  }
  makePendant(-1.28,-.85,-1);
  makePendant(1.5,.48,1);

  // Architectural and task lighting.
  s.add(new dr(16250090,11711154,1.22));
  const keyLight=new li(16772832,1.25);
  keyLight.position.set(2.8,4.5,-2.6); keyLight.castShadow=!0;
  keyLight.shadow.mapSize.setScalar(e?2048:1024);
  Object.assign(keyLight.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.4,far:12});
  keyLight.shadow.bias=-.00024; keyLight.shadow.normalBias=.012; keyLight.shadow.radius=3; s.add(keyLight);
  const fillLight=new li(14540253,.38); fillLight.position.set(-3,2.6,2.2); s.add(fillLight);

  // 2027 display system: slimmer bezels, larger touch screens and clearer clinical UI.
  function screenTexture(kind){
    if (kind === 'monitor') return vitalTexture;
    const canvas=document.createElement('canvas'); canvas.width=1280; canvas.height=720;
    const ctx=canvas.getContext('2d');
    const W=1280,H=720;
    const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0f1a22'); bg.addColorStop(.58,'#0a131b'); bg.addColorStop(1,'#060d13');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const round=(x,y,w,h,r,fill,stroke,lineWidth=2)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}};
    const txt=(text,x,y,size=20,color='#dce8ed',weight=500,align='left')=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px Inter, Arial, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left';};
    const line=(x1,y1,x2,y2,color='#29404a',width=1)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    const chip=(x,y,w,text,fill='#16343a',stroke='#2c6468',tcol='#bfe8e3')=>{round(x,y,w,28,14,fill,stroke,1.5);txt(text,x+w/2,y+19,12,tcol,700,'center');};
    const panel=(x,y,w,h,title,sub,color='#53d9b8')=>{round(x,y,w,h,16,'#111d27','#223540');txt(title,x+18,y+24,14,'#8ea7b2',700);txt(sub,x+18,y+54,36,color,700);};
    const grid=(x,y,w,h,dx=34,dy=26)=>{ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='rgba(132,166,176,.12)';ctx.lineWidth=1;for(let xx=x;xx<=x+w;xx+=dx){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+h);ctx.stroke();}for(let yy=y;yy<=y+h;yy+=dy){ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.stroke();}ctx.restore();};
    const waveform=(x,y,w,h,color,type)=>{grid(x,y,w,h,36,28);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();const mid=y+h*.52;for(let px=0;px<=w;px+=2){const phase=(px%160)/160;let v=0;if(type==='ecg'){if(phase<.18)v=Math.sin(phase*8)*2;else if(phase<.29)v=-6*(1-(phase-.18)/.11);else if(phase<.36)v=0;else if(phase<.405)v=-h*.32*((phase-.36)/.045);else if(phase<.455)v=h*.41*(1-(phase-.405)/.05);else if(phase<.50)v=-2;else if(phase<.72)v=Math.sin((phase-.5)*Math.PI/.22)*h*.11;else v=0;}else if(type==='pleth'){const q=(phase+.1)%1;v=q<.22?-Math.sin(q/.22*Math.PI/2)*h*.29:q<.55?-h*.29+((q-.22)/.33)*h*.24:Math.sin((q-.55)/.45*Math.PI)*h*.05;}else if(type==='resp')v=Math.sin(phase*Math.PI*2)*h*.24;else if(type==='capno')v=phase<.12?0:phase<.2?-(phase-.12)/.08*h*.32:phase<.72?-h*.32:-(1-(phase-.72)/.28)*h*.32;const py=mid+v;if(px===0)ctx.moveTo(x+px,py);else ctx.lineTo(x+px,py);}ctx.stroke();ctx.restore();};
    const header=(title,subtitle='CLINICAL SYSTEMS',status='LIVE SIMULATION')=>{ctx.fillStyle='#131f28';ctx.fillRect(0,0,W,72);txt('NABD  /  '+subtitle,30,29,15,'#8eaab5',700);txt(title,30,54,23,'#f1f7f8',700);chip(1030,20,220,status,'#163c37','#2c625b','#a9e6d4');line(0,72,W,72,'#324852',1);};
    if(kind==='monitor'){
      header('PATIENT MONITOR  /  2027 SERIES','PATIENT MONITORING','AT BEDSIDE');
      const rows=[['ECG  II','#58dda8','ecg'],['PLETH','#5db9f0','pleth'],['RESP','#e6c36e','resp'],['EtCO₂','#bd9bfa','capno']];
      rows.forEach((r,i)=>{const y=96+i*118;txt(r[0],30,y+16,15,r[1],700);waveform(30,y+24,820,78,r[1],r[2]);});
      panel(884,95,168,136,'HR','78','#58dda8'); txt('bpm',1002,151,18,'#a9bcc4',600);
      panel(1080,95,170,136,'SpO₂','98','#5db9f0'); txt('%',1210,151,18,'#a9bcc4',600);
      panel(884,247,366,108,'NIBP  /  mmHg','118 / 76','#e6c36e'); txt('MAP 90',1140,321,16,'#9bb0b8',600);
      panel(884,371,168,124,'EtCO₂','36','#bd9bfa'); txt('mmHg',980,430,16,'#a9bcc4',600);
      panel(1080,371,170,124,'RR','14','#e6c36e'); txt('/min',1165,430,16,'#a9bcc4',600);
      round(884,513,366,64,14,'#111d27','#223540'); txt('TEMP  36.8 °C',910,554,20,'#dfecef',700);
      txt('Lead II  •  SpO₂ sensor  •  NIBP auto cycle',30,687,14,'#869ca6',500);
    }else if(kind==='anesthesia'){
      header('ANESTHESIA WORKSTATION  /  TOUCH CONSOLE','ANESTHESIA + VENTILATION','SYSTEM CHECK OK');
      round(30,95,1220,62,14,'#12312e','#2a6558'); txt('Integrated gas delivery, ventilation and agent control ready',52,135,20,'#a9e6d4',700);
      const metrics=[['VT','450','mL','#5db9f0'],['RR','12','/min','#58dda8'],['PEEP','5','cmH₂O','#e6c36e'],['FiO₂','40','%','#bd9bfa']];
      metrics.forEach((m,i)=>{const x=30+i*304;round(x,182,284,116,14,'#111d27','#223540');txt(m[0],x+18,210,15,'#9fb3bc',700);txt(m[1],x+18,267,44,m[3],700);txt(m[2],x+124,267,18,'#a9bcc4',600);});
      txt('AIRWAY PRESSURE',32,340,15,'#8fa8b2',700); waveform(30,352,760,148,'#59d5ad','resp');
      txt('FLOW / VOLUME',836,340,15,'#8fa8b2',700); waveform(834,352,416,148,'#5db9f0','pleth');
      round(30,530,1220,114,14,'#111d27','#223540');
      chip(52,553,140,'MODE  VCV'); chip(206,553,156,'O₂ SUPPLY'); chip(376,553,176,'AGENT  SEVO');
      txt('EtCO₂  36 mmHg',58,621,18,'#dce8ed',650); txt('Fresh Gas Flow  2.0 L/min',318,621,18,'#dce8ed',650); txt('Alarm status  normal',724,621,18,'#a9e6d4',700);
    }else if(kind==='endoscopy'){
      header('LAPAROSCOPY  /  4K VISUALIZATION','MINIMALLY INVASIVE SURGERY','VIDEO FEED ACTIVE');
      const vx=28,vy=96,vw=806,vh=500;
      round(vx-5,vy-5,vw+10,vh+10,16,'#05090d','#334952');
      ctx.save();ctx.beginPath();ctx.roundRect(vx,vy,vw,vh,12);ctx.clip();
      const cavity=ctx.createRadialGradient(vx+vw*.48,vy+vh*.43,28,vx+vw*.5,vy+vh*.5,vw*.72);
      cavity.addColorStop(0,'#b27a70');cavity.addColorStop(.28,'#87575a');cavity.addColorStop(.58,'#4b303a');cavity.addColorStop(1,'#090d13');
      ctx.fillStyle=cavity;ctx.fillRect(vx,vy,vw,vh);
      const fold=(points,base,highlight)=>{
        ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
        for(let i=1;i<points.length;i+=3){if(points[i+2])ctx.bezierCurveTo(points[i][0],points[i][1],points[i+1][0],points[i+1][1],points[i+2][0],points[i+2][1]);}
        ctx.closePath();const g=ctx.createLinearGradient(vx,vy,vx+vw,vy+vh);g.addColorStop(0,highlight);g.addColorStop(.52,base);g.addColorStop(1,'#3b2732');
        ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(255,214,196,.22)';ctx.lineWidth=4;ctx.stroke();
        ctx.save();ctx.clip();
        for(let k=0;k<28;k++){const x=vx+((k*73)%vw),y=vy+((k*47+31)%vh);ctx.beginPath();ctx.ellipse(x,y,10+(k%5)*5,4+(k%3)*3,(k%7)*.2,0,Math.PI*2);ctx.fillStyle='rgba(255,205,184,.035)';ctx.fill();}
        ctx.restore();
      };
      fold([[40,280],[80,135],[190,118],[280,168],[365,218],[455,182],[560,154],[700,212],[790,308],[765,454],[640,472],[520,420],[410,468],[260,438],[120,398]],'#86505a','#d39a88');
      fold([[155,190],[225,115],[320,138],[390,198],[475,252],[560,224],[645,238],[720,306],[690,390],[595,420],[490,360],[390,392],[280,340],[190,278]],'#a36a69','#e0b09a');
      // Fine vascular markings and moist specular highlights create depth without graphic detail.
      ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#6d303b';ctx.lineWidth=2.2;ctx.lineCap='round';
      const vessels=[[[110,355],[160,320],[206,326],[245,292],[284,270]],[[225,420],[275,385],[310,392],[352,352],[392,330]],[[520,185],[548,225],[580,242],[612,282],[650,300]],[[600,385],[630,352],[662,350],[700,322],[730,290]]];
      vessels.forEach(v=>{ctx.beginPath();ctx.moveTo(v[0][0],v[0][1]);for(let i=1;i<v.length;i++)ctx.lineTo(v[i][0],v[i][1]);ctx.stroke();});
      ctx.restore();
      // A softly lit anatomical surface in the centre of the endoscopic field.
      ctx.beginPath();ctx.ellipse(438,315,122,82,-.24,0,Math.PI*2);
      const organ=ctx.createRadialGradient(395,275,12,438,315,142);organ.addColorStop(0,'#e4b49c');organ.addColorStop(.42,'#bd8179');organ.addColorStop(.78,'#87505b');organ.addColorStop(1,'#4a303b');
      ctx.fillStyle=organ;ctx.fill();ctx.strokeStyle='rgba(255,224,203,.35)';ctx.lineWidth=5;ctx.stroke();
      ctx.beginPath();ctx.ellipse(415,292,58,26,-.24,0,Math.PI*2);ctx.fillStyle='rgba(255,220,196,.16)';ctx.fill();
      // Laparoscopic grasper entering the field from the upper right.
      const shaft=ctx.createLinearGradient(620,130,520,340);shaft.addColorStop(0,'#e7eceb');shaft.addColorStop(.35,'#7f9295');shaft.addColorStop(.62,'#d9e1df');shaft.addColorStop(1,'#53666c');
      ctx.beginPath();ctx.moveTo(730,105);ctx.bezierCurveTo(690,155,642,225,594,292);ctx.strokeStyle=shaft;ctx.lineWidth=17;ctx.lineCap='round';ctx.stroke();
      ctx.beginPath();ctx.moveTo(730,105);ctx.bezierCurveTo(690,155,642,225,594,292);ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=3;ctx.stroke();
      ctx.beginPath();ctx.moveTo(594,292);ctx.lineTo(558,322);ctx.lineTo(548,310);ctx.moveTo(594,292);ctx.lineTo(565,276);ctx.lineTo(554,284);ctx.strokeStyle='#dce4e2';ctx.lineWidth=6;ctx.lineJoin='round';ctx.stroke();
      // Camera vignette and subtle lens reflections.
      const vignette=ctx.createRadialGradient(vx+vw/2,vy+vh/2,170,vx+vw/2,vy+vh/2,455);vignette.addColorStop(.55,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.84)');ctx.fillStyle=vignette;ctx.fillRect(vx,vy,vw,vh);
      ctx.beginPath();ctx.ellipse(vx+vw*.5,vy+vh*.5,150,85,-.15,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=14;ctx.stroke();
      ctx.restore();
      round(866,96,384,500,14,'#111d27','#223540');
      txt('VIDEO PROCESSOR',892,130,15,'#9db5be',700); txt('4K UHD  /  60 FPS',892,175,25,'#edf4f5',700); line(892,194,1225,194,'#334a54',1);
      const opts=[['LIGHT SOURCE','LED 82%'],['WHITE BALANCE','AUTO'],['IMAGE MODE','NATURAL'],['INSUFFLATION','12 mmHg'],['RECORDING','STANDBY'],['CAMERA HEAD','DIGITAL CMOS']];
      opts.forEach((o,i)=>{const y=244+i*56;txt(o[0],892,y,13,'#829da7',600);txt(o[1],892,y+24,18,i===4?'#e6c36e':'#dce8ed',650);});
      chip(892,548,180,'SIMULATED FEED'); chip(1088,548,140,'4K READY','#16343a','#2c6468','#7fe5f4');
    }else{
      header('ELECTROSURGICAL UNIT  /  ENERGY PLATFORM','ENERGY SYSTEMS','READY');
      round(30,96,1220,66,14,'#12312e','#2a6558'); txt('Footswitch connected  •  return electrode detected  •  system standby',56,139,20,'#a9e6d4',700);
      const modes=[['MONOPOLAR CUT','35','W','#5db9f0'],['COAGULATION','25','W','#e6c36e'],['BIPOLAR','20','W','#58dda8']];
      modes.forEach((m,i)=>{const x=30+i*406;round(x,190,380,206,16,'#111d27','#223540');txt(m[0],x+22,228,17,'#a7bbc3',700);txt(m[1],x+22,322,68,m[3],700);txt(m[2],x+140,322,22,'#a7bbc3',600);round(x+24,348,332,10,5,'#233843');round(x+24,348,Math.max(60,332*(Number(m[1])/50)),10,5,m[3]);});
      round(30,430,1220,180,16,'#111d27','#223540'); txt('ACTIVE ACCESSORIES',56,466,15,'#91aab3',700);
      txt('Monopolar pencil',56,520,20,'#dce8ed',600); txt('Bipolar forceps',412,520,20,'#dce8ed',600); txt('Return electrode',818,520,20,'#dce8ed',600);
      txt('Training simulation  /  energy output disabled',56,572,14,'#829ba5',500);
      chip(1020,544,190,'SIMULATION ONLY','#183531','#2f5c56','#a9e6d4');
    }
    const tex=new rr(canvas); tex.colorSpace=ut; tex.anisotropy=8; tex.needsUpdate=!0; return tex;
  }
  const casing=new Ut({color:15464001,metalness:.16,roughness:.36});
  const darkCase=new Ut({color:1712933,metalness:.28,roughness:.28});
  const deviceAccent=new Ut({color:12829635,metalness:.36,roughness:.26});
  const rubber=new Ut({color:3158064,roughness:.78});
  const screenFrame=new Ut({color:1119252,metalness:.38,roughness:.22});
  function makeScreen(parent,w,h,y,z,kind,tilt=-.03){
    // Separate rear shell, front bezel, glass and lower control strip.
    vt(parent,[w+.095,h+.095,.082],[0,y,z-.025],screenFrame,.03,!1);
    vt(parent,[w+.035,h+.035,.02],[0,y,z+.018],darkCase,.012,!1);
    const displayTexture=screenTexture(kind);
    const material=new Ut({map:displayTexture,emissive:16777215,emissiveMap:displayTexture,emissiveIntensity:.46,roughness:.14,metalness:.015});
    material.toneMapped=!1;
    const display=jn(parent,new xn(w,h),material,[0,y,z+.031],!1);
    display.rotation.x=tilt;
    vt(parent,[w+.028,.045,.016],[0,y-h*.5-.027,z+.029],screenFrame,.008,!1);
    for(let k=0;k<5;k++){
      const b=jn(parent,new Ii(.009,.009,.012,12),k===0?deviceAccent:steel,[w*.5-.105+k*.035,y-h*.5-.027,z+.04],!1);
      b.rotation.x=Math.PI/2;
    }
    const led=jn(parent,new Ii(.008,.008,.012,12),new Ut({color:5898157,emissive:5898157,emissiveIntensity:.72}),[w*.5-.035,y-h*.5-.027,z+.041],!1);
    led.rotation.x=Math.PI/2;
    // Fine side ventilation slots, visible on the monitor housing rather than painted on the screen.
    for(const side of [-1,1])for(let k=0;k<4;k++)vt(parent,[.012,.006,.006],[side*(w*.5+.036),y-h*.5+.025+k*.018,z+.024],steelDark,.002,!1);
    return display;
  }
  function wheelSet(parent,x,z,y=.06){
    for(const dx of [-x,x])for(const dz of [-z,z]){
      vt(parent,[.095,.022,.09],[dx,y+.105,dz],steelDark,.012,!1);
      ll(parent,[dx,y+.105,dz],[dx,y+.035,dz],.012,steel);
      const wheel=jn(parent,new Ii(.045,.045,.038,24),rubber,[dx,y+.045,dz]); wheel.rotation.z=Math.PI/2;
      const hub=jn(parent,new Ii(.019,.019,.042,20),steelDark,[dx,y+.045,dz]); hub.rotation.z=Math.PI/2;
      const cap=jn(parent,new Ii(.009,.009,.044,16),steel,[dx,y+.045,dz]); cap.rotation.z=Math.PI/2;
      ll(parent,[dx-.035,y+.105,dz],[dx-.035,y+.055,dz],.008,steelDark);
      ll(parent,[dx+.035,y+.105,dz],[dx+.035,y+.055,dz],.008,steelDark);
    }
  }
  function pathSegments(parent,points,r,mat){
    for(let i=0;i<points.length-1;i++)ll(parent,points[i],points[i+1],r,mat);
  }
  function ribbedHose(parent,points,r,mat,ribMat){
    for(let s=0;s<points.length-1;s++){
      const a=points[s],b=points[s+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      const len=Math.sqrt(dx*dx+dy*dy+dz*dz),steps=Math.max(2,Math.ceil(len/.035));
      for(let k=0;k<steps;k++){
        const t0=k/steps,t1=(k+1)/steps;
        const p0=[a[0]+dx*t0,a[1]+dy*t0,a[2]+dz*t0],p1=[a[0]+dx*t1,a[1]+dy*t1,a[2]+dz*t1];
        ll(parent,p0,p1,r*(k%2?.88:1),mat);
        if(k>0){const tm=(t0+t1)*.5,pm=[a[0]+dx*tm,a[1]+dy*tm,a[2]+dz*tm];ll(parent,[pm[0]-dx/len*.004,pm[1]-dy/len*.004,pm[2]-dz/len*.004],[pm[0]+dx/len*.004,pm[1]+dy/len*.004,pm[2]+dz/len*.004],r*1.12,ribMat);}
      }
    }
  }
  function spherePart(parent,pos,scale,mat){const m=jn(parent,new cr(1,20,14),mat,pos,!1);m.scale.set(...scale);return m;}

  // Anesthesia workstation: updated to a 2027-style integrated touchscreen unit.
  const anesthesia=new Mt; scene.add(anesthesia); anesthesia.position.set(-1.42,.02,-1.52); anesthesia.rotation.y=.12;
  const hoseMat=new Ut({color:12698049,roughness:.66,metalness:.04});
  vt(anesthesia,[.76,.085,.62],[0,.08,0],casing,.035);
  wheelSet(anesthesia,.27,.22,.05);
  vt(anesthesia,[.58,.68,.46],[0,.46,0],casing,.055);
  vt(anesthesia,[.54,.06,.43],[0,.82,0],deviceAccent,.02);
  vt(anesthesia,[.76,.48,.22],[0,1.22,-.01],darkCase,.05);
  makeScreen(anesthesia,.64,.37,1.22,.1,'anesthesia',-.02);
  for(const y of [.29,.45,.61]){vt(anesthesia,[.34,.026,.016],[0,y,.236],deviceAccent,.006,!1); vt(anesthesia,[.06,.04,.018],[-.22,y,.238],steel,.006,!1);}
  for(const x of [-.17,0,.17]) jn(anesthesia,new Ii(.026,.026,.022,16),steel,[x,.9,.2],!1).rotation.x=Math.PI/2;
  for(const x of [-.16,.0,.16]){
    vt(anesthesia,[.1,.22,.1],[x,.46,-.24],new Ut({color:x<0?12235203:x===0?11062339:16247277,metalness:.26,roughness:.22}),.02);
    vt(anesthesia,[.08,.05,.08],[x,.59,-.24],deviceAccent,.01);
  }
  const absorber=jn(anesthesia,new Ii(.11,.11,.34,24),new Ut({color:12895428,metalness:.12,roughness:.18,transparent:!0,opacity:.62}),[.24,.76,-.08]);
  const bag=jn(anesthesia,new Ii(.12,.1,.2,22),new Ut({color:14606046,roughness:.64,metalness:.02,transparent:!0,opacity:.85}),[.29,.56,.13]); bag.rotation.z=.45;
  ll(anesthesia,[.24,.92,.11],[.34,.86,.18],.018,hoseMat); ll(anesthesia,[.34,.86,.18],[.39,.63,.16],.018,hoseMat); ll(anesthesia,[.26,.75,.01],[.18,.61,.14],.014,hoseMat);
  vt(anesthesia,[.18,.08,.06],[-.29,.72,.18],steel,.02);
  // Front-facing vaporizer modules, flow control dials and gas connection details.
  for(let k=0;k<2;k++){
    const x=k===0?-.17:.17;
    vt(anesthesia,[.14,.22,.09],[x,.48,.245],new Ut({color:14540253,metalness:.28,roughness:.24}),.018,!1);
    jn(anesthesia,new Ii(.047,.047,.105,24),new Ut({color:13290970,metalness:.08,roughness:.2,transparent:!0,opacity:.58}),[x,.62,.292]);
    const dial=jn(anesthesia,new Ii(.032,.032,.035,20),deviceAccent,[x,.36,.305],!1);dial.rotation.x=Math.PI/2;
    for(let n=0;n<5;n++)ll(anesthesia,[x-.038+n*.019,.35,.315],[x-.038+n*.019,.37,.315],.0025,steel);
  }
  // Flow-control tubes and a compact ventilator bellows are distinct components.
  const flowGlass=new Ut({color:13487565,metalness:.04,roughness:.12,transparent:!0,opacity:.42});
  for(let k=0;k<3;k++){
    const x=-.2+k*.2;
    jn(anesthesia,new Ii(.022,.022,.19,20),flowGlass,[x,.89,.255]);
    jn(anesthesia,new Ii(.012,.012,.025,16),deviceAccent,[x,.88,.26]);
    vt(anesthesia,[.048,.018,.018],[x,.985,.255],steel,.004,!1);
    vt(anesthesia,[.048,.018,.018],[x,.795,.255],steel,.004,!1);
  }
  spherePart(anesthesia,[.31,.62,.39],[.12,.085,.075],new Ut({color:14932189,roughness:.6,metalness:.02,transparent:!0,opacity:.82}));
  ribbedHose(anesthesia,[[.22,.91,.17],[.34,1.02,.26],[.42,1.03,.38],[.33,.94,.49],[.13,.91,.51],[-.08,.95,.44],[-.24,.9,.4]],.014,hoseMat,deviceAccent);
  pathSegments(anesthesia,[[-.24,.9,.4],[-.32,.82,.38],[-.34,.7,.31]],.009,steelDark);
  // Front fascia, drawer pulls and side cooling slots.
  for(const y of [.2,.31,.42]){
    vt(anesthesia,[.36,.075,.018],[0,y,.239],darkCase,.008,!1);
    vt(anesthesia,[.12,.012,.018],[0,y+.005,.253],steel,.004,!1);
  }
  for(let k=0;k<7;k++)vt(anesthesia,[.012,.012,.008],[.305,.24+k*.045,-.08],steelDark,.002,!1);

  // Patient monitor: thin-bezel bedside monitor with a modern arm and compact base.
  const monitor=new Mt; scene.add(monitor); monitor.position.set(-1.34,.02,-1.03); monitor.rotation.y=1.29;
  vt(monitor,[.54,.06,.42],[0,.05,0],casing,.022); wheelSet(monitor,.19,.14,.04);
  ll(monitor,[0,.08,0],[0,1.31,0],.03,steel);
  ll(monitor,[0,1.29,0],[0,1.40,.06],.024,steel);
  vt(monitor,[.16,.05,.08],[0,.92,.04],deviceAccent,.014);
  vt(monitor,[.78,.10,.18],[0,1.44,0],darkCase,.03);
  const vitalScreen=makeScreen(monitor,.86,.484,1.44,.07,'monitor',-.015);
  vt(monitor,[.42,.05,.11],[0,.86,.02],darkCase,.018);
  for(let k=0;k<4;k++) jn(monitor,new Ii(.015,.015,.016,14),steel,[-.17+k*.11,.86,.079],!1).rotation.x=Math.PI/2;
  vt(monitor,[.72,.04,.06],[0,1.15,-.105],casing,.012,!1);
  vt(monitor,[.16,.2,.07],[.36,.93,-.04],casing,.018,!1);
  for(let k=0;k<6;k++)vt(monitor,[.012,.012,.006],[.31,.86+k*.025,-.078],steelDark,.002,!1);
  const ecgLead=new Ut({color:3158064,roughness:.72}), spoLead=new Ut({color:16777215,roughness:.68}), nibpLead=new Ut({color:12235203,roughness:.64});
  ribbedHose(monitor,[[.2,.83,.12],[.27,.7,.2],[.28,.54,.31],[.14,.47,.42],[-.06,.44,.52],[-.18,.4,.58]],.006,ecgLead,steelDark);
  pathSegments(monitor,[[.18,.83,.12],[.35,.68,.19],[.39,.51,.31],[.29,.44,.45],[.08,.4,.56]],.005,spoLead);
  pathSegments(monitor,[[-.16,.83,.12],[-.3,.69,.2],[-.34,.52,.34],[-.24,.44,.5],[-.06,.39,.59]],.007,nibpLead);
  for(const [x,z,mat] of [[-.18,.58,ecgLead],[.08,.56,spoLead],[-.06,.59,nibpLead]])spherePart(monitor,[x,.39,z],[.014,.014,.014],mat);

  // Two field monitors on opposite sides share the tower's video feed.
  const fieldDisplays = [-1, 1].map((side) => {
    const mount = new Mt();
    scene.add(mount);
    mount.position.set(side * 1.38, 1.83, 0.12);
    mount.rotation.y = -side * Math.PI / 2;
    mount.visible = false;
    ll(mount, [0,1.02,-.11], [0,.34,-.11], .033, steel);
    ll(mount, [0,.34,-.11], [0,.1,-.12], .024, steel);
    vt(mount, [.13,.13,.14], [0,.10,-.10], casing, .024, false);
    return { side, mount, screen: makeScreen(mount,.92,.5175,0,0,'endoscopy',0) };
  });

  // Endoscopy tower: dual-display 4K tower positioned opposite the surgeon.
  const endoscopy=new Mt; scene.add(endoscopy); endoscopy.position.set(2.54,.02,.24); endoscopy.rotation.y=-Math.PI/2;
  vt(endoscopy,[.78,.075,.64],[0,.06,0],casing,.028); wheelSet(endoscopy,.27,.22,.045);
  vt(endoscopy,[.66,.24,.54],[0,.23,0],casing,.04);
  vt(endoscopy,[.66,.04,.54],[0,.39,0],deviceAccent,.015);
  vt(endoscopy,[.66,.24,.54],[0,.62,0],casing,.04);
  vt(endoscopy,[.66,.04,.54],[0,.78,0],deviceAccent,.015);
  vt(endoscopy,[.66,.24,.54],[0,1.01,0],casing,.04);
  vt(endoscopy,[.66,.04,.54],[0,1.17,0],deviceAccent,.015);
  vt(endoscopy,[.88,.42,.22],[0,1.61,-.01],darkCase,.045);
  vt(endoscopy,[.64,.34,.18],[0,1.07,-.01],darkCase,.036);
  const endoscopyScreenPrimary = makeScreen(endoscopy,.76,.43,1.61,.1,'endoscopy',-.01);
  const endoscopyScreenSecondary = makeScreen(endoscopy,.56,.31,1.07,.098,'endoscopy',-.012);
  for(const y of [.52,.9,1.29]){for(let k=0;k<3;k++) jn(endoscopy,new Ii(.012,.012,.014,12),steel,[-.14+k*.14,y,.27],!1);}
  vt(endoscopy,[.06,1.38,.06],[.31,.93,.18],steel,.018);
  vt(endoscopy,[.14,.14,.14],[.31,1.58,.18],deviceAccent,.02);
  ll(endoscopy,[.31,1.46,.18],[.52,1.34,.32],.014,hoseMat); ll(endoscopy,[.52,1.34,.32],[.66,1.36,.42],.01,hoseMat);
  jn(endoscopy,new Ii(.03,.03,.07,18),new Ut({color:10461087,metalness:.72,roughness:.24}),[.68,1.36,.42]);
  // Front-facing processor controls, ventilation, optical ports and cable management.
  for(const y of [.25,.64,1.03]){
    vt(endoscopy,[.5,.13,.022],[0,y,.281],darkCase,.008,!1);
    for(let k=0;k<7;k++)vt(endoscopy,[.012,.055,.012],[-.2+k*.066,y,.298],steelDark,.002,!1);
    for(let k=0;k<3;k++){const led=jn(endoscopy,new Ii(.009,.009,.012,12),new Ut({color:k===0?5898157:k===1?16763904:6114047,emissive:k===0?5898157:0,emissiveIntensity:.35}),[.18+k*.035,y,.3],!1);led.rotation.x=Math.PI/2;}
  }
  for(let k=0;k<8;k++)vt(endoscopy,[.012,.012,.008],[.29,.28+k*.035,-.278],steelDark,.002,!1);
  for(let k=0;k<4;k++){
    const port=jn(endoscopy,new Ii(.026,.026,.022,18),steelDark,[-.22+k*.12,.49,.292],!1);port.rotation.x=Math.PI/2;
    const inner=jn(endoscopy,new Ii(.012,.012,.024,16),deviceAccent,[-.22+k*.12,.49,.307],!1);inner.rotation.x=Math.PI/2;
  }
  ribbedHose(endoscopy,[[.25,1.43,.2],[.38,1.3,.28],[.39,1.08,.34],[.28,.9,.37],[.12,.78,.4],[-.1,.72,.39],[-.28,.62,.33]],.012,hoseMat,deviceAccent);
  pathSegments(endoscopy,[[-.28,.62,.33],[-.38,.52,.29],[-.42,.42,.22]],.008,steelDark);

  // Electrosurgical unit upgraded with a slimmer body and clearer front panel.
  const esu=new Mt; scene.add(esu); esu.position.set(2.6,.02,1.54); esu.rotation.y=-Math.PI/2;
  vt(esu,[.56,.07,.48],[0,.06,0],casing,.022); wheelSet(esu,.19,.15,.045);
  vt(esu,[.46,.68,.38],[0,.43,0],casing,.035);
  vt(esu,[.58,.36,.16],[0,.94,.02],darkCase,.032);
  makeScreen(esu,.5,.28,.94,.093,'esu',-.01);
  vt(esu,[.18,.05,.08],[0,.67,.2],deviceAccent,.014);
  for(let x of [-.13,0,.13]) jn(esu,new Ii(.017,.017,.018,14),steel,[x,.67,.225],!1).rotation.x=Math.PI/2;
  for(const x of [-.16,.16]){vt(esu,[.1,.06,.025],[x,.33,.21],new Ut({color:x<0?6114047:16247277,roughness:.28,metalness:.08}),.006,!1);}
  for(let k=0;k<4;k++){
    const port=jn(esu,new Ii(.024,.024,.026,18),steelDark,[-.18+k*.12,.18,.205],!1);port.rotation.x=Math.PI/2;
    const inner=jn(esu,new Ii(.012,.012,.028,16),k%2?deviceAccent:steel,[-.18+k*.12,.18,.222],!1);inner.rotation.x=Math.PI/2;
  }
  const power=jn(esu,new Ii(.035,.035,.025,20),new Ut({color:5898157,emissive:5898157,emissiveIntensity:.3}),[.2,.78,.205],!1);power.rotation.x=Math.PI/2;
  const footPedal=new Mt;scene.add(footPedal);footPedal.position.set(2.22,.025,2.12);footPedal.rotation.y=-Math.PI/2;
  vt(footPedal,[.34,.055,.24],[0,.04,0],rubber,.035,!1);
  vt(footPedal,[.12,.055,.15],[-.085,.075,.005],deviceAccent,.018,!1);
  vt(footPedal,[.12,.055,.15],[.085,.075,.005],steelDark,.018,!1);
  for(const x of [-.085,.085])vt(footPedal,[.075,.018,.11],[x,.108,.005],steel,.008,!1);
  pathSegments(scene,[[2.6,.13,1.54],[2.56,.07,1.72],[2.43,.045,1.88],[2.32,.04,2.02],[2.22,.04,2.12]],.008,ecgLead);

  // Suction unit: more contemporary cart with dual collection canisters.
  const suction=new Mt; scene.add(suction); suction.position.set(-2.6,.02,-1.42); suction.rotation.y=.06;
  vt(suction,[.46,.06,.38],[0,.06,0],casing,.02); wheelSet(suction,.16,.13,.04);
  vt(suction,[.32,.34,.28],[0,.24,0],casing,.03);
  vt(suction,[.32,.06,.24],[0,.53,0],deviceAccent,.015);
  const jarMat=new Ut({color:13290970,metalness:.08,roughness:.22,transparent:!0,opacity:.6});
  jn(suction,new Ii(.085,.085,.22,24),jarMat,[-.07,.76,0]);
  jn(suction,new Ii(.085,.085,.22,24),jarMat,[.07,.76,0]);
  vt(suction,[.25,.055,.2],[0,.98,0],darkCase,.018);
  for(const x of [-.08,.08]) ll(suction,[x,.85,.08],[x+.06,.97,.18],.011,hoseMat);
  for(const x of [-.07,.07]){
    vt(suction,[.15,.025,.13],[x,.9,.02],steel,.008,!1);
    jn(suction,new Ii(.018,.018,.025,16),deviceAccent,[x,.99,.02]);
  }
  vt(suction,[.18,.07,.04],[0,.57,.15],darkCase,.012,!1);
  for(let k=0;k<5;k++)vt(suction,[.012,.008,.008],[-.06+k*.03,.57,.175],steelDark,.002,!1);
  ribbedHose(suction,[[.12,.91,.12],[.2,.98,.18],[.29,.9,.24],[.3,.7,.26],[.22,.55,.24]],.01,hoseMat,deviceAccent);

  // Back table: sterile instrument preparation station at the scrub-nurse side.
  const trolley=new Mt; scene.add(trolley); trolley.position.set(-2.55,.02,.55); trolley.rotation.y=.08;
  const traySteel=new Ut({color:15987700,metalness:.78,roughness:.18});
  const trayEdge=new Ut({color:11119017,metalness:.82,roughness:.22});
  vt(trolley,[1.12,.045,.68],[0,.96,0],traySteel,.025);
  vt(trolley,[1.04,.022,.6],[0,.925,0],new Ut({color:14079402,metalness:.48,roughness:.3}),.01);
  vt(trolley,[.98,.035,.58],[0,.36,0],traySteel,.02);
  wheelSet(trolley,.46,.26,.035);
  for(const x of [-.46,.46])for(const z of [-.26,.26])ll(trolley,[x,.15,z],[x,.91,z],.014,trayEdge);
  // Raised tray lips, lower shelf braces and side push handles.
  ll(trolley,[-.54,1.0,-.31],[.54,1.0,-.31],.012,trayEdge);
  ll(trolley,[-.54,1.0,.31],[.54,1.0,.31],.012,trayEdge);
  ll(trolley,[-.54,1.0,-.31],[-.54,1.0,.31],.012,trayEdge);
  ll(trolley,[.54,1.0,-.31],[.54,1.0,.31],.012,trayEdge);
  ll(trolley,[-.48,.42,-.3],[.48,.42,-.3],.012,trayEdge);
  ll(trolley,[-.48,.42,.3],[.48,.42,.3],.012,trayEdge);
  for(const x of [-.61,.61]){ll(trolley,[x,.82,-.2],[x,.82,.2],.012,steel);ll(trolley,[x,.82,-.2],[x,.92,-.2],.012,steel);ll(trolley,[x,.82,.2],[x,.92,.2],.012,steel);}
  // Two shallow stainless instrument pans sit on the sterile field.
  vt(trolley,[.28,.018,.18],[-.34,.999,-.18],new Ut({color:15199445,metalness:.72,roughness:.22}),.012,!1);
  vt(trolley,[.28,.018,.18],[.34,.999,.18],new Ut({color:15199445,metalness:.72,roughness:.22}),.012,!1);
  for(const x of [-.48,-.2,.2,.48])for(const z of [-.27,.27])jn(trolley,new Ii(.012,.012,.018,14),steel,[x,1.015,z],!1);
  const toolMat=new Ut({color:13290970,metalness:.94,roughness:.19});
  const toolDark=new Ut({color:5526874,metalness:.72,roughness:.28});
  const sterileDrape=new Ut({color:4895423,roughness:.96,metalness:.01});
  // Individual surgical instruments: oval finger rings, box locks, serrations and distinct working tips.
  function instrumentRing(parent,cx,y,cz,rx,rz,mat){
    const segments=22;
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      ll(parent,[cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz],[cx+Math.cos(b)*rx,y,cz+Math.sin(b)*rz],.0038,mat);
    }
  }
  function ringInstrument(parent,x,y,z,kind='hemostat',angle=0,scale=1){
    const g=new Mt;parent.add(g);g.position.set(x,y,z);g.rotation.y=angle;g.scale.setScalar(scale);
    instrumentRing(g,-.17,.004,-.043,.041,.031,toolMat);
    instrumentRing(g,-.17,.004,.043,.041,.031,toolMat);
    // Finger-ring necks and reinforced shanks.
    ll(g,[-.132,.008,-.043],[-.035,.01,-.012],.007,toolMat);
    ll(g,[-.132,.008,.043],[-.035,.01,.012],.007,toolMat);
    jn(g,new Ii(.018,.018,.018,20),toolDark,[-.005,.012,0],!1);
    // Box lock and ratchet teeth.
    for(let k=0;k<4;k++)ll(g,[-.08+k*.014,.014,-.016],[-.08+k*.014,.014,.016],.0032,toolDark);
    if(kind==='scissors'){
      ll(g,[.004,.012,-.012],[.255,.012,.055],.008,toolMat);
      ll(g,[.004,.012,.012],[.255,.012,-.055],.008,toolMat);
      ll(g,[.245,.012,.052],[.35,.012,.066],.0038,toolMat);
      ll(g,[.245,.012,-.052],[.35,.012,-.066],.0038,toolMat);
      ll(g,[.055,.014,-.005],[.29,.014,.044],.0025,steel);
      ll(g,[.055,.014,.005],[.29,.014,-.044],.0025,steel);
      for(let k=0;k<5;k++)ll(g,[.27+k*.012,.014,.047-k*.003],[.278+k*.012,.014,.052-k*.003],.0024,toolDark);
    }else{
      ll(g,[.004,.012,-.012],[.245,.012,-.012],kind==='needle-holder'?.009:.007,toolMat);
      ll(g,[.004,.012,.012],[.245,.012,.012],kind==='needle-holder'?.009:.007,toolMat);
      if(kind==='needle-holder'){
        vt(g,[.085,.014,.04],[.19,.014,0],toolDark,.006,!1);
        for(let k=0;k<6;k++)ll(g,[.225,.015,-.014+k*.0056],[.275,.015,-.014+k*.0056],.003,toolMat);
        ll(g,[.245,.014,-.012],[.335,.014,-.018],.006,toolMat);
        ll(g,[.245,.014,.012],[.335,.014,.018],.006,toolMat);
      }else if(kind==='hemostat'){
        for(let k=0;k<5;k++)ll(g,[.19+k*.012,.015,-.013],[.19+k*.012,.015,.013],.003,toolDark);
        ll(g,[.245,.012,-.012],[.35,.012,-.016],.0045,toolMat);
        ll(g,[.245,.012,.012],[.35,.012,.016],.0045,toolMat);
        for(let k=0;k<4;k++)ll(g,[.29+k*.012,.014,-.013],[.29+k*.012,.014,.013],.0024,toolDark);
      }else{
        ll(g,[.245,.012,-.012],[.35,.012,-.002],.004,toolMat);
        ll(g,[.245,.012,.012],[.35,.012,.002],.004,toolMat);
      }
    }
    return g;
  }
  function scalpel(parent,x,y,z,angle=0,scale=1){
    const g=new Mt;parent.add(g);g.position.set(x,y,z);g.rotation.y=angle;g.scale.setScalar(scale);
    vt(g,[.29,.022,.052],[-.035,.006,0],toolDark,.012,!1);
    for(let k=0;k<7;k++)vt(g,[.012,.018,.054],[-.15+k*.033,.009,0],toolMat,.003,!1);
    vt(g,[.09,.008,.034],[.13,.014,0],toolMat,.004,!1);
    ll(g,[.15,.014,-.012],[.29,.014,0],.006,toolMat);
    ll(g,[.15,.014,.012],[.29,.014,0],.006,toolMat);
    ll(g,[.29,.014,0],[.33,.014,-.012],.0028,toolMat);
    return g;
  }
  function tissueForceps(parent,x,y,z,angle=0,scale=1){
    const g=new Mt;parent.add(g);g.position.set(x,y,z);g.rotation.y=angle;g.scale.setScalar(scale);
    ll(g,[-.22,.006,-.026],[.22,.006,-.006],.006,toolMat);
    ll(g,[-.22,.006,.026],[.22,.006,.006],.006,toolMat);
    ll(g,[-.22,.006,-.026],[-.29,.006,-.04],.0038,toolMat);
    ll(g,[-.22,.006,.026],[-.29,.006,.04],.0038,toolMat);
    for(let k=0;k<7;k++)ll(g,[-.17+k*.027,.012,-.018],[-.17+k*.027,.012,.018],.0025,toolDark);
    ll(g,[.22,.006,-.006],[.32,.006,0],.0035,toolMat);
    ll(g,[.22,.006,.006],[.32,.006,0],.0035,toolMat);
    return g;
  }
  function suctionCannula(parent,x,y,z,angle=0,scale=1){
    const g=new Mt;parent.add(g);g.position.set(x,y,z);g.rotation.y=angle;g.scale.setScalar(scale);
    ll(g,[-.23,.006,0],[.19,.006,0],.009,toolMat);
    ll(g,[.19,.006,0],[.27,.006,.025],.008,toolMat);
    ll(g,[.27,.006,.025],[.31,.006,.025],.006,toolMat);
    jn(g,new Ii(.014,.014,.016,18),toolDark,[-.23,.006,0],!1);
    jn(g,new Ii(.014,.014,.016,18),toolMat,[.31,.006,.025],!1);
    for(let k=0;k<4;k++)ll(g,[-.06+k*.035,.012,-.009],[-.06+k*.035,.012,.009],.0025,steel);
    return g;
  }
  // Back table: blue sterile field and clearly separated, recognizable instrument set.
  vt(trolley,[.98,.012,.55],[0,.991,0],sterileDrape,.008,!1);
  ringInstrument(trolley,-.02,1.025,.21,'hemostat',0,.72);
  ringInstrument(trolley,-.02,1.025,.105,'scissors',0,.72);
  ringInstrument(trolley,-.02,1.025,0,'needle-holder',0,.72);
  tissueForceps(trolley,-.02,1.025,-.105,0,.74);
  scalpel(trolley,-.02,1.025,-.21,0,.72);
  suctionCannula(trolley,.27,1.025,-.21,0,.68);
  ringInstrument(trolley,.28,1.025,-.095,'hemostat',0,.66);
  ringInstrument(trolley,.28,1.025,.02,'needle-holder',0,.66);
  // Small sterile bowls and folded gauze packs are kept in a separate tray zone.
  const bowlMat=new Ut({color:15856113,metalness:.72,roughness:.2});
  jn(trolley,new Ii(.075,.075,.018,32),bowlMat,[.43,1.018,-.18],!1);
  jn(trolley,new Ii(.061,.061,.012,32),new Ut({color:14211288,metalness:.24,roughness:.26}),[.43,1.03,-.18],!1);
  vt(trolley,[.13,.028,.085],[-.39,1.02,.19],new Ut({color:15199445,roughness:.88}),.008,!1);
  vt(trolley,[.13,.028,.085],[-.39,1.02,.08],new Ut({color:15199445,roughness:.88}),.008,!1);
  // Mayo stand: smaller active-use set, positioned close to the surgeon.
  const mayo=new Mt; scene.add(mayo); mayo.position.set(-.92,.02,.52); mayo.rotation.y=-.18;
  vt(mayo,[.5,.035,.38],[0,1.0,0],traySteel,.018);
  vt(mayo,[.44,.012,.32],[0,.976,.002],sterileDrape,.008,!1);
  // Raised rim keeps the sterile instruments on the tray.
  ll(mayo,[-.24,1.025,-.17],[.24,1.025,-.17],.009,trayEdge);
  ll(mayo,[-.24,1.025,.17],[.24,1.025,.17],.009,trayEdge);
  ll(mayo,[-.24,1.025,-.17],[-.24,1.025,.17],.009,trayEdge);
  ll(mayo,[.24,1.025,-.17],[.24,1.025,.17],.009,trayEdge);
  ll(mayo,[0,.03,0],[0,.94,0],.022,steelDark);
  ll(mayo,[0,.55,0],[0,.98,0],.027,steel);
  vt(mayo,[.16,.07,.12],[0,.06,0],steel,.025);
  for(let a=0;a<3;a++){
    const ang=a*Math.PI*2/3;
    const ex=Math.cos(ang)*.27,ez=Math.sin(ang)*.22;
    ll(mayo,[0,.12,0],[ex,.065,ez],.018,steelDark);
    const caster=jn(mayo,new Ii(.035,.035,.026,18),rubber,[ex,.045,ez]);caster.rotation.z=Math.PI/2;
    const hub=jn(mayo,new Ii(.014,.014,.03,16),steel,[ex,.045,ez]);hub.rotation.z=Math.PI/2;
  }
  vt(mayo,[.09,.12,.07],[.06,.6,.02],darkCase,.012,!1);
  jn(mayo,new Ii(.025,.025,.035,16),steel,[.12,.6,.02]);
  ringInstrument(mayo,-.015,1.012,.105,'hemostat',0,.55);
  ringInstrument(mayo,-.015,1.012,.015,'scissors',0,.55);
  tissueForceps(mayo,-.015,1.012,-.09,0,.55);
  scalpel(mayo,.13,1.012,.0,0,.48);

  // Compact waste/sharps station at the perimeter, outside sterile tables and access lane.
  const waste=new Mt; scene.add(waste); waste.position.set(2.95,.02,3.05);
  const binMat=new Ut({color:14803425,roughness:.72,metalness:.04});
  vt(waste,[.28,.42,.28],[0,.22,0],binMat,.025);
  vt(waste,[.3,.045,.3],[0,.45,0],darkCase,.012);
  vt(waste,[.16,.1,.16],[.2,.06,-.02],new Ut({color:15397875,roughness:.4}),.012);

  // Subtle floor circulation reference, intentionally low-contrast and not a game-like path.
  const floorGuide=Aa(14671839,.9);
  vt(scene,[.018,.002,2.9],[3.22,.002,1.5],floorGuide,0,!1);
  vt(scene,[.018,.002,2.9],[-3.22,.002,1.5],floorGuide,0,!1);

  const grid=new xr(6,24,4492167,7972771); grid.position.y=.004; grid.material.transparent=!0; grid.material.opacity=.18; grid.visible=!1; scene.add(grid);
  // Load embedded, project-created GLB assets. Keep the procedural models as fallbacks if any asset fails.
  async function loadEmbeddedAsset(id){
    const el=document.getElementById(id);
    const assetPaths={
      'asset-operating-table-base':'./assets/operating-table/base.glb',
      'asset-operating-table-top':'./assets/operating-table/top.glb',
      'asset-surgical-light-pendant-system':'./assets/surgical-system/light-pendant-system.glb',
      'asset-anesthesia-workstation':'./assets/anesthesia/workstation.glb'
    };
    let gltf;
    if(el){
      const raw=atob(el.textContent.trim()),bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      gltf=await new Ra().parseAsync(bytes.buffer,'');
      el.remove();
    }else{
      const path=assetPaths[id];
      if(!path)throw new Error('No external path configured for asset: '+id);
      gltf=await new Ra().loadAsync(path);
    }
    gltf.scene.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;obj.frustumCulled=false;}});
    return gltf.scene;
  }
  let activeCeilingFixtures=fixtures,activePendants=pendants;
  try{
    const [baseAsset,topAsset]=await Promise.all([
      loadEmbeddedAsset('asset-operating-table-base'),
      loadEmbeddedAsset('asset-operating-table-top')
    ]);
    baseAsset.name='Nabd_Operating_Table_Base_GLTF';
    topAsset.name='Nabd_Operating_Table_Top_GLTF';
    topAsset.position.y=Un.high;
    assetTableTop=topAsset;
    scene.add(baseAsset);scene.add(topAsset);
    table.visible=false;
    assetStatus.operatingTable=true;
  }catch(err){console.warn('Nabd operating table GLB fallback active.',err);}
  try{
    const lightAsset=await loadEmbeddedAsset('asset-surgical-light-pendant-system');
    lightAsset.name='Nabd_Surgical_Light_and_Pendant_System_GLTF';
    scene.add(lightAsset);
    fixtures.visible=false;pendants.visible=false;
    // F26: the two lamp task lights were children of the procedural heads, so hiding `fixtures` switched them
    // off. Keep the same lights (spot cones aimed at the work point) at the GLB lamp faces.
    lightAsset.updateMatrixWorld(true);
    focusSpotLights.forEach((spot,i)=>{
      const face=lightAsset.getObjectByName('light_'+i+'_diffuser');
      if(face)face.getWorldPosition(spot.position);else spot.getWorldPosition(spot.position);
      scene.add(spot);
    });
    activeCeilingFixtures=lightAsset;activePendants=lightAsset;
    assetStatus.surgicalLightsAndPendant=true;
  }catch(err){console.warn('Nabd surgical light / pendant GLB fallback active.',err);}
  try{
    const anesthesiaAsset=await loadEmbeddedAsset('asset-anesthesia-workstation');
    anesthesiaAsset.name='Nabd_Anesthesia_Workstation_GLTF';
    anesthesiaAsset.position.set(-1.42,.02,-1.52);
    anesthesiaAsset.rotation.y=.12;
    const displayNode=anesthesiaAsset.getObjectByName('anesthesia_screen_glass');
    if(displayNode&&displayNode.isMesh){
      const tex=screenTexture('anesthesia');
      const displayMat=new Ut({map:tex,emissive:16777215,emissiveMap:tex,emissiveIntensity:.42,roughness:.15,metalness:.02});
      displayMat.toneMapped=false;displayNode.material=displayMat;
    }
    scene.add(anesthesiaAsset);
    anesthesia.visible=false;
    assetStatus.anesthesiaWorkstation=true;
  }catch(err){console.warn('Nabd anesthesia workstation GLB fallback active.',err);}
  return setDeckHeight(Un.high),{grid,ceilingFixtures:activeCeilingFixtures,ceilingShell,pendants:activePendants,setDeckHeight,assetStatus,vitalScreen,mayo,focusLightTarget,focusSpotLights,fieldDisplays,endoscopyScreens:[endoscopyScreenPrimary,endoscopyScreenSecondary]};
}

function ul(s,e){if(e===Uc)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===As||e===wr){let t=s.getIndex();if(t===null){let o=[],a=s.getAttribute("position");if(a!==void 0){for(let l=0;l<a.count;l++)o.push(l);s.setIndex(o),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}let n=t.count-2,i=[];if(e===As)for(let o=1;o<=n;o++)i.push(t.getX(0)),i.push(t.getX(o)),i.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(t.getX(o)),i.push(t.getX(o+1)),i.push(t.getX(o+2))):(i.push(t.getX(o+2)),i.push(t.getX(o+1)),i.push(t.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=s.clone();return r.setIndex(i),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}var Ra=class extends Ln{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new xl(t)}),this.register(function(t){return new yl(t)}),this.register(function(t){return new Rl(t)}),this.register(function(t){return new Cl(t)}),this.register(function(t){return new Il(t)}),this.register(function(t){return new Ml(t)}),this.register(function(t){return new Sl(t)}),this.register(function(t){return new bl(t)}),this.register(function(t){return new El(t)}),this.register(function(t){return new _l(t)}),this.register(function(t){return new Tl(t)}),this.register(function(t){return new vl(t)}),this.register(function(t){return new Al(t)}),this.register(function(t){return new wl(t)}),this.register(function(t){return new ml(t)}),this.register(function(t){return new Pl(t)}),this.register(function(t){return new Ll(t)})}load(e,t,n,i){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let c=Zn.extractUrlBase(e);o=Zn.resolveURL(c,this.path)}else o=Zn.extractUrlBase(e);this.manager.itemStart(e);let a=function(c){i?i(c):console.error(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new ys(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,o,function(u){t(u),r.manager.itemEnd(e)},a)}catch(u){a(u)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r,o={},a={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===ad){try{o[Xe.KHR_BINARY_GLTF]=new Dl(e)}catch(h){i&&i(h);return}r=JSON.parse(o[Xe.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new kl(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){let h=this.pluginCallbacks[u](c);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[h.name]=h,o[h.name]=!0}if(r.extensionsUsed)for(let u=0;u<r.extensionsUsed.length;++u){let h=r.extensionsUsed[u],d=r.extensionsRequired||[];switch(h){case Xe.KHR_MATERIALS_UNLIT:o[h]=new gl;break;case Xe.KHR_DRACO_MESH_COMPRESSION:o[h]=new Nl(r,this.dracoLoader);break;case Xe.KHR_TEXTURE_TRANSFORM:o[h]=new Ul;break;case Xe.KHR_MESH_QUANTIZATION:o[h]=new Fl;break;default:d.indexOf(h)>=0&&a[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}c.setExtensions(o),c.setPlugins(a),c.parse(n,i)}parseAsync(e,t){let n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}};function d0(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}var Xe={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},ml=class{constructor(e){this.parser=e,this.name=Xe.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,i=t.cache.get(n);if(i)return i;let r=t.json,l=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],c,u=new Ce(16777215);l.color!==void 0&&u.setRGB(l.color[0],l.color[1],l.color[2],It);let h=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new li(u),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new mr(u),c.distance=h;break;case"spot":c=new pr(u),c.distance=h,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Fn(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return n._getNodeRef(t.cache,a,l)})}},gl=class{constructor(){this.name=Xe.KHR_MATERIALS_UNLIT}getMaterialType(){return Qt}extendParams(e,t,n){let i=[];e.color=new Ce(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],It),e.opacity=o[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,ut))}return Promise.all(i)}},_l=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},xl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Ie(a,a)}return Promise.all(r)}},yl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_DISPERSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},vl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},Ml=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SHEEN}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new Ce(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=i.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],It)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,ut)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},Sl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},bl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_VOLUME}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ce().setRGB(a[0],a[1],a[2],It),Promise.all(r)}},El=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_IOR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},Tl=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_SPECULAR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new Ce().setRGB(a[0],a[1],a[2],It),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,ut)),Promise.all(r)}},wl=class{constructor(e){this.parser=e,this.name=Xe.EXT_MATERIALS_BUMP}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},Al=class{constructor(e){this.parser=e,this.name=Xe.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:qt}extendMaterialParams(e,t){let n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=[],o=i.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},Rl=class{constructor(e){this.parser=e,this.name=Xe.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let r=i.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},Cl=class{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],l=n.textureLoader;if(a.uri){let c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(e,o.source,l)}},Il=class{constructor(e){this.parser=e,this.name=Xe.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=i.images[o.source],l=n.textureLoader;if(a.uri){let c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(e,o.source,l)}},Pl=class{constructor(e){this.name=Xe.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let l=i.byteOffset||0,c=i.byteLength||0,u=i.count,h=i.byteStride,d=new Uint8Array(a,l,c);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(u,h,d,i.mode,i.filter).then(function(p){return p.buffer}):o.ready.then(function(){let p=new ArrayBuffer(u*h);return o.decodeGltfBuffer(new Uint8Array(p),u,h,d,i.mode,i.filter),p})})}else return null}},Ll=class{constructor(e){this.name=Xe.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let i=t.meshes[n.mesh];for(let c of i.primitives)if(c.mode!==cn.TRIANGLES&&c.mode!==cn.TRIANGLE_STRIP&&c.mode!==cn.TRIANGLE_FAN&&c.mode!==void 0)return null;let o=n.extensions[this.name].attributes,a=[],l={};for(let c in o)a.push(this.parser.getDependency("accessor",o[c]).then(u=>(l[c]=u,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(c=>{let u=c.pop(),h=u.isGroup?u.children:[u],d=c[0].count,p=[];for(let g of h){let _=new ze,m=new L,f=new tt,b=new L(1,1,1),E=new nr(g.geometry,g.material,d);for(let v=0;v<d;v++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,v),l.ROTATION&&f.fromBufferAttribute(l.ROTATION,v),l.SCALE&&b.fromBufferAttribute(l.SCALE,v),E.setMatrixAt(v,_.compose(m,f,b));for(let v in l)if(v==="_COLOR_0"){let C=l[v];E.instanceColor=new ci(C.array,C.itemSize,C.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&g.geometry.setAttribute(v,l[v]);ct.prototype.copy.call(E,g),this.parser.assignFinalMaterial(E),p.push(E)}return u.isGroup?(u.clear(),u.add(...p),u):p[0]}))}},ad="glTF",Ir=12,id={JSON:1313821514,BIN:5130562},Dl=class{constructor(e){this.name=Xe.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Ir),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==ad)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-Ir,r=new DataView(e,Ir),o=0;for(;o<i;){let a=r.getUint32(o,!0);o+=4;let l=r.getUint32(o,!0);if(o+=4,l===id.JSON){let c=new Uint8Array(e,Ir+o,a);this.content=n.decode(c)}else if(l===id.BIN){let c=Ir+o;this.body=e.slice(c,c+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},Nl=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Xe.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},l={},c={};for(let u in o){let h=Bl[u]||u.toLowerCase();a[h]=o[u]}for(let u in e.attributes){let h=Bl[u]||u.toLowerCase();if(o[u]!==void 0){let d=n.accessors[e.attributes[u]],p=Ls[d.componentType];c[h]=p.name,l[h]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(u){return new Promise(function(h,d){i.decodeDracoFile(u,function(p){for(let g in p.attributes){let _=p.attributes[g],m=l[g];m!==void 0&&(_.normalized=m)}h(p)},a,c,It,d)})})}},Ul=class{constructor(){this.name=Xe.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},Fl=class{constructor(){this.name=Xe.KHR_MESH_QUANTIZATION}},Ca=class extends Xn{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let o=0;o!==i;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,u=i-t,h=(n-t)/u,d=h*h,p=d*h,g=e*c,_=g-c,m=-2*p+3*d,f=p-d,b=1-m,E=f-d+h;for(let v=0;v!==a;v++){let C=o[_+v+a],R=o[_+v+l]*u,I=o[g+v+a],D=o[g+v]*u;r[v]=b*C+E*R+m*I+f*D}return r}},f0=new tt,Ol=class extends Ca{interpolate_(e,t,n,i){let r=super.interpolate_(e,t,n,i);return f0.fromArray(r).normalize().toArray(r),r}},cn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Ls={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},sd={9728:Rt,9729:Ct,9984:Uo,9985:Ms,9986:Ui,9987:yn},rd={33071:bn,33648:os,10497:gn},dl={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Bl={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},fi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},p0={CUBICSPLINE:void 0,LINEAR:Ti,STEP:Ei},fl={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function m0(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new Ut({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:mn})),s.DefaultMaterial}function Vi(s,e,t){for(let n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Fn(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function g0(s,e,t){let n=!1,i=!1,r=!1;for(let c=0,u=e.length;c<u;c++){let h=e[c];if(h.POSITION!==void 0&&(n=!0),h.NORMAL!==void 0&&(i=!0),h.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);let o=[],a=[],l=[];for(let c=0,u=e.length;c<u;c++){let h=e[c];if(n){let d=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):s.attributes.position;o.push(d)}if(i){let d=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):s.attributes.normal;a.push(d)}if(r){let d=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):s.attributes.color;l.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l)]).then(function(c){let u=c[0],h=c[1],d=c[2];return n&&(s.morphAttributes.position=u),i&&(s.morphAttributes.normal=h),r&&(s.morphAttributes.color=d),s.morphTargetsRelative=!0,s})}function _0(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function x0(s){let e,t=s.extensions&&s.extensions[Xe.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+pl(t.attributes):e=s.indices+":"+pl(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+pl(s.targets[n]);return e}function pl(s){let e="",t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function zl(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function y0(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":s.search(/\.ktx2($|\?)/i)>0||s.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var v0=new ze,kl=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new d0,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;let l=a.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&o<98?this.textureLoader=new ur(this.options.manager):this.textureLoader=new gr(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ys(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){let a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return Vi(r,a,i),Fn(a,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(let l of a.scenes)l.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){let o=t[i].joints;for(let a=0,l=o.length;a<l;a++)e[o[a]].isBone=!0}for(let i=0,r=e.length;i<r;i++){let o=e[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let i=n.clone(),r=(o,a)=>{let l=this.associations.get(o);l!=null&&this.associations.set(a,l);for(let[c,u]of o.children.entries())r(u,a.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let i=e(t[n]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let i=0;i<t.length;i++){let r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Xe.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(r,o){n.load(Zn.resolveURL(t.uri,i.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){let t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let o=dl[i.type],a=Ls[i.componentType],l=i.normalized===!0,c=new a(i.count*o);return Promise.resolve(new yt(c,o,l))}let r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],l=dl[i.type],c=Ls[i.componentType],u=c.BYTES_PER_ELEMENT,h=u*l,d=i.byteOffset||0,p=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,g=i.normalized===!0,_,m;if(p&&p!==h){let f=Math.floor(d/p),b="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+f+":"+i.count,E=t.cache.get(b);E||(_=new c(a,f*p,i.count*p/u),E=new fs(_,p/u),t.cache.add(b,E)),m=new ps(E,l,d%p/u,g)}else a===null?_=new c(i.count*l):_=new c(a,d,i.count*l),m=new yt(_,l,g);if(i.sparse!==void 0){let f=dl.SCALAR,b=Ls[i.sparse.indices.componentType],E=i.sparse.indices.byteOffset||0,v=i.sparse.values.byteOffset||0,C=new b(o[1],E,i.sparse.count*f),R=new c(o[2],v,i.sparse.count*l);a!==null&&(m=new yt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let I=0,D=C.length;I<D;I++){let S=C[I];if(m.setX(S,R[I*l]),l>=2&&m.setY(S,R[I*l+1]),l>=3&&m.setZ(S,R[I*l+2]),l>=4&&m.setW(S,R[I*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let l=n.manager.getHandler(o.uri);l!==null&&(a=l)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let i=this,r=this.json,o=r.textures[e],a=r.images[t],l=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,n).then(function(u){u.flipY=!1,u.name=o.name||a.name||"",u.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(u.name=a.uri);let d=(r.samplers||{})[o.sampler]||{};return u.magFilter=sd[d.magFilter]||Ct,u.minFilter=sd[d.minFilter]||yn,u.wrapS=rd[d.wrapS]||gn,u.wrapT=rd[d.wrapT]||gn,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==Rt&&u.minFilter!==Ct,i.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());let o=i.images[e],a=self.URL||self.webkitURL,l=o.uri||"",c=!1;if(o.bufferView!==void 0)l=n.getDependency("bufferView",o.bufferView).then(function(h){c=!0;let d=new Blob([h],{type:o.mimeType});return l=a.createObjectURL(d),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let u=Promise.resolve(l).then(function(h){return new Promise(function(d,p){let g=d;t.isImageBitmapLoader===!0&&(g=function(_){let m=new St(_);m.needsUpdate=!0,d(m)}),t.load(Zn.resolveURL(h,r.path),g,void 0,p)})}).then(function(h){return c===!0&&a.revokeObjectURL(l),Fn(h,o),h.userData.mimeType=o.mimeType||y0(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),h});return this.sourceCache[e]=u,u}assignTexture(e,t,n,i){let r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[Xe.KHR_TEXTURE_TRANSFORM]){let a=n.extensions!==void 0?n.extensions[Xe.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let l=r.associations.get(o);o=r.extensions[Xe.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,l)}}return i!==void 0&&(o.colorSpace=i),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,n=e.material,i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+n.uuid,l=this.cache.get(a);l||(l=new xs,Xt.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(a,l)),n=l}else if(e.isLine){let a="LineBasicMaterial:"+n.uuid,l=this.cache.get(a);l||(l=new Ri,Xt.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(a,l)),n=l}if(i||r||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=n.clone(),r&&(l.vertexColors=!0),o&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return Ut}loadMaterial(e){let t=this,n=this.json,i=this.extensions,r=n.materials[e],o,a={},l=r.extensions||{},c=[];if(l[Xe.KHR_MATERIALS_UNLIT]){let h=i[Xe.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),c.push(h.extendParams(a,r,t))}else{let h=r.pbrMetallicRoughness||{};if(a.color=new Ce(1,1,1),a.opacity=1,Array.isArray(h.baseColorFactor)){let d=h.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],It),a.opacity=d[3]}h.baseColorTexture!==void 0&&c.push(t.assignTexture(a,"map",h.baseColorTexture,ut)),a.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,a.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(a,"metalnessMap",h.metallicRoughnessTexture)),c.push(t.assignTexture(a,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=rn);let u=r.alphaMode||fl.OPAQUE;if(u===fl.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,u===fl.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==Qt&&(c.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new Ie(1,1),r.normalTexture.scale!==void 0)){let h=r.normalTexture.scale;a.normalScale.set(h,h)}if(r.occlusionTexture!==void 0&&o!==Qt&&(c.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==Qt){let h=r.emissiveFactor;a.emissive=new Ce().setRGB(h[0],h[1],h[2],It)}return r.emissiveTexture!==void 0&&o!==Qt&&c.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,ut)),Promise.all(c).then(function(){let h=new o(a);return r.name&&(h.name=r.name),Fn(h,r),t.associations.set(h,{materials:e}),r.extensions&&Vi(i,h,r),h})}createUniqueName(e){let t=je.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,i=this.primitiveCache;function r(a){return n[Xe.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(l){return od(l,a,t)})}let o=[];for(let a=0,l=e.length;a<l;a++){let c=e[a],u=x0(c),h=i[u];if(h)o.push(h.promise);else{let d;c.extensions&&c.extensions[Xe.KHR_DRACO_MESH_COMPRESSION]?d=r(c):d=od(new Nt,c,t),i[u]={primitive:c,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){let t=this,n=this.json,i=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let l=0,c=o.length;l<c;l++){let u=o[l].material===void 0?m0(this.cache):this.getDependency("material",o[l].material);a.push(u)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(l){let c=l.slice(0,l.length-1),u=l[l.length-1],h=[];for(let p=0,g=u.length;p<g;p++){let _=u[p],m=o[p],f,b=c[p];if(m.mode===cn.TRIANGLES||m.mode===cn.TRIANGLE_STRIP||m.mode===cn.TRIANGLE_FAN||m.mode===void 0)f=r.isSkinnedMesh===!0?new er(_,b):new gt(_,b),f.isSkinnedMesh===!0&&f.normalizeSkinWeights(),m.mode===cn.TRIANGLE_STRIP?f.geometry=ul(f.geometry,wr):m.mode===cn.TRIANGLE_FAN&&(f.geometry=ul(f.geometry,As));else if(m.mode===cn.LINES)f=new _s(_,b);else if(m.mode===cn.LINE_STRIP)f=new Ci(_,b);else if(m.mode===cn.LINE_LOOP)f=new ir(_,b);else if(m.mode===cn.POINTS)f=new sr(_,b);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(f.geometry.morphAttributes).length>0&&_0(f,r),f.name=t.createUniqueName(r.name||"mesh_"+e),Fn(f,r),m.extensions&&Vi(i,f,m),t.assignFinalMaterial(f),h.push(f)}for(let p=0,g=h.length;p<g;p++)t.associations.set(h[p],{meshes:e,primitives:p});if(h.length===1)return r.extensions&&Vi(i,h[0],r),h[0];let d=new Mt;r.extensions&&Vi(i,d,r),t.associations.set(d,{meshes:e});for(let p=0,g=h.length;p<g;p++)d.add(h[p]);return d})}loadCamera(e){let t,n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new xt(Pt.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new Li(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Fn(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){let r=i.pop(),o=i,a=[],l=[];for(let c=0,u=o.length;c<u;c++){let h=o[c];if(h){a.push(h);let d=new ze;r!==null&&d.fromArray(r.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new tr(a,l)})}loadAnimation(e){let t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,o=[],a=[],l=[],c=[],u=[];for(let h=0,d=i.channels.length;h<d;h++){let p=i.channels[h],g=i.samplers[p.sampler],_=p.target,m=_.node,f=i.parameters!==void 0?i.parameters[g.input]:g.input,b=i.parameters!==void 0?i.parameters[g.output]:g.output;_.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",f)),l.push(this.getDependency("accessor",b)),c.push(g),u.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(u)]).then(function(h){let d=h[0],p=h[1],g=h[2],_=h[3],m=h[4],f=[];for(let E=0,v=d.length;E<v;E++){let C=d[E],R=p[E],I=g[E],D=_[E],S=m[E];if(C===void 0)continue;C.updateMatrix&&C.updateMatrix();let x=n._createAnimationTracks(C,R,I,D,S);if(x)for(let w=0;w<x.length;w++)f.push(x[w])}let b=new hr(r,void 0,f);return Fn(b,i),b})}createNodeMesh(e){let t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){let o=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let l=0,c=i.weights.length;l<c;l++)a.morphTargetInfluences[l]=i.weights[l]}),o})}loadNode(e){let t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=i.children||[];for(let c=0,u=a.length;c<u;c++)o.push(n.getDependency("node",a[c]));let l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(o),l]).then(function(c){let u=c[0],h=c[1],d=c[2];d!==null&&u.traverse(function(p){p.isSkinnedMesh&&p.bind(d,v0)});for(let p=0,g=h.length;p<g;p++)u.add(h[p]);return u})}_loadNodeShallow(e){let t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?i.createUniqueName(r.name):"",a=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&a.push(l),r.camera!==void 0&&a.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){a.push(c)}),this.nodeCache[e]=Promise.all(a).then(function(c){let u;if(r.isBone===!0?u=new ms:c.length>1?u=new Mt:c.length===1?u=c[0]:u=new ct,u!==c[0])for(let h=0,d=c.length;h<d;h++)u.add(c[h]);if(r.name&&(u.userData.name=r.name,u.name=o),Fn(u,r),r.extensions&&Vi(n,u,r),r.matrix!==void 0){let h=new ze;h.fromArray(r.matrix),u.applyMatrix4(h)}else r.translation!==void 0&&u.position.fromArray(r.translation),r.rotation!==void 0&&u.quaternion.fromArray(r.rotation),r.scale!==void 0&&u.scale.fromArray(r.scale);if(!i.associations.has(u))i.associations.set(u,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){let h=i.associations.get(u);i.associations.set(u,{...h})}return i.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],i=this,r=new Mt;n.name&&(r.name=i.createUniqueName(n.name)),Fn(r,n),n.extensions&&Vi(t,r,n);let o=n.nodes||[],a=[];for(let l=0,c=o.length;l<c;l++)a.push(i.getDependency("node",o[l]));return Promise.all(a).then(function(l){for(let u=0,h=l.length;u<h;u++)r.add(l[u]);let c=u=>{let h=new Map;for(let[d,p]of i.associations)(d instanceof Xt||d instanceof St)&&h.set(d,p);return u.traverse(d=>{let p=i.associations.get(d);p!=null&&h.set(d,p)}),h};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){let o=[],a=e.name?e.name:e.uuid,l=[];fi[r.path]===fi.weights?e.traverse(function(d){d.morphTargetInfluences&&l.push(d.name?d.name:d.uuid)}):l.push(a);let c;switch(fi[r.path]){case fi.weights:c=Cn;break;case fi.rotation:c=In;break;case fi.translation:case fi.scale:c=Pn;break;default:switch(n.itemSize){case 1:c=Cn;break;case 2:case 3:default:c=Pn;break}break}let u=i.interpolation!==void 0?p0[i.interpolation]:Ti,h=this._getArrayFromAccessor(n);for(let d=0,p=l.length;d<p;d++){let g=new c(l[d]+"."+fi[r.path],t.array,h,u);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),o.push(g)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=zl(t.constructor),i=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let i=this instanceof In?Ol:Ca;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function M0(s,e,t){let n=e.attributes,i=new zt;if(n.POSITION!==void 0){let a=t.json.accessors[n.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(i.set(new L(l[0],l[1],l[2]),new L(c[0],c[1],c[2])),a.normalized){let u=zl(Ls[a.componentType]);i.min.multiplyScalar(u),i.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new L,l=new L;for(let c=0,u=r.length;c<u;c++){let h=r[c];if(h.POSITION!==void 0){let d=t.json.accessors[h.POSITION],p=d.min,g=d.max;if(p!==void 0&&g!==void 0){if(l.setX(Math.max(Math.abs(p[0]),Math.abs(g[0]))),l.setY(Math.max(Math.abs(p[1]),Math.abs(g[1]))),l.setZ(Math.max(Math.abs(p[2]),Math.abs(g[2]))),d.normalized){let _=zl(Ls[d.componentType]);l.multiplyScalar(_)}a.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}s.boundingBox=i;let o=new Gt;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=o}function od(s,e,t){let n=e.attributes,i=[];function r(o,a){return t.getDependency("accessor",o).then(function(l){s.setAttribute(a,l)})}for(let o in n){let a=Bl[o]||o.toLowerCase();a in s.attributes||i.push(r(n[o],a))}if(e.indices!==void 0&&!s.index){let o=t.getDependency("accessor",e.indices).then(function(a){s.setIndex(a)});i.push(o)}return Ye.workingColorSpace!==It&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Ye.workingColorSpace}" not supported.`),Fn(s,e),M0(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?g0(s,e.targets,t):s})}var Qn=(...s)=>new L(...s),cd=s=>s.getWorldPosition(Qn()),Ia=s=>s.getWorldQuaternion(new tt),ld=s=>Qn(...s).normalize(),Ds=(s,e,t=.025)=>Qn(s,e,t),Pr={supine:{position:Ds(0,.936),pitch:-Math.PI/2,yaw:0,deck:Un.high,upperArm:[.3,-1,-.12],lowerArm:[.1,-1,-.04],thigh:[.07,-1,-.008],shin:[.05,-1,-.037]},rise:{position:Ds(.1,.995),pitch:-.68,yaw:.24,deck:.83,upperArm:[.39,-1,-.18],lowerArm:[.18,-.58,.59],thigh:[.2,-.57,.79],shin:[.08,-.52,.85]},turn:{position:Ds(.37,.804),pitch:-.07,yaw:1.36,deck:.69,upperArm:[.38,-1,.1],lowerArm:[.02,-.9,.56],thigh:[.09,-.25,1],shin:[.04,-.97,.29]},sitting:{position:Ds(.398,.694),pitch:0,yaw:Math.PI/2,deck:Un.low,upperArm:[.25,-1,.12],lowerArm:[.02,-.67,.75],thigh:[.09,-.17,1],shin:[.04,-1,.08]},lean:{position:Ds(.61,.882),pitch:.29,yaw:Math.PI/2,deck:Un.low,upperArm:[.28,-1,.21],lowerArm:[.03,-.72,.58],thigh:[.09,-.34,1],shin:[.04,-1,-.14]},standing:{position:Ds(1.02,1.062),pitch:0,yaw:Math.PI/2,deck:Un.low,upperArm:[.23,-1,.025],lowerArm:[.06,-1,.06],thigh:[.069,-1,.058],shin:[.049,-1,-.018]}},pi=["supine","rise","turn","sitting","lean","standing"],S0={supine:{sitting:["rise","turn","sitting"],standing:["rise","turn","sitting","lean","standing"]},sitting:{supine:["turn","rise","supine"],standing:["lean","standing"]},standing:{supine:["lean","sitting","turn","rise","supine"],sitting:["lean","sitting"]}};async function hd(s,e){let t=new Ra,n=await(e instanceof ArrayBuffer?t.parseAsync(e,""):t.loadAsync(e)),i=new Mt;i.name="VirtualPatient",i.add(n.scene),s.add(i);let r=new Map,o=[];n.scene.traverse(x=>{x.isBone&&r.set(x.name,x),x.isSkinnedMesh&&(o.push(x),x.castShadow=x.receiveShadow=!0,x.frustumCulled=!1)});function a(x){let w=r.get(x)??r.get(je.sanitizeNodeName(x));if(!w)throw new Error(`Patient skeleton is missing ${x}.`);return w}let l=a("root");n.scene.position.copy(cd(l)).negate(),i.updateMatrixWorld(!0);function c(x,w,A){let F=(x==="arm"?["upperarm01","lowerarm01","wrist"]:["upperleg01","lowerleg01","foot"]).map(H=>a(`${H}.${w}`)),G=F.map(cd),V=[G[1].clone().sub(G[0]).normalize(),G[2].clone().sub(G[1]).normalize()],$=F.map(Ia);return{id:(A===1?"left":"right")+(x==="arm"?"Arm":"Leg"),kind:x,side:A,joints:F,restDirections:V,restRotations:$}}let u=[c("arm","L",1),c("arm","R",-1),c("leg","L",1),c("leg","R",-1)],h=u.flatMap(({joints:x})=>x),d=a("neck01"),p=d.quaternion.clone();h.push(d);function g(x,w){let A=i.quaternion.clone().multiply(w);x.quaternion.copy(Ia(x.parent).invert().multiply(A)).normalize(),x.updateWorldMatrix(!1,!0)}function _(x,w){let{kind:A,side:U,joints:F,restDirections:G,restRotations:V}=x,$=A==="arm"?[w.upperArm,w.lowerArm]:[w.thigh,w.shin],H;for(let me=0;me<2;me++){let[Ae,W,Z]=$[me],oe=me===0?G[me]:G[me].clone().applyQuaternion(H),Te=ld([Ae*U,W,Z]),pe=new tt().setFromUnitVectors(oe,Te);H=me===0?pe:pe.multiply(H),g(F[me],H.clone().multiply(V[me]))}let ee=new tt().setFromAxisAngle(ld([$[1][0]*U,$[1][1],$[1][2]]),U*.19),k=w===Pr.supine?.15:w===Pr.lean?-w.pitch:0,J=w===Pr.supine?U*.13:0,le=new tt().setFromEuler(new Wt(k,J,0,"YXZ")),de=A==="arm"?ee.multiply(H).multiply(V[2]):le.multiply(V[2]);g(F[2],de)}function m(x){i.position.copy(x.position),i.quaternion.setFromEuler(new Wt(x.pitch,x.yaw,0,"YXZ")),d.quaternion.copy(p),x===Pr.supine&&d.quaternion.multiply(new tt().setFromAxisAngle(Qn(1,0,0),-.05)),i.updateMatrixWorld(!0),u.forEach(w=>_(w,x))}function f(x){return{position:i.position.clone(),rotation:i.quaternion.clone(),joints:h.map(w=>w.quaternion.clone()),deck:x}}let b=Object.fromEntries(Object.entries(Pr).map(([x,w])=>(m(w),[x,f(w.deck)]))),E=new Map,v=Qn();for(let x of o){let w=x.geometry.getAttribute("position");for(let A=0;A<w.count;A++){if(x.getVertexPosition(A,v).applyMatrix4(x.matrixWorld),v.y>.056)continue;let U=`${Math.floor(v.x/.027)},${Math.floor(v.z/.026)}`;v.y<(E.get(U)?.y??1/0)&&E.set(U,{skin:x,i:A,y:v.y})}}let C=[...E.values()];function R(x,w,A){i.position.lerpVectors(x.position,w.position,A),i.quaternion.slerpQuaternions(x.rotation,w.rotation,A),h.forEach((F,G)=>F.quaternion.slerpQuaternions(x.joints[G],w.joints[G],A)),i.updateMatrixWorld(!0);let U=0;for(let{skin:F,i:G}of C)F.getVertexPosition(G,v).applyMatrix4(F.matrixWorld),U=Math.max(U,-v.y);return U>0&&(i.position.y+=U,i.updateMatrixWorld(!0)),Pt.lerp(x.deck,w.deck,A)}R(b.supine,b.supine,1);function I(x,w,A){let U=x.joints[0],F=i.quaternion.clone().invert().multiply(Ia(U.parent)),V=(w==="sitting"&&x.kind==="leg"?Qn(0,1,0):Qn(0,0,1)).applyQuaternion(F.invert()).normalize(),$=new tt().setFromAxisAngle(V,Pt.degToRad(A*x.side)),H=b[w].joints[h.indexOf(U)];U.quaternion.copy($.multiply(H)).normalize(),i.updateMatrixWorld(!0)}function D(x,w){let A=x.joints[0],U=b[w].joints[h.indexOf(A)],F=A.quaternion.clone().multiply(U.clone().invert()).normalize(),G=i.quaternion.clone().invert().multiply(Ia(A.parent)),V=w==="sitting"&&x.kind==="leg"?Qn(0,1,0):Qn(0,0,1);V.applyQuaternion(G.invert()).normalize();let $=2*Math.atan2(F.x*V.x+F.y*V.y+F.z*V.z,F.w),H=Pt.radToDeg($);return Math.round(Pt.euclideanModulo(H+180,360)-180)*x.side}function S(){let x=new zt;for(let w of o)w.computeBoundingBox(),x.union(w.boundingBox.clone().applyMatrix4(w.matrixWorld));return{min:x.min.toArray(),max:x.max.toArray()}}const patientHandStates={left:0,right:0};
const patientHandBones={
  left:{
    thumb:["finger1-1.L","finger1-2.L","finger1-3.L"],
    index:["finger2-1.L","finger2-2.L","finger2-3.L"],
    middle:["finger3-1.L","finger3-2.L","finger3-3.L"],
    ring:["finger4-1.L","finger4-2.L","finger4-3.L"],
    little:["finger5-1.L","finger5-2.L","finger5-3.L"]
  },
  right:{
    thumb:["finger1-1.R","finger1-2.R","finger1-3.R"],
    index:["finger2-1.R","finger2-2.R","finger2-3.R"],
    middle:["finger3-1.R","finger3-2.R","finger3-3.R"],
    ring:["finger4-1.R","finger4-2.R","finger4-3.R"],
    little:["finger5-1.R","finger5-2.R","finger5-3.R"]
  }
};
const patientHandRest={left:{},right:{}};
for(const side of ["left","right"]){
  for(const [digit,names] of Object.entries(patientHandBones[side])){
    patientHandRest[side][digit]=names.map(name=>({bone:a(name),rest:a(name).quaternion.clone()}));
  }
}
const patientFingerFlexion={
  thumb:[.42,.62,.48],
  index:[.58,.86,.68],
  middle:[.62,.94,.72],
  ring:[.65,.98,.76],
  little:[.68,1.00,.79]
};
function setHandCurl(side,value){
  if(!patientHandStates.hasOwnProperty(side))return;
  const amount=Pt.clamp(Number(value)||0,0,1);
  patientHandStates[side]=amount;
  for(const [digit,records] of Object.entries(patientHandRest[side])){
    const angles=patientFingerFlexion[digit];
    for(let index=0;index<records.length;index++){
      const record=records[index];
      const delta=new tt().setFromAxisAngle(new L(1,0,0),angles[index]*amount);
      record.bone.quaternion.copy(record.rest).multiply(delta).normalize();
    }
  }
  i.updateMatrixWorld(!0);
}
function setBothHandsCurl(value){setHandCurl("left",value);setHandCurl("right",value);}
function resetHands(){setBothHandsCurl(0);}
function getHandCurl(side){return patientHandStates[side]??0;}
return{root:i,skins:o,chains:u,frames:b,routes:S0,capture:f,interpolate:R,applySlider:I,getSlider:D,getBounds:S,setHandCurl,setBothHandsCurl,resetHands,getHandCurl}}var ud=new L(0,0,1),Hl=new L(1,0,0),b0=new L(0,1,0),E0={arm:["Elbow","Wrist"],leg:["Knee","Ankle"]},dd={arm:{swing:1.9,bend:2.52,radius:[.055,.042]},leg:{swing:1.08,bend:2.3,radius:[.083,.06]}};function Gi(s,e){return e.clone().sub(s).normalize()}function Pa(s,e){return s.clone().addScaledVector(e,-s.dot(e))}function T0(s,e){let{start:t,middle:n,tip:i,upperLength:r,lowerLength:o,direction:a,pole:l,limits:c,role:u}=e,h=Gi(t,s);if(h.lengthSq()<.01)return null;if(u==="joint"){if((e.limitDirection??a).angleTo(h)>c.swing)return null;let b=new tt().setFromUnitVectors(a,h);return{middle:n.clone().sub(t).applyQuaternion(b).add(t),tip:i.clone().sub(t).applyQuaternion(b).add(t)}}let d=Math.sqrt(r**2+o**2+2*r*o*Math.cos(c.bend)),p=Pt.clamp(t.distanceTo(s),d,r+o-1e-4),g=(p**2+r**2-o**2)/(2*p),_=Math.sqrt(Math.max(0,r**2-g**2)),m=Pa(l,h);m.lengthSq()<1e-4&&(m=Pa(b0,h)),m.lengthSq()<1e-4&&(m=Pa(Hl,h));let f=t.clone().addScaledVector(h,g).addScaledVector(m.normalize(),_);return (e.limitDirection??a).angleTo(Gi(t,f))>c.swing?null:{middle:f,tip:t.clone().addScaledVector(h,p)}}function fd(s,e,t){/* shortest-arc bone alignment: preserve anatomical direction and prevent free axial limb spin */let n=s.getWorldQuaternion(new tt),i=s.parent.getWorldQuaternion(new tt),r=new tt().setFromUnitVectors(e,t);s.quaternion.copy(i.invert().multiply(r).multiply(n)),s.updateWorldMatrix(!1,!0)}function w0(s,e){let[t,n,i]=s.chain.joints;if(t.quaternion.copy(s.upperRotation),n.quaternion.copy(s.lowerRotation),fd(t,s.direction,Gi(s.start,e.middle)),s.role==="tip"){let r=Gi(n.getWorldPosition(new L),i.getWorldPosition(new L));fd(n,r,Gi(e.middle,e.tip))}}function pd(s,e,t,n){let i=0;for(let r of[.25,.5,.75,1]){let o=s.clone().lerp(e.middle,r),a=e.middle.clone().lerp(e.tip,r);i+=Math.max(0,n(o,t,"upper")-o.y),i+=Math.max(0,n(a,t,r===1?"tip":"lower")-a.y)}return i}function A0(s,e,t){let n=l=>{let c=T0(l,e);return c&&pd(e.start,c,e.chain.kind,t)<=e.maxPenetration?c:null},i=n(s);if(i)return{target:s,solution:i};let r=0,o=1,a=null;for(let l=0;l<7;l++){let c=(r+o)/2,u=e.lastTarget.clone().lerp(s,c),h=n(u);h?(r=c,a=u,i=h):o=c}return i?{target:a,solution:i}:null}function md({canvas:s,camera:e,controls:t,patient:n,chains:i,canDrag:r=()=>!0,getMinY:o=()=>0,onChange:a=()=>{},onVisualChange:l=()=>{}}){let c=new cr(.014,12,8),u=i.flatMap(A=>{let U=A.id.startsWith("left")?"left":"right";return E0[A.kind].map((F,G)=>{let V=new Qt({color:3724219,depthTest:!1,depthWrite:!1,transparent:!0}),$=new gt(c,V);$.name=`${U}${F} control`,$.renderOrder=10,$.visible=!1,A.joints[G+1].add($);let H=[];if(G===1){let ee=A.joints[2];ee.traverse(k=>{k!==ee&&k.isBone&&!k.children.some(J=>J.isBone)&&H.push(k)})}return{id:`${U}${F}`,marker:$,chain:A,role:G===0?"joint":"tip",distalBones:H}})}),h=new _r,d=new Ie,p=new L,g=null,_=null,m=!1;function f(){for(let A of u){let U=A===_||A===g?.target;A.marker.visible=m||U,A.marker.material.opacity=U?1:.68,A.marker.scale.setScalar(U?1.32:1)}l()}function b(A){_!==A&&(_=A,s.style.cursor=_?"grab":"",f())}function E(A,U){let F=A.clone().project(e);return F.z<-1||F.z>1?null:{x:U.left+(F.x+1)*U.width/2,y:U.top+(1-F.y)*U.height/2,depth:F.z}}function v(){e.updateMatrixWorld();let A=s.getBoundingClientRect(),U={};for(let F of u){let G=F.marker.getWorldPosition(new L),V=E(G,A);V&&(U[F.id]={x:V.x,y:V.y,world:G.toArray()})}return U}function C(A){e.updateMatrixWorld();let U=s.getBoundingClientRect(),F=A.pointerType==="touch",G=F?22:13,V=null,$=1/0,H=null,ee=1/0;function k(J,le,de,me,Ae,W){let Z=me.x-de.x,oe=me.y-de.y,Te=Z*Z+oe*oe;if(Te<1)return;let pe=Pt.clamp(((A.clientX-de.x)*Z+(A.clientY-de.y)*oe)/Te,0,1),Be=Math.hypot(A.clientX-(de.x+pe*Z),A.clientY-(de.y+pe*oe)),ft=e.position.distanceTo(J.clone().lerp(le,pe)),P=U.height/(2*Math.tan(Pt.degToRad(e.fov/2))*ft),it=Math.max(F?16:8,Ae*P),Fe=Be/it+me.depth*.05;Be<=it&&Fe<ee&&(H=W,ee=Fe)}for(let J of u){let le=J.role==="tip",de=J.chain.joints[le?1:0].getWorldPosition(new L),me=J.chain.joints[le?2:1].getWorldPosition(new L),Ae=E(de,U),W=E(me,U);if(!Ae||!W)continue;let Z=Math.hypot(A.clientX-W.x,A.clientY-W.y),oe=Z/G+W.depth*.05;Z<=G&&oe<$&&(V=J,$=oe);let Te=dd[J.chain.kind].radius[le?1:0];k(de,me,Ae,W,Te,J);for(let pe of J.distalBones){let Be=pe.getWorldPosition(new L),ft=E(Be,U);ft&&k(me,Be,W,ft,Te*.75,J)}}return m?V??H:H??V}function R(A,U){let F=s.getBoundingClientRect();return d.set((A.clientX-F.left)/F.width*2-1,1-(A.clientY-F.top)/F.height*2),h.setFromCamera(d,e),h.ray.intersectPlane(U,p)}function I(A){A.preventDefault(),A.stopImmediatePropagation()}function D(A){if(g){I(A);return}if(A.button!==0||!A.isPrimary||!r())return;let U=C(A);if(!U)return;let{chain:F,role:G}=U,[V,$,H]=F.joints,ee=V.getWorldPosition(new L),k=$.getWorldPosition(new L),J=H.getWorldPosition(new L),le=ee.distanceTo(k),de=k.distanceTo(J);if(le<.01||de<.01)return;let me=G==="joint"?k:J,Ae=e.getWorldDirection(new L),W=new Vt().setFromNormalAndCoplanarPoint(Ae,me),Z=R(A,W);if(!Z)return;let oe=n.getWorldQuaternion(new tt),Te=F.kind==="leg"?ud.clone().addScaledVector(Hl,F.side*.14):Hl.clone().multiplyScalar(F.side*.75).addScaledVector(ud,-.6);Te.normalize().applyQuaternion(oe);let pe=Pa(k.clone().sub(ee),Gi(ee,J)),Be=pe.lengthSq()>4e-4?pe.normalize():Te;I(A),g={target:U,chain:F,role:G,start:ee,middle:k,tip:J,upperLength:le,lowerLength:de,pole:Be,direction:Gi(ee,k),limits:dd[F.kind],upperRotation:V.quaternion.clone(),lowerRotation:$.quaternion.clone(),plane:W,offset:me.clone().sub(Z),lastTarget:me.clone(),maxPenetration:pd(ee,{middle:k,tip:J},F.kind,o)+.004,pointerId:A.pointerId,controlsWereEnabled:t.enabled,originX:A.clientX,originY:A.clientY,moved:!1},t.enabled=!1,s.setPointerCapture(A.pointerId),s.style.cursor="grabbing",f()}function S(A){if(!g){A.pointerType!=="touch"&&b(r()?C(A):null);return}if(I(A),A.pointerId!==g.pointerId||!g.moved&&Math.hypot(A.clientX-g.originX,A.clientY-g.originY)<3)return;g.moved=!0;let U=R(A,g.plane);if(!U)return;let F=A0(U.clone().add(g.offset),g,o);F&&(w0(g,F.solution),g.lastTarget.copy(F.target),a(g.target.id))}function x(){if(!g)return;let{pointerId:A,controlsWereEnabled:U}=g;g=null,_=null,t.enabled=U,s.hasPointerCapture(A)&&s.releasePointerCapture(A),s.style.cursor="",f()}function w(A){!g||A.pointerId!==g.pointerId||(I(A),x())}return s.addEventListener("pointerdown",D,!0),s.addEventListener("pointermove",S,!0),s.addEventListener("pointerup",w,!0),s.addEventListener("pointercancel",w,!0),s.addEventListener("lostpointercapture",w),s.addEventListener("pointerleave",()=>{g||b(null)}),window.addEventListener("blur",x),{cancel:x,getTargets:v,setHandlesVisible(A){m=A,f()}}}var Mn=document.getElementById("viewport"),La=document.getElementById("loading-state"),Na=document.getElementById("model-status");function Da(s){La.dataset.state=Na.dataset.state="error",La.querySelector("span").textContent=s,La.hidden=!1,Na.textContent="\u062A\u0639\u0630\u0651\u0631 \u0639\u0631\u0636 \u0627\u0644\u0645\u0631\u064A\u0636"}function R0(){let s=document.getElementById("embedded-patient");if(!s)return"./assets/patient/patient.glb";let e=s.textContent;if(s.remove(),Uint8Array.fromBase64)return Uint8Array.fromBase64(e).buffer;let t=atob(e),n=new Uint8Array(t.length);for(let i=0;i<t.length;i++)n[i]=t.charCodeAt(i);return n.buffer}async function C0(){let s;try{s=new va({antialias:!0,alpha:!1,powerPreference:"high-performance"})}catch(k){Da("\u064A\u0644\u0632\u0645 \u0645\u062A\u0635\u0641\u062D \u064A\u062F\u0639\u0645 WebGL 2 \u0644\u0641\u062A\u062D \u063A\u0631\u0641\u0629 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629."),console.error(k);return}let e=new Qs,t=new xt(52,1,.035,35),n=window.matchMedia("(max-width: 650px)"),i=window.matchMedia("(prefers-reduced-motion: reduce)");e.add(t);s.setPixelRatio(Math.min(window.devicePixelRatio||1,n.matches?1.5:1.8)),s.outputColorSpace=ut,s.toneMapping=Lo,s.toneMappingExposure=.88,s.shadowMap.enabled=!0,s.shadowMap.type=vr,s.domElement.setAttribute("aria-label","\u0645\u0634\u0647\u062F \u0627\u0644\u0645\u0631\u064A\u0636 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F"),Mn.prepend(s.domElement),s.domElement.addEventListener("webglcontextlost",()=>Da("\u0627\u0646\u0642\u0637\u0639 \u0627\u0644\u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F. \u0623\u0639\u062F \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0644\u0627\u0633\u062A\u0639\u0627\u062F\u062A\u0647."));const sceneManager = createSceneManager({ scene: e, renderer: s, camera: t });
const diagnosticsPanel = createDiagnosticsPanel({ host: Mn, enabled: new URLSearchParams(location.search).get('debug') === '1', eventBus: nabdEventBus });
let r=new Ea(t,s.domElement);r.enableDamping=!0,r.dampingFactor=.085,r.enablePan=!0,r.enableRotate=!0,r.enableZoom=!0,r.rotateSpeed=.68,r.zoomSpeed=.82,r.panSpeed=.68,r.screenSpacePanning=!1,r.minDistance=.42,r.maxDistance=4.8,r.maxPolarAngle=Math.PI*.49,r.minPolarAngle=.11,r.maxTargetRadius=3.6;const vitals = createVitals({ CanvasTexture: rr, SRGBColorSpace: ut, LinearFilter: 1006 });
const o = await nd(e, !n.matches, vitals.texture);
function assetBuffer(id, path) {
  const embedded = document.getElementById(id);
  if (!embedded) return path;
  const text = embedded.textContent.trim();
  embedded.remove();
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(text).buffer;
  const raw = atob(text);
  const data = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i);
  return data.buffer;
}

// First-person bedside navigation and supervised handoff.
const viewport = document.getElementById('viewport');
const viewPanel = document.querySelector('.viewport-views');
const traineeHud = document.getElementById('trainee-hud');
const modeButton = document.getElementById('toggle-trainee-mode');
const pointerStatus = document.getElementById('pointer-status');
const traineeStatus = document.getElementById('trainee-status');
const action = document.getElementById('training-action');
const toolSelect = document.getElementById('training-tool');
const resetTraining = document.getElementById('training-reset');
const workMarker = document.getElementById('training-target');
const positioningButton = document.getElementById('trainee-patient-position');
const confirmVitals = document.getElementById('vitals-confirm');
const traineeDefault = { position: new L(0.735, 1.60, 0.15), yaw: Math.PI / 2, pitch: -0.60, fov: 62 };
const traineeKeys = new Set();
const traineeVelocity = new L();
const viewRay = new _r();
const cursor = new Ie();
let traineeMode = true, patientPositioning = false, bedside = null;
let abdomen = null, workFocused = false, workReady = false, refreshWorkView = false;
let workFocusPoint = null, focusPickMode = false, lookMode = false, scopeFeed = null;
let scopeMonitorLook = false;
let forearmPractice = null;
const forearmButton = document.getElementById('forearm-practice');
const forearmActions = document.getElementById('forearm-actions');
const forearmAssist = document.getElementById('forearm-assist');
const forearmFeedback = document.getElementById('forearm-feedback');
let internalAnatomy = null, anatomyActive = false, anatomyNeedsFrame = false;
let anatomyReturnToTrainee = false, anatomyPreviousFov = 52;
const anatomyToggle = document.getElementById('anatomy-toggle');
const anatomyPanel = document.getElementById('anatomy-controls');
const anatomySystem = document.getElementById('anatomy-system');
const anatomyOrgan = document.getElementById('anatomy-organ');
const anatomyIsolate = document.getElementById('anatomy-isolate');
const anatomyReadout = document.getElementById('anatomy-readout');
const abdomenButtons = Array.from(document.querySelectorAll('[data-abdomen-focus]'));
let traineeYaw = traineeDefault.yaw, traineePitch = traineeDefault.pitch;
let traineeFocusTransition = null, traineeLast = performance.now();
// traineeViewShown: the first-person view is on screen (later moves beside the bed are smooth, not cuts).
let traineeViewShown = false, fovTween = null;
// Lens changes between the bedside and a work area ease over 0.3 s. Any other change of the FOV (zoom, the
// scope monitor, a layout change) simply ends the tween.
function tweenFov(to) {
  if (i.matches || Math.abs(t.fov - to) < 0.01) {
    fovTween = null;
    if (t.fov !== to) { t.fov = to; t.updateProjectionMatrix(); I = true; }
    return;
  }
  fovTween = { from: t.fov, to, k: 0, last: t.fov };
}
function finishFovTween() {
  if (!fovTween) return;
  if (t.fov === fovTween.last) { t.fov = fovTween.to; t.updateProjectionMatrix(); I = true; }
  fovTween = null;
}
function updateFovTween(dt) {
  if (!fovTween) return;
  if (t.fov !== fovTween.last) { fovTween = null; return; }
  fovTween.k = Math.min(1, fovTween.k + Math.min(dt, 1 / 48) / 0.3);
  const k = fovTween.k * fovTween.k * (3 - 2 * fovTween.k);
  t.fov = fovTween.last = Pt.lerp(fovTween.from, fovTween.to, k);
  t.updateProjectionMatrix();
  I = true;
  if (fovTween.k === 1) fovTween = null;
}
let activeHand = 'right', crew = null, phase = 'idle';
let crewTime = -Infinity, animateCrewUntil = 0, crewPaused = true;
const crewReady = loadCrew({
  T: { Vector3: L, Quaternion: tt, Matrix4: ze, Group: Mt, MeshStandardMaterial: Ut, CylinderGeometry: Ii },
  scene: e, camera: t, segment: ll, put: jn, mobile: () => n.matches,
  loadAsset: async (name) => {
    const asset = assetBuffer('asset-' + name, './assets/staff/' + name + '.glb');
    const loader = new Ra();
    return (await (asset instanceof ArrayBuffer ? loader.parseAsync(asset, '') : loader.loadAsync(asset))).scene;
  },
}).then((loaded) => ({ loaded }), (error) => ({ error }));

const area = {
  chest: { z: -0.33, target: [0.11, 1.04, -0.35], name: 'الصدر' },
  abdomen: { x: 0.625, z: -0.09, target: [0.02, 1.095, -0.16], name: 'البطن' },
  arm: { z: -0.03, target: [0.30, 1.02, -0.17], name: 'الذراع' },
  leg: { z: 0.70, target: [0.13, 0.92, 0.69], name: 'الساق' },
  handoff: { x: 0.82, z: 0.14, target: [0.02, 1.29, 0.17], name: 'المشرف' },
  practice: { x: 0.85, z: 0.18, target: [0.22, 1.10, 0.21], name: 'الصينية ومجال العمل' },
  wrist: { x: 0.84, z: 0.16, target: [0.30, 1.025, 0.09], name: 'رسغ المريض' },
};
function setTraineeStatus(message) { traineeStatus.textContent = message; }
function applyTraineeRotation() { t.rotation.set(traineePitch, traineeYaw, 0, 'YXZ'); t.updateMatrixWorld(); }
function animateCrew(ms = 330) {
  animateCrewUntil = Math.max(animateCrewUntil, performance.now() + ms);
  I = true;
}
function setPatientPositioning(active) {
  if (active && bedside?.held === 'tool') {
    setTraineeStatus('فلّت الأداة أولًا لتغيير وضعية المريض');
    return;
  }
  if (active) leaveWorkstation();
  patientPositioning = active;
  bedside?.cancel();
  traineeVelocity.set(0, 0, 0);
  viewport.classList.toggle('patient-positioning', active);
  const button = document.getElementById('trainee-patient-position');
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? 'إنهاء تحريك الأطراف' : 'تحريك أطراف المريض';
  window.__patientManipulator?.(active);
  pointerStatus.textContent = active ? 'اسحب مفصلًا لتحريك طرف المريض' : 'انقر للإمساك ثم انقر للإفلات · اسحب للالتفات';
  I = true;
}

function enterTraineeMode() {
  if (anatomyActive) closeAnatomy();
  // Already beside the patient (leaving a work area, a reset): the trainee walks back to the bedside spot
  // instead of a cut. Coming from the room view (and the first view after loading) is still a cut.
  const smooth = traineeMode && traineeViewShown && !i.matches;
  if (nabdSimulation.snapshot().sessionId) nabdSimulation.record('camera_changed', { metadata: { view: 'trainee-first-person' } });
  leaveWorkstation();
  traineeMode = true;
  r.enabled = false;
  crew?.setVisible(true);
  viewport.classList.add('trainee-active');
  viewPanel.hidden = true;
  traineeHud.hidden = false;
  modeButton.textContent = 'معاينة الغرفة';
  modeButton.setAttribute('aria-pressed', 'true');
  setPatientPositioning(false);
  traineeStation = null;
  if (smooth) {
    moveTo(traineeDefault.position.clone(), traineeDefault.yaw, traineeDefault.pitch,
      travelMs(traineeDefault.position, traineeDefault.yaw, traineeDefault.pitch));
    tweenFov(n.matches ? 76 : traineeDefault.fov);
  } else {
    t.position.copy(traineeDefault.position);
    traineeYaw = traineeDefault.yaw;
    traineePitch = traineeDefault.pitch;
    fovTween = null;
    t.fov = n.matches ? 76 : traineeDefault.fov;
    t.updateProjectionMatrix();
    traineeFocusTransition = null;
    applyTraineeRotation();
    // A hard cut: idle hands start at rest in front of the trainee (no flight from the old view).
    crew?.snapIdleHands();
  }
  traineeViewShown = true;
  document.getElementById('camera-detail-label').textContent = 'منظور المتدرّب';
  document.getElementById('detail-view').textContent = 'بجانب السرير';
  setTraineeStatus('واقف بجانب المريض');
}
function exitTraineeMode() {
  if (nabdSimulation.snapshot().sessionId) nabdSimulation.record('camera_changed', { metadata: { view: 'room-overview' } });
  leaveWorkstation();
  setPatientPositioning(false);
  traineeMode = false;
  crew?.setVisible(false);
  r.enabled = true;
  viewport.classList.remove('trainee-active');
  viewPanel.hidden = false;
  traineeHud.hidden = true;
  modeButton.textContent = 'منظور المتدرّب';
  modeButton.setAttribute('aria-pressed', 'false');
  traineeFocusTransition = null;
  traineeViewShown = false;
  // The view glides out to the room (the room tween, not a cut) from where the trainee was looking: the orbit
  // target starts just ahead of the trainee's eyes (looking at least slightly down, as the orbit allows).
  const ahead = t.getWorldDirection(new L());
  ahead.y = Math.min(ahead.y, -0.08);
  r.target.copy(t.position).addScaledVector(ahead.normalize(), 1.2);
  x('room');
  // About 4 m: a 1.2 s glide that starts and ends gently (the presets keep their 0.62 s ease-out).
  if (C) Object.assign(C, { ms: 1200, smooth: true });
}
// Room view would silently end the forearm drill (and its support) or drop what the hand holds (F31):
// it is refused with the reason instead.
function roomViewRefusal() {
  if (forearmPractice?.session) return 'أغلق تمرين الساعد أولًا ثم افتح معاينة الغرفة';
  if (bedside?.active) return 'أفلِت ما في يدك قبل معاينة الغرفة';
  return null;
}

function frameAnatomy() {
  const selected = anatomyOrgan.value;
  const organ = internalAnatomy.organs.get(selected);
  const bounds = organ ? new zt().setFromObject(organ.mesh) : internalAnatomy.bounds();
  if (bounds.isEmpty()) return;
  const center = bounds.getCenter(new L());
  const size = bounds.getSize(new L());
  const halfView = Math.tan(Pt.degToRad(t.fov / 2));
  const distance = Math.max(.30, (size.z * .58 + .075) / (halfView * t.aspect),
    (size.x * .52 + size.y * .32 + .07) / halfView);
  C = null;
  t.position.copy(center).addScaledVector(new L(.52,.84,.075).normalize(), distance);
  r.target.copy(center);
  r.update();
  document.getElementById('camera-detail-label').textContent = organ?.label ?? 'تشريح المريض';
  I = true;
}

function refreshAnatomyOptions() {
  const old = anatomyOrgan.value;
  const option = (label, value) => new Option(label, value);
  anatomyOrgan.replaceChildren(option('عرض المجموعة', ''));
  for (const organ of internalAnatomy.organs.values()) {
    if (anatomySystem.value === 'all' || anatomySystem.value === organ.system) {
      anatomyOrgan.add(option(organ.label, organ.key));
    }
  }
  if ([...anatomyOrgan.options].some(({ value }) => value === old)) anatomyOrgan.value = old;
}

function updateAnatomySelection({ reframe = true } = {}) {
  const organ = internalAnatomy.organs.get(anatomyOrgan.value);
  anatomyIsolate.disabled = !organ;
  internalAnatomy.show(anatomySystem.value, organ?.key, anatomyIsolate.checked);
  const visible = [...internalAnatomy.organs.values()].filter(({ mesh }) => mesh.visible).length;
  anatomyReadout.textContent = organ?.label ?? `${visible} بنية معروضة`;
  if (reframe && !E) frameAnatomy();
  else if (reframe) anatomyNeedsFrame = true;
  I = true;
}

function openAnatomy() {
  if (!internalAnatomy) return;
  if (bedside?.active || !['idle','complete'].includes(phase)) {
    setTraineeStatus('أفلت الهدف وأنهِ التمرين المفتوح قبل عرض التشريح');
    return;
  }
  // Like the room view, the atlas would end the forearm drill silently (F31).
  if (forearmPractice?.session) {
    setTraineeStatus('أغلق تمرين الساعد قبل عرض التشريح');
    return;
  }
  anatomyReturnToTrainee = traineeMode;
  finishFovTween();
  anatomyPreviousFov = t.fov;
  if (b !== 'supine' || E) G('supine');
  if (traineeMode) exitTraineeMode();
  _?.setHandlesVisible(false);
  anatomyActive = true;
  internalAnatomy.setVisible(true);
  viewport.dataset.anatomy = 'true';
  anatomyPanel.hidden = false;
  anatomyToggle.setAttribute('aria-pressed','true');
  anatomyToggle.textContent = 'إغلاق التشريح';
  viewPanel.hidden = true;
  t.fov = n.matches ? 57 : 49;
  t.updateProjectionMatrix();
  r.minDistance = .28;
  setTraineeStatus('اسحب لتدوير المشهد · اختر عضوًا من القائمة أو المجسّم');
  refreshAnatomyOptions();
  updateAnatomySelection();
}

function closeAnatomy() {
  if (!anatomyActive) return;
  anatomyActive = anatomyNeedsFrame = false;
  internalAnatomy.setVisible(false);
  delete viewport.dataset.anatomy;
  anatomyPanel.hidden = true;
  anatomyToggle.setAttribute('aria-pressed','false');
  anatomyToggle.textContent = 'التشريح الداخلي';
  viewPanel.hidden = traineeMode;
  r.minDistance = .42;
  t.fov = anatomyPreviousFov;
  t.updateProjectionMatrix();
  _?.setHandlesVisible(h.getAttribute('aria-pressed') === 'true');
  setTraineeStatus('عرض غرفة العمليات');
  I = true;
}

anatomyToggle.addEventListener('click', () => {
  if (!anatomyActive) { openAnatomy(); return; }
  closeAnatomy();
  if (anatomyReturnToTrainee) enterTraineeMode();
  else x('overview');
});
anatomySystem.addEventListener('change', () => {
  refreshAnatomyOptions();
  updateAnatomySelection();
});
anatomyOrgan.addEventListener('change', () => updateAnatomySelection());
anatomyIsolate.addEventListener('change', () => updateAnatomySelection({ reframe: false }));
document.getElementById('anatomy-reset').addEventListener('click', () => {
  anatomySystem.value = 'all';
  anatomyOrgan.value = '';
  anatomyIsolate.checked = false;
  refreshAnatomyOptions();
  updateAnatomySelection();
});
let anatomyPress = null;
s.domElement.addEventListener('pointerdown', (event) => {
  if (anatomyActive && event.isPrimary && event.button === 0 && event.pointerType === 'mouse') {
    anatomyPress = { x: event.clientX, y: event.clientY };
  }
});
s.domElement.addEventListener('pointerup', (event) => {
  const start = anatomyPress;
  anatomyPress = null;
  if (!anatomyActive || !start || Math.hypot(event.clientX-start.x,event.clientY-start.y) > 5) return;
  const canvas = s.domElement.getBoundingClientRect();
  cursor.set((event.clientX-canvas.left)/canvas.width*2-1, 1-(event.clientY-canvas.top)/canvas.height*2);
  viewRay.setFromCamera(cursor,t);
  const meshes = [...internalAnatomy.organs.values()].map(({ mesh }) => mesh).filter((mesh) => mesh.visible);
  const hit = viewRay.intersectObjects(meshes,false)[0];
  if (!hit) return;
  anatomyOrgan.value = hit.object.name;
  updateAnatomySelection();
});
s.domElement.addEventListener('pointercancel', () => { anatomyPress = null; });

// Messages for moves that cannot happen (explain every failure).
const holdingMoveText = 'أفلِت ما في يدك لتتحرك';
const holdingWalkText = 'أفلِت ما في يدك لتمشي حول السرير';
const bedEdgeText = 'وصلت إلى حافة السرير · افتح منطقة عمل لتدور حوله';
const insertedWalkText = 'اسحب الأداة خارج الفتحة قبل المشي';
const reachLostText = 'خارج مدى اليد · اقترب من السرير';
function notice(message) { if (traineeStatus.textContent !== message) setTraineeStatus(message); }
// A smooth move of the trainee: the body, and the head unless keepView (a step keeps where the trainee looks).
function moveTo(position, yaw, pitch, duration = 500, { keepView = false } = {}) {
  traineeFocusTransition = {
    elapsed: 0, duration, fromPosition: t.position.clone(), position,
    fromYaw: traineeYaw, yaw, fromPitch: traineePitch, pitch, viewHeld: keepView,
  };
  if (i.matches) updateTraineeFocus(0, true);
}
// How long a move back to a bedside spot takes: the eased move peaks at about 1.2 m/s and 180°/s (1.5 times
// its average speed), between 0.25 s and 1.5 s.
function travelMs(position, yaw, pitch) {
  const turn = Math.hypot(Math.atan2(Math.sin(yaw - traineeYaw), Math.cos(yaw - traineeYaw)), pitch - traineePitch);
  return 1000 * Pt.clamp(1.5 * Math.max(t.position.distanceTo(position) / 1.2, turn / Math.PI), 0.25, 1.5);
}
// The bedside spot of a training step or area: where the trainee stands and looks.
let traineeStation = null;
function stationPose(name) {
  const region = area[name];
  const position = new L(n.matches && name === 'practice' ? 1.03 : region.x ?? 0.735, traineeDefault.position.y, region.z);
  const direction = new L(...region.target).sub(position).normalize();
  return { position, yaw: Math.atan2(-direction.x, -direction.z), pitch: Math.asin(direction.y) };
}
function focusTraineeArea(name) {
  const region = area[name];
  if (nabdSimulation.snapshot().sessionId) nabdSimulation.record('camera_changed', { metadata: { view: 'work-area', area: name } });
  if (bedside?.active) { setTraineeStatus(holdingMoveText); return; }
  if (name !== 'abdomen') leaveWorkstation();
  const { position, yaw, pitch } = stationPose(name);
  traineeStation = name;
  moveTo(position, yaw, pitch);
  setTraineeStatus(`بجانب السرير · ${region.name}`);
}
// «إعادة المنظور» and the home button: back to the current step's spot (or the bedside spot), smoothly;
// at a work area the view turns back to the work point.
function recentreTrainee() {
  if (!traineeMode) return;
  if (workFocused) { recenterWorkFocus(); return; }
  if (bedside?.active) { setTraineeStatus('أفلِت ما في يدك أولًا'); return; }
  if (patientPositioning) setPatientPositioning(false);
  if (nabdSimulation.snapshot().sessionId) nabdSimulation.record('camera_changed', { metadata: { view: 'trainee-first-person', recentre: traineeStation ?? 'bedside' } });
  const pose = traineeStation ? stationPose(traineeStation) : { position: traineeDefault.position.clone(), yaw: traineeDefault.yaw, pitch: traineeDefault.pitch };
  moveTo(pose.position, pose.yaw, pose.pitch, travelMs(pose.position, pose.yaw, pose.pitch));
  tweenFov(n.matches ? 76 : traineeDefault.fov);
  setTraineeStatus(traineeStation ? `بجانب السرير · ${area[traineeStation].name}` : 'واقف بجانب المريض');
}
// Progress follows the frame time, capped at one 48 Hz frame: a slow frame slows the move instead of jumping.
function updateTraineeFocus(dt, finish = false) {
  if (!traineeFocusTransition) return;
  const turn = traineeFocusTransition;
  turn.elapsed = finish ? turn.duration : turn.elapsed + Math.min(dt, 1 / 48) * 1000;
  const progress = Pt.clamp(turn.elapsed / turn.duration, 0, 1);
  const smooth = progress * progress * (3 - 2 * progress);
  const difference = Math.atan2(Math.sin(turn.yaw - turn.fromYaw), Math.cos(turn.yaw - turn.fromYaw));
  t.position.lerpVectors(turn.fromPosition, turn.position, smooth);
  // Once the trainee looks during the move, the move no longer steers the head.
  if (!turn.viewHeld) {
    traineeYaw = turn.fromYaw + difference * smooth;
    traineePitch = Pt.lerp(turn.fromPitch, turn.pitch, smooth);
  }
  applyTraineeRotation();
  if (progress === 1) traineeFocusTransition = null;
  I = true;
}
function adjustTraineeZoom(delta) {
  if (!traineeMode || workFocused) return;
  t.fov = Pt.clamp(t.fov + delta, 47, 78);
  t.updateProjectionMatrix();
  I = true;
}
// The free bedside view is limited to the patient's left side, from the bed edge outwards.
const freeArea = { minX: 0.65, maxX: 1.36, minZ: -1.14, maxZ: 1.19 };
function clampFree(x, z) { return [Pt.clamp(x, freeArea.minX, freeArea.maxX), Pt.clamp(z, freeArea.minZ, freeArea.maxZ)]; }
// W/A/S/D walking: moves at once by a small step each frame. Returns the distance actually moved.
function step(dx, dz) {
  if (!traineeMode || patientPositioning || workFocused || bedside?.active) return 0;
  traineeFocusTransition = null;
  const [x, z] = clampFree(t.position.x + dx, t.position.z + dz);
  const moved = Math.hypot(x - t.position.x, z - t.position.z);
  t.position.x = x;
  t.position.z = z;
  t.updateMatrixWorld();
  I = true;
  return moved;
}
// The step buttons: a smooth 0.25 s step that keeps where the trainee looks. Quick clicks add up.
function stepTo(dx, dz) {
  if (!traineeMode || patientPositioning || workFocused) return;
  if (bedside?.active) { setTraineeStatus(holdingMoveText); return; }
  const from = traineeFocusTransition?.viewHeld ? traineeFocusTransition.position : t.position;
  const [x, z] = clampFree(from.x + dx, from.z + dz);
  if (Math.hypot(x - from.x, z - from.z) < 0.005) { setTraineeStatus(bedEdgeText); return; }
  moveTo(new L(x, from.y, z), traineeYaw, traineePitch, 250, { keepView: true });
  if (traineeStatus.textContent === bedEdgeText || traineeStatus.textContent === holdingMoveText) setTraineeStatus('واقف بجانب المريض');
}
function traineeMovement(dt) {
  if (!traineeMode || patientPositioning || workFocused || !traineeKeys.size) return;
  // W/A/S/D walk; the arrow keys turn the view (turnView).
  const has = (code) => Number(traineeKeys.has(code));
  const forward = has('KeyW') - has('KeyS');
  const sideways = has('KeyD') - has('KeyA');
  if (!forward && !sideways) return;
  if (bedside?.active) { notice(holdingMoveText); return; }
  const speed = 0.63 * dt / (Math.hypot(forward, sideways) || 1);
  const moved = step((-Math.sin(traineeYaw) * forward + Math.cos(traineeYaw) * sideways) * speed,
       (-Math.cos(traineeYaw) * forward - Math.sin(traineeYaw) * sideways) * speed);
  // Stopped by the bed edge: say why; the notice goes once the trainee walks freely again.
  if (speed > 0 && moved < speed * 0.2) notice(bedEdgeText);
  else if (traineeStatus.textContent === bedEdgeText || traineeStatus.textContent === holdingMoveText) setTraineeStatus('واقف بجانب المريض');
}
// Looking around needs only a free view; hand actions have the stricter bedside isEnabled gate.
function lookEnabled() { return traineeMode && !patientPositioning && !vitals.dialog.open; }
// ←/→ and the ↺/↻ buttons turn about 90°/s; ↑/↓ tilt about 60°/s. A click on a turn button turns 15°.
const viewTurn = { yawRate: Pt.degToRad(90), pitchRate: Pt.degToRad(60), click: Pt.degToRad(15), dir: 0, held: false, turned: 0 };
function startViewTurn(dir, held) {
  if (!lookEnabled() || scopeMonitorLook) return;
  bedside?.pauseManipulation();
  Object.assign(viewTurn, { dir, held, turned: 0 });
  I = true;
}
function turnView(dt) {
  if (!lookEnabled() || scopeMonitorLook) { viewTurn.dir = 0; return; }
  const has = (code) => Number(traineeKeys.has(code));
  let yaw = (has('ArrowLeft') - has('ArrowRight')) * viewTurn.yawRate * dt;
  const pitch = (has('ArrowUp') - has('ArrowDown')) * viewTurn.pitchRate * dt;
  if (viewTurn.dir) {
    const stepAngle = Math.max(0, Math.min(viewTurn.yawRate * dt, viewTurn.held ? Infinity : viewTurn.click - viewTurn.turned));
    yaw += viewTurn.dir * stepAngle;
    viewTurn.turned += stepAngle;
    if (!viewTurn.held && viewTurn.turned >= viewTurn.click - 1e-6) viewTurn.dir = 0;
  }
  if (!yaw && !pitch) return;
  // A held grip keeps its world position while the head turns (same as a right-drag look).
  if (bedside?.active) bedside.pauseManipulation();
  // A walk to a work area keeps moving the body; the head stays where the trainee turned it.
  if (traineeFocusTransition) traineeFocusTransition.viewHeld = true;
  workView.lookAt = performance.now();
  traineeYaw += yaw;
  traineePitch = Pt.clamp(traineePitch + pitch, -1.28, 0.42);
  applyTraineeRotation();
  I = true;
}

const workRegion = document.getElementById('work-region');
const workAction = document.getElementById('work-action');
const workControls = document.getElementById('work-controls');
const workSide = document.getElementById('work-side');
const workHelp = document.getElementById('work-help');
const workWalk = createWorkWalk({ sideX: 0.76, endZ: Un.halfLength + 0.32 });
// The work-area view turns smoothly: a base direction eases toward the work point (at most 180°/s) while the
// trainee walks, arrives or re-centres, and the trainee's own look (drag, arrows) is kept on top of it. While
// the trainee is looking, the base holds still. A short blend carries the camera onto the walkway (entry, a
// step closer or back) instead of a cut.
const workView = { yaw: 0, pitch: 0, steering: false, lookAt: -Infinity };
const workTurnRate = Pt.degToRad(180);
let workBlend = null;
function workAim() {
  const direction = workTarget().sub(t.position).normalize();
  return { yaw: Math.atan2(-direction.x, -direction.z), pitch: Math.asin(direction.y) };
}
// Start (or keep) turning toward the work point. reset: the trainee's current look is dropped (a new work
// point, a re-centre); otherwise the offset between the look and the work point is kept.
function steerWork(reset = false) {
  if (reset || !workView.steering) {
    const base = reset ? { yaw: traineeYaw, pitch: traineePitch } : workAim();
    workView.yaw = base.yaw;
    workView.pitch = base.pitch;
  }
  workView.steering = true;
}
function startWorkBlend() {
  if (i.matches) { workBlend = null; return; }
  const [x, z] = workWalk.position();
  const distance = Math.hypot(x - t.position.x, z - t.position.z);
  workBlend = distance < 0.002 ? null : { from: t.position.clone(), k: 0, duration: Pt.clamp(distance / 1.2, 0.15, 0.6) };
}
// The trainee is still walking, blending onto the walkway or turning toward the work point.
function workInMotion() { return workWalk.moving || workView.steering || Boolean(workBlend); }
function updateWorkView(dt) {
  if (!workView.steering || performance.now() - workView.lookAt < 150) return;
  const aim = workAim();
  const dy = Math.atan2(Math.sin(aim.yaw - workView.yaw), Math.cos(aim.yaw - workView.yaw));
  const dp = aim.pitch - workView.pitch;
  const frame = Math.min(dt, 1 / 48);
  let k = i.matches ? 1 : 1 - Math.exp(-frame * 8);
  const size = Math.hypot(dy, dp) * k, cap = i.matches ? Infinity : workTurnRate * frame;
  if (size > cap) k *= cap / size;
  let sy = dy * k, sp = dp * k;
  if (Math.hypot(dy - sy, dp - sp) < 0.0009 && !workWalk.moving && !workBlend) {
    sy = dy; sp = dp;
    workView.steering = false;
  }
  workView.yaw += sy;
  workView.pitch += sp;
  traineeYaw += sy;
  traineePitch = Pt.clamp(traineePitch + sp, -1.28, 0.42);
  applyTraineeRotation();
  I = true;
}
const workRegions = {
  head: { title: 'الرأس', x: 0, z: -0.815 },
  hip: { title: 'جانب الحوض', x: 0.136, z: 0.037 },
  abdomen: { title: 'البطن', x: 0.055, z: -0.153 },
  chest: { title: 'الصدر', x: 0.028, z: -0.43 },
  leftArm: { title: 'ذراع المريض اليسرى', chain: 'leftArm', side: 1 },
  rightArm: { title: 'ذراع المريض اليمنى', chain: 'rightArm', side: -1 },
  leftLeg: { title: 'ساق المريض اليسرى', chain: 'leftLeg', side: 1 },
  rightLeg: { title: 'ساق المريض اليمنى', chain: 'rightLeg', side: -1 },
};
function selectedRegion() { return workRegions[workRegion.value]; }
function inferWorkRegion(point) {
  if (point.z < -0.66) return 'head';
  if (Math.abs(point.x) > 0.27 && point.z < 0.16) return point.x > 0 ? 'leftArm' : 'rightArm';
  if (point.z < -0.29) return 'chest';
  if (point.z < -0.015) return 'abdomen';
  if (point.z < 0.25) return 'hip';
  return point.x >= 0 ? 'leftLeg' : 'rightLeg';
}
function setFocusPickMode(active) {
  if (active && scopeMonitorLook) setScopeMonitorLook(false);
  focusPickMode = Boolean(active);
  if (focusPickMode) setLookMode(false);
  for (const button of [document.getElementById('trainee-pick-focus'), document.getElementById('pick-focus-point')]) {
    if (!button) continue;
    button.setAttribute('aria-pressed', String(focusPickMode));
    button.textContent = focusPickMode ? 'انقر على جسم المريض…' : 'تحديد نقطة العمل';
  }
  viewport.classList.toggle('focus-picking', focusPickMode);
  setTraineeStatus(focusPickMode ? 'اختر أي نقطة ظاهرة على جسم المريض لتصبح مركز العمل' : (workFocused ? instructionForWork() : 'واقف بجانب المريض'));
}
function setLookMode(active) {
  if (active && scopeMonitorLook) setScopeMonitorLook(false);
  lookMode = Boolean(active);
  if (lookMode) {
    focusPickMode = false;
    for (const button of [document.getElementById('trainee-pick-focus'), document.getElementById('pick-focus-point')]) {
      if (button) { button.setAttribute('aria-pressed', 'false'); button.textContent = 'تحديد نقطة العمل'; }
    }
    viewport.classList.remove('focus-picking');
  }
  const button = document.getElementById('trainee-look-mode');
  if (button) button.setAttribute('aria-pressed', String(lookMode));
  viewport.classList.toggle('look-mode', lookMode);
  setTraineeStatus(lookMode ? 'اسحب لتغيير زاوية النظر · لن تتحرك الأداة' : (workFocused ? instructionForWork() : 'واقف بجانب المريض'));
}
function selectFocusPoint(point) {
  if (!['idle', 'complete'].includes(phase)) { setFocusPickMode(false); setTraineeStatus('أكمل الخطوة الحالية قبل تغيير نقطة العمل'); return; }
  if (toolDepth?.inserted) { setFocusPickMode(false); setTraineeStatus('اسحب الأداة خارج منفذ الإدخال قبل تغيير نقطة العمل'); return; }
  const region = inferWorkRegion(point);
  setFocusPickMode(false);
  selectWork(region, point);
  const label = document.getElementById('work-focus-readout');
  if (label) label.textContent = `نقطة العمل: ${workRegions[region].title} · موضع حر`;
  setTraineeStatus(`تم تحديد نقطة عمل على ${workRegions[region].title} · تستطيع تغيير زاوية النظر أو الوقفة`);
}
function selectedWorkChain() {
  return g.chains.find(({ id }) => id === selectedRegion().chain);
}
function workTarget() {
  if (workFocusPoint) return workFocusPoint.clone();
  const chain = selectedWorkChain();
  if (chain) return chain.joints[2].getWorldPosition(new L());
  const [, , headX, headZ] = workRegion.value === 'head' ? headLandmark() : [];
  const x = headX ?? selectedRegion().x, z = headZ ?? selectedRegion().z;
  const height = abdomen.height(x, z);
  return new L(x, Number.isFinite(height) ? height : 1.12, z);
}
function updateWorkFocusLighting() {
  if (!o?.focusLightTarget) return;
  const point = workFocused ? workTarget() : new L(0, 0.95, -0.15);
  o.focusLightTarget.position.copy(point);
  o.focusLightTarget.updateMatrixWorld(true);
}
function workSpec() {
  if (!workFocused) return null;
  return {
    forearm: forearmPractice?.session ?? null,
    joints: bodyJoints(),
    landmarks: surfaceLandmarks,
    surfaceAction(point, object) {
      if (object?.material?.name?.includes('Local privacy')) return null;
      // Any visible, non-protected patient surface is a valid contact target.
      // Only the calibrated anterior abdominal patch receives the current press/pinch profile.
      if (abdomen.contains(point)) return workAction.value;
      return 'touch';
    },
  };
}
const bodyMarkers = document.getElementById('body-markers');
const bodyMarkerNodes = new Map();
const bodyLandmarks = [
  ['chest-center','الصدر',0.028,-0.43],
  ['chest-left','أعلى الصدر يسار',0.118,-0.472], ['chest-right','أعلى الصدر يمين',-0.118,-0.472],
  ['abdomen-center','منتصف البطن',0.055,-0.153],
  ['abdomen-left','جانب البطن الأيسر',0.123,-0.131], ['abdomen-right','جانب البطن الأيمن',-0.112,-0.131],
  ['hip-left','الورك الأيسر',0.136,0.037], ['hip-right','الورك الأيمن',-0.136,0.037],
];
let headPoint = null;
function headLandmark() {
  if (headPoint) return headPoint;
  const bone = g.root.getObjectByName('head');
  const center = bone?.getWorldPosition(new L()) ?? new L(0,1.11,-0.815);
  let z = center.z, best = -Infinity;
  for (let step = -10; step <= 3; step++) {
    const candidate = center.z + step*0.009;
    const score = abdomen.height(center.x,candidate) - Math.abs(step+4)*0.004;
    if (score > best) { best = score; z = candidate; }
  }
  const result = ['forehead','ملامسة الرأس',center.x,z];
  if (Number.isFinite(best)) headPoint = result;
  return result;
}
function allLandmarks() { return [headLandmark(),...bodyLandmarks]; }
function bodyJoints() {
  return g.chains.flatMap((chain) => [1,2].map((jointIndex) => {
    const point = chain.joints[jointIndex].getWorldPosition(new L());
    const base = abdomen.height(point.x,point.z);
    const skinTop = point.y + (chain.kind === 'leg' ? 0.042 : 0.022);
    point.y = Math.max(skinTop, Math.min(base,skinTop+0.02));
    const name = chain.kind === 'leg' ? (jointIndex === 1 ? 'الركبة' : 'الكاحل')
      : (jointIndex === 1 ? 'المرفق' : 'الرسغ');
    return { id:`${chain.id}-${jointIndex}`, chain, jointIndex, point,
      label: name + (chain.side > 0 ? ' · يسار' : ' · يمين') };
  }));
}
function surfaceLandmarks() {
  return allLandmarks().map(([id,label,x,z]) => ({
    id,label,point:new L(x,abdomen.height(x,z)+0.003,z),
  })).filter(({point}) => Number.isFinite(point.y));
}
function bodyPoints() { return [...surfaceLandmarks(),...bodyJoints()]; }
function drawBodyPoints() {
  bodyMarkers.hidden = Boolean(forearmPractice?.session) || scopeMonitorLook || !workFocused || !workReady || !showBodyPoints.checked || bedside.held === 'tool';
  if (bodyMarkers.hidden) return;
  const box = viewport.getBoundingClientRect();
  for (const point of bodyPoints()) {
    let element = bodyMarkerNodes.get(point.id);
    if (!element) {
      element = document.createElement('span');
      element.className = 'body-marker';
      element.dataset.landmark = point.id;
      element.textContent = point.label;
      bodyMarkers.append(element);
      bodyMarkerNodes.set(point.id,element);
    }
    // Mark the limbs on the visible side, and the selected opposite limb when it can be reached.
    const hiddenSide = point.chain && Math.abs(t.position.x) > 0.64 &&
      Math.sign(t.position.x) !== point.chain.side && selectedWorkChain() !== point.chain;
    const screen = !hiddenSide && screenPoint(point.point);
    element.hidden = !screen;
    if (!screen) continue;
    element.style.left = `${screen.x-box.left}px`;
    element.style.top = `${screen.y-box.top}px`;
    element.classList.toggle('focused-marker', selectedWorkChain() === point.chain && Boolean(point.chain));
  }
}

function instructionForWork() {
  // A held instrument has its own instruction (D-11), not the hand-on-the-skin one.
  if (bedside?.held === 'tool') {
    return crew?.supportsDepth && workRegion.value === 'abdomen' ? 'وجّه طرف الأداة نحو حلقة فتحة التدريب ثم أدخلها'
      : 'الأداة في يدك فوق الجلد · حرّك المؤشر لتحريكها · انقر للإفلات';
  }
  if (forearmPractice?.session) return 'انقر على جلد الرسغ · حرّك لفوق لرفع الساعد · انقر ثانية للإفلات';
  if (selectedRegion().chain) {
    return selectedRegion().chain.endsWith('Arm') ? 'انقر عند الرسغ أو المرفق وحرّك الإيد. انقر مرة ثانية للإفلات'
      : 'انقر عند الكاحل أو الركبة وحرّك الإيد. انقر مرة ثانية للإفلات';
  }
  if (workRegion.value !== 'abdomen') return 'انقر على نقطة من المنطقة حتى تلامسها الإيد';
  return workAction.value === 'press' ? 'انقر لتلامس البطن بأصابع مبسوطة. انقر مرة ثانية للإفلات'
    : 'انقر حتى تبين القبضة، حرّكها مسافة قصيرة، ثم انقر للإفلات';
}
function updateWorkLabels() {
  workAction.closest('label').hidden = workRegion.value !== 'abdomen';
  document.getElementById('camera-detail-label').textContent = selectedRegion().title;
  workHelp.textContent = instructionForWork();
  pointerStatus.textContent = instructionForWork();
  const focusReadout = document.getElementById('work-focus-readout');
  if (focusReadout && !workFocusPoint) focusReadout.textContent = `منطقة العمل: ${selectedRegion().title}`;
}
// Place the camera on the walkway (through the entry/step blend while one runs). The view itself turns in
// updateWorkView; 'snap' turns it to the work point at once (back from the scope monitor).
function positionAtWork(mode = 'ease') {
  const [x, z] = workWalk.position();
  if (mode === 'snap') workBlend = null;
  if (workBlend) {
    const k = workBlend.k * workBlend.k * (3 - 2 * workBlend.k);
    t.position.set(Pt.lerp(workBlend.from.x, x, k), traineeDefault.position.y, Pt.lerp(workBlend.from.z, z, k));
  } else t.position.set(x, traineeDefault.position.y, z);
  t.updateMatrixWorld();
  updateWorkFocusLighting();
  if (mode === 'snap') {
    const aim = workAim();
    Object.assign(workView, { yaw: aim.yaw, pitch: aim.pitch, steering: false });
    traineeYaw = aim.yaw;
    traineePitch = aim.pitch;
    applyTraineeRotation();
  }
  const location = Math.abs(x) < 0.61 ? (z < 0 ? 'جهة الرأس' : 'جهة القدمين') :
    x > 0 ? 'يسار المريض' : 'يمين المريض';
  if (workSide.textContent !== location) workSide.textContent = location;
  I = true;
}
function recenterWorkFocus() {
  if (!workFocused || !workReady) return;
  if (scopeMonitorLook) setScopeMonitorLook(false);
  bedside?.pauseManipulation();
  traineeFocusTransition = null;
  // The view turns back to the work point smoothly. While a limb is held or a tool is in the port the hands
  // depend on the view, so it turns at once, as before.
  if (walkRefusal() || E || i.matches) {
    positionAtWork('snap');
    crew?.snapIdleHands();
  } else steerWork(true);
  setTraineeStatus(`رجع النظر إلى ${selectedRegion().title} · نقطة العمل محفوظة`);
}
// Why the trainee cannot walk round the bed now, or null.
function walkRefusal() {
  if (scopeMonitorLook) return 'ارجع إلى الحقل أولًا';
  if (toolDepth?.inserted) return insertedWalkText;
  if (bedside?.active && bedside.held !== 'tool') return holdingWalkText;
  return null;
}
function selectWork(region, focusPoint = null) {
  if (!abdomen || !['idle', 'complete'].includes(phase)) return;
  const carry = bedside.held === 'tool' && traineeMode && b === 'supine';
  if (carry && toolDepth?.inserted && (region !== workRegion.value || Boolean(focusPoint) || Boolean(workFocusPoint))) {
    setTraineeStatus('اسحب الأداة خارج فتحة التدريب قبل تغيير المنطقة أو نقطة العمل');
    return;
  }
  if (scopeMonitorLook) setScopeMonitorLook(false);
  if (toolDepth && !toolDepth.inserted) toolDepth.reset();
  if (forearmPractice?.session) closeForearmPractice();
  if (!carry) bedside.cancel();
  if (!traineeMode) enterTraineeMode();
  if (patientPositioning) setPatientPositioning(false);
  if (b !== 'supine' || E) G('supine');
  if (!workFocused) workWalk.enter(t.position.x, t.position.z);
  workFocused = true;
  traineeFocusTransition = null;
  traineeKeys.clear();
  workRegion.value = region;
  workFocusPoint = focusPoint?.clone() ?? null;
  updateWorkFocusLighting();
  refreshWorkView = true;
  workReady = false;
  viewport.classList.add('abdomen-focused');
  for (const button of abdomenButtons) button.setAttribute('aria-pressed', 'true');
  workControls.hidden = false;
  crew.setWorkstation(true);
  practiceStand.visible = false;
  o.mayo.position.x = -1.61;
  tweenFov(n.matches ? 64 : 52);
  const target = workTarget();
  workWalk.goTo(workFocusPoint ? (Math.sign(workFocusPoint.x) || Math.sign(t.position.x) || 1) : (selectedRegion().side ?? (Math.sign(t.position.x) || 1)), target.z);
  updateWorkLabels();
  // No cut: the trainee steps onto the walkway and turns to the new work point; a held free instrument rides
  // along with the body meanwhile (toolField counts this as walking).
  startWorkBlend();
  positionAtWork();
  steerWork(true);
  setTraineeStatus(carry ? 'الأداة بإيدك · وجّهها إلى فتحة التدريب' : instructionForWork());
  syncDepthControls();
  revealViewport();
}
function leaveWorkstation() {
  if (!workFocused) return;
  if (forearmPractice?.session) closeForearmPractice();
  if (scopeMonitorLook) setScopeMonitorLook(false);
  if (bedside?.held !== 'tool') bedside?.cancel();
  if (crew?.toolMode === 'placed') crew.parkTool();
  toolDepth?.reset();
  abdomen?.restore();
  crew?.setSurfaceHeight(null);
  crew?.setWorkstation(false);
  workReady = false;
  workFocused = false;
  workFocusPoint = null;
  workView.steering = false;
  workBlend = null;
  updateWorkFocusLighting();
  setFocusPickMode(false);
  setLookMode(false);
  workControls.hidden = true;
  practiceStand.visible = true;
  o.mayo.position.x = -0.92;
  viewport.classList.remove('abdomen-focused');
  for (const button of abdomenButtons) button.setAttribute('aria-pressed', 'false');
  tweenFov(n.matches ? 76 : traineeDefault.fov);
  document.getElementById('camera-detail-label').textContent = 'منظور المتدرّب';
  pointerStatus.textContent = 'انقر للإمساك ثم انقر للإفلات · اسحب للالتفات';
  crew?.snapIdleHands();
  animateCrew();
}
function changeWorkSide() {
  if (!workFocused) return;
  const refusal = walkRefusal();
  if (refusal) { setTraineeStatus(refusal); return; }
  const [x] = workWalk.position();
  steerWork();
  workWalk.goTo(x >= 0 ? -1 : 1, workTarget().z);
  setTraineeStatus('عم تمشي حول السرير للجانب المقابل');
}
function tickWork(dt) {
  if (scopeMonitorLook || E) return;
  // A/D walk around the bed and W/S step closer or back; the arrow keys turn the view (turnView).
  const has = (code) => Number(traineeKeys.has(code));
  const around = has('KeyA') - has('KeyD');
  const closer = has('KeyS') - has('KeyW');
  const refusal = walkRefusal();
  if (refusal) {
    if (around || closer) notice(refusal);
    return;
  }
  if (around || closer) steerWork();
  if (around) workWalk.walk(around * dt * 0.82);
  if (closer) workWalk.approach(closer * dt * 0.39);
  // The walk advances at most one 48 Hz frame per frame, so a slow frame (the height-field rebuild on entry)
  // does not jump the trainee several centimetres.
  const walked = workWalk.update(Math.min(dt, 1 / 48), i.matches && !around);
  if (workBlend) workBlend.k = Math.min(1, workBlend.k + Math.min(dt, 1 / 48) / workBlend.duration);
  if (walked || closer || workBlend) positionAtWork();
  if (workBlend?.k === 1) workBlend = null;
  // The view turns toward the work point while walking and after arriving (at most 180°/s), keeping the
  // trainee's own look offset; a held free instrument rides with the body until the turn ends.
  updateWorkView(dt);
  if (walked && !workWalk.moving) setTraineeStatus(instructionForWork());
}

function chooseHand(side) {
  const previous = activeHand;
  activeHand = side;
  // The hand that is no longer active drops the forearm collision object unless it is still in a gesture.
  if (crew && previous !== side && bedside?.holder !== previous) crew.setForearmContact(previous,null);
  if (previous !== side && nabdSimulation.snapshot().sessionId) {
    nabdSimulation.record('hand_changed', { hand: side, metadata: { from: previous, to: side } });
  }
  for (const name of ['left', 'right']) document.getElementById('trainee-reach-' + name).setAttribute('aria-pressed', String(name === side));
}
const depthControls = document.getElementById('tool-depth-controls');
const depthValue = document.getElementById('tool-depth-value');
const depthState = document.getElementById('tool-depth-state');
const depthButtons = Array.from(document.querySelectorAll('[data-tool-depth]'));
const rollButtons = Array.from(document.querySelectorAll('[data-tool-roll]'));
const angleValue = document.getElementById('tool-angle-value');
const showBodyPoints = document.getElementById('show-body-points');
let toolDepth = null;
function trainingPort() {
  if (!workFocused || !workReady || workInMotion() || workRegion.value !== 'abdomen' || !crew.supportsDepth) return null;
  return workTarget();
}
const scopePanel = document.getElementById('scope-station');
const scopeViewButton = document.getElementById('scope-view');
const scopeMonitorControls = document.getElementById('scope-monitor-controls');
const scopeSignal = document.getElementById('scope-signal');
function scopeStationReady() {
  return traineeMode && workFocused && workReady && workRegion.value === 'abdomen'
    && crew?.selectedTool === 'scope' && !workInMotion();
}
// Looking at the scope monitor: the view narrows and aims so the field display fills the free band between
// the buttons and status at the top of the view and the controls docked at the bottom (at most two thirds of
// the view height and 90 % of its width). The field view's FOV comes back on return.
let monitorFieldFov = null;
function frameMonitor(screen) {
  syncScopeStation();
  const box = s.domElement.getBoundingClientRect();
  let top = box.top + box.height * 0.04;
  for (const element of viewport.querySelectorAll('.viewport-tools, .viewport-caption, .viewport-info')) {
    const rect = element.getBoundingClientRect();
    if (rect.height > 0 && rect.top < box.top + box.height / 2) top = Math.max(top, rect.bottom + 6);
  }
  const bottom = Math.min(box.bottom, viewport.querySelector('.viewport-dock').getBoundingClientRect().top) - 8;
  const band = Pt.clamp((bottom - top) / box.height, 0.35, 1);
  const { width, height } = screen.geometry.parameters;
  let tanX = 0, tanY = 0;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const corner = t.worldToLocal(screen.localToWorld(new L(sx * width / 2, sy * height / 2, 0)));
    if (corner.z > -0.05) return;
    tanX = Math.max(tanX, Math.abs(corner.x / corner.z));
    tanY = Math.max(tanY, Math.abs(corner.y / corner.z));
  }
  const fill = Math.min(0.66, 0.94 * band);
  const half = Math.max(tanY / fill, tanX / (0.9 * t.aspect));
  t.fov = Pt.clamp(Pt.radToDeg(2 * Math.atan(half)), 12, t.fov);
  t.updateProjectionMatrix();
  // Aim so the display's centre sits in the middle of the band.
  const centre = 1 - 2 * ((top + bottom) / 2 - box.top) / box.height;
  traineePitch -= Math.atan(centre * Math.tan(Pt.degToRad(t.fov) / 2));
  applyTraineeRotation();
}
function setScopeMonitorLook(active) {
  if (active && !scopeStationReady()) return;
  scopeMonitorLook = active;
  viewport.classList.toggle('scope-monitor-look', active);
  crew.setMonitorView(active);
  bedside?.pauseManipulation();
  traineeFocusTransition = null;
  traineeKeys.clear();
  finishFovTween();
  if (!active && monitorFieldFov !== null) {
    t.fov = monitorFieldFov;
    monitorFieldFov = null;
    t.updateProjectionMatrix();
  }
  if (active) {
    setLookMode(false);
    setFocusPickMode(false);
    crew.freezeToolGrip();
    const side = Math.sign(t.position.x) || 1;
    const screen = o.fieldDisplays.find((display) => display.side === -side).screen;
    const direction = screen.getWorldPosition(new L()).sub(t.position).normalize();
    traineeYaw = Math.atan2(-direction.x, -direction.z);
    traineePitch = Math.asin(direction.y);
    applyTraineeRotation();
    monitorFieldFov ??= t.fov;
    frameMonitor(screen);
    document.getElementById('camera-detail-label').textContent = 'شاشة المنظار';
    setTraineeStatus('تنظر إلى الشاشة · استخدم أزرار العمق والدوران');
  } else if (workFocused) {
    positionAtWork('snap');
    document.getElementById('camera-detail-label').textContent = selectedRegion().title;
    setTraineeStatus(bedside?.held === 'tool' ? 'الأداة بإيدك · حرّك المؤشر لتوجيهها' : instructionForWork());
  }
  if (nabdSimulation.snapshot().sessionId) {
    nabdSimulation.record('camera_changed', { metadata: { view: active ? 'scope-monitor' : 'work-field' } });
  }
  I = true;
}
function syncScopeStation() {
  const show = scopeStationReady();
  if (!show && scopeMonitorLook) setScopeMonitorLook(false);
  scopePanel.hidden = !show;
  scopeMonitorControls.hidden = !scopeMonitorLook || bedside?.held !== 'tool';
  for (const { mount } of o.fieldDisplays) mount.visible = show;
  if (!show) return;
  const live = scopeFeed.live;
  scopePanel.dataset.live = String(live);
  const label = live ? 'صورة مباشرة' : 'بانتظار إدخال المنظار';
  if (scopeSignal.textContent !== label) scopeSignal.textContent = label;
  const action = scopeMonitorLook ? 'ارجع إلى الحقل' : 'انظر إلى الشاشة';
  if (scopeViewButton.textContent !== action) scopeViewButton.textContent = action;
  scopeViewButton.setAttribute('aria-pressed', String(scopeMonitorLook));
}
scopeViewButton.addEventListener('click', () => setScopeMonitorLook(!scopeMonitorLook));

function syncDepthControls() {
  workRegion.disabled = Boolean(toolDepth?.inserted);
  const held = bedside?.held === 'tool';
  depthControls.hidden = !held;
  if (!held) return;
  const port = trainingPort();
  const value = port ? `${toolDepth.percent}%` : '—';
  if (depthValue.textContent !== value) depthValue.textContent = value;
  const screenDepth = document.getElementById('scope-monitor-depth');
  if (screenDepth.textContent !== value) screenDepth.textContent = value;
  if (angleValue) { const a = toolDepth.angles; angleValue.textContent = `Pitch ${a.pitch}° · Yaw ${a.yaw}° · Roll ${a.roll}°`; }
  // reachLost: the hand cannot hold the tool at that pose from here (standing back, D-03).
  const message = !crew.supportsDepth ? 'الإدخال التدريبي متاح للملقط والمنظار'
    : !port ? 'افتح منطقة البطن لتوجيه الأداة'
    : toolDepth.reachLost ? reachLostText
    : toolDepth.aligned ? 'طرف الأداة بمحاذاة الفتحة التدريبية'
    : 'وجّه طرف الأداة نحو حلقة فتحة التدريب';
  if (depthState.textContent !== message) depthState.textContent = message;
  // Back within reach: the reach notice gives way to the instruction.
  if (port && !toolDepth.reachLost && traineeStatus.textContent === reachLostText) setTraineeStatus(instructionForWork());
  document.getElementById('open-tool-field').hidden = !['idle','complete'].includes(phase);
  for (const button of depthButtons) {
    const inward = Number(button.dataset.toolDepth) > 0;
    button.disabled = !port || !toolDepth.aligned || (inward && toolDepth.reachLost) || (inward ? toolDepth.percent === 100 : toolDepth.percent === 0);
  }
  // At the ±90° roll limit the buttons for that direction switch off.
  for (const button of rollButtons) {
    button.disabled = !port || !toolDepth.aligned || toolDepth.reachLost || Math.sign(Number(button.dataset.toolRoll)) === toolDepth.rollLimit;
  }
}
function adjustDepth(delta) {
  if (bedside?.held !== 'tool') return;
  if (!trainingPort()) { setTraineeStatus('العمق متاح عند فتحة التدريب في منطقة البطن'); return; }
  if (!toolDepth.adjust(delta)) setTraineeStatus(toolDepth.reachLost ? reachLostText : 'وجّه الطرف إلى فتحة التدريب أولًا');
  animateCrew(360);
}
for (const button of depthButtons) button.addEventListener('click', () => adjustDepth(Number(button.dataset.toolDepth) * 0.012));
function adjustRoll(delta) {
  if (bedside?.held !== 'tool' || !toolDepth) return;
  if (!trainingPort()) { setTraineeStatus('اللفّ متاح عند فتحة التدريب في منطقة البطن'); return; }
  if (Math.sign(delta) === toolDepth.rollLimit) { setTraineeStatus('وصل لفّ الأداة لحدّه · 90°'); return; }
  if (toolDepth.adjustRoll(delta)) animateCrew(360);
  else setTraineeStatus(toolDepth.reachLost ? reachLostText : 'وجّه الطرف إلى فتحة التدريب أولًا');
}
for (const button of rollButtons) button.addEventListener('click', () => adjustRoll(Number(button.dataset.toolRoll) * Math.PI / 12));
document.getElementById('trainee-tray-view').addEventListener('click', () => {
  if (bedside?.active) { setTraineeStatus('فلّت الهدف أولًا للرجوع للصينية'); return; }
  focusTraineeArea('practice');
});
document.getElementById('open-tool-field').addEventListener('click', () => selectWork('abdomen'));
document.getElementById('release-held').addEventListener('click', () => bedside?.release());
showBodyPoints.addEventListener('change', () => { I = true; });
const toggleFocusPicker = () => {
  if (bedside?.held === 'tool' && toolDepth?.inserted) { setTraineeStatus('اسحب الأداة خارج منفذ الإدخال قبل تغيير نقطة العمل'); return; }
  if (!focusPickMode && (b !== 'supine' || E)) G('supine');
  setFocusPickMode(!focusPickMode);
};
document.getElementById('trainee-pick-focus').addEventListener('click', toggleFocusPicker);
document.getElementById('trainee-look-mode').addEventListener('click', () => setLookMode(!lookMode));
// ↺/↻: hold to keep turning; a short press or a keyboard click turns 15°.
for (const button of document.querySelectorAll('[data-look-turn]')) {
  const dir = Number(button.dataset.lookTurn);
  button.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    button.setPointerCapture?.(ev.pointerId);
    startViewTurn(dir, true);
  });
  const stop = () => { if (viewTurn.dir === dir) viewTurn.held = false; };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, stop);
  button.addEventListener('click', (ev) => { if (ev.detail === 0) startViewTurn(dir, false); });
  button.addEventListener('contextmenu', (ev) => ev.preventDefault());
}
document.getElementById('pick-focus-point').addEventListener('click', toggleFocusPicker);
for (const button of [document.getElementById('recenter-work-focus'), document.getElementById('trainee-recenter-focus')]) button.addEventListener('click', recenterWorkFocus);

const practiceHeight = 1.245;
const interactionSource = document.getElementById('training-source');
const resultPanel = document.getElementById('training-results');
const checklist = Array.from(document.querySelectorAll('[data-check]'));
const feedback = document.getElementById('training-feedback');
const motion = { checked: new Set(), retries: 0, wristLift: 0 };
const nearArm = () => g.chains.find(({ id }) => id === 'leftArm');
const getWrist = (chain = nearArm()) => chain.joints[2].getWorldPosition(new L());
const trayRest = () => crew.trayPose.position;
const aimPoint = new L(0.109, practiceHeight, -0.12);
const staffExercise = () => interactionSource.value === 'staff';

function createPracticeTray() {
  const stand = new Mt();
  stand.name = 'Trainee practice tray';
  stand.position.set(0.50, 0, 0.44);
  const steel = new Ut({ color: 0x85969a, roughness: 0.35, metalness: 0.58 });
  const mat = new Ut({ color: 0x255e61, roughness: 0.8 });
  const slot = new Ut({ color: 0x6baba7, roughness: 0.78 });
  vt(stand, [0.255, 0.026, 0.35], [0, 1.102, 0], steel, 0.015);
  vt(stand, [0.236, 0.009, 0.326], [0, 1.117, 0], mat, 0.012, false);
  vt(stand, [0.062, 0.003, 0.292], [0, 1.123, -0.016], slot, 0.009, false);
  ll(stand, [0, 0.09, 0], [0, 1.085, 0], 0.021, steel);
  vt(stand, [0.22, 0.05, 0.26], [0, 0.055, 0], steel, 0.018);
  e.add(stand);
  return stand;
}
const practiceStand = createPracticeTray();

const limbLimits = new Map();
const limbSettles = new Map();
// Each patient skin gets one fixed bounding sphere, enlarged by how far a moved limb can reach
// (0.4 m), assigned once. Nulling it after every limb move made three.js re-skin every patient
// vertex on the next frame (depth sort and raycast), which halved the frame rate during limb drags.
// Each skin also keeps its skinned vertices between picks (SkinPickCache): a pointer pick re-skinned
// every vertex about six times and took ~40 ms, which held plain mouse movement to ~25 fps.
function fixPatientSkinBounds() {
  g.root.updateMatrixWorld(true);
  for (const skin of g.skins) {
    if (!skin.isSkinnedMesh) continue;
    skin.computeBoundingSphere();
    const sphere = skin.boundingSphere.clone();
    sphere.radius += 0.4 / (skin.matrixWorld.getMaxScaleOnAxis() || 1);
    skin.boundingSphere = sphere;
    skin.boundingBox = null;
    installSkinPickCache(skin);
  }
}
function createLimbDrag(chain, jointIndex = 2) {
  const [upper, lower, wrist] = chain.joints;
  const start = upper.getWorldPosition(new L()), middle = lower.getWorldPosition(new L()), tip = getWrist(chain);
  const forward = Gi(start, tip);
  const bend = Pa(middle.clone().sub(start), forward);
  const defaultPole = new L(chain.side * 0.75, chain.kind === 'leg' ? 0.85 : 0, -0.6).applyQuaternion(g.root.getWorldQuaternion(new tt()));
  const grip = jointIndex === 1 ? middle : tip;
  const direction = Gi(start,middle);
  if (!limbLimits.has(chain)) limbLimits.set(chain,direction.clone());
  const reference = {
    chain, role: jointIndex === 1 ? 'joint' : 'tip', start, middle, tip, direction,
    limitDirection: limbLimits.get(chain), lastTarget: grip.clone(),
    upperLength: start.distanceTo(middle), lowerLength: middle.distanceTo(tip),
    pole: bend.lengthSq() > 4e-4 ? bend.normalize() : defaultPole.normalize(), limits: dd[chain.kind],
    upperRotation: upper.quaternion.clone(), lowerRotation: lower.quaternion.clone(),
    maxPenetration: pd(start, { middle, tip }, chain.kind, $) + 0.004,
  };
  return {
    chain, jointIndex, initial: grip,
    move(desired) {
      const solution = A0(desired, reference, $);
      if (!solution) return null;
      w0(reference, solution.solution);
      reference.lastTarget.copy(solution.target);
      return chain.joints[jointIndex].getWorldPosition(new L());
    },
    restore() {
      upper.quaternion.copy(reference.upperRotation);
      lower.quaternion.copy(reference.lowerRotation);
      g.root.updateMatrixWorld(true);
    },
    // Turn both segments part of the way (amount 0…1) back to their resting rotations; returns the
    // larger remaining angle in radians.
    easeToRest(amount) {
      upper.quaternion.slerp(reference.upperRotation, amount);
      lower.quaternion.slerp(reference.lowerRotation, amount);
      g.root.updateMatrixWorld(true);
      return Math.max(upper.quaternion.angleTo(reference.upperRotation), lower.quaternion.angleTo(reference.lowerRotation));
    },
  };
}
// A released patient limb settles back to where it lay: the gripped joint eases home at most 0.32 m/s
// (as in the forearm drill) and slows down over its last few centimetres (not below 4 cm/s). Within
// 0.5 mm (or after 3 s) both segments turn the rest of the way to their resting rotations over about
// 0.15 s, so the elbow or knee does not pop. A grab during settling takes the limb over and keeps the
// original resting pose.
const limbSettleSpeed = 0.32, limbSettleEase = 6, limbSettleSlowest = 0.04, limbSettleDone = 0.0005, limbSettleLongest = 3000;
const limbSettleTurnRate = 18, limbSettleTurnDone = 0.002;
function startPatientLimb(chain, jointIndex = 2) {
  const settling = limbSettles.get(chain);
  limbSettles.delete(chain);
  const limb = createLimbDrag(chain, jointIndex);
  limb.rest = settling?.rest ?? limb;
  if (settling) limb.initial = restingJoint(settling.rest, chain, jointIndex);
  return limb;
}
function restingJoint(rest, chain, jointIndex) {
  const [upper, lower] = chain.joints;
  const pose = [upper.quaternion.clone(), lower.quaternion.clone()];
  rest.restore();
  const point = chain.joints[jointIndex].getWorldPosition(new L());
  upper.quaternion.copy(pose[0]);
  lower.quaternion.copy(pose[1]);
  g.root.updateMatrixWorld(true);
  return point;
}
function settleLimb(limb) {
  if (!limb?.chain) return;
  limbSettles.set(limb.chain, { limb, rest: limb.rest ?? limb, goal: limb.initial.clone(), started: performance.now() });
  I = true;
}
let limbFieldStale = false;
function endLimbSettle(chain, entry) {
  entry.rest.restore();
  limbSettles.delete(chain);
  limbFieldStale = true;
  I = true;
}
function finishLimbSettles() {
  for (const [chain, entry] of limbSettles) endLimbSettle(chain, entry);
}
function updateLimbSettles(dt) {
  // The work-area height field is rebuilt once, when every released limb lies on the bed again, and not
  // under a hand that is touching the skin (a rebuild resets the abdominal dent).
  if (limbFieldStale && !limbSettles.size && !bedside?.active) {
    limbFieldStale = false;
    if (workFocused) workReady = false;
  }
  if (!limbSettles.size || E) return;
  if (!traineeMode || patientPositioning) { finishLimbSettles(); return; }
  // A reach in progress (it may be for a settling limb) holds them still, as in the forearm drill.
  if (bedside?.active && !bedside.held) return;
  for (const [chain, entry] of limbSettles) {
    if (!entry.turning) {
      const joint = chain.joints[entry.limb.jointIndex].getWorldPosition(new L());
      const step = entry.goal.clone().sub(joint);
      const distance = step.length();
      const speed = Math.min(limbSettleSpeed, Math.max(limbSettleSlowest, distance * limbSettleEase));
      const late = performance.now() - entry.started > limbSettleLongest;
      if (distance >= limbSettleDone && !late && entry.limb.move(joint.add(step.setLength(Math.min(distance, speed * dt))))) continue;
      entry.turning = true;
    }
    if (entry.rest.easeToRest(1 - Math.exp(-dt * limbSettleTurnRate)) < limbSettleTurnDone) endLimbSettle(chain, entry);
  }
  I = true;
}

function openForearmPractice() {
  selectWork('leftArm');
  if (!workFocused || workRegion.value !== 'leftArm') return;
  // The drill takes the arm's resting pose from here: a limb still settling lies down at once.
  finishLimbSettles();
  const chain = nearArm();
  const collision = createForearmContact({
    physics: forearmPractice.physics, Vector3:L, Quaternion:tt, chain,
    bed: { width:Un.halfWidth, length:Un.halfLength, height:() => m },
  });
  forearmPractice.session = {
    chain, collision, rest:null, settling:null, support:false,
    takeOver() { this.settling = null; },
    release(limb) {
      this.settling = limb;
      if (crew.forearmSupportGap === null || crew.forearmSupportGap >= .020) {
        this.support = false;
        forearmAssist.setAttribute('aria-pressed','false');
        forearmAssist.textContent = 'اطلب مساندة المشرف';
      }
      animateCrew(900);
    },
  };
  forearmButton.setAttribute('aria-pressed','true');
  forearmActions.hidden = false;
  forearmFeedback.textContent = '';
  updateWorkLabels();
  setTraineeStatus(instructionForWork());
}
function resetForearmPractice() {
  const station = forearmPractice?.session;
  if (!station) return;
  bedside.cancel();
  station.rest?.restore();
  station.settling = null;
  station.support = false;
  forearmAssist.setAttribute('aria-pressed','false');
  forearmAssist.textContent = 'اطلب مساندة المشرف';
  forearmFeedback.textContent = '';
  for (const side of ['left','right']) crew.setForearmContact(side,null);
  crew.setForearmSupport(null);
  animateCrew(600);
}
function closeForearmPractice() {
  resetForearmPractice();
  forearmPractice.session = null;
  forearmButton.setAttribute('aria-pressed','false');
  forearmActions.hidden = true;
  updateWorkLabels();
}
forearmButton.addEventListener('click', () => {
  if (forearmPractice?.session) { closeForearmPractice(); setTraineeStatus(instructionForWork()); return; }
  if (forearmPractice) openForearmPractice();
});
document.getElementById('forearm-reset').addEventListener('click',resetForearmPractice);
forearmAssist.addEventListener('click', () => {
  const station = forearmPractice?.session;
  if (!station || forearmAssist.disabled) return;
  station.support = !station.support;
  forearmAssist.setAttribute('aria-pressed',String(station.support));
  forearmAssist.textContent = station.support ? 'إنهاء المساندة' : 'اطلب مساندة المشرف';
  animateCrew(900);
});
function updateForearmPractice(dt) {
  const station = forearmPractice?.session;
  if (!station || E || !workReady) return;
  station.rest ??= createLimbDrag(station.chain);
  const [,,wrist] = station.chain.joints;
  if (station.settling && !station.support && !bedside.active) {
    const current = wrist.getWorldPosition(new L());
    const step = station.rest.initial.clone().sub(current);
    if (step.length() < .003) {
      station.rest.restore();
      station.settling = null;
    } else {
      station.settling.move(current.add(step.clampLength(0,.32 * dt)));
    }
    I = true;
  }
  station.collision.refresh();
  const elbow = station.chain.joints[1].getWorldPosition(new L());
  const point = wrist.getWorldPosition(new L()).lerp(elbow,.53).add(new L(0,.027,0));
  crew.setForearmSupport(station.support ? { point, side:-Math.sign(t.position.x || 1) } : null);
  forearmAssist.disabled = !station.support && bedside.forearmState !== 'gripped';
  const label = station.support
    ? (crew.forearmSupportGap !== null && crew.forearmSupportGap < .020 ? 'المشرف مسنّد الساعد' : 'إيد المشرف بتقرب من الساعد')
    : station.settling ? 'الساعد عم يرجع للتخت' : '';
  if (forearmFeedback.textContent !== label) forearmFeedback.textContent = label;
}

function mark(name) {
  motion.checked.add(name);
  const item = checklist.find((entry) => entry.dataset.check === name);
  item?.classList.add('checked');
  if (nabdSimulation.snapshot().sessionId) {
    nabdSimulation.record('checklist_item_completed', { metadata: { checkId: name, label: item?.textContent?.trim() ?? name } });
  }
}
function showFeedback(message) {
  feedback.textContent = message;
  setTraineeStatus(message);
}
function resetTool() {
  if (staffExercise() && phase !== 'idle' && phase !== 'complete') {
    crew.setMode('offered');
    animateCrew(1450);
  } else crew.parkTool();
}
const holdPausedText = 'الطرف ثابت · اسحب لتكمل تحريكه أو انقر للإفلات';
let heldStatus = '';
function interactionEvent(type, grip, cancelled) {
  if (nabdSimulation.snapshot().sessionId) {
    const toolId = crew?.selectedTool ?? toolSelect.value;
    const contact = grip?.contact?.toArray?.() ?? grip?.point?.toArray?.() ?? null;
    if (type === 'attached' && grip?.kind === 'tool') {
      nabdSimulation.record('instrument_picked', { instrument: toolId, hand: grip.side, target: 'instrument_handle', metadata: { contact, toolMode: crew?.toolMode } });
    } else if (type === 'release' && grip?.kind === 'tool') {
      nabdSimulation.record('instrument_released', { instrument: toolId, hand: grip.side, target: 'instrument', success: !cancelled, metadata: { cancelled: Boolean(cancelled), toolMode: crew?.toolMode } });
    } else if (type === 'attached' && grip && grip.kind !== 'tool') {
      nabdSimulation.record('patient_interaction', { hand: grip.side, target: grip.kind, metadata: { action: 'contact_attached', region: workFocused ? workRegion.value : null, contact, stationGrip: Boolean(grip.stationGrip) } });
    } else if (type === 'release' && grip && grip.kind !== 'tool' && grip.attached) {
      nabdSimulation.record('patient_interaction', { hand: grip.side, target: grip.kind, success: !cancelled, metadata: { action: 'contact_released', cancelled: Boolean(cancelled), region: workFocused ? workRegion.value : null, contact } });
    } else if (type === 'outOfReach' || type === 'noContact') {
      // noContact: the target was in reach but the fingers never touched it before the hold timeout (B6).
      const reason = type === 'noContact' ? 'no_contact' : 'out_of_reach';
      if (grip?.kind === 'tool') {
        nabdSimulation.record('instrument_pick_failed', { instrument: toolId, hand: grip.side ?? activeHand, target: 'instrument_handle', success: false, metadata: { reason } });
      } else {
        nabdSimulation.record('interaction_error', { hand: grip?.side ?? activeHand, target: grip?.kind ?? null, success: false, metadata: { reason } });
      }
    }
  }
  if (type === 'noContact') {
    // The reach ended without a touch (after the release event, so this text stays).
    const text = grip?.forearm ? 'تعذّر الإمساك من هذه الزاوية · انقر أعلى الرسغ'
      : grip?.kind === 'wrist' ? 'تعذّر الإمساك من هذه الزاوية · جرّب نقطة أخرى'
      : grip?.kind === 'tool' ? 'لم تُمسك اليد الأداة · انقر على المقبض مرة أخرى'
      : 'لم تصل الأصابع إلى الجلد · جرّب نقطة أخرى أو اقترب';
    if (workFocused) setTraineeStatus(text); else showFeedback(text);
    return;
  }
  if (type === 'busy') {
    // A press while the hands cannot act yet (walking, turning, a pose change).
    setTraineeStatus(E ? 'انتظر حتى تنتهي حركة المريض'
      : patientPositioning ? 'أنهِ تحريك الأطراف أولًا'
      : 'انتظر حتى تنتهي الحركة');
    return;
  }
  if (type === 'holdPaused') {
    // The mouse left the 3D view while holding a limb: the limb stays put until a press on the view.
    heldStatus = traineeStatus.textContent;
    setTraineeStatus(holdPausedText);
    return;
  }
  if (type === 'holdResumed') {
    if (traineeStatus.textContent === holdPausedText && heldStatus) setTraineeStatus(heldStatus);
    heldStatus = '';
    return;
  }
  if (grip?.kind === 'tool') {
    if (type === 'attached') {
      const docked = crew.toolMode === 'placed';
      crew.holdTool(grip.side);
      if (!docked) toolDepth.reset();
      toolSelect.disabled = true;
      setTraineeStatus('الأداة بإيدك · انقر مرة ثانية للإفلات');
      syncDepthControls();
    } else if (type === 'release') {
      syncDepthControls();
      toolSelect.disabled = !['idle','complete'].includes(phase);
    }
    if (workFocused) return;
  }
  if (workFocused) {
    if (type === 'outOfReach') setTraineeStatus('خارج مدى الإيد · غيّر وقفتك أو اقترب');
    if (type === 'reach') setTraineeStatus('الإيد بتقرب من نقطة التلامس');
    if (type === 'attached') {
      const label = { abdomen: 'السطح بين الأصابع · اسحب برفق', press: 'جسّ خفيف · الأصابع لامست السطح',
        touch: 'الأصابع لامست سطح المريض', wrist: 'تم إمساك الطرف · حرّكه ضمن مداه' };
      setTraineeStatus(label[grip.kind]);
    }
    if (type === 'release') {
      // The limb settles back onto the bed; the height field is rebuilt once it is down.
      if (grip.kind === 'wrist' && !grip.forearm) settleLimb(grip.limb);
      setTraineeStatus(grip.attached ? 'تم الإفلات · ' + instructionForWork() : instructionForWork());
      animateCrew(520);
    }
    return;
  }
  if (type === 'outOfReach') {
    showFeedback('الهدف خارج مدى إيدك. قرّب وقفتك من السرير.');
    return;
  }
  if (type === 'lookFromPress') {
    // A touch on the skin turned into a drag: the hand goes back and the view turns instead.
    setTraineeStatus('واقف بجانب المريض');
    return;
  }
  if (type === 'reach') {
    traineeFocusTransition = null;
    if (grip.kind === 'surface') setTraineeStatus('لمس سطح المريض');
    else setTraineeStatus('خليك ضاغط لحد ما الإيد تمسك');
    return;
  }
  if (type === 'attached') {
    if (grip.kind === 'tool') {
      if (phase === 'pickup') {
        mark('pickup');
        setPhase('aim');
      }
      showFeedback('الأداة ثابتة بإيدك · حرّك المؤشر لتوجيهها');
    } else {
      motion.wristLift = 0;
      showFeedback('مسكت الرسغ · ارفعه وبعدين رجّعه بهدوء');
    }
    return;
  }
  if (type === 'motion') {
    if (grip.kind === 'tool' && phase === 'aim' && crew.getToolTip().distanceTo(aimPoint) <= 0.052) {
      mark('aim');
      if (staffExercise()) {
        crew.setMode('returning');
        animateCrew(1450);
      }
      setPhase('deposit');
      showFeedback(staffExercise() ? 'وصلت للهدف · ارجع باتجاه إيد المشرف' : 'وصلت للهدف · ارجع فوق الصينية');
    }
    if (grip.kind === 'wrist' && phase === 'wrist' && grip.chain === nearArm()) {
      const lift = getWrist(grip.chain).y - grip.limb.initial.y;
      if (lift > motion.wristLift) motion.wristLift = lift;
      const hint = motion.wristLift >= 0.052 ? 'تم الرفع · نزّل الرسغ لمكانه وبعدين فلّت' : 'ارفع الرسغ شوي مع استمرار الضغط';
      if (feedback.textContent !== hint) showFeedback(hint);
    }
    return;
  }
  if (grip.kind === 'tool') {
    const destination = staffExercise() && phase === 'deposit' ? crew.offeringPoint() : trayRest();
    const difference = crew.tool.position.clone().sub(destination);
    const closeEnough = Math.hypot(difference.x, difference.z) < (staffExercise() ? 0.10 : 0.088) && Math.abs(difference.y) < 0.18;
    if (!cancelled && phase === 'deposit' && closeEnough) {
      if (staffExercise()) { crew.setMode('returned'); animateCrew(1200); }
      else crew.parkTool();
      setPhase('wrist');
      mark('deposit');
      focusTraineeArea('wrist');
      showFeedback('تم إرجاع الأداة · دورك ترفع رسغ المريض وترجعه');
    } else {
      resetTool();
      if (phase === 'aim' || phase === 'deposit') {
        motion.retries++;
        setPhase('pickup');
        showFeedback(cancelled ? 'أُلغي السحب ورجعت الأداة. جرّب مرة ثانية.' : 'أفلَتّ الأداة قبل الإرجاع. كرّر الالتقاط والتوجيه.');
      } else if (!cancelled) showFeedback('رجعت الأداة للصينية');
    }
    return;
  }
  // Step 5 is scored where the wrist was let go; then the limb settles back onto the bed.
  if (phase === 'wrist' && grip.chain === nearArm()) {
    if (!cancelled && motion.wristLift >= 0.052 && getWrist(grip.chain).distanceTo(grip.limb.initial) < 0.045) {
      mark('wrist');
      setPhase('complete');
      showFeedback('أنهيت التمرين · ثبّتت القبضة ووجّهت الأداة وحرّكت الرسغ');
    } else {
      motion.retries++;
      showFeedback('ارفع الرسغ أول، بعدين رجّعه لمكانه قبل ما تفلّت.');
    }
  }
  settleLimb(grip.limb);
}

function setPhase(next) {
  phase = next;
  nabdSimulation.setStage(next, { scenario: interactionSource.value });
  const active = !['idle', 'complete'].includes(next);
  const steps = {
    idle: ['', 'ابدأ تمرين الإمساك والتوجيه، أو جرّب إيديك بحرية بجانب السرير.', 'ابدأ التدريب'],
    monitor: ['1 / 5', 'افتح الشاشة وحدّد رمز تشبّع الأكسجين.', 'افتح الشاشة'],
    pickup: ['2 / 5', staffExercise() ? 'انقر على مقبض الأداة بإيد المشرف.' : 'انقر على مقبض الأداة بالصينية.', 'أرني المقبض'],
    aim: ['3 / 5', 'حرّك المؤشر لحد ما يصل طرف الأداة للحلقة.', 'وجّه الطرف للحلقة'],
    deposit: ['4 / 5', staffExercise() ? 'حرّك المقبض فوق إيد المشرف، ثم انقر للإفلات.' : 'حرّك الأداة فوق الصينية، ثم انقر للإفلات.', 'أعد الأداة'],
    wrist: ['5 / 5', 'اضغط على رسغ المريض المحدّد. ارفعه، رجّعه لمكانه، وبعدين فلّت.', 'أرني الرسغ'],
    complete: ['5 / 5', 'اكتملت المهارات الخمس. راجع النتيجة أو جرّب التدريب مرة ثانية.', 'أعد التدريب'],
  };
  const [count, instruction, label] = steps[next];
  document.getElementById('training-count').textContent = count;
  document.getElementById('training-instruction').textContent = instruction;
  action.textContent = label;
  action.disabled = !crew || ['aim', 'deposit'].includes(next);
  toolSelect.disabled = !crew || active;
  interactionSource.disabled = !crew || active;
  resetTraining.hidden = next === 'idle';
  document.getElementById('vitals-question').hidden = next !== 'monitor';
  for (const button of document.querySelectorAll('[data-pose]')) button.disabled = active || !g;
  positioningButton.disabled = active;
  for (const button of abdomenButtons) button.disabled = active || !abdomen;
  for (const button of document.querySelectorAll('[data-region-shortcut]')) button.disabled = active || !abdomen;
  const toolButton = document.getElementById('trainee-tool');
  toolButton.textContent = label;
  toolButton.disabled = action.disabled;
  resultPanel.hidden = next !== 'complete';
  if (next === 'complete') resultPanel.textContent = `${motion.checked.size} من 5 مهارات مكتملة · محاولات الإعادة ${motion.retries}`;
  I = true;
}

function clearScenario({ preserveSession = false } = {}) {
  if (!preserveSession) nabdSimulation.reset({ clearEvents: true });
  leaveWorkstation();
  bedside?.cancel();
  crew?.parkTool();
  toolDepth?.reset();
  motion.checked.clear();
  motion.retries = 0;
  motion.wristLift = 0;
  for (const item of checklist) item.classList.remove('checked');
  feedback.textContent = '';
  setPhase('idle');
}
function startScenario() {
  clearScenario({ preserveSession: true });
  nabdSimulation.startSession({ scenario: 'clinical-skills-practice', source: interactionSource.value, instrument: toolSelect.value });
  if (!traineeMode) enterTraineeMode();
  setPatientPositioning(false);
  // Only tween the pose when it is needed: the tween blocks hand input for about 0.8 s.
  if (b !== 'supine' || E) G('supine');
  focusTraineeArea('practice');
  setPhase('monitor');
}
function confirmOxygen(correct) {
  if (phase !== 'monitor') return;
  if (!correct) {
    motion.retries++;
    document.getElementById('vitals-answer').textContent = 'دور على الرمز اللي جنب قراءة تشبّع الأكسجين.';
    return;
  }
  vitals.dialog.close();
  mark('monitor');
  setPhase('pickup');
  resetTool();
  focusTraineeArea(staffExercise() ? 'handoff' : 'practice');
  showFeedback('قراءة تشبّع الأكسجين صحيحة. هسّا امسك مقبض الأداة.');
  revealViewport();
}
function handleAction() {
  if (!crew) return;
  if (['idle', 'complete'].includes(phase)) startScenario();
  else if (phase === 'monitor') openMonitor();
  else if (phase === 'pickup' || phase === 'wrist') {
    if (!traineeMode) enterTraineeMode();
    focusTraineeArea(phase === 'wrist' ? 'wrist' : staffExercise() ? 'handoff' : 'practice');
  }
  revealViewport();
}
// In the one-column layout (≤ 650 px) the step buttons sit below the 3D view. After a step,
// bring the view back on screen so the trainee sees what the step changed.
function revealViewport() {
  if (!n.matches) return;
  const box = viewport.getBoundingClientRect();
  if (box.top >= 0 && box.bottom <= window.innerHeight) return;
  viewport.scrollIntoView({ block: 'nearest', behavior: i.matches ? 'auto' : 'smooth' });
}
function openMonitor() {
  if (!bedside?.held) bedside?.cancel();
  document.getElementById('vitals-answer').textContent = '';
  vitals.show();
}
function markerWorld() {
  if (workFocused && bedside?.held === 'tool') return trainingPort();
  if (workFocused) return bedside?.held ? (abdomen.contact() ?? bedside.contact) : workTarget();
  if (phase === 'pickup' && (!staffExercise() || crew.offerProgress > 0.92)) return crew.tool.position;
  if (phase === 'aim') return aimPoint;
  if (phase === 'deposit') return staffExercise() ? crew.offeringPoint() : trayRest();
  if (phase === 'wrist') return getWrist();
  return null;
}
// QA: how high the instrument tip is above the skin under it (Infinity off the body).
function toolTipClearance() {
  const tip = crew.getToolTip();
  return tip.y - abdomen.height(tip.x, tip.z);
}
function screenPoint(world) {
  const position = world.clone().project(t);
  if (position.z <= -1 || position.z >= 1 || Math.abs(position.x) > 0.98 || Math.abs(position.y) > 0.98) return null;
  const box = s.domElement.getBoundingClientRect();
  return { x: box.left + (position.x + 1) * box.width / 2, y: box.top + (1 - position.y) * box.height / 2 };
}
function drawWorkMarker() {
  const world = crew && traineeMode && !scopeMonitorLook ? markerWorld() : null;
  const position = world && screenPoint(world);
  workMarker.hidden = !position;
  if (!position) return;
  const box = viewport.getBoundingClientRect();
  workMarker.style.left = `${position.x - box.left}px`;
  workMarker.style.top = `${position.y - box.top}px`;
  workMarker.dataset.phase = workFocused ? (bedside.held === 'tool' ? 'port' : bedside.held ? 'abdomen' : 'workstation') : phase;
}
function keyboardGrip() {
  const target = workFocused && workReady ? workTarget()
    : phase === 'pickup' || phase === 'wrist' ? markerWorld() : null;
  bedside?.keyboardGrip(target && screenPoint(target));
}

action.addEventListener('click', handleAction);
toolSelect.addEventListener('change', () => {
  const previousTool = crew?.selectedTool;
  bedside?.cancel();
  if (crew?.toolMode === 'placed') crew.parkTool();
  toolDepth?.reset();
  crew?.selectTool(toolSelect.value);
  if (previousTool !== toolSelect.value && nabdSimulation.snapshot().sessionId) {
    nabdSimulation.record('instrument_selected', { instrument: toolSelect.value, metadata: { from: previousTool ?? null, to: toolSelect.value } });
  }
  I = true;
});
resetTraining.addEventListener('click', clearScenario);
document.getElementById('open-vitals').addEventListener('click', openMonitor);
document.getElementById('vitals-close').addEventListener('click', () => vitals.dialog.close());
confirmVitals.addEventListener('click', () => confirmOxygen(true));
for (const button of document.querySelectorAll('[data-vital-choice]')) {
  button.addEventListener('click', () => confirmOxygen(false));
}

for (const button of document.querySelectorAll('[data-step]')) {
  const movement = { head: [0, -0.18], feet: [0, 0.18], near: [-0.16, 0], back: [0.16, 0] };
  // A smooth 0.25 s step (idle hands follow the head in camera space, so no snap is needed).
  button.addEventListener('click', () => stepTo(...movement[button.dataset.step]));
}

chooseHand('right');
s.domElement.addEventListener('wheel', (ev) => {
  // At the port the wheel moves the tool in and out; out of the hand's reach it says so instead (D-03).
  if (bedside?.held === 'tool' && workFocused && (toolDepth?.aligned || (toolDepth?.reachLost && trainingPort()))) {
    ev.preventDefault();
    adjustDepth(ev.deltaY < 0 ? 0.011 : -0.011);
    return;
  }
  if (!traineeMode) return;
  // Over the 3D view the wheel always zooms and never scrolls the page away from the view.
  ev.preventDefault();
  // On the scope monitor it only moves the scope (above); the view keeps the display filling it.
  if (!ev.deltaY || scopeMonitorLook) return;
  // A held grip keeps its world position while the view zooms (same as the +/- keys).
  if (bedside?.active) bedside.pauseManipulation();
  if (workFocused) {
    t.fov = Pt.clamp(t.fov + (ev.deltaY > 0 ? 2.2 : -2.2), 38, 72);
    t.updateProjectionMatrix(); I = true;
  } else adjustTraineeZoom(ev.deltaY > 0 ? 2.5 : -2.5);
}, { passive: false });
const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
document.addEventListener('keydown', (ev) => {
  if (!traineeMode || patientPositioning || vitals.dialog.open || ev.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  const arrows = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
  if (arrows[ev.code] && bedside?.nudge(...arrows[ev.code])) {
    // A held grip takes the arrow; an arrow held from before the grab stops turning the view.
    traineeKeys.delete(ev.code);
    ev.preventDefault();
    return;
  }
  if (movementKeys.has(ev.code)) {
    traineeKeys.add(ev.code);
    ev.preventDefault();
  } else if (!ev.repeat) {
    if (ev.code === 'KeyQ') chooseHand('left');
    if (ev.code === 'KeyE') chooseHand('right');
    if (ev.code === 'KeyF') keyboardGrip();
    if (ev.code === 'KeyR') adjustDepth(0.011);
    if (ev.code === 'KeyV') adjustDepth(-0.011);
    if (ev.code === 'KeyZ') adjustRoll(-Math.PI / 24);
    if (ev.code === 'KeyX') adjustRoll(Math.PI / 24);
    if (ev.code === 'KeyL') {
      if (scopeMonitorLook) setScopeMonitorLook(false);
      else setLookMode(!lookMode);
    }
    // On the scope monitor the view keeps the display filling it (no zoom there).
    if ((ev.code === 'Equal' || ev.code === 'NumpadAdd') && !scopeMonitorLook) { bedside?.pauseManipulation(); t.fov = Pt.clamp(t.fov - 2, 38, 78); t.updateProjectionMatrix(); I = true; }
    if ((ev.code === 'Minus' || ev.code === 'NumpadSubtract') && !scopeMonitorLook) { bedside?.pauseManipulation(); t.fov = Pt.clamp(t.fov + 2, 38, 78); t.updateProjectionMatrix(); I = true; }
    if (ev.code === 'KeyG') handleAction();
    if (ev.code === 'Escape') {
      if (scopeMonitorLook) setScopeMonitorLook(false);
      // An inserted instrument stays in the port, as when the trainee lets go with a click.
      else if (bedside?.held === 'tool' && toolDepth?.inserted) bedside.release();
      else if (bedside?.active) bedside.cancel();
      // Escape does not end the forearm drill silently (F31); its own button does.
      else if (forearmPractice?.session) setTraineeStatus('لإنهاء تمرين الساعد انقر «تدريب لمس الساعد»');
      // Back to the bedside spot: a smooth walk (enterTraineeMode), not a cut.
      else if (workFocused) enterTraineeMode();
    }
  }
});
document.addEventListener('keyup', (ev) => traineeKeys.delete(ev.code));
window.addEventListener('blur', () => traineeKeys.clear());
let a=Array.from(document.querySelectorAll("[data-pose]")),c=Object.fromEntries(Object.entries({leftArm:"left-arm",rightArm:"right-arm",leftLeg:"left-leg",rightLeg:"right-leg"}).map(([k,J])=>[k,{input:document.getElementById(J),output:document.getElementById(`${J}-value`)}])),u=document.getElementById("reset-patient"),h=document.getElementById("toggle-handles"),d={room:document.getElementById("camera-room"),surgeon:document.getElementById("camera-surgeon"),anesthesia:document.getElementById("camera-anesthesia"),instruments:document.getElementById("camera-instruments"),overview:document.getElementById("camera-overview"),left:document.getElementById("camera-left"),right:document.getElementById("camera-right"),overhead:document.getElementById("camera-overhead"),torso:document.getElementById("camera-torso"),abdomen:document.getElementById("camera-abdomen"),face:document.getElementById("camera-face")},p={room:"من مدخل الغرفة",surgeon:"موقع الجرّاح",anesthesia:"منطقة التخدير",instruments:"الأدوات الجراحية",overview:"الجسم كامل",left:"الجانب الأيسر",right:"الجانب الأيمن",overhead:"من الأعلى",torso:"الصدر",abdomen:"البطن",face:"الوجه"},g,_,m=Un.high,f="supine",b=f,E=null,v="room",C=null,R=!1,I=!0;function D(k,J,le){return new L(k,J,le)}function S(k,J=b){let le=n.matches,de=g?.root.position??D(0,.836,.025);if(k==="room")return{target:D(0,1.08,.62),offset:D(0,.52,3.62)};if(k==="surgeon")return{target:D(0,.96,.08),offset:D(-2.55,1.28,.95)};if(k==="anesthesia")return{target:D(-.12,1.02,-1.18),offset:D(-2.05,1.2,-1.72)};if(k==="instruments")return{target:D(-1.55,.98,.58),offset:D(-1.65,1.12,1.55)};if(k==="left")return J==="supine"?{target:D(de.x,de.y+.15,de.z-.04),offset:D(-2.65,.88,.08)}:{target:D(de.x+.12,de.y+.68,de.z),offset:D(-2.65,.18,0)};if(k==="right")return J==="supine"?{target:D(de.x,de.y+.15,de.z-.04),offset:D(2.65,.88,.08)}:{target:D(de.x+.12,de.y+.68,de.z),offset:D(2.65,.18,0)};if(k==="abdomen")return J==="supine"?{target:D(de.x,de.y+.14,de.z-.2),offset:D(.12,.88,.34)}:{target:D(de.x+.12,de.y+.34,de.z),offset:D(1.12,.22,-.14)};if(k==="face")return J==="supine"?{target:D(de.x,de.y+.18,de.z-.74),offset:D(.34,.6,-.17)}:{target:D(de.x+.14,de.y+.69,de.z),offset:D(.65,.2,-.33)};if(k==="torso"){let W=le?1.23:1;return J==="supine"?{target:D(de.x,de.y+.145,de.z-.4),offset:D(.14,1.2,.29).multiplyScalar(W)}:{target:D(de.x+.15,de.y+.33,de.z),offset:D(1.28,.14,-.16).multiplyScalar(W)}}if(k==="overhead")return{target:D(J==="supine"?0:.42,.6,0),offset:D(.08,le?4.25:3.7,-.45)};let me=D(J==="supine"?0:.46,J==="supine"?.66:.76,-.04),Ae=D(2.92,1.92,-2.62).multiplyScalar(le?1.18:1);return{target:me,offset:Ae}}function x(k,J=!1){_?.cancel(),R=!1,v=k;if(nabdSimulation.snapshot().sessionId)nabdSimulation.record('camera_changed',{metadata:{view:k}});let viewName=p[k]||p.overview,viewDetail=document.getElementById("detail-view"),viewBadge=document.getElementById("camera-detail-label");viewDetail&&(viewDetail.textContent=viewName),viewBadge&&(viewBadge.textContent=viewName);let le=S(k),de=le.target.clone().add(le.offset);Object.entries(d).forEach(([me,Ae])=>Ae.setAttribute("aria-pressed",String(me===k))),J||i.matches?(C=null,t.position.copy(de),r.target.copy(le.target),r.update()):C={start:performance.now(),position:de,target:le.target,fromPosition:t.position.clone(),fromTarget:r.target.clone()},I=!0}function w(k){if(!C)return;let{start:J,position:le,target:de,fromPosition:me,fromTarget:Ae}=C,W=Pt.clamp((k-J)/(C.ms??620),0,1),Z=C.smooth?W*W*(3-2*W):1-(1-W)**3;t.position.lerpVectors(me,le,Z),r.target.lerpVectors(Ae,de,Z),W===1&&(C=null)}r.addEventListener("start",()=>{C=null,R=!0}),r.addEventListener("change",()=>{let zoomInfo=document.getElementById("detail-zoom");if(zoomInfo){let distance=t.position.distanceTo(r.target);zoomInfo.textContent=distance<1.05?"قريب جداً":distance<1.85?"قريب":distance<3.25?"متوسط":"واسع"}I=!0}),x("room",!0),enterTraineeMode(),new ResizeObserver(()=>{let k=Mn.clientWidth,J=Mn.clientHeight;!k||!J||(sceneManager.resize(k,J,!1),anatomyNeedsFrame=anatomyActive,I=!0)}).observe(Mn),n.addEventListener("change",()=>{s.setPixelRatio(Math.min(window.devicePixelRatio||1,n.matches?1.5:1.8)),sceneManager.resize(Mn.clientWidth,Mn.clientHeight,!1),anatomyActive ? (t.fov=n.matches?57:49,t.updateProjectionMatrix(),anatomyNeedsFrame=true) : traineeMode ? (t.fov = workFocused ? (n.matches ? 64 : 52) : (n.matches ? 76 : 62), t.updateProjectionMatrix(), I=true) : R||x(v,!0)});function updatePatientHandControls(){
  if(!g)return;
  for(const side of ["left","right"]){
    const input=document.getElementById(`${side}-hand-curl`);
    const output=document.getElementById(`${side}-hand-curl-value`);
    if(input)input.value=String(Math.round(g.getHandCurl(side)*100));
    if(output)output.textContent=`${Math.round(g.getHandCurl(side)*100)}%`;
  }
}
function setPatientHandControls(value){
  if(!g)return;
  g.setBothHandsCurl(value);
  updatePatientHandControls();
  const status=document.getElementById("patient-hand-status");
  if(status)status.textContent=value>=.95?"قبض اليدين":value<=.05?"فتح اليدين":"وضعية قبض جزئية";
  I=true;
}
let patientHandDemoToken=0;
function runPatientHandDemo(){
  if(!g)return;
  const token=++patientHandDemoToken,start=performance.now(),duration=1800;
  const fromLeft=g.getHandCurl("left"),fromRight=g.getHandCurl("right");
  const animate=(now)=>{
    if(token!==patientHandDemoToken||!g)return;
    const p=Pt.clamp((now-start)/duration,0,1);
    const wave=p<.5?p*2:(1-p)*2;
    const smooth=wave*wave*(3-2*wave);
    g.setHandCurl("left",fromLeft+(1-fromLeft)*smooth);
    g.setHandCurl("right",fromRight+(1-fromRight)*smooth);
    updatePatientHandControls();
    const status=document.getElementById("patient-hand-status");
    if(status)status.textContent=p<.5?"إغلاق تدريجي للأصابع":"فتح تدريجي للأصابع";
    I=true;
    if(p<1)requestAnimationFrame(animate);
    else if(status)status.textContent="اكتمل اختبار حركة اليدين";
  };
  requestAnimationFrame(animate);
}
function bindPatientHandControls(){
  for(const side of ["left","right"]){
    const input=document.getElementById(`${side}-hand-curl`);
    if(!input)continue;
    input.disabled=false;
    input.addEventListener("input",()=>{
      if(!g)return;
      g.setHandCurl(side,Number(input.value)/100);
      updatePatientHandControls();
      const status=document.getElementById("patient-hand-status");
      if(status)status.textContent="تعديل حركة أصابع المريض";
      I=true;
    });
  }
  const open=document.getElementById("patient-hands-open");
  const close=document.getElementById("patient-hands-close");
  const reset=document.getElementById("patient-hands-reset");
  if(open)open.addEventListener("click",()=>setPatientHandControls(0));
  if(close)close.addEventListener("click",()=>setPatientHandControls(1));
  if(reset)reset.addEventListener("click",()=>{patientHandDemoToken++;setPatientHandControls(0);});
  const demo=document.getElementById("patient-hands-demo");
  if(demo)demo.addEventListener("click",runPatientHandDemo);
  updatePatientHandControls();
}
function U(){if(g)for(let k of g.chains){let{input:J,output:le}=c[k.id],de=g.getSlider(k,f);J.value=String(de),le.textContent=`${de}\xB0`}}function F(k){h.disabled=k,Object.values(c).forEach(({input:J})=>{J.disabled=k})}function G(k){if(!g||!Object.hasOwn(g.routes,k))return;closeAnatomy();limbLimits.clear();leaveWorkstation();bedside?.cancel();_.cancel();finishLimbSettles();let J=f,poseInfo=document.getElementById("detail-pose");poseInfo&&(poseInfo.textContent=({supine:"استلقاء",sitting:"جلوس",standing:"وقوف"}[k]||"وضعية انتقالية"));if(b=k,a.forEach(me=>{let Ae=me.dataset.pose===k;me.classList.toggle("active",Ae),me.setAttribute("aria-pressed",String(Ae))}),i.matches){m=g.interpolate(g.frames[k],g.frames[k],1),o.setDeckHeight(m),E=null,f=k,F(!1),U(),!traineeMode&&(!R||v==="face"||v==="torso")&&x(v,!0),I=!0;return}let le=g.routes[J][k]??[k],de=J;if(E){let me=pi.indexOf(E.fromName),Ae=pi.indexOf(E.sequence[0]),W=Math.min(me,Ae),Z=Math.max(me,Ae),oe=pi.indexOf(k);oe<=W?(le=pi.slice(oe,W+1).reverse(),de=pi[Z]):(le=pi.slice(Z,oe+1),de=pi[W])}E={from:g.capture(m),fromName:de,sequence:le,start:performance.now()},F(!0),!traineeMode&&(v==="face"||v==="torso")&&x("overview")}function V(k){if(!E)return;let{from:J,sequence:le,start:de}=E,me=le[0],Ae=le.length>1?600:760,W=Pt.clamp((k-de)/Ae,0,1),Z=W*W*(3-2*W);if(m=g.interpolate(J,g.frames[me],Z),o.setDeckHeight(m),I=!0,W<1)return;let oe=le.slice(1);oe.length?E={from:g.frames[me],fromName:me,sequence:oe,start:k}:(E=null,f=b,F(!1),U(),(!traineeMode&&!R)&&x(v))}function $(k,J,le){let de=J==="arm"?le==="upper"?.039:.024:le==="upper"?.063:.051;if(Math.abs(k.x)>Un.halfWidth-.008||Math.abs(k.z)>Un.halfLength)return de;let me=Math.abs(k.x)<Cr.halfWidth&&k.z>Cr.minZ&&k.z<Cr.maxZ;return m+de+(me?Cr.rise:0)}Object.entries(d).forEach(([k,J])=>J.addEventListener("click",()=>x(k))),document.getElementById("home-camera").addEventListener("click",()=>anatomyActive?frameAnatomy():traineeMode?recentreTrainee():x("overview")),
modeButton.addEventListener('click', () => {
  if (!traineeMode) { enterTraineeMode(); return; }
  const refusal = roomViewRefusal();
  if (refusal) { setTraineeStatus(refusal); return; }
  exitTraineeMode();
});
// «إعادة المنظور»: back to the current step's spot, or at a work area back to the work point (smoothly).
document.getElementById('trainee-lock').addEventListener('click', recentreTrainee);
document.getElementById('trainee-zoom-in').addEventListener('click', () => adjustTraineeZoom(-4));
document.getElementById('trainee-zoom-out').addEventListener('click', () => adjustTraineeZoom(4));
for (const button of abdomenButtons) {
  button.addEventListener('click', () => {
    if (button.id === 'trainee-focus-abdomen') selectWork('abdomen');
    else if (workFocused) enterTraineeMode();
    else selectWork(workRegion.value);
  });
}
for (const button of document.querySelectorAll('[data-region-shortcut]')) {
  button.addEventListener('click', () => selectWork(button.dataset.regionShortcut));
}
workRegion.addEventListener('change', () => selectWork(workRegion.value));
workAction.addEventListener('change', () => { bedside.cancel(); updateWorkLabels(); setTraineeStatus(instructionForWork()); });
document.getElementById('work-other-side').addEventListener('click', changeWorkSide);
for (const button of document.querySelectorAll('[data-work-approach]')) {
  button.addEventListener('click', () => {
    if (!workFocused) return;
    const refusal = walkRefusal() ?? (workWalk.moving ? 'انتظر حتى تنتهي الحركة' : null);
    if (refusal) { setTraineeStatus(refusal); return; }
    const closer = Number(button.dataset.workApproach) < 0;
    const [x0, z0] = workWalk.position();
    steerWork();
    workWalk.approach(Number(button.dataset.workApproach) * 0.055);
    const [x1, z1] = workWalk.position();
    if (Math.hypot(x1 - x0, z1 - z0) < 0.001) {
      setTraineeStatus(closer ? 'لا تستطيع الاقتراب أكثر من هنا' : 'لا تستطيع الابتعاد أكثر من هنا');
      return;
    }
    // A short glide (about 0.15 s) instead of a 5.5 cm jump; the view keeps the trainee's look.
    startWorkBlend();
    positionAtWork();
  });
}
for (const button of document.querySelectorAll('[data-work-step]')) {
  button.addEventListener('click', () => {
    if (!workFocused) return;
    const refusal = walkRefusal();
    if (refusal) { setTraineeStatus(refusal); return; }
    steerWork();
    workWalk.walk(Number(button.dataset.workStep) * 0.26);
  });
}
document.getElementById('trainee-patient-position').addEventListener('click', () => setPatientPositioning(!patientPositioning));
for (const side of ['left', 'right']) {
  document.getElementById('trainee-reach-' + side).addEventListener('click', () => chooseHand(side));
}
document.getElementById('trainee-grip').addEventListener('click', keyboardGrip);
document.getElementById('trainee-tool').addEventListener('click', handleAction);
document.getElementById('trainee-reset').addEventListener('click', () => { clearScenario(); enterTraineeMode(); });
document.getElementById("toggle-grid").addEventListener("click",k=>{o.grid.visible=!o.grid.visible,k.currentTarget.setAttribute("aria-pressed",String(o.grid.visible)),I=!0});let H=document.getElementById("fullscreen");!Mn.requestFullscreen&&!Mn.webkitRequestFullscreen&&(H.hidden=!0),H.addEventListener("click",async()=>{try{document.fullscreenElement?await document.exitFullscreen():Mn.requestFullscreen?await Mn.requestFullscreen():Mn.webkitRequestFullscreen?.()}catch(k){console.info("Fullscreen unavailable.",k)}});
function ee(now) {
  requestAnimationFrame(ee);
  const elapsed = Math.max(0, (now - traineeLast) / 1000);
  const dt = Math.min(0.05, elapsed);
  traineeLast = now;
  diagnosticsPanel.update(now, s.info, elapsed);
  V(now);
  if (anatomyNeedsFrame && !E) {
    anatomyNeedsFrame = false;
    frameAnatomy();
  }
  w(now);
  if (traineeMode) {
    if (workFocused) tickWork(Math.min(0.23, elapsed));
    else {
      traineeMovement(dt);
      if (!bedside?.active) updateTraineeFocus(dt);
    }
    turnView(dt);
  } else r.update();
  updateFovTween(dt);
  if (workFocused && !workReady && !E) {
    abdomen.rebuild();
    headPoint = null;
    crew.setSurfaceHeight(abdomen.height);
    workReady = true;
    if (refreshWorkView) { positionAtWork(); refreshWorkView = false; }
    I = true;
  }
  if (workFocused && workReady && abdomen.update(dt)) I = true;
  updateForearmPractice(dt);
  updateLimbSettles(dt);
  if (vitals.update(now, true, i.matches)) I = true;
  const crewDue = crew && (I || bedside?.active || now < animateCrewUntil || crew.moving);
  if (crewDue && (i.matches || now - crewTime > 15)) {
    t.updateMatrixWorld(true);
    // After a pause (nothing to animate) the time since the last crew update is stale: the first
    // update steps one 60 Hz frame instead of jumping most of the way at once.
    const crewDt = crewPaused ? 1 / 60 : (now - crewTime) / 1000;
    bedside?.updateBeforeHands(Math.min(0.05, crewDt));
    crew.update(Math.min(0.08, crewDt), i.matches);
    bedside?.updateAfterHands();
    crewTime = now;
    crewPaused = false;
    I = true;
  } else if (crewDue && I && traineeMode) {
    // Throttled frame: idle hands still follow the head, so they never trail while walking or turning.
    t.updateMatrixWorld(true);
    crew.followCamera();
  } else if (!crewDue) crewPaused = true;
  if (I) {
    o.ceilingFixtures.visible = t.position.y < 3.36;
    o.ceilingShell.visible = t.position.y < 3.36;
    o.pendants.visible = t.position.y < 3.36;
    if (scopeFeed) {
      const port = toolDepth?.port;
      const inserted = scopeStationReady() && port && toolDepth.inserted && ['held','placed'].includes(crew.toolMode);
      scopeFeed.render(crew, inserted, port);
      syncScopeStation();
    }
    sceneManager.render();
    drawWorkMarker();
    drawBodyPoints();
    I = false;
  }
}
requestAnimationFrame(ee);
try{g=await hd(e,R0())}catch(k){Da("\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062C\u0633\u0645. \u0627\u0641\u062A\u062D \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u0623\u0648 \u0634\u063A\u0651\u0644 \u0627\u0644\u0645\u062E\u062A\u0628\u0631 \u0628\u0639\u062F \u0641\u0643 \u0636\u063A\u0637 \u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u062C\u0644\u062F."),console.error(k);return}_=md({canvas:s.domElement,camera:t,controls:r,patient:g.root,chains:g.chains,canDrag:()=>!E&&!anatomyActive&&(!traineeMode||patientPositioning),getMinY:$,onChange:(jointId)=>{let jointInfo=document.getElementById("detail-joint"),jointNames={leftElbow:"المرفق الأيسر",rightElbow:"المرفق الأيمن",leftWrist:"الرسغ الأيسر",rightWrist:"الرسغ الأيمن",leftKnee:"الركبة اليسرى",rightKnee:"الركبة اليمنى",leftAnkle:"الكاحل الأيسر",rightAnkle:"الكاحل الأيمن"};jointInfo&&(jointInfo.textContent=jointNames[jointId]||"مفصل محدد");U(),I=!0},onVisualChange:()=>{I=!0}});window.__patientManipulator=(active)=>{if(_)_.setHandlesVisible(active);I=!0;};for(let k of g.chains){let{input:J}=c[k.id];J.addEventListener("input",()=>{_.cancel(),g.applySlider(k,f,Number(J.value)),U(),I=!0})}a.forEach(k=>{k.disabled=!1,k.addEventListener("click",()=>G(k.dataset.pose))}),u.disabled=!1,u.addEventListener("click",()=>{let jointInfo=document.getElementById("detail-joint");jointInfo&&(jointInfo.textContent="لم يتم تحديد مفصل");g.resetHands();updatePatientHandControls();G("supine")}),h.addEventListener("click",()=>{let k=h.getAttribute("aria-pressed")==="false";h.setAttribute("aria-pressed",String(k)),_.setHandlesVisible(k),I=!0}),F(false);
U();
bindPatientHandControls();
try {
  internalAnatomy = await loadInternalAnatomy({
    source: assetBuffer('embedded-internal-atlas', './assets/anatomy/internal-atlas.glb'),
    loader: new Ra(), patient: g, Box3: zt,
  });
  anatomyToggle.disabled = false;
} catch (error) {
  anatomyToggle.title = 'تعذّر تحميل الأطلس التشريحي';
  console.warn('Nabd internal atlas could not load.', error);
}
const crewResult = await crewReady;
if (crewResult.loaded) {
  crew = crewResult.loaded;
  crew.selectTool(toolSelect.value);
  scopeFeed = createScopeFeed({ renderer:s, RenderTarget:wn, Scene:Qs, PerspectiveCamera:xt, SphereGeometry:cr, Mesh:gt, MeshStandardMaterial:Ut, AmbientLight:dr, DirectionalLight:li, Vector3:L, DoubleSide:Dh, SRGBColorSpace:ut, CanvasTexture:rr, createCanvas:()=>document.createElement('canvas'), Group:Mt, PointLight:mr, Color:Ce });
  if (internalAnatomy) scopeFeed.setAnatomy(internalAnatomy);
  scopeFeed.attach([...o.endoscopyScreens, ...o.fieldDisplays.map(({ screen }) => screen)]);
  crew.parkTool();
  abdomen = createAbdomenSurface(g, { Vector3: L, Matrix3: ke });
  fixPatientSkinBounds();
  toolDepth = createInstrumentDepth({ Vector3:L, Plane:Vt, crew, camera:t,
    getPort: trainingPort, getHeight: abdomen.height, updateUI: syncDepthControls,
    onEvent: (movement) => {
      if (crew.selectedTool === 'scope' && nabdSimulation.snapshot().sessionId) {
        nabdSimulation.record('endoscope_moved', { instrument: crew.selectedTool, hand: activeHand, metadata: movement });
      }
    },
  });
  s.domElement.tabIndex = 0;
  bedside = createBedside({
    canvas: s.domElement, camera: t, crew, patient: g, Raycaster: _r, Vector2: Ie, Vector3: L, Plane: Vt, Quaternion:tt,
    toolHeight: practiceHeight, getSide: () => activeHand,
    abdomen, workstation: workSpec,
    focusPickEnabled: () => focusPickMode,
    onFocusPoint: (point) => selectFocusPoint(point),
    lookModeEnabled: () => lookMode,
    lookEnabled,
    viewportInputPaused: () => scopeMonitorLook,
    toolField(line, side, rebase) {
      // The tool rides with the body only while the trainee actually walks; elsewhere a free instrument is
      // carried under the pointer (toolSpace) and a port tool is steered at the port.
      return toolDepth.drive(line, side, workFocused && workInMotion(), rebase);
    },
    toolSpace() {
      // At a work area a free instrument is carried just above the skin around the work point.
      if (!workFocused) return null;
      return { key: `${workRegion.value}:${workFocusPoint?.toArray().join(',') ?? ''}`, centre: workTarget(),
        reach: 0.16, clearance: 0.06, height: abdomen.height };
    },
    toolReleased(cancelled) {
      if (!workFocused) return;
      if (toolDepth.inserted && !cancelled) {
        crew.placeInstrument();
        showFeedback('فلّت الأداة وهي ثابتة في فتحة التدريب');
      } else {
        crew.parkTool();
        toolDepth.reset();
        showFeedback('تم إفلات الأداة · رجعت للصينية');
      }
    },
    isEnabled: () => traineeMode && !patientPositioning && !E && !vitals.dialog.open &&
      (!workFocused || (workReady && (!workInMotion() || bedside?.held === 'tool'))),
    canPickTool: () => ['idle', 'pickup', 'complete'].includes(phase) && (!staffExercise() || phase !== 'pickup' || crew.offerProgress > 0.92),
    allowWrist: () => ['idle', 'wrist', 'complete'].includes(phase) && b === 'supine',
    startLimb: startPatientLimb,
    surfaceHit: (ray) => ray.intersectObjects(g.skins, false)[0],
    invalidate: () => animateCrew(),
    look(dx, dy) {
      // Camera look is independent from locomotion and from any held instrument.
      // A move to a work area keeps carrying the body; it stops turning the head.
      if (traineeFocusTransition) traineeFocusTransition.viewHeld = true;
      // At a work area the turn toward the work point holds while the trainee looks (the look stays theirs).
      workView.lookAt = performance.now();
      traineeYaw -= dx * 0.0039;
      traineePitch = Pt.clamp(traineePitch - dy * 0.0033, -1.28, 0.42);
      applyTraineeRotation();
    },
    tap(clientX, clientY) {
      const box = s.domElement.getBoundingClientRect();
      cursor.set((clientX - box.left) / box.width * 2 - 1, 1 - (clientY - box.top) / box.height * 2);
      viewRay.setFromCamera(cursor, t);
      if (viewRay.intersectObject(o.vitalScreen).length) openMonitor();
    },
    onEvent: interactionEvent,
  });
  crew.setVisible(traineeMode);
  t.updateMatrixWorld(true);
  crew.update(1, true);
  setPhase('idle');
  try {
    const embeddedPhysics = document.getElementById('forearm-physics');
    const source = embeddedPhysics ? 'data:text/javascript;base64,' + embeddedPhysics.textContent.trim()
      : new URL('./vendor/rapier/rapier.mjs',document.baseURI).href;
    const { default: physics } = await import(/* @vite-ignore */ source);
    await physics.init();
    forearmPractice = { physics, session:null };
    forearmButton.disabled = false;
  } catch (error) {
    forearmButton.title = 'تعذّر تشغيل محرك التصادم';
    console.error('Nabd could not load forearm collision.',error);
  }
} else {
  document.getElementById('training-instruction').textContent = 'تعذّر تحميل اليدين والمشرف. تأكّد من وجود ملفات assets/staff.';
  console.error(crewResult.error);
}
Na.textContent="\u0627\u0644\u0645\u062C\u0633\u0645 \u062C\u0627\u0647\u0632",Na.dataset.state="ready",La.hidden=!0,I=!0,new URLSearchParams(location.search).has("qa")&&(window.__studioQA={getTargets:_.getTargets,getAssetStatus:()=>o.assetStatus,getSimulationState: () => ({
  abdomen: { focused: workFocused, ready: workReady && !workInMotion(),
    region: workFocused ? workRegion.value : null, moving: workFocused && workInMotion(),
    ...abdomen.getState(), contactGap: bedside.contactGap,
    sample: workFocused ? screenPoint(workTarget()) : null,
    penetration: crew.measureSurfacePenetration(),
  },
  points: workReady ? Object.fromEntries(bodyPoints().map(({id,point}) => [id,screenPoint(point)])) : {},
  focus: { point: workFocusPoint?.toArray() ?? null, pickMode: focusPickMode, lookMode, region: workFocused ? workRegion.value : null, lightTarget: o.focusLightTarget.position.toArray() },
  // F26 (AC-P1-2): the two lamp task lights; `lit` = in the scene with every ancestor visible (what the renderer uses).
  lamps: o.focusSpotLights.map((light) => {
    let lit = light.visible, root = light;
    for (let p = light.parent; p; p = p.parent) { lit = lit && p.visible; root = p; }
    return { name: light.name, type: light.type, color: light.color.getHex(), intensity: light.intensity, castShadow: light.castShadow,
      lit: lit && root.isScene === true, position: light.getWorldPosition(new L()).toArray(), target: light.target.getWorldPosition(new L()).toArray() };
  }),
  forearm: forearmPractice?.session ? {
    state:bedside.forearmState, overlap:forearmPractice.session.collision.overlap,
    stops:forearmPractice.session.collision.stops, supportGap:crew.forearmSupportGap, gap:bedside.contactGap,
    contact:bedside.contact?.toArray() ?? null,
  } : null,
  input: { manipulationPaused: bedside?.manipulationPaused ?? false },
  skinPick: g.skins.map((skin) => skinPickCacheStats(skin)).filter(Boolean).map((stats) => ({ ...stats })),
  anatomy: internalAnatomy ? {
    active: anatomyActive,
    keys: [...internalAnatomy.organs.keys()],
    visible: anatomyActive ? [...internalAnatomy.organs.values()].filter(({ mesh }) => mesh.visible).map(({ key }) => key) : [],
    selected: anatomyActive ? anatomyOrgan.value : null,
    attached: internalAnatomy.atlas.parent === g.root,
    usesAtlasInScope: scopeFeed.anatomyActive,
    patientSkin: g.skins.flatMap((mesh) => [mesh.material].flat().map(({ name, opacity, visible }) => [name, opacity, visible])),
  } : null,
  scope: {
    lookingAtMonitor: scopeMonitorLook,
    live: scopeFeed.live,
    screens: o.fieldDisplays.filter(({ mount, screen }) => mount.visible && screen.material.map === scopeFeed.target.texture).length,
    orientation: crew.tool.quaternion.toArray(),
  },
  instrument: { percent: toolDepth.percent, aligned: toolDepth.aligned, angles: toolDepth.angles, tip: crew.getToolTip().toArray(),
    tipClearance: workFocused ? toolTipClearance() : null,
    port: trainingPort()?.toArray() ?? null, portScreen: trainingPort() && screenPoint(trainingPort()) },
  mode: traineeMode, phase, patientPositioning, supervisorVisible: Boolean(crew?.supervisor.visible),
  handsVisible: crew?.getState().handVisible, grip: bedside?.held, crew: crew?.getState(),
  practice: { marker: markerWorld() && screenPoint(markerWorld()), tray: screenPoint(trayRest()),
    tool: screenPoint(crew.tool.position), wrist: screenPoint(getWrist()),
    aimPointer: screenPoint(crew.aimAt(aimPoint).setY(bedside?.toolPlaneY ?? trayRest().y)),
    results: Array.from(motion.checked), retries: motion.retries, lift: motion.wristLift,
  },
  cameraPosition:t.position.toArray(),cameraRotation:t.rotation.toArray(),cameraFov:t.fov,
  vitals:vitals.getValues(), operatingTableDeck:m,
  patientLeftHandCurl:g.getHandCurl('left'),patientRightHandCurl:g.getHandCurl('right'),
}),getScopePixels: () => {
  if (!scopeFeed.live) return [];
  const target = scopeFeed.target;
  const pixels = new Uint8Array(4);
  return [0.31,0.45,0.57,0.72].flatMap((x) => [0.33,0.51,0.69].map((y) => {
    s.readRenderTargetPixels(target, Math.floor(x * target.width), Math.floor(y * target.height), 1, 1, pixels);
    return Array.from(pixels.slice(0,3));
  }));
},getState:()=>({pose:f,animating:!!E,deck:m,position:g.root.position.toArray(),bounds:g.getBounds(),camera:t.position.toArray(),view:p[v]}),getCamera:()=>t.position.toArray(),workMoving:()=>workInMotion(),getJoints:()=>Object.fromEntries(g.chains.map(k=>[k.id,k.joints.map(J=>J.getWorldPosition(D()).toArray())])),setPose:G})}C0().catch(s=>{nabdSimulation.record("interaction_error",{success:false,metadata:{source:"runtime_initialization",message:String(s?.message??s)}});Da("\u062A\u0639\u0630\u0651\u0631 \u062A\u0634\u063A\u064A\u0644 \u063A\u0631\u0641\u0629 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629."),console.error(s)});})();
/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */

