<script setup lang="ts">
import QRCode from 'qrcode'
definePageMeta({middleware:'auth'})
const route=useRoute()
const client=useSupabaseClient()
const dialog=useAppDialog()
const item=ref<any>(null)
const loading=ref(true)
const error=ref('')
const origin=ref('')
const qr=ref('')
const qrColourMode=ref<'auto'|'dark'|'light'>('auto')
const qrInk=computed(()=>qrColourMode.value==='light'?'#FFFFFF':'#0C1D2D')
async function updateQr(){
 if(!guestUrl.value)return
 qr.value=await QRCode.toDataURL(guestUrl.value,{width:1200,margin:4,errorCorrectionLevel:'H',color:{dark:qrInk.value,light:'#00000000'}})
}



// Per-element typography controls, persisted in each saved poster design.
type TextKey = 'brand'|'tagline'|'event'|'date'|'heading'|'message'|'action'|'footer'
type TextStyle = { size:number; color:string; font:string; bold:boolean; italic:boolean; underline:boolean }
const fontOptions = [
 {value:'Georgia, serif',label:'Georgia · Elegant serif'},
 {value:'Arial, sans-serif',label:'Arial · Clean'},
 {value:'Verdana, sans-serif',label:'Verdana · Modern'},
 {value:'Tahoma, sans-serif',label:'Tahoma · Compact'},
 {value:'Trebuchet MS, sans-serif',label:'Trebuchet · Friendly'},
 {value:'Times New Roman, serif',label:'Times New Roman · Traditional'},
 {value:'Palatino Linotype, Book Antiqua, Palatino, serif',label:'Palatino · Classic'},
 {value:'Garamond, Georgia, serif',label:'Garamond · Formal'},
 {value:'Courier New, monospace',label:'Courier New · Typewriter'},
 {value:'Impact, sans-serif',label:'Impact · Bold'},
]
const typographySections:{key:TextKey;label:string}[]=[
 {key:'brand',label:'EventKeepsakes logo'},
 {key:'tagline',label:'Brand tagline'},
 {key:'event',label:'Event name'},
 {key:'date',label:'Event date'},
 {key:'heading',label:'Welcome heading'},
 {key:'message',label:'Message'},
 {key:'action',label:'QR instructions'},
 {key:'footer',label:'Footer'},
]
const typography=reactive<Record<TextKey,TextStyle>>({
 brand:{size:28,color:'#0C1D2D',font:'Georgia, serif',bold:true,italic:false,underline:false},
 tagline:{size:10,color:'#B18A50',font:'Arial, sans-serif',bold:false,italic:false,underline:false},
 event:{size:43,color:'#0C1D2D',font:'Georgia, serif',bold:false,italic:false,underline:false},
 date:{size:15,color:'#B18A50',font:'Arial, sans-serif',bold:false,italic:false,underline:false},
 heading:{size:26,color:'#0C1D2D',font:'Georgia, serif',bold:false,italic:false,underline:false},
 message:{size:14,color:'#0C1D2D',font:'Arial, sans-serif',bold:false,italic:false,underline:false},
 action:{size:15,color:'#0C1D2D',font:'Arial, sans-serif',bold:true,italic:false,underline:false},
 footer:{size:12,color:'#B18A50',font:'Arial, sans-serif',bold:false,italic:false,underline:false},
})
const selectedTypography=ref<TextKey>('event')
const selectedText=computed(()=>typography[selectedTypography.value])
const textClassMap:Record<TextKey,string>={brand:'brand',tagline:'tagline',event:'title',date:'date',heading:'heading',message:'message',action:'action',footer:'footer'}
const signTypographyVars=computed(()=>{
 const vars:Record<string,string>={}
 const scale=paper.value==='A5'?0.705:1
 for(const {key} of typographySections){
  const t=typography[key]
  const prefix=`--ek-${textClassMap[key]}`
  vars[`${prefix}-size`]=`${Math.round(t.size*scale*100)/100}px`
  vars[`${prefix}-print-size`]=`${Math.round(t.size*0.75*scale*100)/100}pt`
  vars[`${prefix}-color`]=t.color
  vars[`${prefix}-font`]=t.font
  vars[`${prefix}-weight`]=t.bold?'700':'400'
  vars[`${prefix}-style`]=t.italic?'italic':'normal'
  vars[`${prefix}-decoration`]=t.underline?'underline':'none'
 }
 return vars
})
function restoreTypography(raw:any){
 if(!raw||typeof raw!=='object')return
 for(const {key} of typographySections){
  const t=raw[key]
  if(!t||typeof t!=='object')continue
  if(Number.isFinite(Number(t.size)))typography[key].size=Math.min(80,Math.max(6,Number(t.size)))
  if(typeof t.color==='string'&&/^#[0-9a-f]{6}$/i.test(t.color))typography[key].color=t.color
  if(fontOptions.some(f=>f.value===t.font))typography[key].font=t.font
  for(const field of ['bold','italic','underline'] as const)if(typeof t[field]==='boolean')typography[key][field]=t[field]
 }
}

const heading=ref('Scan & Share Your Memories')
const message=ref('Help us capture every special moment! Scan the QR code to share your photos and videos.')
const paper=ref<'A4'|'A5'>('A4')
const photoFill=ref(false)
const photoOverlay=ref(28) // White overlay percentage: lower means a stronger, more vivid photo
const theme=ref<'classic'|'romance'|'modern'>('classic')
const showDate=ref(true)
const coverUrl=ref<string|null>(null),posterCover=ref<string|null>(null),useCover=ref(false)
const posterName=ref('Welcome poster'),savedPosters=ref<any[]>([]),posterBusy=ref(false),posterError=ref('')
async function posterAuth(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in again');return {authorization:`Bearer ${session.access_token}`}}
async function loadPosterAssets(){try{const headers=await posterAuth();const [branding,posters]=await Promise.all([$fetch<any>('/api/owner/branding',{query:{id:String(route.params.id)},headers}),$fetch<any>('/api/owner/posters',{query:{id:String(route.params.id)},headers})]);coverUrl.value=branding.cover_url;savedPosters.value=posters.designs}catch(e:any){posterError.value=e?.data?.statusMessage||e.message}}
async function savePoster(){posterBusy.value=true;posterError.value='';try{const result=await $fetch<any>('/api/owner/posters',{method:'POST',headers:await posterAuth(),body:{eventId:String(route.params.id),name:posterName.value,config:{paper:paper.value,theme:theme.value,heading:heading.value,message:message.value,showDate:showDate.value,useCover:useCover.value,qrColourMode:qrColourMode.value,photoOverlay:photoOverlay.value,photoFill:photoFill.value,typography:JSON.parse(JSON.stringify(typography))}}});posterCover.value=result.snapshot_url;loadedSavedPoster.value=true;await loadPosterAssets();dialog.show('Poster design saved with a snapshot of its cover.','success')}catch(e:any){posterError.value=e?.data?.statusMessage||e.message}finally{posterBusy.value=false}}
function openSavedPoster(p:any){const c=p.config||{};paper.value=c.paper||'A4';theme.value=c.theme||'classic';heading.value=c.heading||'';message.value=c.message||'';showDate.value=!!c.showDate;useCover.value=!!c.useCover;qrColourMode.value=['auto','dark','light'].includes(c.qrColourMode)?c.qrColourMode:'auto';photoFill.value=!!c.photoFill;photoOverlay.value=Number.isFinite(Number(c.photoOverlay))?Math.min(85,Math.max(0,Number(c.photoOverlay))):28;restoreTypography(c.typography);posterCover.value=p.snapshot_url;loadedSavedPoster.value=true;posterName.value=p.name}
const loadedSavedPoster=ref(false)
const activePosterCover=computed(()=>useCover.value?(loadedSavedPoster.value?posterCover.value:coverUrl.value):null)

const guestUrl=computed(()=>item.value?`${origin.value}/e/${encodeURIComponent(item.value.slug)}`:'')
watch([guestUrl,qrInk],()=>{void updateQr()})
const dateLabel=computed(()=>item.value?.event_date?new Date(`${item.value.event_date}T12:00:00`).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}):'')
useHead({title:'Welcome Sign Designer · EventKeepsakes'})
onMounted(async()=>{
 origin.value=window.location.origin
 const {data,error:err}=await client.from('events').select('id,title,slug,event_date').eq('id',String(route.params.id)).single()
 if(err)error.value=err.message
 else {item.value=data;await updateQr()}
 await loadPosterAssets()
 loading.value=false
})
function printSign(){window.print()}
async function copyLink(){try{await navigator.clipboard.writeText(guestUrl.value);dialog.show('Guest link copied.','success')}catch{dialog.show('Unable to copy the link.','error')}}
</script>
<template>
 <main class="mx-auto max-w-6xl px-5 py-10 space-y-6">
  <div class="ek-no-print flex flex-wrap items-center justify-between gap-3"><NuxtLink :to="`/dashboard/events/${route.params.id}`" class="ek-back-button inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D] shadow-sm transition hover:bg-[#F0E5D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]"><span aria-hidden="true">←</span><span>Back</span></NuxtLink><h1 class="text-2xl font-bold">Welcome Sign Designer</h1></div>
  <p v-if="loading">Loading sign designer…</p><p v-else-if="error" class="text-red-700">{{error}}</p>
  <div v-else-if="item" class="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
   <section class="panel space-y-5 ek-no-print self-start">
    <h2 class="text-xl font-semibold">Customise your sign</h2>
    <label class="block text-sm font-medium">Style<select v-model="theme" class="input mt-2"><option value="classic">Classic navy & gold</option><option value="romance">Wedding ivory & rose</option><option value="modern">Modern minimal</option></select></label>
    <label class="block text-sm font-medium">Paper size<select v-model="paper" class="input mt-2"><option value="A4">A4 portrait</option><option value="A5">A5 portrait</option></select></label>
    <label class="block text-sm font-medium">Heading<input v-model="heading" maxlength="100" class="input mt-2" /></label>
    <label class="block text-sm font-medium">Message<textarea v-model="message" maxlength="260" rows="4" class="input mt-2" /></label>

    <div class="rounded-xl border border-[#D6B077] p-3 space-y-3">
     <h3 class="font-semibold">Text formatting</h3>
     <label class="block text-sm font-medium">Choose text element
      <select v-model="selectedTypography" class="input mt-1">
       <option v-for="section in typographySections" :key="section.key" :value="section.key">{{section.label}}</option>
      </select>
     </label>
     <label class="block text-sm font-medium">Font family
      <select v-model="selectedText.font" class="input mt-1"><option v-for="f in fontOptions" :key="f.value" :value="f.value">{{f.label}}</option></select>
     </label>
     <label class="block text-sm font-medium">Font size (A4 reference): {{selectedText.size}} px
      <input v-model.number="selectedText.size" type="range" min="6" max="80" step="1" class="w-full mt-2" />
     </label>
     <div class="flex items-center justify-between gap-3">
      <label class="text-sm font-medium" for="ek-sign-font-colour">Font colour</label>
      <div class="flex items-center gap-2"><input id="ek-sign-font-colour" v-model="selectedText.color" type="color" class="h-9 w-12 cursor-pointer" /><input v-model="selectedText.color" type="text" maxlength="7" class="input w-28" aria-label="Hex font colour" /></div>
     </div>
     <div class="flex flex-wrap gap-3 text-sm">
      <label class="flex items-center gap-1"><input v-model="selectedText.bold" type="checkbox" /> Bold</label>
      <label class="flex items-center gap-1"><input v-model="selectedText.italic" type="checkbox" /> Italic</label>
      <label class="flex items-center gap-1"><input v-model="selectedText.underline" type="checkbox" /> Underline</label>
     </div>
     <p class="text-xs text-[#536273]">Each element has independent styling. A5 automatically scales font sizes down. Your choices are saved with the poster.</p>
    </div>
    <label class="block text-sm font-medium">QR code colour
     <select v-model="qrColourMode" class="input mt-2">
      <option value="auto">Automatic (matches sign background)</option>
      <option value="dark">Dark navy</option>
      <option value="light">White (for dark backgrounds)</option>
     </select>
    </label>
    <p class="text-xs text-[#536273]">The QR image has a transparent background. White QR uses a subtle dark contrast panel for reliable scanning.</p>
    <label class="flex items-center gap-2 text-sm"><input v-model="showDate" type="checkbox" /> Show event date</label>
    <label class="flex items-center gap-2 text-sm"><input v-model="useCover" type="checkbox" /> Use event cover photo in poster</label>
    <div v-if="useCover" class="space-y-1">
       <label class="flex items-center gap-2 text-sm"><input v-model="photoFill" type="checkbox" /> Fill entire poster with photo (edge to edge)</label>
       <p class="text-xs text-[#536273]">When enabled, the photo fills the whole A4/A5 sheet. Edges of the photo may be cropped to fit the paper.</p>
      <label class="flex items-center justify-between gap-3 text-sm font-medium"><span>Photo fade / text contrast</span><span>{{ photoOverlay }}%</span></label>
      <input v-model.number="photoOverlay" type="range" min="0" max="85" step="5" class="w-full" aria-label="Photo fade percentage" />
      <p class="text-xs text-[#536273]">0% shows the photo at full strength; increase the fade if the text becomes hard to read. Default: 28%.</p>
    </div>
    <p class="text-xs text-[#536273]">A saved poster keeps its own cover snapshot even if you later replace the event cover.</p>
    <label class="block text-sm">Design name<input v-model="posterName" maxlength="80" class="input mt-2" /></label>
    <button type="button" class="w-full rounded-lg border border-[#D6B077] px-4 py-2" :disabled="posterBusy" @click="savePoster">{{posterBusy?'Saving…':'Save poster design'}}</button>
    <p v-if="posterError" class="text-sm text-red-700">{{posterError}}</p>
    <label v-if="savedPosters.length" class="block text-sm">Saved designs<select class="input mt-2" @change="openSavedPoster(savedPosters.find(p=>p.id===($event.target as HTMLSelectElement).value))"><option value="">Choose saved design</option><option v-for="p in savedPosters" :key="p.id" :value="p.id">{{p.name}}</option></select></label>
    <button type="button" class="btn w-full" @click="printSign">Print / Save as PDF</button>
    <button type="button" class="w-full rounded-lg border border-[#CBBFAE] px-4 py-2" @click="copyLink">Copy guest link</button>
    <p class="text-xs text-[#536273]">In the print dialog, select Save as PDF, set paper size to A4 (or A5 if selected), margins to None, scale to 100%, disable headers/footers, and enable background graphics.</p>
   </section>
   <div class="ek-sign-stage flex flex-col items-center rounded-2xl bg-[#E8E2D7] p-4 sm:p-8">
    <p class="mb-3 text-center text-xs font-semibold text-[#536273]">{{paper}} portrait preview · {{paper==='A4'?'210 × 297 mm':'148 × 210 mm'}} · scaled to fit screen</p>
    <article :class="['ek-print-sign',`ek-sign-${theme}`,paper==='A5'?'ek-paper-a5':'ek-paper-a4',activePosterCover&&photoFill?'ek-sign-photo-fill':'']" :style="{...signTypographyVars,...(activePosterCover&&photoFill?{backgroundImage:`linear-gradient(rgba(255,255,255,${photoOverlay/100}),rgba(255,255,255,${photoOverlay/100})),url(${activePosterCover})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}:{})}" aria-label="Printable event welcome sign">
      <div class="ek-sign-inner" :style="activePosterCover&&!photoFill?{backgroundImage:`linear-gradient(rgba(255,255,255,${photoOverlay/100}),rgba(255,255,255,${photoOverlay/100})),url(${activePosterCover})`,backgroundSize:'cover',backgroundPosition:'center'}:{}">
       <div class="ek-sign-brand">Event<span>Keepsakes</span></div>
       <div class="ek-sign-tagline">CAPTURE · SHARE · REMEMBER</div>
       <div class="ek-sign-ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
       <h2 class="ek-sign-title">{{item.title}}</h2>
       <p v-if="showDate&&dateLabel" class="ek-sign-date">{{dateLabel}}</p>
       <h3 class="ek-sign-heading">{{heading}}</h3>
       <p class="ek-sign-message" style="white-space:pre-line;overflow-wrap:anywhere">{{message}}</p>
       <div class="ek-sign-qr" :class="qrInk==='#FFFFFF'?'ek-sign-qr-light':'ek-sign-qr-dark'"><img :src="qr"  alt="QR code linking to event guest upload page" /></div>
       <p class="ek-sign-action">Point your phone camera here</p>
       <p class="ek-sign-footer">No app or account required</p>
      </div>
    </article>
   </div>
  </div>
 </main>
