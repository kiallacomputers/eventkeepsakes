import {createError} from 'h3'
import {adminDb} from './media'
export const COVER_BUCKET='event-covers'
export const VALID_IMAGE=['image/jpeg','image/png','image/webp']
export const safeStyle=(row:any)=>({welcome_message:String(row.welcome_message||''),gallery_layout:row.gallery_layout||'grid',gallery_theme:row.gallery_theme||'classic',gallery_accent:row.gallery_accent||'#B18A50',has_cover:!!row.cover_path})
export async function signedCover(path:string|null|undefined){
 if(!path)return null
 const {data,error}=await adminDb().storage.from(COVER_BUCKET).createSignedUrl(path,600)
 if(error)throw createError({statusCode:500,statusMessage:'Cover image unavailable'})
 return data.signedUrl
}
export function validateStyle(b:any){
 const message=String(b.welcome_message||'').trim()
 if(message.length>500)throw createError({statusCode:400,statusMessage:'Welcome message too long'})
 const layout=String(b.gallery_layout||'grid'),theme=String(b.gallery_theme||'classic'),accent=String(b.gallery_accent||'#B18A50')
 if(!['grid','masonry'].includes(layout)||!['classic','wedding','birthday','corporate','custom'].includes(theme)||!/^#[0-9a-f]{6}$/i.test(accent))throw createError({statusCode:400,statusMessage:'Invalid gallery appearance'})
 return {welcome_message:message,gallery_layout:layout,gallery_theme:theme,gallery_accent:accent}
}
