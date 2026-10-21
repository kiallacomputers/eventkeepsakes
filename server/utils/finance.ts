import {createError} from 'h3'
import {adminDb} from './media'
export async function financeSettings(){
 const {data,error}=await adminDb().from('event_finance_settings').select('*').eq('id',1).single()
 if(error||!data)throw createError({statusCode:500,statusMessage:'Financial settings unavailable. Run migration 007.'})
 return data
}
export function audFromCents(amount:number,currency:string,rate:number){
 if(currency.toUpperCase()==='AUD')return amount/100
 if(currency.toUpperCase()==='USD')return amount/100*rate
 return null // never silently treat another currency as AUD
}
