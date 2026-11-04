<script setup lang="ts">
import QRCode from 'qrcode'
type SignKey='heading'|'event'|'date'|'message'|'qr'|'action'
const props=withDefaults(defineProps<{
 config:any; backgroundUrl?:string|null; eventName?:string; eventDate?:string;
 qrUrl?:string; editable?:boolean; sample?:boolean
}>(),{eventName:'Daniel & Hannah',eventDate:'15 MAY 2026',editable:false,sample:false})
const emit=defineEmits<{(e:'select',key:SignKey):void}>()
const keys:SignKey[]=['heading','event','date','message','qr','action']
const canvasEl=ref<HTMLElement|null>(null)
const zoneEls=ref<Record<string,HTMLElement>>({})
const fittedSizes=ref<Record<string,number>>({})
const smartAreas=computed<Record<string,any>>(()=>props.config?.smartAreas||{})
const hasSmartAreas=computed(()=>Object.keys(smartAreas.value).some(k=>keys.includes(k as SignKey)))
const zone=(key:SignKey)=>smartAreas.value[key]
function setZoneEl(key:string,el:any){if(el)zoneEls.value[key]=el as HTMLElement;else delete zoneEls.value[key]}
function zoneStyle(key:SignKey){const a=zone(key);if(!a)return {display:'none'};return {
 left:`${a.x}%`,top:`${a.y}%`,width:`${a.w}%`,height:`${a.h}%`,
 display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center' as const
}}
function fitText(){
 if(!hasSmartAreas.value)return
 const next:Record<string,number>={}
 for(const key of keys){if(key==='qr'||!zone(key))continue
  const el=zoneEls.value[key];if(!el)continue
  const style=props.config?.typography?.[key]||{}
  // Font sizes in the editor are document units: 1 unit = 0.24% of the
  // full sign width. Do not use zone width here, or a 48-unit font becomes
  // twice as large in a narrow content area.
  const canvasWidth=canvasEl.value?.clientWidth||el.clientWidth
  const toPx=(units:number)=>units*0.0024*canvasWidth
  const requested=Math.max(6,Math.min(110,Number(style.size)||16))
  const maxAllowed=Math.max(6,Math.min(130,Number(zone(key).maxFont)||110))
  const requestedPx=toPx(Math.min(requested,maxAllowed))
  const target=el.querySelector('.ek-fit-text') as HTMLElement|null
  if(!target)continue
  // Begin at the requested size. Only shrink when text would overflow.
  // Measure the actual font and line wrapping, rather than character count.
  let low=toPx(5),high=requestedPx,best=low
  for(let i=0;i<14;i++){
   const mid=(low+high)/2
   target.style.fontSize=`${mid}px`
   const fits=target.scrollWidth<=el.clientWidth-2&&target.scrollHeight<=el.clientHeight-2
   if(fits){best=mid;low=mid}else high=mid
  }
  next[key]=Math.min(requestedPx,best)
 }
 fittedSizes.value=next
}
let observer:ResizeObserver|undefined
onMounted(()=>{if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>fitText());if(canvasEl.value)observer.observe(canvasEl.value)}nextTick(fitText);if(typeof document!=='undefined')document.fonts?.ready.then(fitText)})
onBeforeUnmount(()=>observer?.disconnect())
watch(()=>[props.config?.smartAreas,props.config?.typography,props.config?.heading,props.config?.message,props.eventName,props.eventDate],()=>nextTick(fitText),{deep:true})

