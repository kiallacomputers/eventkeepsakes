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
 {value:"'Great Vibes', cursive",label:'Great Vibes',family:'Great Vibes',category:'Calligraphy & Wedding'},
 {value:"'Allura', cursive",label:'Allura',family:'Allura',category:'Calligraphy & Wedding'},
 {value:"'Alex Brush', cursive",label:'Alex Brush',family:'Alex Brush',category:'Calligraphy & Wedding'},
 {value:"'Parisienne', cursive",label:'Parisienne',family:'Parisienne',category:'Calligraphy & Wedding'},
 {value:"'Pinyon Script', cursive",label:'Pinyon Script',family:'Pinyon Script',category:'Calligraphy & Wedding'},
 {value:"'Tangerine', cursive",label:'Tangerine',family:'Tangerine',category:'Calligraphy & Wedding'},
 {value:"'Italianno', cursive",label:'Italianno',family:'Italianno',category:'Calligraphy & Wedding'},
 {value:"'Monsieur La Doulaise', cursive",label:'Monsieur La Doulaise',family:'Monsieur La Doulaise',category:'Calligraphy & Wedding'},
 {value:"'Mrs Saint Delafield', cursive",label:'Mrs Saint Delafield',family:'Mrs Saint Delafield',category:'Calligraphy & Wedding'},
 {value:"'Qwigley', cursive",label:'Qwigley',family:'Qwigley',category:'Calligraphy & Wedding'},
 {value:"'Ballet', cursive",label:'Ballet',family:'Ballet',category:'Calligraphy & Wedding'},
 {value:"'Arizonia', cursive",label:'Arizonia',family:'Arizonia',category:'Calligraphy & Wedding'},
 {value:"'Mea Culpa', cursive",label:'Mea Culpa',family:'Mea Culpa',category:'Calligraphy & Wedding'},
 {value:"'Corinthia', cursive",label:'Corinthia',family:'Corinthia',category:'Calligraphy & Wedding'},
 {value:"'Petit Formal Script', cursive",label:'Petit Formal Script',family:'Petit Formal Script',category:'Calligraphy & Wedding'},
 {value:"'Ephesis', cursive",label:'Ephesis',family:'Ephesis',category:'Calligraphy & Wedding'},
 {value:"'Dancing Script', cursive",label:'Dancing Script',family:'Dancing Script',category:'Handwritten & Casual'},
 {value:"'Sacramento', cursive",label:'Sacramento',family:'Sacramento',category:'Handwritten & Casual'},
 {value:"'Caveat', cursive",label:'Caveat',family:'Caveat',category:'Handwritten & Casual'},
 {value:"'Pacifico', cursive",label:'Pacifico',family:'Pacifico',category:'Handwritten & Casual'},
 {value:"'Satisfy', cursive",label:'Satisfy',family:'Satisfy',category:'Handwritten & Casual'},
 {value:"'Cookie', cursive",label:'Cookie',family:'Cookie',category:'Handwritten & Casual'},
 {value:"'Handlee', cursive",label:'Handlee',family:'Handlee',category:'Handwritten & Casual'},
 {value:"'Patrick Hand', cursive",label:'Patrick Hand',family:'Patrick Hand',category:'Handwritten & Casual'},
 {value:"'Kalam', cursive",label:'Kalam',family:'Kalam',category:'Handwritten & Casual'},
 {value:"'Indie Flower', cursive",label:'Indie Flower',family:'Indie Flower',category:'Handwritten & Casual'},
 {value:"'Shadows Into Light', cursive",label:'Shadows Into Light',family:'Shadows Into Light',category:'Handwritten & Casual'},
 {value:"'Amatic SC', cursive",label:'Amatic SC',family:'Amatic SC',category:'Handwritten & Casual'},
 {value:"'Gloria Hallelujah', cursive",label:'Gloria Hallelujah',family:'Gloria Hallelujah',category:'Handwritten & Casual'},
 {value:"'Permanent Marker', cursive",label:'Permanent Marker',family:'Permanent Marker',category:'Handwritten & Casual'},
 {value:"'Reenie Beanie', cursive",label:'Reenie Beanie',family:'Reenie Beanie',category:'Handwritten & Casual'},
 {value:"'Playfair Display', serif",label:'Playfair Display',family:'Playfair Display',category:'Elegant & Classic'},
 {value:"'Cormorant Garamond', serif",label:'Cormorant Garamond',family:'Cormorant Garamond',category:'Elegant & Classic'},
 {value:"'Cinzel', serif",label:'Cinzel',family:'Cinzel',category:'Elegant & Classic'},
 {value:"'Cinzel Decorative', serif",label:'Cinzel Decorative',family:'Cinzel Decorative',category:'Elegant & Classic'},
 {value:"'DM Serif Display', serif",label:'DM Serif Display',family:'DM Serif Display',category:'Elegant & Classic'},
 {value:"'Libre Baskerville', serif",label:'Libre Baskerville',family:'Libre Baskerville',category:'Elegant & Classic'},
 {value:"'Lora', serif",label:'Lora',family:'Lora',category:'Elegant & Classic'},
 {value:"'Merriweather', serif",label:'Merriweather',family:'Merriweather',category:'Elegant & Classic'},
 {value:"'EB Garamond', serif",label:'EB Garamond',family:'EB Garamond',category:'Elegant & Classic'},
 {value:"'Bodoni Moda', serif",label:'Bodoni Moda',family:'Bodoni Moda',category:'Elegant & Classic'},
 {value:"'Prata', serif",label:'Prata',family:'Prata',category:'Elegant & Classic'},
 {value:"'Abril Fatface', serif",label:'Abril Fatface',family:'Abril Fatface',category:'Elegant & Classic'},
 {value:"'Yeseva One', serif",label:'Yeseva One',family:'Yeseva One',category:'Elegant & Classic'},
 {value:"'Marcellus', serif",label:'Marcellus',family:'Marcellus',category:'Elegant & Classic'},
 {value:"'Italiana', serif",label:'Italiana',family:'Italiana',category:'Elegant & Classic'},
 {value:"'Gilda Display', serif",label:'Gilda Display',family:'Gilda Display',category:'Elegant & Classic'},
 {value:"'Montserrat', sans-serif",label:'Montserrat',family:'Montserrat',category:'Modern & Minimal'},
 {value:"'Poppins', sans-serif",label:'Poppins',family:'Poppins',category:'Modern & Minimal'},
 {value:"'Raleway', sans-serif",label:'Raleway',family:'Raleway',category:'Modern & Minimal'},
 {value:"'Lato', sans-serif",label:'Lato',family:'Lato',category:'Modern & Minimal'},
 {value:"'Roboto', sans-serif",label:'Roboto',family:'Roboto',category:'Modern & Minimal'},
 {value:"'Open Sans', sans-serif",label:'Open Sans',family:'Open Sans',category:'Modern & Minimal'},
 {value:"'Inter', sans-serif",label:'Inter',family:'Inter',category:'Modern & Minimal'},
 {value:"'Nunito', sans-serif",label:'Nunito',family:'Nunito',category:'Modern & Minimal'},
 {value:"'Quicksand', sans-serif",label:'Quicksand',family:'Quicksand',category:'Modern & Minimal'},
 {value:"'Josefin Sans', sans-serif",label:'Josefin Sans',family:'Josefin Sans',category:'Modern & Minimal'},
 {value:"'Work Sans', sans-serif",label:'Work Sans',family:'Work Sans',category:'Modern & Minimal'},
 {value:"'Outfit', sans-serif",label:'Outfit',family:'Outfit',category:'Modern & Minimal'},
 {value:"'Manrope', sans-serif",label:'Manrope',family:'Manrope',category:'Modern & Minimal'},
 {value:"'DM Sans', sans-serif",label:'DM Sans',family:'DM Sans',category:'Modern & Minimal'},
 {value:"'Urbanist', sans-serif",label:'Urbanist',family:'Urbanist',category:'Modern & Minimal'},
 {value:"'Bebas Neue', sans-serif",label:'Bebas Neue',family:'Bebas Neue',category:'Bold & Celebration'},
 {value:"'Anton', sans-serif",label:'Anton',family:'Anton',category:'Bold & Celebration'},
 {value:"'Oswald', sans-serif",label:'Oswald',family:'Oswald',category:'Bold & Celebration'},
 {value:"'Lobster', sans-serif",label:'Lobster',family:'Lobster',category:'Bold & Celebration'},
 {value:"'Righteous', sans-serif",label:'Righteous',family:'Righteous',category:'Bold & Celebration'},
 {value:"'Fredoka', sans-serif",label:'Fredoka',family:'Fredoka',category:'Bold & Celebration'},
 {value:"'Bangers', sans-serif",label:'Bangers',family:'Bangers',category:'Bold & Celebration'},
 {value:"'Luckiest Guy', sans-serif",label:'Luckiest Guy',family:'Luckiest Guy',category:'Bold & Celebration'},
 {value:"'Alfa Slab One', sans-serif",label:'Alfa Slab One',family:'Alfa Slab One',category:'Bold & Celebration'},
 {value:"'Patua One', sans-serif",label:'Patua One',family:'Patua One',category:'Bold & Celebration'},
 {value:"'Lilita One', sans-serif",label:'Lilita One',family:'Lilita One',category:'Bold & Celebration'},
 {value:"'Baloo 2', sans-serif",label:'Baloo 2',family:'Baloo 2',category:'Bold & Celebration'},
 {value:"'Chewy', sans-serif",label:'Chewy',family:'Chewy',category:'Bold & Celebration'},
 {value:"'Fugaz One', sans-serif",label:'Fugaz One',family:'Fugaz One',category:'Bold & Celebration'},
 {value:"'Titan One', sans-serif",label:'Titan One',family:'Titan One',category:'Bold & Celebration'},
 {value:"'Special Elite', serif",label:'Special Elite',family:'Special Elite',category:'Vintage & Retro'},
 {value:"'Rye', serif",label:'Rye',family:'Rye',category:'Vintage & Retro'},
 {value:"'Bree Serif', serif",label:'Bree Serif',family:'Bree Serif',category:'Vintage & Retro'},
 {value:"'Berkshire Swash', serif",label:'Berkshire Swash',family:'Berkshire Swash',category:'Vintage & Retro'},
 {value:"'Unica One', serif",label:'Unica One',family:'Unica One',category:'Vintage & Retro'},
 {value:"'Limelight', serif",label:'Limelight',family:'Limelight',category:'Vintage & Retro'},
 {value:"'Playball', serif",label:'Playball',family:'Playball',category:'Vintage & Retro'},
 {value:"'Courgette', serif",label:'Courgette',family:'Courgette',category:'Vintage & Retro'},
 {value:"'Lobster Two', serif",label:'Lobster Two',family:'Lobster Two',category:'Vintage & Retro'},
 {value:"'Sail', serif",label:'Sail',family:'Sail',category:'Vintage & Retro'},
 {value:"'Oleo Script', serif",label:'Oleo Script',family:'Oleo Script',category:'Vintage & Retro'},
 {value:"'Grand Hotel', serif",label:'Grand Hotel',family:'Grand Hotel',category:'Vintage & Retro'},
 {value:"'Yellowtail', serif",label:'Yellowtail',family:'Yellowtail',category:'Vintage & Retro'},
 {value:"'Kaushan Script', serif",label:'Kaushan Script',family:'Kaushan Script',category:'Vintage & Retro'},
 {value:"'Bubblegum Sans', sans-serif",label:'Bubblegum Sans',family:'Bubblegum Sans',category:'Playful & Kids'},
 {value:"'Comic Neue', sans-serif",label:'Comic Neue',family:'Comic Neue',category:'Playful & Kids'},
 {value:"'Sniglet', sans-serif",label:'Sniglet',family:'Sniglet',category:'Playful & Kids'},
 {value:"'Concert One', sans-serif",label:'Concert One',family:'Concert One',category:'Playful & Kids'},
 {value:"'Short Stack', sans-serif",label:'Short Stack',family:'Short Stack',category:'Playful & Kids'},
 {value:"'Schoolbell', sans-serif",label:'Schoolbell',family:'Schoolbell',category:'Playful & Kids'},
 {value:"'Coming Soon', sans-serif",label:'Coming Soon',family:'Coming Soon',category:'Playful & Kids'},
 {value:"'Itim', sans-serif",label:'Itim',family:'Itim',category:'Playful & Kids'},
 {value:"'Mali', sans-serif",label:'Mali',family:'Mali',category:'Playful & Kids'},
 {value:"'Finger Paint', sans-serif",label:'Finger Paint',family:'Finger Paint',category:'Playful & Kids'},
 {value:"'Fredericka the Great', sans-serif",label:'Fredericka the Great',family:'Fredericka the Great',category:'Playful & Kids'},
 {value:"'Cabin Sketch', sans-serif",label:'Cabin Sketch',family:'Cabin Sketch',category:'Playful & Kids'},
 {value:"'Love Ya Like A Sister', sans-serif",label:'Love Ya Like A Sister',family:'Love Ya Like A Sister',category:'Playful & Kids'},
 {value:"'Henny Penny', sans-serif",label:'Henny Penny',family:'Henny Penny',category:'Playful & Kids'},
]
const fontCategories = ['System fonts','Calligraphy & Wedding','Handwritten & Casual','Elegant & Classic','Modern & Minimal','Bold & Celebration','Vintage & Retro','Playful & Kids']
const fontsByCategory = computed(()=>fontCategories.map(label=>({label,fonts:fontOptions.filter(f=>(f.category||'System fonts')===label)})))

