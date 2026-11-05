import {createError} from 'h3'
import {adminDb} from './media'
import {signedCover} from './branding'
export const templateCategories=['wedding','birthday','celebration','christening','baby','graduation','corporate','anniversary','memorial','other']
export function validTemplateConfig(input:any){
 if(!input||typeof input!=='object'||Array.isArray(input))throw createError({statusCode:400,statusMessage:'Invalid sign configuration'})
 const cfg=JSON.parse(JSON.stringify(input))
 if(JSON.stringify(cfg).length>60000)throw createError({statusCode:400,statusMessage:'Sign configuration too large'})
 if(!['A4','A5'].includes(cfg.paper)||!['classic','romance','modern'].includes(cfg.theme))throw createError({statusCode:400,statusMessage:'Invalid sign format'})
 if(typeof cfg.heading!=='string'||cfg.heading.length>100||typeof cfg.message!=='string'||cfg.message.length>260)throw createError({statusCode:400,statusMessage:'Invalid sign text'})
 if(cfg.variants!==undefined){
  if(!Array.isArray(cfg.variants)||cfg.variants.length>12)throw createError({statusCode:400,statusMessage:'Maximum 12 colour variations'})
  const ids=new Set<string>()
  cfg.variants=cfg.variants.map((v:any)=>{
   const id=String(v?.id||''),name=String(v?.name||'').trim()
   if(!/^[a-z0-9_-]{1,48}$/.test(id)||ids.has(id)||!name||name.length>60)throw createError({statusCode:400,statusMessage:'Invalid variation'})
   ids.add(id)
   const colors:any={}
   for(const [key,value] of Object.entries(v?.colors||{})){
    if(!['heading','event','date','message','action'].includes(key)||typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw createError({statusCode:400,statusMessage:'Invalid variation colour'})
    colors[key]=value
   }
   const background_path=v?.background_path||null
   if(background_path&&(typeof background_path!=='string'||!/^sign-templates\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(background_path)))throw createError({statusCode:400,statusMessage:'Invalid variation background'})
   return {id,name,colors,background_path}
  })
 }
 // A reusable template never captures an owner's event-specific cover or URL.
 cfg.useCover=false
 delete cfg.posterCover;delete cfg.coverUrl;delete cfg.guestUrl;delete cfg.qr
 return cfg
}
export function templateName(name:any){const s=String(name||'').trim().slice(0,80);if(!s)throw createError({statusCode:400,statusMessage:'Enter a template name'});return s}
export function templateCategory(category:any){const s=String(category||'');if(!templateCategories.includes(s))throw createError({statusCode:400,statusMessage:'Invalid template category'});return s}
export async function templateView(row:any){
 const variants=Array.isArray(row.config?.variants)?row.config.variants:[]
 return {...row,background_url:row.background_path?await signedCover(row.background_path):null,
  variants:await Promise.all(variants.map(async(v:any)=>({...v,background_url:v.background_path?await signedCover(v.background_path):null})))}
}
export async function requireTemplate(id:string){const {data,error}=await adminDb().from('sign_template_library').select('*').eq('id',id).maybeSingle();if(error)throw createError({statusCode:500,statusMessage:'Template lookup failed. Apply migration 020.'});if(!data)throw createError({statusCode:404,statusMessage:'Template not found'});return data}
