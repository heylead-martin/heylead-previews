// Fetch only reviewed Pexels photo IDs. Ordinary builds use the committed local files.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
let local={};
try {local=parseEnv(await readFile(new URL('.env.local',root),'utf8'));} catch(error) {if(error.code!=='ENOENT')throw error;}
const key=process.env.PEXELS_API_KEY||local.PEXELS_API_KEY;
if(!key)throw new Error('Set PEXELS_API_KEY in the environment or ignored roster/.env.local.');
const selected={aircon:6033459,plumbing:6419128,electrician:6412539,handyman:6713705,cleaning:7513111};
await mkdir(new URL('assets/hero/',root),{recursive:true});
const photos={};
for(const [service,id] of Object.entries(selected)) {
  const response=await fetch(`https://api.pexels.com/v1/photos/${id}`,{headers:{Authorization:key}});
  if(!response.ok)throw new Error(`Pexels metadata request failed (${response.status}) for photo ${id}.`);
  const photo=await response.json();
  if(photo.id!==id||new URL(photo.url).hostname!=='www.pexels.com'||new URL(photo.src.original).hostname!=='images.pexels.com')throw new Error('Unexpected Pexels photo metadata.');
  const sizes={};
  for(const width of [640,1200]) {
    const url=new URL(photo.src.original);
    url.search=new URLSearchParams({auto:'compress',cs:'tinysrgb',w:String(width),h:String(Math.round(width*2/3)),fit:'crop'});
    const image=await fetch(url);
    if(!image.ok||!image.headers.get('content-type')?.startsWith('image/'))throw new Error(`Pexels image request failed for ${id}.`);
    const buffer=Buffer.from(await image.arrayBuffer());
    const src=`/roster/assets/hero/pexels-${id}-${width}.jpg`;
    await writeFile(new URL(src.replace('/roster/',''),root),buffer);
    sizes[width]={src,sha256:createHash('sha256').update(buffer).digest('hex')};
  }
  photos[service]={id,photographer:photo.photographer,url:photo.url,photographerUrl:photo.photographer_url,alt:photo.alt,sizes};
  console.log(`Saved reviewed ${service} photo ${id}.`);
}
await writeFile(new URL('data/hero-photos.json',root),JSON.stringify(photos,null,2)+'\n');
