import { readBody, createError } from 'h3'
import { adminDb,eventBySlug,ipHash,setGuestSession } from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const body=await readBody(event)
 const slug=String(body?.slug||'').slice(0,150)
 const row=await eventBySlug(slug)
 if(row.pin_enabled){
  const pin=String(body?.pin||'')
  if(!/^\d{4,8}$/.test(pin)) throw createError({statusCode:401,statusMessage:'Invalid PIN'})
  const {data,error}=await adminDb().rpc('check_guest_pin',{p_event_id:row.id,p_pin:pin,p_ip_fingerprint:ipHash(event)})
  if(error) throw createError({statusCode:429,statusMessage:error.message})
  if(!data) throw createError({statusCode:401,statusMessage:'Incorrect PIN'})
 }
 setGuestSession(event,row.id)
 return {ok:true}
})
