/** Image-only Wayfarer compositor. No WebGL, models, or Three.js imports. */
import {OUTFIT_COLORS,type Avatar} from './avatar';
import type {Equipment} from './inventory';

const ROOT='/brand/wayfarer/';
export const WAYFARER_ART={clothing:ROOT+'clothing-v3.png',faces:ROOT+'faces-v1.png',hair:ROOT+'hair-v1.png',settings:ROOT+'settings-v1.png',earned:ROOT+'earned-clothing-v2.png',equipment:ROOT+'equipment-v1.png'};
type Sheet=keyof typeof WAYFARER_ART;
type Rect={x:number;y:number;w:number;h:number};
const loaded=new Map<Sheet,Promise<HTMLImageElement>>();
const parts=new Map<string,HTMLCanvasElement>();
const wardrobe=new Map<string,HTMLCanvasElement>();
const pictures=new Map<string,string>();
const skins=['porcelain','sand','copper','umber','ebony','olive'];
const hairs=['crop','waves','coils','shaved','bob','long','pixie','undercut','braids','locs','ponytail','bun','twists','afro'];
const earned=['scholar-coat','linen-layers','cartographer-vest','grove-cloak','artisan-apron','tide-coat'];
const free=['wayfarer-coat','studio-knit','field-jacket'];
// Source art has optical gutters rather than mathematically identical row baselines.
// Explicit UVs keep neighbouring hairstyles out of the extracted layer.
const hairUV:Rect[]=[
 {x:0,y:0,w:313,h:267},{x:313,y:0,w:314,h:267},{x:627,y:0,w:313,h:267},{x:940,y:0,w:314,h:267},
 {x:0,y:275,w:313,h:310},{x:313,y:272,w:314,h:352},{x:627,y:275,w:313,h:285},{x:940,y:272,w:314,h:300},
 {x:0,y:595,w:313,h:350},{x:313,y:608,w:314,h:338},{x:627,y:589,w:313,h:385},{x:940,y:590,w:314,h:365},
 {x:0,y:943,w:313,h:311},{x:313,y:935,w:314,h:319},{x:627,y:1004,w:313,h:250},{x:940,y:978,w:314,h:276},
];
const hairFilters={ink:'brightness(.72)',chestnut:'sepia(.65) saturate(1.4) brightness(.95)',silver:'brightness(2.2) saturate(.25)',auburn:'sepia(1) saturate(2.5) hue-rotate(335deg) brightness(1.15)',honey:'sepia(1) saturate(1.6) brightness(1.8)'};

function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function context(c:HTMLCanvasElement){const ctx=c.getContext('2d');if(!ctx)throw new Error('Picture rendering is unavailable.');return ctx;}
function load(sheet:Sheet){let request=loaded.get(sheet);if(!request){request=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{loaded.delete(sheet);reject(new Error('The artwork could not be loaded.'));};img.src=WAYFARER_ART[sheet];});loaded.set(sheet,request);}return request;}

/** Trim only the transparent cell margin; preserve original alpha and artwork. */
function part(sheet:Sheet,img:HTMLImageElement,index:number,cols:number,rows:number){
 const key=sheet+':'+index;if(parts.has(key))return parts.get(key)!;
 const uv=sheet==='hair'?hairUV[index]:null;
 const x0=uv?Math.round(uv.x*img.width/1254):Math.round(index%cols*img.width/cols),y0=uv?Math.round(uv.y*img.height/1254):Math.round(Math.floor(index/cols)*img.height/rows),w=uv?Math.round(uv.w*img.width/1254):Math.round((index%cols+1)*img.width/cols)-x0,h=uv?Math.round(uv.h*img.height/1254):Math.round((Math.floor(index/cols)+1)*img.height/rows)-y0;
 const c=canvas(w,h),ctx=context(c);ctx.drawImage(img,x0,y0,w,h,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(left>=right||top>=bottom)throw new Error('An artwork layer is empty.');
 const crop=canvas(right-left+1,bottom-top+1);context(crop).drawImage(c,left,top,crop.width,crop.height,0,0,crop.width,crop.height);parts.set(key,crop);return crop;
}
function draw(ctx:CanvasRenderingContext2D,img:CanvasImageSource,r:Rect,filter='none'){ctx.save();ctx.filter=filter;ctx.drawImage(img,r.x,r.y,r.w,r.h);ctx.restore();}
function colorCloth(img:HTMLCanvasElement,value:Avatar,index:number){
 if(value.palette==='moss')return img;
 const key=index+':'+value.palette;if(wardrobe.has(key))return wardrobe.get(key)!;
 const c=canvas(img.width,img.height),ctx=context(c);ctx.drawImage(img,0,0);
 const pixels=ctx.getImageData(0,0,c.width,c.height),data=pixels.data;
 const hex=OUTFIT_COLORS[value.palette].slice(1),target=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
 for(let i=0;i<data.length;i+=4){
  if(data[i+3]<8)continue;
  const r=data[i],g=data[i+1],b=data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;if(delta<3)continue;
  const hue=(max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)*60;
  // The authored olive wool is a separate hue from linen, brass and leather.
  // This follows actual garment edges and folds, never rectangular screen areas.
  const mix=Math.max(0,Math.min(1,(hue-44)/9))*Math.max(0,Math.min(1,(155-hue)/15));if(!mix)continue;
  const light=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  const shade=light/96;
  for(let channel=0;channel<3;channel++)data[i+channel]=Math.round(data[i+channel]*(1-mix)+Math.min(255,target[channel]*shade)*mix);
 }
 ctx.putImageData(pixels,0,0);wardrobe.set(key,c);return c;
}
function softenedNeck(head:HTMLCanvasElement){
 const c=canvas(head.width,head.height),ctx=context(c);ctx.drawImage(head,0,0);
 const fade=ctx.createLinearGradient(0,head.height*.88,0,head.height);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,c.width,c.height);return c;
}
function ground(ctx:CanvasRenderingContext2D){
 ctx.save();ctx.translate(400,1181);ctx.scale(1,.17);
 const fade=ctx.createRadialGradient(0,0,8,0,0,165);fade.addColorStop(0,'rgba(20,25,19,.28)');fade.addColorStop(.5,'rgba(20,25,19,.13)');fade.addColorStop(1,'rgba(20,25,19,0)');ctx.fillStyle=fade;ctx.fillRect(-165,-165,330,330);ctx.restore();
}
function cover(ctx:CanvasRenderingContext2D,img:CanvasImageSource,sw:number,sh:number,w:number,h:number){const scale=Math.max(w/sw,h/sh);ctx.drawImage(img,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);}