</template>
<style>
.ek-print-sign{--sign-ink:#0C1D2D;--sign-accent:#B18A50;--sign-bg:#F8F4EB;box-sizing:border-box;width:min(100%,520px);height:auto;aspect-ratio:210/297;flex:none;background:var(--sign-bg);color:var(--sign-ink);padding:7%;box-shadow:0 10px 35px #0C1D2D25;text-align:center;overflow:hidden}
.ek-print-sign.ek-paper-a5{width:min(100%,366.5px);aspect-ratio:148/210}.ek-sign-romance{--sign-ink:#513F48;--sign-accent:#B7828C;--sign-bg:#FFF9F5}.ek-sign-modern{--sign-ink:#19242D;--sign-accent:#516A78;--sign-bg:#FFFFFF}
.ek-print-sign.ek-sign-photo-fill{padding:0!important}
.ek-sign-photo-fill .ek-sign-inner{margin:5%;height:90%;background:transparent}
.ek-sign-inner{height:100%;min-height:0;box-sizing:border-box;border:2px solid var(--sign-accent);padding:7%;display:flex;flex-direction:column;align-items:center;justify-content:space-around;gap:1%}
.ek-sign-brand{font-family:Georgia,serif;font-weight:bold;font-size:clamp(16px,2.7vw,28px)}.ek-sign-brand span{color:var(--sign-accent)}.ek-sign-tagline{font-size:clamp(6px,.85vw,10px);letter-spacing:.23em;color:var(--sign-accent)}.ek-sign-ornament{color:var(--sign-accent);font-size:18px}.ek-sign-title{font-family:Georgia,serif;font-size:clamp(22px,4vw,43px);line-height:1.14;overflow-wrap:anywhere}.ek-sign-date{color:var(--sign-accent);font-size:clamp(10px,1.4vw,15px)}.ek-sign-heading{font-family:Georgia,serif;font-size:clamp(15px,2.4vw,26px);line-height:1.15}.ek-sign-message{font-size:clamp(10px,1.3vw,14px);line-height:1.5;overflow-wrap:anywhere}.ek-sign-qr{background:transparent;padding:3%;width:52%;max-width:230px}
.ek-sign-qr-light{background:rgba(0,0,0,.65);border-radius:8px}
.ek-sign-qr-dark{background:rgba(255,255,255,.24);border-radius:8px}.ek-sign-qr img{width:100%;display:block}.ek-sign-action{font-size:clamp(10px,1.4vw,15px);font-weight:700}.ek-sign-footer{font-size:clamp(8px,1vw,12px);color:var(--sign-accent)}
@media print {
 @page { size: A4 portrait; margin: 0; }
 @page ek-a5-page { size: 148mm 210mm; margin: 0; }
 html,body,#__nuxt { width:100%!important; margin:0!important; padding:0!important; min-height:0!important; height:auto!important; overflow:visible!important; background:#fff!important; scrollbar-gutter:auto!important; }
 body * { visibility:hidden!important; }
 .ek-print-sign, .ek-print-sign * { visibility:visible!important; }
 .ek-print-sign { position:absolute!important; top:0!important; left:0!important; width:210mm!important; height:297mm!important; box-sizing:border-box!important; margin:0!important; padding:15mm!important; max-width:none!important; min-width:0!important; min-height:0!important; aspect-ratio:auto!important; box-shadow:none!important; overflow:hidden!important; break-inside:avoid!important; page-break-inside:avoid!important; print-color-adjust:exact!important; -webkit-print-color-adjust:exact!important; }
 .ek-print-sign.ek-paper-a5 { page:ek-a5-page; width:148mm!important; height:210mm!important; padding:10mm!important; }
 .ek-sign-inner { box-sizing:border-box!important; height:100%!important; min-height:0!important; }
 .ek-sign-brand{font-size:26pt!important}.ek-sign-tagline{font-size:9pt!important}.ek-sign-title{font-size:32pt!important}.ek-sign-date{font-size:12pt!important}.ek-sign-heading{font-size:20pt!important}.ek-sign-message{font-size:12pt!important}.ek-sign-qr{width:55%!important;max-width:65mm!important}.ek-sign-action{font-size:12pt!important}.ek-sign-footer{font-size:10pt!important}
}

@media print {
 .ek-print-sign.ek-sign-photo-fill{padding:0!important;background-size:cover!important;background-position:center!important;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
 .ek-print-sign.ek-sign-photo-fill .ek-sign-inner{margin:5%!important;height:90%!important}
}

/* A5 is 70.5% of A4's linear size. Scale the content as well as the paper. */
@media screen {
 .ek-print-sign.ek-paper-a5{padding:4.9%}
 .ek-paper-a5 .ek-sign-inner{padding:5%;gap:.6%}
 .ek-paper-a5 .ek-sign-brand{font-size:clamp(11px,1.9vw,20px)}
 .ek-paper-a5 .ek-sign-tagline{font-size:clamp(5px,.6vw,7px);letter-spacing:.16em}
 .ek-paper-a5 .ek-sign-ornament{font-size:13px}
 .ek-paper-a5 .ek-sign-title{font-size:clamp(16px,2.8vw,30px)}
 .ek-paper-a5 .ek-sign-date{font-size:clamp(8px,1vw,11px)}
 .ek-paper-a5 .ek-sign-heading{font-size:clamp(11px,1.7vw,18px)}
 .ek-paper-a5 .ek-sign-message{font-size:clamp(8px,.95vw,10px);line-height:1.35}
 .ek-paper-a5 .ek-sign-qr{width:48%;max-width:162px;padding:2%}
 .ek-paper-a5 .ek-sign-action{font-size:clamp(8px,1vw,11px)}
 .ek-paper-a5 .ek-sign-footer{font-size:clamp(7px,.7vw,9px)}
}
@media print {
 .ek-print-sign.ek-paper-a5{padding:10mm!important}
 .ek-paper-a5 .ek-sign-inner{padding:5%!important;gap:.6%!important}
 .ek-paper-a5 .ek-sign-brand{font-size:18pt!important}
 .ek-paper-a5 .ek-sign-tagline{font-size:6.3pt!important}
 .ek-paper-a5 .ek-sign-ornament{font-size:13px!important}
 .ek-paper-a5 .ek-sign-title{font-size:22.5pt!important}
 .ek-paper-a5 .ek-sign-date{font-size:8.5pt!important}
 .ek-paper-a5 .ek-sign-heading{font-size:14pt!important}
 .ek-paper-a5 .ek-sign-message{font-size:8.5pt!important;line-height:1.35!important}
 .ek-paper-a5 .ek-sign-qr{width:48%!important;max-width:46mm!important;padding:2%!important}
 .ek-paper-a5 .ek-sign-action{font-size:8.5pt!important}
 .ek-paper-a5 .ek-sign-footer{font-size:7pt!important}
}

/* Per-element font styling, shared by preview and PDF print output. */
.ek-print-sign .ek-sign-brand{font-family:var(--ek-brand-font)!important;font-size:var(--ek-brand-size)!important;color:var(--ek-brand-color)!important;font-weight:var(--ek-brand-weight)!important;font-style:var(--ek-brand-style)!important;text-decoration:var(--ek-brand-decoration)!important}
.ek-print-sign .ek-sign-tagline{font-family:var(--ek-tagline-font)!important;font-size:var(--ek-tagline-size)!important;color:var(--ek-tagline-color)!important;font-weight:var(--ek-tagline-weight)!important;font-style:var(--ek-tagline-style)!important;text-decoration:var(--ek-tagline-decoration)!important}
.ek-print-sign .ek-sign-title{font-family:var(--ek-title-font)!important;font-size:var(--ek-title-size)!important;color:var(--ek-title-color)!important;font-weight:var(--ek-title-weight)!important;font-style:var(--ek-title-style)!important;text-decoration:var(--ek-title-decoration)!important}
.ek-print-sign .ek-sign-date{font-family:var(--ek-date-font)!important;font-size:var(--ek-date-size)!important;color:var(--ek-date-color)!important;font-weight:var(--ek-date-weight)!important;font-style:var(--ek-date-style)!important;text-decoration:var(--ek-date-decoration)!important}
.ek-print-sign .ek-sign-heading{font-family:var(--ek-heading-font)!important;font-size:var(--ek-heading-size)!important;color:var(--ek-heading-color)!important;font-weight:var(--ek-heading-weight)!important;font-style:var(--ek-heading-style)!important;text-decoration:var(--ek-heading-decoration)!important}
.ek-print-sign .ek-sign-message{font-family:var(--ek-message-font)!important;font-size:var(--ek-message-size)!important;color:var(--ek-message-color)!important;font-weight:var(--ek-message-weight)!important;font-style:var(--ek-message-style)!important;text-decoration:var(--ek-message-decoration)!important}
.ek-print-sign .ek-sign-action{font-family:var(--ek-action-font)!important;font-size:var(--ek-action-size)!important;color:var(--ek-action-color)!important;font-weight:var(--ek-action-weight)!important;font-style:var(--ek-action-style)!important;text-decoration:var(--ek-action-decoration)!important}
.ek-print-sign .ek-sign-footer{font-family:var(--ek-footer-font)!important;font-size:var(--ek-footer-size)!important;color:var(--ek-footer-color)!important;font-weight:var(--ek-footer-weight)!important;font-style:var(--ek-footer-style)!important;text-decoration:var(--ek-footer-decoration)!important}
@media print {
.ek-print-sign .ek-sign-brand{font-size:var(--ek-brand-print-size)!important}
.ek-print-sign .ek-sign-tagline{font-size:var(--ek-tagline-print-size)!important}
.ek-print-sign .ek-sign-title{font-size:var(--ek-title-print-size)!important}
.ek-print-sign .ek-sign-date{font-size:var(--ek-date-print-size)!important}
.ek-print-sign .ek-sign-heading{font-size:var(--ek-heading-print-size)!important}
.ek-print-sign .ek-sign-message{font-size:var(--ek-message-print-size)!important}
.ek-print-sign .ek-sign-action{font-size:var(--ek-action-print-size)!important}
.ek-print-sign .ek-sign-footer{font-size:var(--ek-footer-print-size)!important}
}
</style>
