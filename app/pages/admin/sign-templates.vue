<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const templates=ref<any[]>([]),busy=ref(false),error=ref(''),statusFilter=ref('all'),search=ref('')
const editing=ref<any|null>(null),createOpen=ref(false)
const newName=ref('New Wedding Template'),newCategory=ref('wedding')
const categories=['wedding','birthday','celebration','christening','baby','graduation','corporate','anniversary','memorial','other']
const filtered=computed(()=>templates.value.filter(t=>(statusFilter.value==='all'||t.status===statusFilter.value)&&`${t.name} ${t.category}`.toLowerCase().includes(search.value.toLowerCase())))
const defaultConfig=()=>({
 contentOrder:['heading','event','date','message','qr','action'],
 paper:'A4',theme:'classic',heading:'Welcome to our wedding',message:'Scan the QR code to share your photos and videos.',showDate:true,useCover:false,
 qrColourMode:'dark',qrPosition:'bottom',qrSize:52,photoOverlay:28,photoFill:false,categoryId:newCategory.value,paletteIndex:0,paletteBackground:'#FFF9ED',
 layers:[],decoration:'none',decorationOpacity:65,decorationSize:85,decorationRotation:0,decorationPosition:'top-left',decorationColour:'#B18A50',
 brandColour:'#6B431D',brandAccent:'#B18A50',
 textPlacement:{},typography:{
 heading:{font:'Georgia, serif',size:30,colour:'#6B431D',bold:false,italic:false},
 event:{font:'Georgia, serif',size:44,colour:'#9E601F',bold:false,italic:true},
 date:{font:'Georgia, serif',size:20,colour:'#B9A17D',bold:false,italic:false},
 message:{font:'Georgia, serif',size:16,colour:'#6B431D',bold:false,italic:false},
 action:{font:'Georgia, serif',size:14,colour:'#6B431D',bold:false,italic:false}
 }})