export async function renderWayfarer(value:Avatar,equipment:Equipment={},portrait=false):Promise<{character:string;picture:string;setting:string;portrait:string}>{
 const key=JSON.stringify([value,equipment,portrait]);
 const cache=pictures.get(key);if(cache)return JSON.parse(cache);
 const isEarned=earned.includes(equipment.outfit??''),hasGear=Object.entries(equipment).some(([slot,id])=>slot!=='outfit'&&id);
 const [bodyImg,headImg,hairImg,scenes,gear]=await Promise.all([load(isEarned?'earned':'clothing'),load('faces'),load('hair'),load('settings'),hasGear?load('equipment'):Promise.resolve(null)]);
 const ready=pictures.get(key);if(ready)return JSON.parse(ready);
 const female=value.gender==='female',bodyIndex=isEarned?earned.indexOf(equipment.outfit!)+(female?6:0):Math.max(0,free.indexOf(equipment.outfit??value.outfit))+(female?3:0);
 const body=part(isEarned?'earned':'clothing',bodyImg,bodyIndex,3,isEarned?4:2),head=part('faces',headImg,skins.indexOf(value.skin)+(female?6:0),3,4),hair=part('hair',hairImg,hairs.indexOf(value.hair),4,4);
 const figure=canvas(800,1280),ctx=context(figure);
 ground(ctx);
 const width=value.build==='slim'?.92:value.build==='sturdy'?1.10:1,stature=value.stature==='short'?.94:value.stature==='tall'?1.06:1;
 // Overscan above the figure keeps tall characters and raised hairstyles intact.
 ctx.translate(400,1180);ctx.scale(width,stature);ctx.translate(-400,-1100);
 const bodyH=850,bodyW=bodyH*body.width/body.height,bodyRect={x:400-bodyW/2,y:250,w:bodyW,h:bodyH};
 const faceW=value.face==='round'?158:value.face==='angular'?146:value.face==='heart'?150:148,faceH=value.face==='round'?181:value.face==='angular'?196:190;
 const face={x:400-faceW/2,y:270-faceH,w:faceW,h:faceH};
 const long=['bob','long','braids','locs','ponytail','bun','twists','afro'].includes(value.hair);
 const hairW=(long?(value.hair==='afro'?242:value.hair==='bob'?202:218):176)*faceW/148,hairH=hairW*hair.height/hair.width;
 const wig={x:400-hairW/2,y:(value.hair==='afro'?10:value.hair==='bun'||value.hair==='ponytail'?0:58)+face.y-80,w:hairW,h:hairH};
 const filter=hairFilters[value.hairColor];
 if(gear&&equipment.aura==='focus-halo')draw(ctx,part('equipment',gear,10,4,3),{x:270,y:10,w:260,h:260});
 if(long)draw(ctx,hair,wig,filter);
 const neckWidth=face.w*(female?.50:.59),chin=face.y+face.h*.79;
 // The continuous neck sits behind the garment; the collar masks its lower edge.
 ctx.drawImage(head,head.width*.34,head.height*.83,head.width*.32,head.height*.15,400-neckWidth/2,chin,neckWidth,335-chin);
 const neckShadow=ctx.createLinearGradient(0,chin,0,chin+40);neckShadow.addColorStop(0,'rgba(34,23,17,.24)');neckShadow.addColorStop(1,'rgba(34,23,17,0)');ctx.fillStyle=neckShadow;ctx.fillRect(400-neckWidth/2,chin,neckWidth,40);
 const clothing=isEarned?body:colorCloth(body,{...value,outfit:(free.includes(equipment.outfit??'')?equipment.outfit:value.outfit) as Avatar['outfit']},bodyIndex);
 draw(ctx,clothing,bodyRect);
 draw(ctx,softenedNeck(head),face);
 // Face choices are proportional variations; iris colour and expression remain visible.
 const eyeColors={brown:'#61412a',hazel:'#827440',green:'#4f795d',blue:'#537a9b',grey:'#8b9291'};
 if(value.eyes!=='brown'){ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha=.65;ctx.fillStyle=eyeColors[value.eyes];for(const x of [.337,.665]){ctx.beginPath();ctx.ellipse(face.x+face.w*x,face.y+face.h*.378,face.w*.029,face.h*.024,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(value.expression!=='gentle'){
  const patch=canvas(100,35),p=context(patch);p.drawImage(head,head.width*.26,head.height*.60,head.width*.48,head.height*.16,0,0,100,35);
  draw(ctx,patch,{x:face.x+face.w*.26,y:face.y+face.h*.60,w:face.w*.48,h:face.h*(value.expression==='bright'?.18:.145)});
 }
 if(value.hair==='ponytail'){
  ctx.save();ctx.beginPath();ctx.rect(0,0,800,1280);ctx.ellipse(400,face.y+95,face.w*.43,face.h*.45,0,0,Math.PI*2);ctx.clip('evenodd');draw(ctx,hair,wig,filter);ctx.restore();
 }else{ctx.save();ctx.shadowColor='rgba(23,21,16,.18)';ctx.shadowBlur=3;ctx.shadowOffsetY=2;draw(ctx,hair,wig,filter);ctx.restore();}
 if(value.beard!=='clean'){
  const beard=part('hair',hairImg,value.beard==='full'?15:14,4,4),w=face.w*.77;
  ctx.save();ctx.globalAlpha=value.beard==='stubble'?.28:1;draw(ctx,beard,{x:400-w/2,y:face.y+face.h*.53,w,h:w*beard.height/beard.width},filter);ctx.restore();
 }
 if(gear){
  const item=(index:number,r:Rect)=>draw(ctx,part('equipment',gear,index,4,3),r);
  if(equipment.back==='map-carrier')item(8,{x:270,y:265,w:225,h:400});
  if(equipment.accessory==='mission-satchel')item(1,{x:265,y:265,w:250,h:430});
  if(equipment.accessory==='trail-scarf')item(0,{x:340,y:246,w:120,h:145});
  if(equipment.accessory==='sharp-pin')item(2,{x:437,y:307,w:33,h:33});
  if(equipment.neck==='leaf-pendant')item(7,{x:366,y:262,w:68,h:118});
  if(equipment.accessory==='lantern-charm')item(9,{x:500,y:610,w:75,h:115});
  if(equipment.headwear==='grove-hood')item(6,{x:281,y:47,w:238,h:295});
  if(equipment.eyes==='copper-spectacles')item(3,{x:face.x+face.w*.12,y:face.y+face.h*.30,w:face.w*.76,h:face.h*.21});
  if(equipment.hands==='field-gloves'){const gloves=part('equipment',gear,4,4,3);ctx.drawImage(gloves,0,0,gloves.width/2,gloves.height,bodyRect.x+bodyRect.w*.015,585,46,90);ctx.drawImage(gloves,gloves.width/2,0,gloves.width/2,gloves.height,bodyRect.x+bodyRect.w*.86,585,46,90);}
  if(equipment.feet==='ridge-boots')item(5,{x:bodyRect.x+bodyRect.w*.20,y:968,w:bodyRect.w*.60,h:132});
 }
 const setting=part('settings',scenes,['atrium','grove','workshop'].indexOf(value.background),3,1);
 const scene=canvas(600,900),s=context(scene);cover(s,setting,setting.width,setting.height,600,900);
 const sceneURL=scene.toDataURL('image/webp',.86);
 const cropY=1180-1020*stature-100;
 const result=canvas(portrait?256:800,portrait?256:1280),r=context(result);
 cover(r,scene,600,900,result.width,result.height);
 if(portrait)r.drawImage(figure,235,cropY,330,330,0,0,256,256);
 else r.drawImage(figure,0,0);
 const portraitCanvas=canvas(256,256),p=context(portraitCanvas);cover(p,scene,600,900,256,256);p.drawImage(figure,235,cropY,330,330,0,0,256,256);
 const art={character:figure.toDataURL('image/webp',.9),picture:result.toDataURL('image/webp',.88),setting:sceneURL,portrait:portraitCanvas.toDataURL('image/webp',.88)};
 if(pictures.size>=64)pictures.delete(pictures.keys().next().value!);pictures.set(key,JSON.stringify(art));return art;
}