const typographySections:{key:TextKey;label:string}[]=[
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
const studioTab=ref<'category'|'photo'|'colours'|'text'|'style'|'qr'|'saved'>('category')
const brandColour=ref('#0C1D2D')
const brandAccent=ref('#B18A50')
// Category-first design: each category owns three independent 3-tone palettes.
const categories=[
 {id:'wedding',name:'Wedding',icon:'♡',palettes:[['Ivory & Champagne','#FFF9ED','#C7A46A','#29384B'],['Blush Romance','#F8E8E7','#C68C95','#59414B'],['Sage Garden','#F3F1E7','#94A98B','#3D5946']]},
 {id:'birthday',name:'Birthday',icon:'✦',palettes:[['Confetti Party','#FFF1B6','#FA7090','#6376D5'],['Neon Celebration','#201A36','#FF5DB1','#57E7DB'],['Pastel Fun','#F9E3F0','#A9C8F2','#F4BB7D']]},
 {id:'celebration',name:'Celebration',icon:'★',palettes:[['Midnight Gold','#152033','#D3B16B','#FFF8E8'],['Emerald Luxe','#163D35','#C6A56B','#F4F0E7'],['Modern Silver','#29343E','#BBC7CF','#FFFFFF']]},
 {id:'christening',name:'Christening',icon:'✧',palettes:[['Soft Blue','#E9F3F8','#A6C5D9','#5A7C95'],['Blush Blessing','#FFF3F0','#E8B7BE','#977B84'],['Pure Ivory','#FFFDF6','#E4D7B7','#9E936F']]},
 {id:'baby',name:'Baby Shower',icon:'☼',palettes:[['Cotton Candy','#FFF3F7','#E7A6BE','#735D77'],['Little Star','#F1F5FF','#A4BBE5','#415A85'],['Mint & Cream','#F8F8EB','#B2D1BA','#53745D']]},
 {id:'graduation',name:'Graduation',icon:'✹',palettes:[['Navy & Gold','#F8F4E9','#B99A49','#172D54'],['Burgundy','#FFF9F2','#B88C69','#622E3A'],['Black Tie','#F7F7F7','#C2C2C2','#242424']]},
 {id:'corporate',name:'Corporate',icon:'▣',palettes:[['Executive Blue','#F4F8FB','#6C99B5','#1B3548'],['Modern Teal','#EFF7F5','#75A9A0','#214E49'],['Slate','#F3F5F6','#A2B0B9','#344450']]},
 {id:'anniversary',name:'Anniversary',icon:'♥',palettes:[['Rose Gold','#FFF5F1','#C99B85','#634B51'],['Golden Years','#FCF8EA','#BBA15D','#484132'],['Pearl','#FAF7F4','#B9AFB3','#5A5260']]},
 {id:'memorial',name:'Celebration of Life',icon:'❀',palettes:[['Peaceful Sage','#F4F7F1','#A0B39A','#40564B'],['Gentle Lavender','#F8F5FB','#B9A8D1','#5B516B'],['Warm Remembrance','#FAF6F0','#C5A88C','#594D46']]},
 {id:'other',name:'Other Event',icon:'✳',palettes:[['Timeless','#FFF9ED','#C7A46A','#29384B'],['Ocean','#EAF6FA','#83BDCB','#2D576A'],['Sunset','#FFF0E7','#F0A16D','#6C465A']]}
] as const
const categoryId=ref<string>('wedding')
const paletteIndex=ref(0)
const currentCategory=computed(()=>categories.find(c=>c.id===categoryId.value)||categories[0])
const currentPalette=computed(()=>currentCategory.value.palettes[Math.min(paletteIndex.value,2)]!)
const paletteBackground=ref('#FFF9ED')
function choosePalette(index:number){paletteIndex.value=index;const p=currentPalette.value;paletteBackground.value=p[1];brandAccent.value=p[2];brandColour.value=p[3];for(const k of ['event','heading','message','action'] as const)typography[k].color=p[3];for(const k of ['date','footer'] as const)typography[k].color=p[2]}
function chooseCategory(id:string){categoryId.value=id;choosePalette(0);studioTab.value='photo'}
const studioSteps=[{id:'category',name:'Category',icon:'▦'},{id:'photo',name:'Photo',icon:'▧'},{id:'colours',name:'Colour Theme',icon:'◉'},{id:'text',name:'Text',icon:'T'},{id:'style',name:'Style',icon:'✧'},{id:'qr',name:'QR Code',icon:'▣'},{id:'saved',name:'Save',icon:'▤'}] as const
function nextStudioStep(){const i=studioSteps.findIndex(x=>x.id===studioTab.value);studioTab.value=studioSteps[Math.min(i+1,studioSteps.length-1)].id}
function editOnCanvas(key:TextKey){selectedTypography.value=key;studioTab.value='style';fontBrowserOpen.value=false}
// Decoration assets are CSS/SVG primitives rather than third-party image files.
type DecorationKind='none'|'floral'|'confetti'|'stars'|'ribbon'|'clouds'|'cross'|'geometric'|'leaves'|'hearts'
const decoration=ref<DecorationKind>('none')
const decorationOpacity=ref(65)
const decorationSize=ref(85)
const decorationRotation=ref(0)
const decorationPosition=ref<'top-left'|'top-right'|'bottom-left'|'bottom-right'>('top-left')
const decorationColour=ref('#B18A50')
const decorationNames:[DecorationKind,string][]=[['none','None'],['floral','Floral corners'],['confetti','Confetti'],['stars','Sparkles'],['ribbon','Ribbon'],['clouds','Soft clouds'],['cross','Cross'],['geometric','Geometric'],['leaves','Botanical leaves'],['hearts','Hearts']]
const decorationSymbols:Record<DecorationKind,string>={none:'',floral:'❀ ❁ ❀',confetti:'✦ ● ◆ ✧ ★',stars:'✧ ✦ ✧',ribbon:'❧ ❧',clouds:'☁ ☁',cross:'✝',geometric:'◇ ◆ ◇',leaves:'❧ ❦ ❧',hearts:'♡ ♥ ♡'}
const decorationPositionStyle=computed(()=>({
 position:'absolute' as const,zIndex:1,pointerEvents:'none' as const,color:decorationColour.value,
 opacity:decorationOpacity.value/100,fontSize:`${decorationSize.value/4}px`,
 transform:`rotate(${decorationRotation.value}deg)`,
 top:decorationPosition.value.startsWith('top')?'3%':undefined,
 bottom:decorationPosition.value.startsWith('bottom')?'3%':undefined,
 left:decorationPosition.value.endsWith('left')?'3%':undefined,
 right:decorationPosition.value.endsWith('right')?'3%':undefined,
 maxWidth:'50%',whiteSpace:'normal' as const
}))
// Load only fonts currently used on the poster, avoiding a large upfront download.
const selectedWebFonts=computed(()=>[...new Set(typographySections.map(({key})=>typography[key]).map(t=>fontOptions.find(f=>f.value===t.font)?.family).filter((f):f is string=>!!f))])
const fontStylesheetUrl=computed(()=>selectedWebFonts.value.length?'https://fonts.googleapis.com/css2?'+selectedWebFonts.value.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap':'')
useHead(()=>({link:fontStylesheetUrl.value?[{key:'sign-fonts',rel:'stylesheet',href:fontStylesheetUrl.value}]:[]}))

// Font browser: render each font name in its own typeface, loading lightweight
// preview glyphs only when the browser is opened.
const fontBrowserOpen=ref(false)
const fontSearch=ref('')
const previewFamilies=fontOptions.filter(f=>f.family).map(f=>f.family as string)
const previewFontUrl='https://fonts.googleapis.com/css2?'+previewFamilies.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')).join('&')+'&display=swap&text='+encodeURIComponent('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ')
useHead(()=>({link:fontBrowserOpen.value?[{key:'sign-font-previews',rel:'stylesheet',href:previewFontUrl}]:[]}))
const matchingFontGroups=computed(()=>fontsByCategory.value.map(g=>({...g,fonts:g.fonts.filter(f=>f.label.toLowerCase().includes(fontSearch.value.trim().toLowerCase()))})).filter(g=>g.fonts.length))
const chosenFontName=computed(()=>fontOptions.find(f=>f.value===typography[selectedTypography.value].font)?.label||'Choose a font')
function chooseFont(value:string){typography[selectedTypography.value].font=value;fontBrowserOpen.value=false}
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
const message=ref('Help us capture every special moment!\n\nScan the QR code to share your photos and videos.')
const paper=ref<'A4'|'A5'>('A4')
const photoFill=ref(false)
const photoOverlay=ref(28) // White overlay percentage: lower means a stronger, more vivid photo
const theme=ref<'classic'|'romance'|'modern'>('classic')
const showDate=ref(true)
const coverUrl=ref<string|null>(null),posterCover=ref<string|null>(null),useCover=ref(false)
const posterName=ref('Welcome poster'),savedPosters=ref<any[]>([]),posterBusy=ref(false),posterError=ref('')
async function posterAuth(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in again');return {authorization:`Bearer ${session.access_token}`}}
async function loadPosterAssets(){try{const headers=await posterAuth();const [branding,posters]=await Promise.all([$fetch<any>('/api/owner/branding',{query:{id:String(route.params.id)},headers}),$fetch<any>('/api/owner/posters',{query:{id:String(route.params.id)},headers})]);coverUrl.value=branding.cover_url;savedPosters.value=posters.designs}catch(e:any){posterError.value=e?.data?.statusMessage||e.message}}
async function savePoster(){posterBusy.value=true;posterError.value='';try{const result=await $fetch<any>('/api/owner/posters',{method:'POST',headers:await posterAuth(),body:{eventId:String(route.params.id),name:posterName.value,config:{paper:paper.value,theme:theme.value,heading:heading.value,message:message.value,showDate:showDate.value,useCover:useCover.value,qrColourMode:qrColourMode.value,photoOverlay:photoOverlay.value,photoFill:photoFill.value,categoryId:categoryId.value,paletteIndex:paletteIndex.value,paletteBackground:paletteBackground.value,decoration:decoration.value,decorationOpacity:decorationOpacity.value,decorationSize:decorationSize.value,decorationRotation:decorationRotation.value,decorationPosition:decorationPosition.value,decorationColour:decorationColour.value,brandColour:brandColour.value,brandAccent:brandAccent.value,typography:JSON.parse(JSON.stringify(typography))}}});posterCover.value=result.snapshot_url;loadedSavedPoster.value=true;await loadPosterAssets();dialog.show('Poster design saved with a snapshot of its cover.','success')}catch(e:any){posterError.value=e?.data?.statusMessage||e.message}finally{posterBusy.value=false}}
function openSavedPoster(p:any){const c=p.config||{};paper.value=c.paper||'A4';theme.value=c.theme||'classic';heading.value=c.heading||'';message.value=c.message||'';showDate.value=!!c.showDate;useCover.value=!!c.useCover;qrColourMode.value=['auto','dark','light'].includes(c.qrColourMode)?c.qrColourMode:'auto';photoFill.value=!!c.photoFill;photoOverlay.value=Number.isFinite(Number(c.photoOverlay))?Math.min(85,Math.max(0,Number(c.photoOverlay))):28;restoreTypography(c.typography);categoryId.value=categories.some(x=>x.id===c.categoryId)?c.categoryId:'wedding';paletteIndex.value=[0,1,2].includes(c.paletteIndex)?c.paletteIndex:0;paletteBackground.value=/^#[0-9a-f]{6}$/i.test(c.paletteBackground||'')?c.paletteBackground:'#FFF9ED';decoration.value=decorationNames.some(x=>x[0]===c.decoration)?c.decoration:'none';decorationOpacity.value=Math.min(100,Math.max(0,Number(c.decorationOpacity)||65));decorationSize.value=Math.min(160,Math.max(20,Number(c.decorationSize)||85));decorationRotation.value=Math.min(180,Math.max(-180,Number(c.decorationRotation)||0));decorationPosition.value=['top-left','top-right','bottom-left','bottom-right'].includes(c.decorationPosition)?c.decorationPosition:'top-left';decorationColour.value=/^#[0-9a-f]{6}$/i.test(c.decorationColour||'')?c.decorationColour:'#B18A50';brandColour.value=/^#[0-9a-f]{6}$/i.test(c.brandColour||'')?c.brandColour:'#0C1D2D';brandAccent.value=/^#[0-9a-f]{6}$/i.test(c.brandAccent||'')?c.brandAccent:'#B18A50';posterCover.value=p.snapshot_url;loadedSavedPoster.value=true;posterName.value=p.name}
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
async function printSign(){
 // Ensure selected web fonts are loaded before the browser captures the PDF.
 if(import.meta.client){
  try {
   await Promise.all(selectedWebFonts.value.map(f=>document.fonts.load(`16px "${f}"`)))
   await document.fonts.ready
  } catch(e){console.warn('Some poster fonts could not load before printing',e)}
  window.print()
 }
}
async function copyLink(){try{await navigator.clipboard.writeText(guestUrl.value);dialog.show('Guest link copied.','success')}catch{dialog.show('Unable to copy the link.','error')}}
</script>
<template>
 <main class="mx-auto max-w-6xl px-5 py-10 space-y-6">
  <div class="ek-no-print relative flex min-h-12 items-center justify-center"><NuxtLink :to="`/dashboard/events/${route.params.id}`" class="ek-back-button absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D] shadow-sm transition hover:bg-[#F0E5D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]"><span aria-hidden="true">←</span><span>Back</span></NuxtLink><h1 class="px-20 text-center text-xl font-bold sm:text-2xl">Welcome Sign Designer</h1></div>
  <p v-if="loading">Loading sign designer…</p><p v-else-if="error" class="text-red-700">{{error}}</p>
  <div v-else-if="item" class="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
   <section class="panel space-y-5 ek-no-print self-start">
    <nav class="grid grid-cols-2 gap-2" aria-label="Sign design steps">
     <button v-for="(step,i) in studioSteps" :key="step.id" type="button" class="flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium" :class="studioTab===step.id?'bg-[#0C1D2D] text-white border-[#0C1D2D]':'bg-white text-[#0C1D2D] border-[#D6B077]'" @click="studioTab=step.id"><span class="opacity-70">{{i+1}}.</span><span>{{step.name}}</span></button>
    </nav>
    <div v-if="studioTab==='category'" class="space-y-3"><h2 class="text-lg font-semibold">1. Choose your event</h2><p class="text-sm text-[#536273]">Start with an event type. Each has three unique colour themes.</p>
     <div class="grid grid-cols-2 gap-2"><button v-for="c in categories" :key="c.id" type="button" class="rounded-xl border p-3 text-left" :class="categoryId===c.id?'border-[#0C1D2D] bg-[#F4E9D8]':'border-[#D6B077] bg-white'" @click="chooseCategory(c.id)"><span class="text-xl">{{c.icon}}</span><span class="block text-sm font-semibold mt-1">{{c.name}}</span></button></div>
    </div>
    <div v-if="studioTab==='colours'" class="space-y-4"><h2 class="text-lg font-semibold">3. Colour Theme</h2><p class="text-sm text-[#536273]">Three coordinated tones designed for {{currentCategory.name}}. Your text and photo are preserved.</p>
     <button v-for="(p,i) in currentCategory.palettes" :key="i" type="button" class="w-full rounded-xl border p-3 text-left" :class="paletteIndex===i?'border-[#0C1D2D] ring-2 ring-[#D6B077]':'border-[#D6B077]'" @click="choosePalette(i)"><span class="block text-sm font-semibold mb-2">{{p[0]}}</span><span class="flex h-12 overflow-hidden rounded-lg"><span v-for="(colour,j) in p.slice(1)" :key="j" class="flex-1" :style="{background:colour}"></span></span></button>
     <label class="block text-sm font-medium">Background colour<div class="flex gap-2 mt-2"><input v-model="paletteBackground" type="color" class="h-10 w-12"/><input v-model="paletteBackground" class="input flex-1" maxlength="7"/></div></label>
     <label class="block text-sm font-medium">Brand title colour<div class="flex gap-2 mt-2"><input v-model="brandColour" type="color" class="h-10 w-12"/><input v-model="brandColour" class="input flex-1" maxlength="7"/></div></label>
     <label class="block text-sm font-medium">Accent / tagline colour<div class="flex gap-2 mt-2"><input v-model="brandAccent" type="color" class="h-10 w-12"/><input v-model="brandAccent" class="input flex-1" maxlength="7"/></div></label>
    </div>
    <div v-if="studioTab==='style'" class="space-y-4"><h2 class="text-lg font-semibold">5. Style & Decorations</h2><p class="text-sm text-[#536273]">The EventKeepsakes title and Capture · Share · Remember keep their original wording, font and sizing. Only branding colours can change.</p>
     <label class="block text-sm font-medium">Branding title colour<div class="flex items-center gap-2 mt-2"><input v-model="brandColour" type="color" class="h-10 w-12" /><input v-model="brandColour" class="input flex-1" maxlength="7" aria-label="Brand title hex colour" /></div></label>
     <label class="block text-sm font-medium">Branding accent and tagline colour<div class="flex items-center gap-2 mt-2"><input v-model="brandAccent" type="color" class="h-10 w-12" /><input v-model="brandAccent" class="input flex-1" maxlength="7" aria-label="Brand accent hex colour" /></div></label>
     <button type="button" class="rounded-lg border px-3 py-2 text-sm" @click="brandColour='#0C1D2D';brandAccent='#B18A50'">Reset branding colours</button>
     <label class="block text-sm font-medium">Background style<select v-model="theme" class="input mt-2"><option value="classic">Classic</option><option value="romance">Romance</option><option value="modern">Modern</option></select></label>
     <label class="block text-sm font-medium">Paper size<select v-model="paper" class="input mt-2"><option value="A4">A4 portrait</option><option value="A5">A5 portrait</option></select></label>
    </div>
    <div v-if="studioTab==='style'" class="space-y-4"><h3 class="font-semibold">Decorative overlays</h3><p class="text-xs text-[#536273]">Decorations print with the sign. Branding always stays legible and locked.</p>
     <div class="grid grid-cols-2 gap-2"><button v-for="[id,name] in decorationNames" :key="id" type="button" class="rounded-lg border px-2 py-3 text-sm" :class="decoration===id?'border-[#0C1D2D] bg-[#F4E9D8]':'border-[#D6B077]'" @click="decoration=id">{{name}}</button></div>
     <template v-if="decoration!=='none'">
      <label class="block text-sm">Overlay colour <input v-model="decorationColour" type="color" class="ml-2 h-9 w-12 align-middle"/></label>
      <label class="block text-sm">Opacity: {{decorationOpacity}}%<input v-model.number="decorationOpacity" type="range" min="0" max="100" class="w-full"/></label>
      <label class="block text-sm">Size: {{decorationSize}}%<input v-model.number="decorationSize" type="range" min="20" max="160" class="w-full"/></label>
      <label class="block text-sm">Rotation: {{decorationRotation}}°<input v-model.number="decorationRotation" type="range" min="-180" max="180" class="w-full"/></label>
      <label class="block text-sm">Position<select v-model="decorationPosition" class="input mt-1"><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label>
     </template>
    </div>
    <div v-if="studioTab==='text'" class="space-y-4"><h2 class="text-lg font-semibold">Edit text</h2>
    <label class="block text-sm font-medium">Heading<input v-model="heading" maxlength="100" class="input mt-2" /></label>
    <label class="block text-sm font-medium">Message<textarea v-model="message" maxlength="260" rows="4" class="input mt-2" /></label>

    <div class="rounded-xl border border-[#D6B077] p-3 space-y-3">
     <h3 class="font-semibold">Text formatting</h3>
     <label class="block text-sm font-medium">Choose text element
      <select v-model="selectedTypography" class="input mt-1">
       <option v-for="section in typographySections" :key="section.key" :value="section.key">{{section.label}}</option>
      </select>
     </label>
     <div class="space-y-2">
      <label class="block text-sm font-medium">Font family</label>
      <button type="button" class="input w-full text-left flex items-center justify-between gap-2" :aria-expanded="fontBrowserOpen" @click="fontBrowserOpen=!fontBrowserOpen">
       <span class="truncate" :style="{fontFamily:selectedText.font}">{{chosenFontName}}</span><span aria-hidden="true">▾</span>
      </button>
      <div v-if="fontBrowserOpen" class="rounded-xl border border-[#D6B077] bg-white p-2 shadow-lg">
       <input v-model="fontSearch" class="input w-full mb-2" placeholder="Search fonts..." aria-label="Search fonts" />
       <div class="max-h-72 overflow-y-auto space-y-2" role="listbox" aria-label="Font choices">
        <section v-for="group in matchingFontGroups" :key="group.label">
         <div class="sticky top-0 bg-[#F8F4EB] px-2 py-1 text-xs font-semibold text-[#536273]">{{group.label}}</div>
         <button v-for="f in group.fonts" :key="f.value" type="button" role="option" :aria-selected="selectedText.font===f.value"
          class="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#F8F4EB]"
          :class="selectedText.font===f.value?'bg-[#F8F4EB] ring-1 ring-[#D6B077]':''"
          :style="{fontFamily:f.value,fontSize:'19px'}" @click="chooseFont(f.value)">{{f.label}}</button>
        </section>
        <p v-if="!matchingFontGroups.length" class="p-3 text-sm text-[#536273]">No matching fonts</p>
       </div>
      </div>
      <p class="text-xs text-[#536273]">Font names are displayed in their own typeface. Previews load when you open the list.</p>
     </div>
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
    </div><div v-if="studioTab==='qr'" class="space-y-4"><h2 class="text-lg font-semibold">QR code</h2>
    <label class="block text-sm font-medium">QR code colour
     <select v-model="qrColourMode" class="input mt-2">
      <option value="auto">Automatic (matches sign background)</option>
      <option value="dark">Dark navy</option>
      <option value="light">White (for dark backgrounds)</option>
     </select>
    </label>
    <p class="text-xs text-[#536273]">The QR image has a transparent background. White QR uses a subtle dark contrast panel for reliable scanning.</p>
    </div><div v-if="studioTab==='photo'" class="space-y-4"><h2 class="text-lg font-semibold">2. Photo & layout</h2>
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
    </div><div v-if="studioTab==='saved'" class="space-y-4"><h2 class="text-lg font-semibold">Save & load designs</h2>
    <label class="block text-sm">Design name<input v-model="posterName" maxlength="80" class="input mt-2" /></label>
    <button type="button" class="w-full rounded-lg border border-[#D6B077] px-4 py-2" :disabled="posterBusy" @click="savePoster">{{posterBusy?'Saving…':'Save poster design'}}</button>
    <p v-if="posterError" class="text-sm text-red-700">{{posterError}}</p>
    <label v-if="savedPosters.length" class="block text-sm">Saved designs<select class="input mt-2" @change="openSavedPoster(savedPosters.find(p=>p.id===($event.target as HTMLSelectElement).value))"><option value="">Choose saved design</option><option v-for="p in savedPosters" :key="p.id" :value="p.id">{{p.name}}</option></select></label>
    </div>
    <button v-if="studioTab!=='saved'" type="button" class="w-full rounded-lg border border-[#D6B077] px-4 py-2 font-semibold" @click="nextStudioStep">Next step →</button>
    <button type="button" class="btn w-full" @click="printSign">Print / Save as PDF</button>
    <button type="button" class="w-full rounded-lg border border-[#CBBFAE] px-4 py-2" @click="copyLink">Copy guest link</button>
    <p class="text-xs text-[#536273]">In the print dialog, select Save as PDF, set paper size to A4 (or A5 if selected), margins to None, scale to 100%, disable headers/footers, and enable background graphics.</p>
   </section>
   <div class="ek-sign-stage flex flex-col items-center rounded-2xl bg-[#E8E2D7] p-4 sm:p-8">
    <p class="mb-3 text-center text-xs font-semibold text-[#536273]">{{paper}} portrait preview · {{paper==='A4'?'210 × 297 mm':'148 × 210 mm'}} · scaled to fit screen</p>
    <p class="ek-no-print mb-2 text-xs text-[#536273]">Click editable text on the sign to open its font controls.</p>
    <article :class="['ek-print-sign',`ek-sign-${theme}`,paper==='A5'?'ek-paper-a5':'ek-paper-a4',activePosterCover&&photoFill?'ek-sign-photo-fill':'']" :style="{...signTypographyVars,'--ek-brand-colour':/^#[0-9a-f]{6}$/i.test(brandColour)?brandColour:'#0C1D2D','--ek-brand-accent':/^#[0-9a-f]{6}$/i.test(brandAccent)?brandAccent:'#B18A50','--sign-bg':/^#[0-9a-f]{6}$/i.test(paletteBackground)?paletteBackground:'#FFF9ED',...(activePosterCover&&photoFill?{backgroundImage:`linear-gradient(rgba(255,255,255,${photoOverlay/100}),rgba(255,255,255,${photoOverlay/100})),url(${activePosterCover})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}:{})}" aria-label="Printable event welcome sign">
      <div class="ek-sign-inner ek-decorated-sign" :style="activePosterCover&&!photoFill?{backgroundImage:`linear-gradient(rgba(255,255,255,${photoOverlay/100}),rgba(255,255,255,${photoOverlay/100})),url(${activePosterCover})`,backgroundSize:'cover',backgroundPosition:'center'}:{}">
       <div v-if="decoration!=='none'" class="ek-decoration" :style="decorationPositionStyle" aria-hidden="true">{{decorationSymbols[decoration]}}</div>
       <div class="ek-sign-brand">Event<span>Keepsakes</span></div>
       <div class="ek-sign-tagline">Capture · Share · Remember</div>
       <div class="ek-sign-ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
       <h2 class="ek-sign-title ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('event')" @keydown.enter="editOnCanvas('event')">{{item.title}}</h2>
       <p class="ek-sign-date ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('date')" @keydown.enter="editOnCanvas('date')">{{dateLabel}}</p>
       <h3 class="ek-sign-heading ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('heading')" @keydown.enter="editOnCanvas('heading')">{{heading}}</h3>
       <p class="ek-sign-message ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('message')" @keydown.enter="editOnCanvas('message')" style="white-space:pre-line;overflow-wrap:anywhere">{{message}}</p>
       <div class="ek-sign-qr" :class="qrInk==='#FFFFFF'?'ek-sign-qr-light':'ek-sign-qr-dark'"><img :src="qr"  alt="QR code linking to event guest upload page" /></div>
       <p class="ek-sign-action ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('action')" @keydown.enter="editOnCanvas('action')">Point your phone camera here</p>
       <p class="ek-sign-footer ek-editable" tabindex="0" role="button" title="Click to edit text style" @click="editOnCanvas('footer')" @keydown.enter="editOnCanvas('footer')">No app or account required</p>
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

<style>
@media screen{.ek-editable{cursor:pointer;outline-offset:3px}.ek-editable:hover,.ek-editable:focus-visible{outline:2px dashed #B18A50}}
.ek-sign-brand{color:var(--ek-brand-colour,#0C1D2D)!important}
.ek-sign-brand span,.ek-sign-tagline{color:var(--ek-brand-accent,#B18A50)!important}
</style>

<style>
/* Keep poster branding consistent with the EventKeepsakes global header.
   These overrides intentionally win over the older dynamic typography variables. */
.ek-print-sign .ek-sign-brand {
 font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
 font-weight: 700 !important;
 font-style: normal !important;
 text-decoration: none !important;
 font-size: 24px !important;
 line-height: 1.2 !important;
 letter-spacing: -0.025em !important;
 color: var(--ek-brand-colour, #0C1D2D) !important;
}
.ek-print-sign .ek-sign-brand span {color:var(--ek-brand-accent,#B18A50)!important}
.ek-print-sign .ek-sign-tagline {
 font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
 font-weight: 600 !important;
 font-style: normal !important;
 text-decoration: none !important;
 font-size: 10px !important;
 line-height: 1.4 !important;
 letter-spacing: 0.2em !important;
 text-transform: uppercase !important;
 color:var(--ek-brand-accent,#B18A50)!important;
}
@media screen {
 .ek-print-sign.ek-paper-a5 .ek-sign-brand{font-size:17px!important}
 .ek-print-sign.ek-paper-a5 .ek-sign-tagline{font-size:7px!important}
}
@media print {
 .ek-print-sign.ek-paper-a4 .ek-sign-brand{font-size:18pt!important}
 .ek-print-sign.ek-paper-a4 .ek-sign-tagline{font-size:7.5pt!important}
 .ek-print-sign.ek-paper-a5 .ek-sign-brand{font-size:12.7pt!important}
 .ek-print-sign.ek-paper-a5 .ek-sign-tagline{font-size:5.3pt!important}
}
</style>

<style> .ek-decorated-sign{position:relative;isolation:isolate}.ek-decorated-sign>:not(.ek-decoration){position:relative;z-index:2}.ek-decoration{line-height:1.4;letter-spacing:.14em}.ek-print-sign{background:var(--sign-bg)!important} </style>
