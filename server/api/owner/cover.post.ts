import {readMultipartFormData,createError} from 'h3'
import {randomUUID} from 'node:crypto'
import {ownerEvent,adminDb} from '../../utils/media'
import {COVER_BUCKET,VALID_IMAGE,signedCover} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const parts=await readMultipartFormData(event)
 const id=parts?.find(p=>p.name==='id')?.data.toString('utf8')||''
 const row=await ownerEvent(event,id)
 const file=parts?.find(p=>p.name==='file')
 if(!file?.data||!VALID_IMAGE.includes(file.type||'')||file.data.length>10*1024*1024||file.data.length===0)
  throw createError({statusCode:400,statusMessage:'Upload a JPEG, PNG or WebP under 10 MB'})
 const magic=file.data
 const jpeg=magic[0]===0xff&&magic[1]===0xd8&&magic[2]===0xff
 const png=magic.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
 const webp=magic.subarray(0,4).toString()==='RIFF'&&magic.subarray(8,12).toString()==='WEBP'
 if(!((file.type==='image/jpeg'&&jpeg)||(file.type==='image/png'&&png)||(file.type==='image/webp'&&webp)))throw createError({statusCode:400,statusMessage:'Invalid image data'})
 const ext=jpeg?'jpg':png?'png':'webp',path=`${row.id}/covers/${randomUUID()}.${ext}`
 const db=adminDb(),bucket=db.storage.from(COVER_BUCKET)
 const {error:uploadError}=await bucket.upload(path,file.data,{contentType:file.type,upsert:false})
 if(uploadError)throw createError({statusCode:500,statusMessage:'Could not upload cover'})
 const {error}=await db.from('events').update({cover_path:path}).eq('id',row.id)
 if(error){await bucket.remove([path]);throw createError({statusCode:500,statusMessage:'Could not save cover'})}
 // Do not delete old cover: saved poster designs can retain snapshots of it.
 return {cover_url:await signedCover(path)}
})
