<template>
  <div class="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit] select-none" aria-hidden="true">
    <div class="absolute inset-[-45%] flex rotate-[-28deg] flex-col items-center justify-center gap-8 opacity-65">
      <div v-for="i in 7" :key="i" class="flex w-[180%] justify-around gap-8 whitespace-nowrap text-[clamp(12px,2vw,22px)] font-bold tracking-[.15em] text-white [text-shadow:0_1px_5px_rgba(0,0,0,.9),0_0_2px_rgba(0,0,0,.9)]">
        <span v-for="j in 4" :key="j">EventKeepsakes</span>
      </div>
    </div>
  </div>
</template>
