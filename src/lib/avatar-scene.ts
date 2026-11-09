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
 const mat=(color:string,kind?:keyof typeof textures,metalness=0):Material=>new T.MeshPhysicalMaterial({color,roughness:metalness?.32:.78,metalness,map:kind?textures[kind]:null,bumpMap:kind?textures[kind]:null,bumpScale:kind==='cloth'?.009:.012,sheen:kind==='cloth'?.3:0,sheenRoughness:.85,sheenColor:new T.Color(color).lerp(new T.Color('#f3e6ce'),.2)});
 const skin=mat(SKIN_COLORS[a.skin]),hair=mat(HAIR_COLORS[a.hairColor]),cloth=mat(OUTFIT_COLORS[a.palette],'cloth'),dark=mat('#34352f','cloth'),leather=mat('#65442d','leather'),gold=mat('#bf9153',undefined,.8),cream=mat('#e5d6b7','cloth'),stone=mat('#978b73','stone'),wood=mat('#5a4029','wood');
 skin.roughness=.62;hair.roughness=.5;
 const character=new T.Group();scene.add(character);
 const mesh=(parent:T.Object3D,geometry:T.BufferGeometry,m:Material,x=0,y=0,z=0)=>{const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const ell=(p:T.Object3D,m:Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const o=mesh(p,new T.SphereGeometry(1,32,24),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const box=(p:T.Object3D,m:Material,x:number,y:number,z:number,w:number,h:number,d:number)=>mesh(p,new T.BoxGeometry(w,h,d,2,2,2),m,x,y,z);
 const tube=(p:T.Object3D,m:Material,points:number[][],radius:number)=>mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number]))),32,radius,8,false),m);
 const ring=(p:T.Object3D,m:Material,x:number,y:number,z:number,r:number,t=.015)=>{const o=mesh(p,new T.TorusGeometry(r,t,8,48),m,x,y,z);return o;};
 const torso=(p:T.Object3D,m:Material,levels:number[][],z=0,opening=0)=>{
  const profile=new T.SplineCurve(levels.map(([r,y])=>new T.Vector2(r,y))).getPoints(32),geometry=new T.LatheGeometry(profile,48,opening,Math.PI*2-opening*2),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),depth=vertices.getZ(i),angle=Math.atan2(x,depth),fold=1+Math.sin(angle*12+y*4)*.008+Math.sin(angle*23-y*3)*.003;vertices.setXYZ(i,x*fold,y,depth*fold);}geometry.computeVertexNormals();
  const o=mesh(p,geometry,m,0,0,z);o.scale.z=.65;return o;
 };
 const female=a.gender==='female',width=a.build==='slim'?.88:a.build==='sturdy'?1.15:1;
 character.scale.set(width,a.stature==='short'?.94:a.stature==='tall'?1.08:1,1);character.rotation.y=-.12;
 // Layered tailoring and soft, adult proportions share one character transform.
 for(const side of [-1,1]){
  ell(character,dark,side*.18,.77,0,.15,.65,.16);
  ell(character,leather,side*.18,.20,.045,.135,.18,.165);ell(character,leather,side*.18,.08,.12,.145,.075,.24);
  ell(character,mat('#3a3027','leather'),side*.18,.028,.13,.148,.025,.24);
  for(let n=0;n<4;n++)tube(character,cream,[[side*.18-.065,.16+n*.035,.195],[side*.18+.065,.16+n*.035,.195]],.005);
 }
 const upper=new T.Group();upper.position.y=.3;character.add(upper);
 const outfit=equipment.outfit??a.outfit,long=outfit==='wayfarer-coat'||outfit.includes('coat')||outfit.includes('cloak');
 if(outfit==='linen-layers')cloth.color.set('#ddceb0');if(outfit==='cartographer-vest')cloth.color.set('#6a4835');if(outfit==='tide-coat')cloth.color.set('#34586c');if(outfit==='scholar-coat')cloth.color.set('#414f60');
 const knit=outfit==='studio-knit',linen=outfit==='linen-layers',apron=outfit==='artisan-apron',vest=outfit==='cartographer-vest';
 const tailored=!knit&&!linen&&!apron;
 torso(upper,cream,[[.27,1.09],[female?.22:.28,1.5],[female?.32:.36,1.89],[.14,2.055]],.01);
 torso(upper,linen||apron?cream:cloth,[[long?.37:.32,long?.61:1.03],[.35,1.13],[female?.25:.31,1.5],[female?.36:.41,1.91],[.19,2.025]],0,tailored?.20:0);
 for(const side of [-1,1]){
  const sleeve=vest||apron||linen?cream:cloth;
  const arm=ell(upper,sleeve,side*.43,1.67,0,.13,.35,.14);arm.rotation.z=side*.15;
  const forearm=ell(upper,sleeve,side*.49,1.34,.035,.105,.23,.115);forearm.rotation.z=side*.055;
  const cuff=mesh(upper,new T.CylinderGeometry(.106,.102,.075,32),sleeve,side*.50,1.17,.035);cuff.scale.z=1.08;
  const handMat=equipment.hands?leather:skin;ell(upper,handMat,side*.50,1.06,.045,.074,.12,.065);
  ell(upper,handMat,side*.44,1.08,.088,.029,.067,.031);
  for(let n=0;n<3;n++)tube(upper,handMat,[[side*.50+(n-1)*.025,1.06,.096],[side*.50+(n-1)*.022,.98,.08]],.008);
  if(tailored)ell(upper,gold,side*.50,1.18,.15,.012,.012,.005);
  // Tailored lapels have thickness and folds rather than rope-like outlines.
  if(tailored){const lapelShape=new T.Shape();lapelShape.moveTo(side*.08,1.98);lapelShape.lineTo(side*.21,1.94);lapelShape.lineTo(side*.25,1.80);lapelShape.lineTo(side*.075,1.64);lapelShape.lineTo(side*.13,1.83);lapelShape.closePath();const lapel=mesh(upper,new T.ExtrudeGeometry(lapelShape,{depth:.018,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.008,bevelThickness:.006}),cloth,0,0,.205);lapel.rotation.y=side*.08;
   box(upper,cloth,side*.2,1.17,.23,.17,.14,.018);tube(upper,mat(cloth.color.clone().multiplyScalar(.8).getStyle(),'cloth'),[[side*.28,1.245,.251],[side*.12,1.245,.251]],.004);
  }
 }
 if(!knit){for(let n=0;n<4;n++)ell(upper,tailored?gold:wood,tailored?.055:0,1.83-n*.16,.242,.016,.016,.008);}
 if(tailored){const belt=mesh(upper,new T.CylinderGeometry(.318,.318,.055,48),leather,0,1.4,0);belt.scale.z=.68;box(upper,gold,0,1.4,.231,.085,.063,.018);}
 if(knit){const collar=ring(upper,cloth,0,2.015,.005,.145,.025);collar.rotation.x=Math.PI/2;collar.scale.y=.8;for(let x=-.24;x<=.24;x+=.048){const z=.65*Math.sqrt(.32**2-x*x)+.008;tube(upper,cloth,Array.from({length:20},(_,n)=>[x+Math.sin(n*.8)*.011,1.09+n*.04,z]),.009);}for(let n=0;n<4;n++)tube(upper,cloth,[[-.25,1.07+n*.018,.15],[0,1.07+n*.018,.22],[.25,1.07+n*.018,.15]],.008);}
 if(outfit.includes('cloak')){const cape=torso(upper,cloth,[[.54,.54],[.5,1.25],[.43,1.92],[.16,2.035]],-.04,.65);cape.rotation.y=.05;ell(upper,gold,-.17,1.95,.16,.03,.03,.015);}
 if(apron){const canvasMat=mat('#b19469','cloth');const shape=new T.Shape();shape.moveTo(-.13,1.86);shape.lineTo(.13,1.86);shape.lineTo(.17,1.51);shape.quadraticCurveTo(.25,1.45,.25,1.3);shape.lineTo(.26,.88);shape.quadraticCurveTo(0,.83,-.26,.88);shape.lineTo(-.25,1.3);shape.quadraticCurveTo(-.25,1.45,-.17,1.51);shape.closePath();mesh(upper,new T.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:2,steps:1}),canvasMat,0,0,.245);box(upper,canvasMat,0,1.3,.28,.23,.16,.015);tube(upper,leather,[[-.13,1.85,.26],[-.12,2.02,.12],[.12,2.02,.12],[.13,1.85,.26]],.016);}
 mesh(upper,new T.CylinderGeometry(.115,.14,.23,32),skin,0,2.04,0);
 const head=new T.Group();head.scale.setScalar(.82);head.position.y=.40;upper.add(head);
 const face=ell(head,skin,0,2.48,.01,a.face==='round'?.32:a.face==='angular'?.28:.295,a.face==='round'?.34:.385,.28);
 const positions=face.geometry.attributes.position,colors:number[]=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),taper=a.face==='heart'?.70:a.face==='angular'?.91:a.face==='round'?.94:.81;
  positions.setX(i,x*(1-(1-taper)*T.MathUtils.smoothstep(-y,.08,.96)));
  if(z>0){const cheek=Math.exp(-((Math.abs(x)-.48)**2/.08+(y+.03)**2/.10));positions.setZ(i,z+cheek*.045);}
  const blush=z>0?Math.exp(-((Math.abs(x)-.52)**2/.09+(y+.06)**2/.08))*.035:0;
  colors.push(1,1-blush,1-blush*1.3);
 }face.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));const faceMaterial=skin.clone();faceMaterial.vertexColors=true;face.material=faceMaterial;face.geometry.computeVertexNormals();
 for(const side of [-1,1]){
  ell(head,skin,side*.294,2.46,0,.050,.083,.043);
  ell(head,mat(new T.Color(SKIN_COLORS[a.skin]).multiplyScalar(.83).getStyle()),side*.310,2.46,.032,.018,.049,.012);
  ell(head,mat('#f6eee1'),side*.112,2.5,.264,.055,.032,.026);
  const eyes={brown:'#4a2b1c',hazel:'#8c7545',green:'#496b4f',blue:'#577887',grey:'#78817b'};
  ell(head,mat(eyes[a.eyes]),side*.112,2.5,.285,.022,.023,.005);ell(head,mat('#171c18'),side*.112,2.5,.290,.010,.014,.003);ell(head,mat('#ffffff'),side*.112-.007,2.509,.294,.005,.005,.002);
  const cx=side*.112;
  tube(head,skin,[[cx-.05,2.5,.277],[cx-.027,2.528,.282],[cx+.025,2.528,.282],[cx+.05,2.5,.277]],.006);
  tube(head,skin,[[cx-.05,2.5,.277],[cx,2.472,.281],[cx+.05,2.5,.277]],.004);
  tube(head,hair,[[side*.175,2.578,.254],[side*.112,2.598+(a.expression==='thoughtful'&&side===1?.016:0),.272],[side*.061,2.581,.259]],female?.009:.011);

 }
 ell(head,skin,0,2.445,.265,.023,.055,.026);ell(head,skin,0,2.408,.288,.029,.021,.026);
 const nostril=mat(new T.Color(SKIN_COLORS[a.skin]).multiplyScalar(.56).getStyle());for(const side of [-1,1])ell(head,nostril,side*.019,2.397,.303,.007,.003,.004);
 const lip=mat(new T.Color(SKIN_COLORS[a.skin]).lerp(new T.Color('#955d53'),.44).getStyle());tube(head,lip,[[-.061,2.305,.251],[0,2.293+(a.expression==='bright'?-.008:0),.258],[.061,2.305,.251]],female?.0055:.0045);
 if(a.expression==='bright')ell(head,mat('#f6eee1'),0,2.29,.258,.039,.009,.005);
 if(a.beard!=='clean'){
  const beard=ell(head,hair,0,2.25,.13,a.beard==='full'?.25:.23,a.beard==='full'?.19:.11,.17);beard.scale.z=a.beard==='stubble'?.6:1;
  for(let i=0;i<24;i++){const x=(i/23-.5)*.35;tube(head,hair,[[x,2.29,.265],[x*.85,2.17-(a.beard==='full'?.07:0),.23]],.006);}
 }
 if(a.hair!=='shaved'){
  // A curved hairline follows forehead, temples and nape instead of a helmet band.
  const capGeo=new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2);
  const scalp=capGeo.attributes.position;
  for(let i=0;i<scalp.count;i++){
   const x=scalp.getX(i),z=scalp.getZ(i),theta=Math.acos(T.MathUtils.clamp(scalp.getY(i),-1,1)),phi=Math.atan2(z,x);
   const front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi));
   const end=1.48-front*.53+back*.24,angle=theta/(Math.PI/2)*end;
   scalp.setXYZ(i,Math.cos(phi)*Math.sin(angle),Math.cos(angle),Math.sin(phi)*Math.sin(angle));
  }capGeo.computeVertexNormals();
  const cap=mesh(head,capGeo,hair,0,2.49,.003);cap.scale.set(.306,.399,.288);
  const curly=['coils','afro'].includes(a.hair),longHair=['long','braids','locs','bob','twists'].includes(a.hair);
  if(['braids','locs','twists'].includes(a.hair)){const ridge=mat(new T.Color(HAIR_COLORS[a.hairColor]).lerp(new T.Color('#d1b798'),.12).getStyle());for(let n=0;n<11;n++){const x=(n-5)*.043,front=.248*Math.sqrt(1-(x/.31)**2),points=[[x,2.70-Math.abs(x)*.20,front],[x*.9,2.85,.09],[x*.8,2.86,-.12],[x*.85,2.67,-.265]],path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number])));tube(head,hair,points,a.hair==='locs'?.023:.017);if(a.hair!=='locs'){const weave=Array.from({length:25},(_,i)=>{const p=path.getPoint(i/24);return[p.x+Math.sin(i*2.1)*.009,p.y+.009,p.z+Math.cos(i*2.1)*.009];});tube(head,ridge,weave,.004);}}}
  if(curly){for(let i=0;i<88;i++){const phi=Math.acos(1-(i+.5)/88),ang=i*2.39996,r=a.hair==='afro'?1.20:1.01;const x=Math.cos(ang)*Math.sin(phi)*.30*r,y=2.49+Math.cos(phi)*.39*r,z=Math.sin(ang)*Math.sin(phi)*.28*r;if(z>.08&&y<2.67)continue;const curl=mesh(head,new T.SphereGeometry(1,16,12),hair,x,y,z);curl.scale.set(.045*r,.052*r,.043*r);curl.rotation.z=ang;}}
  else if(longHair){const braided=a.hair==='braids'||a.hair==='twists',count=braided?18:26;for(let i=0;i<count;i++){const theta=-1.7+i/(count-1)*3.4,x=Math.sin(theta)*.29,z=-Math.cos(theta)*.27,len=a.hair==='bob'?.47:1.08,endZ=Math.abs(theta)>1.08&&a.hair!=='bob'?.31:z*1.12;const path=[[x*.5,2.80,z*.5],[x,2.62,z],[x*1.10,2.34,z*1.08],[x*1.20,2.80-len,endZ]];tube(head,hair,path,a.hair==='locs'?.031:braided?.022:.018);if(braided){const curve=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p as [number,number,number])));for(let strand=0;strand<2;strand++){const points=Array.from({length:28},(_,n)=>{const p=curve.getPoint(n/27);return[p.x+Math.sin(n*1.6+strand*Math.PI)*.012,p.y,p.z+Math.cos(n*1.6+strand*Math.PI)*.012];});tube(head,hair,points,.008);}}}}
  else{const count=a.hair==='crop'?25:34;for(let i=0;i<count;i++){const x=(i/(count-1)-.5)*.49;const pts=Array.from({length:10},(_,n)=>{const z=.19-n*.044;const y=2.49+Math.sqrt(Math.max(.12,1-(x/.31)**2-(z/.29)**2))*.40;return [x+Math.sin(n*.55)*.012,y+(a.hair==='waves'?Math.sin(n*.9+i*.2)*.022:a.hair==='undercut'?.035:0),z];});tube(head,hair,pts,a.hair==='crop'?.012:.016);}}
  if(a.hair==='bun'){for(let n=0;n<10;n++){const angle=n*.63;tube(head,hair,[[Math.sin(angle)*.08,2.83+Math.cos(angle)*.08,-.18],[Math.sin(angle)*.12,2.88,-.28],[Math.sin(angle)*.08,2.83-Math.cos(angle)*.08,-.34]],.024);}}
  if(a.hair==='ponytail'){for(let n=0;n<9;n++){const x=(n-4)*.014;tube(head,hair,[[x,2.73,-.27],[x+.04,2.48,-.38],[x+.09,2.15,-.34]],.023);}ring(head,gold,0,2.68,-.29,.075).rotation.x=Math.PI/2;}
 }
 // Each earned piece has real geometry, not a painted overlay.
 if(equipment.accessory==='trail-scarf'){const scarf=mesh(upper,new T.TorusGeometry(.17,.052,10,48),mat('#c69c65','cloth'),0,2.02,0);scarf.rotation.x=Math.PI/2;box(upper,mat('#c69c65','cloth'),.16,1.78,.24,.12,.43,.035);}
 if(equipment.accessory==='mission-satchel'){tube(upper,leather,[[-.31,1.96,.14],[0,1.65,.3],[.39,1.21,.14]],.026);const bag=ell(upper,leather,.41,1.11,.12,.19,.20,.11);bag.rotation.z=-.12;box(upper,gold,.41,1.17,.24,.04,.06,.015);}
 if(equipment.accessory==='sharp-pin')ell(upper,gold,-.23,1.83,.25,.045,.06,.02);
 if(equipment.accessory==='lantern-charm'){const glow=new T.MeshStandardMaterial({color:'#efc17b',emissive:'#d69840',emissiveIntensity:.5});mesh(upper,new T.CylinderGeometry(.065,.065,.16,12),glow,-.37,1.12,.12);ring(upper,gold,-.37,1.24,.12,.045,.008);for(let n=0;n<4;n++){const ang=n*Math.PI/2;box(upper,gold,-.37+Math.sin(ang)*.06,1.12,.12+Math.cos(ang)*.06,.008,.18,.008);}}
 if(equipment.back==='map-carrier'){tube(upper,leather,[[-.31,1.96,.14],[0,1.65,.29],[.35,1.21,.12]],.02);const scroll=mesh(upper,new T.CylinderGeometry(.06,.06,.8,24),cream,0,1.4,-.31);scroll.rotation.z=.8;for(const y of [1.13,1.66]){const strap=ring(upper,leather,0,y,-.31,.065,.014);strap.rotation.y=Math.PI/2;}}
 if(equipment.neck){tube(upper,gold,[[-.13,2.02,.1],[0,1.74,.28],[.13,2.02,.1]],.007);ell(upper,gold,0,1.73,.29,.04,.06,.015);}
 if(equipment.eyes){for(const side of [-1,1]){ring(head,gold,side*.112,2.5,.302,.071,.006);tube(head,gold,[[side*.18,2.51,.30],[side*.28,2.51,.14],[side*.29,2.48,.04]],.005);}tube(head,gold,[[-.04,2.51,.30],[0,2.52,.31],[.04,2.51,.30]],.005);}
 if(equipment.headwear){const hood=mesh(head,new T.SphereGeometry(.35,40,24,0,Math.PI*2,0,Math.PI*.64),cloth,0,2.51,-.05);hood.rotation.x=-.37;}
 if(equipment.feet){for(const side of [-1,1]){ell(character,leather,side*.18,.30,.02,.142,.24,.17);for(let n=0;n<3;n++)tube(character,gold,[[side*.18-.07,.23+n*.05,.173],[side*.18+.07,.23+n*.05,.173]],.004);}}
 if(equipment.aura){for(let n=0;n<2;n++){const orbit=ring(upper,gold,0,2.92+n*.08,0,.45+n*.09,.008);orbit.rotation.x=1.1;orbit.rotation.y=n*.7;}}
 // A walk-in diorama: actual three-dimensional architecture and scene dressing.
 const floor=mesh(scene,new T.CylinderGeometry(4,4,.18,80),stone,0,-.15,0);
 floor.receiveShadow=true;mesh(scene,new T.CylinderGeometry(.95,1,.14,80),stone,0,-.07,0);
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
 scene.add(new T.HemisphereLight('#fff4df','#46574d',1.45));
 const sun=new T.DirectionalLight('#fff0d5',2.5);sun.position.set(-3,6,5);sun.castShadow=!portrait;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.015;sun.shadow.radius=4;sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-3;sun.shadow.bias=-.0003;scene.add(sun);
 const rim=new T.DirectionalLight('#c4d9e2',1.35);rim.position.set(3,4,-3);scene.add(rim);
 const headHeight=2.75*character.scale.y;
 const target=new T.Vector3(0,portrait?headHeight:1.57*character.scale.y,0);
 const camera=new T.PerspectiveCamera(portrait?32:33,1,.1,50);camera.position.set(portrait?.08:.9,portrait?headHeight+.04:2.35,portrait?2.1:6.5);camera.lookAt(target);
 const dispose=()=>{const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};
 return {scene,camera,character,target,dispose};
}
