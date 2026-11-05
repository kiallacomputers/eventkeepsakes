import {readMultipartFormData,createError} from 'h3'
import {randomUUID} from 'node:crypto'
import {ownerUser,adminDb} from '../../utils/media'
import {staffRole} from '../../utils/payments'
import {COVER_BUCKET} from '../../utils/branding'
import {requireTemplate,templateView} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event),role=await staffRole(userId)
 if(!role)throw createError({statusCode:403,statusMessage:'Administration access required'})
 const parts=await readMultipartFormData(event)
 const id=parts?.find(p=>p.name==='id')?.data.toString('utf8')||''
 const variationId=parts?.find(p=>p.name==='variationId')?.data.toString('utf8')||''
 const file=parts?.find(p=>p.name==='image')
 const row=await requireTemplate(id)
 if(!file||!file.data.length||file.data.length>12*1024*1024)throw createError({statusCode:400,statusMessage:'Image must be 12 MB or smaller'})
 const mime=String(file.type||'')
 if(!['image/png','image/jpeg','image/webp'].includes(mime))throw createError({statusCode:400,statusMessage:'Use PNG, JPG or WebP'})
 const bytes=file.data
 const valid=mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'
 if(!valid)throw createError({statusCode:400,statusMessage:'Invalid image file'})
 const path=`sign-templates/${row.id}/${randomUUID()}.${mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp'}`
 const db=adminDb()
 const {error:uploadError}=await db.storage.from(COVER_BUCKET).upload(path,bytes,{contentType:mime,upsert:false})
 if(uploadError)throw createError({statusCode:500,statusMessage:'Background upload failed'})
 const changes:any={updated_at:new Date().toISOString()}
 if(variationId){
  const config=structuredClone(row.config||{})
  if(!Array.isArray(config.variants))throw createError({statusCode:400,statusMessage:'Save the variation before uploading artwork'})
  const variant=config.variants.find((v:any)=>v.id===variationId)
  if(!variant)throw createError({statusCode:404,statusMessage:'Variation not found; save the template first'})
  variant.background_path=path
  changes.config=config
 }else changes.background_path=path
 const {data,error}=await db.from('sign_template_library').update(changes).eq('id',row.id).select('*').single()
 if(error)throw createError({statusCode:500,statusMessage:'Could not attach background'})
 return {template:await templateView(data)}
})
