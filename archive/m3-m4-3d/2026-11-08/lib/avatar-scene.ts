import * as T from 'three';
import {parseAvatar,SKIN_COLORS,HAIR_COLORS,OUTFIT_COLORS,type Avatar} from './avatar';
import type {Equipment} from './inventory';
type Material=T.MeshStandardMaterial;
const surfaceMaps=new Map<string,T.CanvasTexture>();
/** Procedural surface maps are bundled, deterministic and have no remote dependency. */
function surface(kind:'cloth'|'wood'|'stone'|'leather'){
 const cached=surfaceMaps.get(kind);if(cached)return cached;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d')!;
 c.fillStyle='#eeeeee';c.fillRect(0,0,1024,1024);let seed=27;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<42000;i++){const x=rand()*1024,y=rand()*1024,v=Math.floor(200+rand()*48);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(x,y,kind==='wood'?rand()*50:1+rand()*3,kind==='wood'?1:1+rand()*3);}
 if(kind==='cloth'){for(let i=0;i<1024;i+=5){c.fillStyle=i%10?'#f8f8f8':'#d8d8d8';c.fillRect(i,0,1,1024);c.fillRect(0,i,1024,1);}}
 const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,3);map.anisotropy=4;map.colorSpace=T.SRGBColorSpace;surfaceMaps.set(kind,map);return map;
}
export function buildAvatarScene(input:Avatar,equipment:Equipment={},portrait=false){
 const a=parseAvatar(input),scene=new T.Scene();scene.background=new T.Color(a.background==='grove'?'#182d25':a.background==='workshop'?'#292e27':'#bcb9a8');
 scene.fog=new T.Fog(scene.background,9,24);
 const textures={cloth:surface('cloth'),wood:surface('wood'),stone:surface('stone'),leather:surface('leather')};
 const mat=(color:string,kind?:keyof typeof textures,metalness=0):Material=>new T.MeshStandardMaterial({color,roughness:metalness?.34:.85,metalness,map:kind?textures[kind]:null,bumpMap:kind?textures[kind]:null,bumpScale:kind==='cloth'?.007:.013});
 const skin=mat(SKIN_COLORS[a.skin]),hair=mat(HAIR_COLORS[a.hairColor]),cloth=mat(OUTFIT_COLORS[a.palette],'cloth'),dark=mat('#34352f','cloth'),leather=mat('#65442d','leather'),gold=mat('#bf9153',undefined,.8),cream=mat('#e5d6b7','cloth'),stone=mat('#978b73','stone'),wood=mat('#5a4029','wood');
 skin.roughness=.67;hair.roughness=.58;
 const character=new T.Group();scene.add(character);
 const mesh=(parent:T.Object3D,geometry:T.BufferGeometry,m:Material,x=0,y=0,z=0)=>{const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const ell=(p:T.Object3D,m:Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const o=mesh(p,new T.SphereGeometry(1,40,32),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const box=(p:T.Object3D,m:Material,x:number,y:number,z:number,w:number,h:number,d:number)=>mesh(p,new T.BoxGeometry(w,h,d,2,2,2),m,x,y,z);
 const tube=(p:T.Object3D,m:Material,points:number[][],radius:number)=>mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number]))),32,radius,8,false),m);
 const ring=(p:T.Object3D,m:Material,x:number,y:number,z:number,r:number,t=.015)=>{const o=mesh(p,new T.TorusGeometry(r,t,8,48),m,x,y,z);return o;};
 const torso=(p:T.Object3D,m:Material,levels:number[][],z=0)=>{const o=mesh(p,new T.LatheGeometry(levels.map(([r,y])=>new T.Vector2(r,y)),48),m,0,0,z);o.scale.z=.65;return o;};
 const female=a.gender==='female',width=a.build==='slim'?.88:a.build==='sturdy'?1.15:1;
 character.scale.set(width,a.stature==='short'?.94:a.stature==='tall'?1.08:1,1);character.rotation.y=-.12;
 // Full-body silhouette: sculpted limbs, layered tailoring and a larger expressive head.
 for(const side of [-1,1]){
  ell(character,dark,side*.18,.77,0,.15,.65,.16);
  ell(character,leather,side*.18,.22,.07,.17,.24,.23);ell(character,leather,side*.18,.09,.17,.18,.1,.3);
  for(let n=0;n<4;n++)tube(character,cream,[[side*.18-.08,.19+n*.055,.27],[side*.18+.08,.19+n*.055,.27]],.008);
 }
 const upper=new T.Group();upper.position.y=.3;character.add(upper);
 const outfit=equipment.outfit??a.outfit,long=outfit==='wayfarer-coat'||outfit.includes('coat')||outfit.includes('cloak');
 if(outfit==='linen-layers')cloth.color.set('#ddceb0');if(outfit==='cartographer-vest')cloth.color.set('#6a4835');if(outfit==='tide-coat')cloth.color.set('#34586c');
 torso(upper,cloth,[[.34,long?.69:1.02],[.35,1.13],[female?.24:.31,1.5],[female?.36:.41,1.91],[.23,2.02]]);
 torso(upper,cream,[[.18,1.72],[.22,1.93],[.16,2.04]],.05);
 for(const side of [-1,1]){
  const arm=ell(upper,outfit==='cartographer-vest'||outfit==='artisan-apron'?cream:cloth,side*.45,1.6,0,.14,.43,.15);arm.rotation.z=side*.15;
  const handMat=equipment.hands?leather:skin;ell(upper,handMat,side*.51,1.16,.015,.105,.16,.085);
  ell(upper,handMat,side*.43,1.17,.08,.04,.09,.04);
  for(let n=0;n<3;n++)tube(upper,gold,[[side*.35,1.27+n*.016,.07],[side*.57,1.27+n*.016,.07]],.004);
  // Tailored lapels have thickness and folds rather than rope-like outlines.
  const lapelShape=new T.Shape();lapelShape.moveTo(side*.1,1.98);lapelShape.lineTo(side*.24,1.94);lapelShape.lineTo(side*.28,1.78);lapelShape.lineTo(side*.09,1.63);lapelShape.lineTo(side*.16,1.82);lapelShape.closePath();const lapel=mesh(upper,new T.ExtrudeGeometry(lapelShape,{depth:.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.008}),cloth,0,0,.21);lapel.rotation.y=side*.08;
  box(upper,cloth,side*.2,1.17,.23,.17,.17,.025);tube(upper,gold,[[side*.28,1.25,.25],[side*.12,1.25,.25]],.007);
 }
 for(let n=0;n<5;n++)ell(upper,gold,.04,1.62-n*.16,.24,.022,.022,.012);
 const belt=mesh(upper,new T.CylinderGeometry(.333,.333,.06,48),leather,0,1.4,0);belt.scale.z=.68;box(upper,gold,0,1.4,.235,.11,.085,.025);
 if(outfit==='studio-knit'){for(let n=0;n<18;n++)tube(upper,cloth,[[-.27,1.12+n*.04,.22],[0,1.115+n*.04,.245],[.27,1.12+n*.04,.22]],.009);}
 if(outfit.includes('cloak')){const cape=torso(upper,cloth,[[.53,.72],[.5,1.25],[.42,1.92],[.16,2.03]],-.09);cape.rotation.y=.1;}
 if(outfit==='artisan-apron'){box(upper,leather,0,1.33,.25,.49,.98,.035);box(upper,leather,0,1.6,.275,.22,.17,.02);tube(upper,leather,[[-.18,1.84,.25],[-.12,2.02,.12],[.12,2.02,.12],[.18,1.84,.25]],.022);}
 mesh(upper,new T.CylinderGeometry(.115,.14,.23,32),skin,0,2.04,0);
 const head=new T.Group();head.scale.setScalar(.82);head.position.y=.43;upper.add(head);
 const face=ell(head,skin,0,2.48,.01,a.face==='round'?.32:a.face==='angular'?.28:.295,a.face==='round'?.34:.385,.28);
 const positions=face.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const y=positions.getY(i);if(y<-.2){const taper=a.face==='heart'?.76:a.face==='angular'?.94:.85;positions.setX(i,positions.getX(i)*(1-(1-taper)*T.MathUtils.smoothstep(-y,.08,.95)));}}face.geometry.computeVertexNormals();
 for(const side of [-1,1]){
  ell(head,skin,side*.299,2.46,0,.064,.105,.045);
  ell(head,mat('#f6eee1'),side*.115,2.5,.242,.061,.032,.025);
  const eyes={brown:'#4a2b1c',hazel:'#8c7545',green:'#496b4f',blue:'#577887',grey:'#78817b'};
  ell(head,mat(eyes[a.eyes]),side*.115,2.5,.265,.025,.026,.01);ell(head,mat('#171c18'),side*.115,2.5,.274,.012,.016,.006);ell(head,mat('#ffffff'),side*.115-.009,2.513,.281,.008,.008,.004);
  tube(head,hair,[[side*.19,2.59,.25],[side*.115,2.61+(a.expression==='thoughtful'&&side===1?.025:0),.28],[side*.055,2.59,.26]],.012);

 }
 ell(head,skin,0,2.43,.265,.027,.067,.035);ell(head,skin,0,2.405,.294,.038,.024,.025);
 const lip=mat('#985c4e');tube(head,lip,[[-.075,2.305,.263],[0,2.29+(a.expression==='bright'?-.015:0),.272],[.075,2.305,.263]],.007);
 if(a.expression==='bright')ell(head,mat('#f6eee1'),0,2.29,.27,.053,.015,.012);
 if(a.beard!=='clean'){
  const beard=ell(head,hair,0,2.25,.13,a.beard==='full'?.25:.23,a.beard==='full'?.19:.11,.17);beard.scale.z=a.beard==='stubble'?.6:1;
  for(let i=0;i<24;i++){const x=(i/23-.5)*.35;tube(head,hair,[[x,2.29,.265],[x*.85,2.17-(a.beard==='full'?.07:0),.23]],.006);}
 }
 if(a.hair!=='shaved'){
  const capGeo=new T.SphereGeometry(1,48,32,0,Math.PI*2,0,Math.PI*.4);
  const cap=mesh(head,capGeo,hair,0,2.49,.01);cap.scale.set(.311,.397,.30);
  const curly=['coils','afro'].includes(a.hair),longHair=['long','braids','locs','bob','twists'].includes(a.hair);
  if(['braids','locs','twists'].includes(a.hair)){for(let n=0;n<11;n++){const x=(n-5)*.045;const points=[[x,2.68,.23],[x*.9,2.85,.09],[x*.8,2.86,-.12],[x*.85,2.67,-.265]];tube(head,hair,points,a.hair==='locs'?.023:.016);}}
  if(curly){for(let i=0;i<100;i++){const phi=Math.acos(1-(i+.5)/100),ang=i*2.39996,r=a.hair==='afro'?1.22:1.02;const x=Math.cos(ang)*Math.sin(phi)*.30*r,y=2.49+Math.cos(phi)*.39*r,z=Math.sin(ang)*Math.sin(phi)*.28*r;const curl=ell(head,hair,x,y,z,.045*r,.055*r,.043*r);curl.rotation.z=ang;}}
  else if(longHair){const braided=a.hair==='braids'||a.hair==='twists',count=braided?18:26;for(let i=0;i<count;i++){const theta=-1.7+i/(count-1)*3.4,x=Math.sin(theta)*.29,z=-Math.cos(theta)*.27,len=a.hair==='bob'?.43:.78;const path=[[x*.5,2.80,z*.5],[x,2.62,z],[x*1.08,2.40,z*1.1],[x*1.05,2.80-len,z*1.12]];tube(head,hair,path,a.hair==='locs'?.033:braided?.023:.019);if(braided)for(let strand=0;strand<2;strand++){const points=Array.from({length:16},(_,n)=>[x*1.05+Math.sin(n*1.6+strand*Math.PI)*.013,2.65-n*(len-.15)/15,z*1.1+Math.cos(n*1.6+strand*Math.PI)*.013]);tube(head,hair,points,.011);}}}
  else{const count=a.hair==='crop'?35:48;for(let i=0;i<count;i++){const x=(i/(count-1)-.5)*.55;const pts=Array.from({length:10},(_,n)=>{const z=.23-n*.052;const y=2.49+Math.sqrt(Math.max(.03,1-(x/.31)**2-(z/.29)**2))*.39;return [x+Math.sin(n*.55)*.01,y+(a.hair==='waves'?Math.sin(n*.9+i*.2)*.022:a.hair==='undercut'?.045:0),z];});tube(head,hair,pts,a.hair==='crop'?.012:.017);}}
  if(a.hair==='bun'){for(let n=0;n<10;n++){const angle=n*.63;tube(head,hair,[[Math.sin(angle)*.08,2.83+Math.cos(angle)*.08,-.18],[Math.sin(angle)*.12,2.88,-.28],[Math.sin(angle)*.08,2.83-Math.cos(angle)*.08,-.34]],.024);}}
  if(a.hair==='ponytail'){for(let n=0;n<9;n++){const x=(n-4)*.014;tube(head,hair,[[x,2.73,-.27],[x+.04,2.48,-.38],[x+.09,2.15,-.34]],.023);}ring(head,gold,0,2.68,-.29,.075).rotation.x=Math.PI/2;}
 }
 // Each earned piece has real geometry, not a painted overlay.
 if(equipment.accessory==='trail-scarf'){const scarf=mesh(upper,new T.TorusGeometry(.17,.052,10,48),mat('#c69c65','cloth'),0,2.02,0);scarf.rotation.x=Math.PI/2;box(upper,mat('#c69c65','cloth'),.16,1.78,.24,.12,.43,.035);}
 if(equipment.accessory==='mission-satchel'||equipment.back){tube(upper,leather,[[-.31,1.96,.14],[0,1.65,.3],[.39,1.21,.14]],.026);const bag=ell(upper,leather,.41,1.11,.12,.22,.23,.13);bag.rotation.z=-.12;box(upper,gold,.41,1.17,.26,.04,.06,.015);}
 if(equipment.accessory==='sharp-pin')ell(upper,gold,-.23,1.83,.25,.045,.06,.02);
 if(equipment.accessory==='lantern-charm'){const glow=new T.MeshStandardMaterial({color:'#efc17b',emissive:'#d69840',emissiveIntensity:.5});mesh(upper,new T.CylinderGeometry(.065,.065,.16,12),glow,-.37,1.12,.12);ring(upper,gold,-.37,1.24,.12,.045,.008);for(let n=0;n<4;n++){const ang=n*Math.PI/2;box(upper,gold,-.37+Math.sin(ang)*.06,1.12,.12+Math.cos(ang)*.06,.008,.18,.008);}}
 if(equipment.back==='map-carrier'){const scroll=mesh(upper,new T.CylinderGeometry(.06,.06,.8,24),cream,0,1.4,-.31);scroll.rotation.z=.8;for(const y of [1.13,1.66]){const strap=ring(upper,leather,0,y,-.31,.065,.014);strap.rotation.y=Math.PI/2;}}
 if(equipment.neck){tube(upper,gold,[[-.13,2.02,.1],[0,1.74,.28],[.13,2.02,.1]],.007);ell(upper,gold,0,1.73,.29,.04,.06,.015);}
 if(equipment.eyes){for(const side of [-1,1])ring(upper,gold,side*.115,2.5,.309,.088,.008);tube(upper,gold,[[-.026,2.51,.31],[.026,2.51,.31]],.008);}
 if(equipment.headwear){const hood=mesh(upper,new T.SphereGeometry(.36,40,24,0,Math.PI*2,0,Math.PI*.6),cloth,0,2.51,-.06);hood.rotation.x=-.35;}
 if(equipment.feet){for(const side of [-1,1]){box(upper,leather,side*.18,.3,.03,.3,.28,.32);for(let n=0;n<3;n++)ring(upper,gold,side*.18,.35+n*.04,.2,.025,.006);}}
 if(equipment.aura){for(let n=0;n<2;n++){const orbit=ring(upper,gold,0,2.92+n*.08,0,.45+n*.09,.008);orbit.rotation.x=1.1;orbit.rotation.y=n*.7;}}
 // A walk-in diorama: actual three-dimensional architecture and scene dressing.
 const floor=mesh(scene,new T.CylinderGeometry(4,4,.18,80),stone,0,-.15,0);
 floor.receiveShadow=true;mesh(scene,new T.CylinderGeometry(.95,1,.14,80),stone,0,.005,0);
 const wallMat=mat(a.background==='workshop'?'#435047':'#d4c9b0','stone');
 if(!portrait){
  if(a.background==='grove'){
   for(let i=0;i<7;i++){const ang=i*.8,x=Math.cos(ang)*3,z=-2-Math.sin(ang)*1.3;mesh(scene,new T.CylinderGeometry(.12,.24,3.8,14),wood,x,1.7,z);for(let n=0;n<4;n++)ell(scene,mat(n%2?'#304c31':'#496342','cloth'),x+Math.sin(n)*.5,3+n*.2,z,.9,.55,.8);}
  }else{
   box(scene,wallMat,0,1.8,-3.4,8,4,.2);
   for(const x of [-2.7,0,2.7]){
    const glass=new T.MeshStandardMaterial({color:'#d6e0d2',roughness:.3,emissive:'#c4ceae',emissiveIntensity:.24});
    box(scene,wood,x,2,-3.23,1.7,2.3,.10);box(scene,glass,x,2,-3.15,1.48,2.1,.04);
    for(const dx of [-.76,0,.76])box(scene,wood,x+dx,2,-3.10,.055,2.2,.05);
    for(const y of [1,2,3])box(scene,wood,x,y,-3.09,1.6,.045,.05);
    box(scene,stone,x,.86,-3.02,1.85,.12,.3);
   }
   for(let n=0;n<18;n++){const plank=box(scene,n%3?wood:mat('#71523c','wood'),0,-.05,-3+n*.36,6.8,.025,.345);plank.receiveShadow=true;}
   const rug=mesh(scene,new T.CylinderGeometry(1.65,1.65,.012,80),mat('#765746','cloth'),0,-.025,0);rug.scale.z=.82;
   for(const radius of [1.43,1.52,1.58]){const border=ring(scene,gold,0,-.012,0,radius,.007);border.rotation.x=Math.PI/2;border.scale.y=.82;}
   for(let n=0;n<9;n++)box(scene,stone,0,.05+n*.035,-3.28+n*.01,7.8,.018,.045);

   const desk=box(scene,wood,-1.9,.88,-1.5,1.6,.12,.65);desk.rotation.y=.15;
   for(const x of [-2.5,-1.3])box(scene,wood,x,.37,-1.5,.1,1,.1);
   for(let i=0;i<8;i++){const book=box(scene,i%2?cloth:cream,-2.4+i*.13,1.07,-1.5,.09,.26+i%3*.03,.24);book.rotation.z=(i%3-1)*.07;}
   const mirror=ring(scene,gold,1.8,1.7,-1.9,.65,.045);mirror.scale.y=1.5;ell(scene,mat('#a6b2a2',undefined,.7),1.8,1.7,-1.94,.63,.96,.035);box(scene,wood,1.8,.35,-1.9,.1,.7,.1);
  }
  for(let i=0;i<6;i++){const x=i<3?-1.7:2.2,z=-.8-(i%3)*.55;mesh(scene,new T.CylinderGeometry(.12,.09,.22,20),mat('#8c6547'),x,.05,z);for(let n=0;n<5;n++){const shape=new T.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.14,.15,0,.36);shape.quadraticCurveTo(-.14,.15,0,0);const leaf=mesh(scene,new T.ExtrudeGeometry(shape,{depth:.004,bevelEnabled:false}),mat(n%2?'#4b6b45':'#6d8651'),x,.15,z);leaf.rotation.set(.3,n*1.3,Math.sin(n*2)*.8);tube(scene,mat('#8a9a68'),[[x,.15,z],[x+Math.sin(n*2)*.1,.4,z]],.004);}}
 }
 scene.add(new T.HemisphereLight('#fff4df','#46574d',2.2));
 const sun=new T.DirectionalLight('#fff0d5',3);sun.position.set(-3,6,5);sun.castShadow=!portrait;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.025;sun.shadow.radius=4;sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-3;sun.shadow.bias=-.0004;scene.add(sun);
 const rim=new T.DirectionalLight('#c4d9e2',2.5);rim.position.set(3,4,-3);scene.add(rim);
 const headHeight=2.78*character.scale.y;
 const camera=new T.PerspectiveCamera(portrait?32:33,1,.1,50);camera.position.set(portrait?.12:1.8,portrait?headHeight+.08:2.5,portrait?2.1:6.5);camera.lookAt(0,portrait?headHeight:1.6,0);
 const dispose=()=>{scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});};
 return {scene,camera,character,dispose};
}
