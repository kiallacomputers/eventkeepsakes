<script setup lang="ts">
import {signFonts,signFontRecommendations} from '~/utils/sign-fonts'
const props=defineProps<{modelValue:string;eventCategory?:string;label?:string}>()
const emit=defineEmits<{(e:'update:modelValue',value:string):void}>()
const open=ref(false),query=ref(''),all=ref(false)
const id=useId()
const chosen=computed(()=>signFonts.find(f=>f.value===props.modelValue))
const recommended=computed(()=>signFontRecommendations[props.eventCategory||'other']||signFontRecommendations.other)
const filtered=computed(()=>{
 const q=query.value.trim().toLowerCase()
 return signFonts.filter(f=>(all.value||!f.category||recommended.value.includes(f.category))&&(!q||`${f.label} ${f.category||''}`.toLowerCase().includes(q)))
})
const loadedFonts=computed(()=>[...new Set([chosen.value,...(open.value?filtered.value:[])].filter(f=>f?.family).map(f=>f!.family!))])
const fontHref=computed(()=>loadedFonts.value.length?'https://fonts.googleapis.com/css2?'+loadedFonts.value.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap':'')
function pick(value:string){emit('update:modelValue',value);open.value=false;query.value=''}
</script>
<template>
 <div class="relative min-w-0">
  <link v-if="fontHref" rel="stylesheet" :href="fontHref"/>
  <button type="button" class="input mt-1 w-full flex items-center justify-between gap-2 text-left" :aria-expanded="open" :aria-controls="id" @click="open=!open">
   <span class="truncate" :style="{fontFamily:modelValue}">{{chosen?.label||modelValue||'Choose font'}}</span><span aria-hidden="true">⌄</span>
  </button>
  <div v-if="open" :id="id" class="relative z-20 mt-2 rounded-lg border border-[#D6B077] bg-white shadow-lg p-2">
   <input v-model="query" class="input w-full text-sm" placeholder="Search fonts…" aria-label="Search fonts"/>
   <label class="flex items-center gap-2 my-2 text-xs"><input v-model="all" type="checkbox"/> Show all fonts ({{signFonts.length}})</label>
   <div class="max-h-64 overflow-y-auto space-y-1" role="listbox" :aria-label="label||'Font choices'">
    <button v-for="font in filtered" :key="font.value" type="button" role="option" :aria-selected="modelValue===font.value" class="w-full text-left rounded px-2 py-2 hover:bg-[#F1E8DA]" :class="modelValue===font.value?'bg-[#F1E8DA]':''" @click="pick(font.value)">
     <span class="block text-lg leading-7" :style="{fontFamily:font.value}">{{font.label}}</span>
     <span class="block text-[10px] text-[#536273]">{{font.category||'System fonts'}}</span>
    </button>
    <p v-if="!filtered.length" class="text-sm text-[#536273] p-2">No matching fonts. Try “Show all fonts”.</p>
   </div>
   <button type="button" class="text-xs underline mt-2" @click="open=false">Close font list</button>
  </div>
 </div>
</template>
