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
 // A reusable template never captures an owner's event-specific cover or URL.
 cfg.useCover=false
 delete cfg.posterCover;delete cfg.coverUrl;delete cfg.guestUrl;delete cfg.qr
 return cfg
}
export function templateName(name:any){const s=String(name||'').trim().slice(0,80);if(!s)throw createError({statusCode:400,statusMessage:'Enter a template name'});return s}
export function templateCategory(category:any){const s=String(category||'');if(!templateCategories.includes(s))throw createError({statusCode:400,statusMessage:'Invalid template category'});return s}
export async function templateView(row:any){return {...row,background_url:row.background_path?await signedCover(row.background_path):null}}
export async function requireTemplate(id:string){const {data,error}=await adminDb().from('sign_template_library').select('*').eq('id',id).maybeSingle();if(error)throw createError({statusCode:500,statusMessage:'Template lookup failed. Apply migration 020.'});if(!data)throw createError({statusCode:404,statusMessage:'Template not found'});return data}