const order=computed(()=>{const a=Array.isArray(props.config?.contentOrder)?props.config.contentOrder:keys;return [...new Set([...a.filter((k:any)=>keys.includes(k)),...keys])] as SignKey[]})
const qrImage=ref('')
watch(()=>[props.qrUrl,props.sample,props.config?.qrColourMode],async()=>{
 const data=props.qrUrl|| (props.sample?'https://example.org/event/sample':'')
 if(!data){qrImage.value='';return}
 try{qrImage.value=await QRCode.toDataURL(data,{width:900,margin:4,errorCorrectionLevel:'H',color:{dark:props.config?.qrColourMode==='light'?'#FFFFFF':'#0C1D2D',light:'#00000000'}})}catch{qrImage.value=''}
},{immediate:true})
const fontLink=computed(()=>{
 const names=[...new Set(Object.values(props.config?.typography||{}).map((s:any)=>String(s?.font||'').match(/^'([^']+)'/)?.[1]).filter(Boolean))]
 return names.length?'https://fonts.googleapis.com/css2?'+names.map(n=>'family='+encodeURIComponent(n as string).replace(/%20/g,'+')).join('&')+'&display=swap':''
})
function fieldText(key:SignKey){
 if(key==='heading')return props.config?.heading||'Welcome'
 if(key==='event')return props.eventName
 if(key==='date')return props.eventDate
 if(key==='message')return props.config?.message||''
 if(key==='action')return props.config?.actionText||'Point your phone camera here'
 return ''
}
function textStyle(key:SignKey){
 const t=props.config?.typography?.[key]||{},p=props.config?.textPlacement?.[key]||{}
 const n=Number(t.size||16)
 return {fontFamily:t.font||'Georgia, serif',fontSize:`${Math.max(6,Math.min(110,n))*0.24}cqw`,color:t.color||t.colour||'#6B431D',
 fontWeight:t.bold?'bold':'normal',fontStyle:t.italic?'italic':'normal',textDecoration:t.underline?'underline':'none',
 textAlign:p.align||'center',transform:`translateY(${Number(p.offset||0)*0.24}cqw)`}
}
function choose(key:SignKey){if(props.editable&&key!=='qr')emit('select',key)}
</script>
<template>
 <div ref="canvasEl" class="ek-shared-sign" :style="{backgroundColor:config?.paletteBackground||'#FFF9ED'}" aria-label="Welcome sign">
  <link v-if="fontLink" rel="stylesheet" :href="fontLink"/>
  <img v-if="backgroundUrl" :src="backgroundUrl" class="ek-shared-background" alt="" aria-hidden="true"/>
  <div v-if="hasSmartAreas" class="ek-smart-stage">
   <template v-for="key in keys" :key="key">
    <div v-if="zone(key)&& (key!=='date'||config?.showDate!==false)" :ref="(el)=>setZoneEl(key,el)" class="ek-smart-zone" :style="zoneStyle(key)">
     <template v-if="key==='qr'">
      <img v-if="qrImage" class="ek-smart-qr" :src="qrImage" alt="QR code for event uploads"/>
      <span v-else class="ek-shared-qr-pending">QR loading</span>
     </template>
     <div v-else class="ek-fit-text" :class="{'ek-shared-editable':editable}" :style="{...textStyle(key),fontSize:(fittedSizes[key]??(Math.max(6,Math.min(110,Number(config?.typography?.[key]?.size)||16))*0.0024*(canvasEl?.clientWidth||400)))+'px',transform:'none',width:'100%',maxHeight:'100%',overflow:'hidden'}" :role="editable?'button':undefined" :tabindex="editable?0:undefined" @click="choose(key)" @keydown.enter="choose(key)">{{fieldText(key)}}</div>
    </div>
   </template>
  </div>
  <div v-else class="ek-shared-content">
   <template v-for="key in order" :key="key">
    <div v-if="key==='qr'" class="ek-shared-qr" :style="{width:`${Math.max(25,Math.min(70,Number(config?.qrSize||52)))}%`}">
     <img v-if="qrImage" :src="qrImage" alt="QR code for event uploads"/>
     <span v-else class="ek-shared-qr-pending">QR code loading</span>
    </div>
    <div v-else-if="key!=='date'||config?.showDate!==false"
     class="ek-shared-text" :class="{'ek-shared-editable':editable}"
     :role="editable?'button':undefined" :tabindex="editable?0:undefined"
     :style="textStyle(key)" @click="choose(key)" @keydown.enter="choose(key)">
     {{fieldText(key)}}
    </div>
   </template>
  </div>
 </div>
</template>
<style>
.ek-shared-sign{position:relative;isolation:isolate;aspect-ratio:210/297;width:100%;height:100%;overflow:hidden;container-type:inline-size;box-sizing:border-box}
.ek-shared-background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:0}
.ek-shared-content{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;gap:1%;padding:15% 12%;box-sizing:border-box;text-align:center}
.ek-shared-text{width:100%;max-width:100%;white-space:pre-line;overflow-wrap:anywhere;line-height:1.16;flex-shrink:1;min-height:0}
.ek-shared-editable{cursor:pointer}.ek-shared-editable:hover{outline:1px dashed #B18A50}
.ek-shared-editable:focus-visible{outline:2px solid #B18A50}
.ek-shared-qr{flex-shrink:1;max-width:100%;min-height:0;display:flex;justify-content:center;align-items:center;aspect-ratio:1/1}
.ek-shared-qr img{width:100%;height:100%;object-fit:contain}
.ek-smart-stage{position:absolute;inset:0;z-index:2;pointer-events:none}
.ek-smart-zone{position:absolute;box-sizing:border-box;pointer-events:auto;overflow:hidden}
.ek-fit-text{white-space:pre-line;overflow-wrap:anywhere;line-height:1.12;box-sizing:border-box}
.ek-smart-qr{display:block;max-width:100%;max-height:100%;width:auto;height:auto;aspect-ratio:1;object-fit:contain;background:#fff;padding:3%;box-sizing:border-box}
.ek-shared-qr-pending{background:#fff;padding:10px;color:#333;font-size:12px}
@media print {.ek-shared-sign,.ek-shared-sign *{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}}
</style>