const selectedFontFamilies=computed(()=>editing.value?Object.values(editing.value.config?.typography||{}).map((v:any)=>String(v.font||'')).filter(f=>f.startsWith("'")).map(f=>f.split("'")[1]):[])
const selectedFontsHref=computed(()=>selectedFontFamilies.value.length?'https://fonts.googleapis.com/css2?'+[...new Set(selectedFontFamilies.value)].map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap':'')
const fields=[{key:'heading',label:'Welcome heading'},{key:'event',label:'Event title / names'},{key:'date',label:'Event date'},{key:'message',label:'Guest message'},{key:'action',label:'QR instructions'}]
async function headers(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required');return {authorization:`Bearer ${session.access_token}`}}
function errText(e:any){return e?.data?.statusMessage||e?.message||'Request failed'}
async function load(){error.value='';try{templates.value=(await $fetch<any>('/api/admin/sign-templates',{headers:await headers()})).templates||[]}catch(e:any){error.value=errText(e)}}
async function create(){busy.value=true;error.value='';try{
 const r=await $fetch<any>('/api/admin/sign-templates',{method:'POST',headers:await headers(),body:{action:'create',name:newName.value,category:newCategory.value,config:defaultConfig()}})
 createOpen.value=false;await load();openEditor(r.template);dialog.show('Draft template created.','success')
 }catch(e:any){error.value=errText(e)}finally{busy.value=false}}
const contentLabels:Record<string,string>={heading:'Welcome heading',event:'Event name',date:'Date',message:'Guest message',qr:'QR code',action:'QR instructions'}
const contentKeys=['heading','event','date','message','qr','action']
function orderedKeys(c:any){const stored=Array.isArray(c?.contentOrder)?c.contentOrder:contentKeys;return [...new Set([...stored.filter((x:string)=>contentKeys.includes(x)),...contentKeys])]}
function moveContent(c:any,key:string,delta:number){const order=orderedKeys(c);const from=order.indexOf(key),to=from+delta;if(to<0||to>=order.length)return;[order[from],order[to]]=[order[to],order[from]];c.contentOrder=order}
function styleFor(c:any,key:string){const t=c.typography?.[key]||{};return {fontFamily:t.font||'Georgia, serif',fontSize:`${Math.max(8,Number(t.size||16)*.65)}px`,color:t.color||t.colour||'#6B431D',fontWeight:t.bold?'bold':'normal',fontStyle:t.italic?'italic':'normal',textAlign:c.textPlacement?.[key]?.align||'center'}}
function openEditor(t:any){editing.value=JSON.parse(JSON.stringify(t));editing.value.config??=defaultConfig();editing.value.config.typography??=defaultConfig().typography;for(const f of fields){editing.value.config.typography[f.key]??=defaultConfig().typography[f.key];const font=editing.value.config.typography[f.key];font.color??=font.colour||'#6B431D';font.colour=font.color}editing.value.config.contentOrder=orderedKeys(editing.value.config)}
async function save(t:any){busy.value=true;error.value='';try{
 for(const font of Object.values(t.config.typography||{}) as any[]){font.color=font.colour||font.color;delete font.colour}
 t.config.contentOrder=orderedKeys(t.config)
 await $fetch('/api/admin/sign-templates',{method:'POST',headers:await headers(),body:{id:t.id,name:t.name,category:t.category,status:t.status,config:t.config}})
 dialog.show('Template saved.','success');await load();editing.value=null
 }catch(e:any){error.value=errText(e)}finally{busy.value=false}}
async function duplicate(t:any){busy.value=true;error.value='';try{
 const r=await $fetch<any>('/api/admin/sign-templates',{method:'POST',headers:await headers(),body:{action:'duplicate',id:t.id,name:`${t.name} Copy`,category:t.category}})
 await load();openEditor(r.template);dialog.show('Created an independent draft copy.','success')
 }catch(e:any){error.value=errText(e)}finally{busy.value=false}}
async function upload(t:any,e:Event){const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;busy.value=true;error.value='';try{
 const form=new FormData();form.append('id',t.id);form.append('image',file)
 await $fetch('/api/admin/sign-template-background',{method:'POST',headers:await headers(),body:form})
 const id=t.id;await load();const fresh=templates.value.find(x=>x.id===id);if(fresh&&editing.value?.id===id)openEditor(fresh)
 dialog.show('Background uploaded.','success')
 }catch(e:any){error.value=errText(e)}finally{busy.value=false}input.value=''}
onMounted(load)
</script>
<template>
 <section class="space-y-5 py-5">
  <link v-if="selectedFontsHref" rel="stylesheet" :href="selectedFontsHref"/>
  <div class="flex flex-wrap justify-between items-start gap-3">
   <div><h2 class="text-2xl font-semibold">Sign Template Manager</h2><p class="text-sm text-[#536273] mt-2">Create official templates, edit typography and layout, review submissions, duplicate and publish.</p></div>
   <button type="button" class="btn" @click="createOpen=true">+ Create Template</button>
  </div>
  <div v-if="createOpen" class="panel space-y-3">
   <h3 class="text-lg font-semibold">Create new template</h3>
   <label class="block text-sm">Template name<input v-model="newName" class="input w-full mt-1" maxlength="80"/></label>
   <label class="block text-sm">Category<select v-model="newCategory" class="input w-full mt-1"><option v-for="c in categories" :key="c" :value="c">{{c}}</option></select></label>
   <div class="flex gap-2"><button class="btn" :disabled="busy" @click="create">Create draft</button><button class="btn" type="button" @click="createOpen=false">Cancel</button></div>
  </div>
  <div class="flex flex-wrap gap-3 items-end">
   <label class="text-sm">Status<select v-model="statusFilter" class="input block mt-1"><option value="all">All</option><option value="pending">Pending review</option><option value="published">Published</option><option value="personal">Draft / Personal</option><option value="archived">Archived</option></select></label>
   <label class="text-sm">Search<input v-model="search" class="input block mt-1" placeholder="Name or category"/></label>
   <button class="btn" @click="load">Refresh</button>
  </div>
  <p v-if="error" class="text-red-700" role="alert">{{error}}</p>
  <p v-if="!filtered.length" class="text-sm text-[#536273]">No templates found. Select Create Template to start your first design.</p>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   <article v-for="t in filtered" :key="t.id" class="panel space-y-3">
    <div class="relative overflow-hidden rounded-lg bg-[#FFF9ED] h-48 flex items-center justify-center">
     <img v-if="t.background_url" :src="t.background_url" alt="" class="h-full w-full object-contain"/>
     <span v-else class="text-sm text-[#536273]">No background artwork</span>
    </div>
    <div class="flex justify-between gap-2"><strong>{{t.name}}</strong><span class="text-xs uppercase text-[#536273]">{{t.status}}</span></div>
    <p class="text-xs text-[#536273] capitalize">{{t.category}} · {{t.config?.paper||'A4'}}</p>
    <p v-if="!t.can_publish" class="text-xs text-amber-800">Requires owner permission before publishing.</p>
    <div class="flex flex-wrap gap-2"><button class="btn" @click="openEditor(t)">Edit / Manage</button><button class="btn" :disabled="busy" @click="duplicate(t)">Duplicate</button></div>
   </article>
  </div>
  <div v-if="editing" class="fixed inset-0 z-[100] overflow-y-auto bg-[#07131CCC] p-3 md:p-8" role="dialog" aria-modal="true" aria-label="Edit sign template">
   <div class="mx-auto max-w-6xl rounded-xl bg-[#FFFDF8] text-[#0C1D2D] p-4 md:p-6 space-y-4">
    <div class="flex justify-between items-center gap-3"><h3 class="text-xl font-semibold">Edit / Manage Template</h3><button type="button" class="btn" @click="editing=null">Close</button></div>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,430px)]">
     <div class="space-y-4">
      <label class="block text-sm">Name<input v-model="editing.name" class="input mt-1 w-full" maxlength="80"/></label>
      <div class="grid grid-cols-2 gap-3">
       <label class="text-sm">Category<select v-model="editing.category" class="input mt-1 w-full"><option v-for="c in categories" :key="c" :value="c">{{c}}</option></select></label>
       <label class="text-sm">Status<select v-model="editing.status" class="input mt-1 w-full"><option value="personal">Draft / Personal</option><option value="pending">Pending</option><option value="published" :disabled="!editing.can_publish">Published</option><option value="archived">Archived</option></select></label>
       <label class="text-sm">Paper size<select v-model="editing.config.paper" class="input mt-1 w-full"><option>A4</option><option>A5</option></select></label>
       <label class="text-sm">Design style<select v-model="editing.config.theme" class="input mt-1 w-full"><option value="classic">Classic</option><option value="romance">Romance</option><option value="modern">Modern</option></select></label>
      </div>
      <label class="block text-sm">Blank background artwork (PNG, JPG or WebP)<input type="file" accept="image/png,image/jpeg,image/webp" class="block mt-2 w-full text-xs" :disabled="busy" @change="upload(editing,$event)"/></label>
      <label class="block text-sm">Welcome heading<input v-model="editing.config.heading" maxlength="100" class="input w-full mt-1"/></label>
      <label class="block text-sm">Guest message<textarea v-model="editing.config.message" maxlength="260" rows="3" class="input w-full mt-1"/></label>
      <div class="grid grid-cols-2 gap-3">
       <label class="text-sm">Background colour<input v-model="editing.config.paletteBackground" type="color" class="block mt-1 h-10 w-full"/></label>
       <label class="text-sm">QR position<select v-model="editing.config.qrPosition" class="input w-full mt-1"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
       <label class="text-sm">QR size (25–70%)<input v-model.number="editing.config.qrSize" type="range" min="25" max="70" class="w-full mt-2"/></label>
       <label class="text-sm">Show event date<input v-model="editing.config.showDate" type="checkbox" class="ml-3"/></label>
      </div>
      <h4 class="font-semibold border-t pt-3">Sign content order</h4>
      <p class="text-xs text-[#536273]">Reorder text and QR code. The same order will be used on the customer's sign.</p>
      <div v-for="(key,index) in orderedKeys(editing.config)" :key="key" class="flex items-center justify-between rounded border px-3 py-2 text-sm">
       <span>{{index+1}}. {{contentLabels[key]}}</span>
       <div class="flex gap-2"><button type="button" class="btn" :disabled="index===0" :aria-label="'Move '+contentLabels[key]+' up'" @click="moveContent(editing.config,key,-1)">↑</button><button type="button" class="btn" :disabled="index===orderedKeys(editing.config).length-1" :aria-label="'Move '+contentLabels[key]+' down'" @click="moveContent(editing.config,key,1)">↓</button></div>
      </div>
      <h4 class="font-semibold border-t pt-3">Typography defaults</h4>
      <div v-for="f in fields" :key="f.key" class="rounded-lg border border-[#D6B077] p-3 space-y-2">
       <strong class="text-sm">{{f.label}}</strong>
       <div class="grid grid-cols-2 gap-2">
        <div class="text-xs min-w-0"><span>Font</span><SignFontPicker v-model="editing.config.typography[f.key].font" :event-category="editing.category" :label="f.label+' font'"/></div>
        <label class="text-xs">Size<input v-model.number="editing.config.typography[f.key].size" type="number" min="8" max="110" class="input w-full mt-1"/></label>
        <label class="text-xs">Colour<input v-model="editing.config.typography[f.key].color" type="color" class="block mt-1 h-9 w-full"/></label>
        <div class="flex gap-4 items-end"><label class="text-xs"><input v-model="editing.config.typography[f.key].bold" type="checkbox"/> Bold</label><label class="text-xs"><input v-model="editing.config.typography[f.key].italic" type="checkbox"/> Italic</label></div>
       </div>
      </div>
      <p v-if="!editing.can_publish" class="text-xs text-amber-800">This owner has not granted permission for public reuse.</p>
      <div class="flex flex-wrap gap-2"><button class="btn" :disabled="busy" @click="save(editing)">Save changes</button><button class="btn" type="button" @click="editing=null">Cancel</button></div>
     </div>
     <div class="lg:sticky lg:top-3 self-start">
      <p class="text-sm font-semibold mb-2">Template preview (sample event details)</p>
      <div class="relative mx-auto w-full max-w-[390px] overflow-hidden border border-[#D6B077] shadow-sm" style="aspect-ratio:210/297" :style="{backgroundColor:editing.config.paletteBackground||'#FFF9ED'}">
       <img v-if="editing.background_url" :src="editing.background_url" alt="" class="absolute inset-0 w-full h-full object-fill"/>
       <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-[12%] py-[13%] gap-2">
        <template v-for="key in orderedKeys(editing.config)" :key="key">
         <div v-if="key==='heading'" :style="styleFor(editing.config,'heading')">{{editing.config.heading}}</div>
         <div v-else-if="key==='event'" :style="styleFor(editing.config,'event')">Daniel &amp; Hannah</div>
         <div v-else-if="key==='date'&&editing.config.showDate" :style="styleFor(editing.config,'date')">15 MAY 2026</div>
         <div v-else-if="key==='message'" class="whitespace-pre-line" :style="styleFor(editing.config,'message')">{{editing.config.message}}</div>
         <div v-else-if="key==='qr'" class="bg-white border border-[#BBB] p-2" :style="{width:`${editing.config.qrSize}%`}"><div class="aspect-square border-4 border-dashed border-[#555] flex items-center justify-center text-xs text-[#555]">QR CODE</div></div>
         <div v-else-if="key==='action'" :style="styleFor(editing.config,'action')">Point your phone camera here</div>
        </template>
       </div>
      </div>
      <p class="text-xs text-[#536273] mt-2">This preview uses sample event details and a QR placeholder. The customer sign uses the saved content order and typography.</p>
     </div>
    </div>
   </div>
  </div>
 </section>
</template>
