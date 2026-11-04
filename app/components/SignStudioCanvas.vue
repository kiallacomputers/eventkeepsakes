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
// Font sizes are A4 reference pixels (794px wide at 96dpi).
// Convert to the current preview width exactly once. The old 0.24cqw
// conversion was over-scaling the requested size and then shrinking it
// to a few pixels when the fitting loop measured overflow.
const A4_REFERENCE_WIDTH=794
const canvasWidth=ref(794)
const pxFromReference=(size:number)=>size*canvasWidth.value/A4_REFERENCE_WIDTH
function requestedSize(key:SignKey){
 const raw=Number(props.config?.typography?.[key]?.size)
 return Math.max(6,Math.min(130,Number.isFinite(raw)&&raw>0?raw:16))
}
function fitText(){
 const canvas=canvasEl.value
 if(!canvas||!hasSmartAreas.value)return
 canvasWidth.value=canvas.getBoundingClientRect().width||794
 const next:Record<string,number>={}
 for(const key of keys){
  if(key==='qr'||!zone(key))continue
  const el=zoneEls.value[key]
  const target=el?.querySelector('.ek-fit-text') as HTMLElement|null
  if(!el||!target)continue
  const area=zone(key)
  const requested=requestedSize(key)
  // The administrator's maximum is a safety cap, not a replacement for
  // the requested size. A higher owner selection still triggers a refit.
  const configuredMax=Number(area?.maxFont)
  const maxReference=Number.isFinite(configuredMax)&&configuredMax>0
   ?Math.max(6,Math.min(130,configuredMax)):130
  const upper=pxFromReference(Math.min(requested,maxReference))
  const lower=pxFromReference(6)
  const width=el.clientWidth
  const height=el.clientHeight
  if(width<2||height<2){next[key]=upper;continue}
  // Measure unconstrained content: max-height/overflow on the visible
  // element can mask its real height and falsely force the smallest font.
  const measure=target.cloneNode(true) as HTMLElement
  measure.removeAttribute('role')
  measure.removeAttribute('tabindex')
  Object.assign(measure.style,{
   position:'absolute',visibility:'hidden',pointerEvents:'none',
   left:'0',top:'0',width:`${width}px`,maxWidth:`${width}px`,
   height:'auto',maxHeight:'none',minHeight:'0',overflow:'visible',
   transform:'none',boxSizing:'border-box',margin:'0',padding:'0'
  })
  canvas.appendChild(measure)
  const fits=(size:number)=>{
   measure.style.fontSize=`${size}px`
   return measure.scrollHeight<=height+1&&measure.scrollWidth<=width+1
  }
  try{
   if(fits(upper)){next[key]=upper;continue}
   let low=lower,high=upper
   if(!fits(low)){next[key]=low;continue}
   for(let i=0;i<16;i++){
    const mid=(low+high)/2
    if(fits(mid))low=mid
    else high=mid
   }
   next[key]=low
  }finally{measure.remove()}
 }
 fittedSizes.value=next
}
let observer:ResizeObserver|undefined
onMounted(()=>{if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>fitText());if(canvasEl.value)observer.observe(canvasEl.value)}nextTick(fitText);if(typeof document!=='undefined')document.fonts?.ready.then(fitText)})
onBeforeUnmount(()=>observer?.disconnect())
watch(()=>[props.config?.smartAreas,props.config?.typography,props.config?.heading,props.config?.message,props.eventName,props.eventDate],()=>nextTick(fitText),{deep:true,flush:'post'})

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
 return {fontFamily:t.font||'Georgia, serif',fontSize:`${Math.max(6,Math.min(130,n))/794*100}cqw`,color:t.color||t.colour||'#6B431D',
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
     <div v-else class="ek-fit-text" :class="{'ek-shared-editable':editable}" :style="{...textStyle(key),fontSize:(fittedSizes[key]??pxFromReference(requestedSize(key)))+'px',transform:'none',width:'100%',maxHeight:'100%',overflow:'hidden'}" :role="editable?'button':undefined" :tabindex="editable?0:undefined" @click="choose(key)" @keydown.enter="choose(key)">{{fieldText(key)}}</div>
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
