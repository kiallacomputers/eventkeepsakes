<script setup lang="ts">
const { state, close } = useAppDialog()
const cancelButton = ref<HTMLButtonElement | null>(null)
const okButton = ref<HTMLButtonElement | null>(null)
watch(() => state.value.open, async open => { if (open) { await nextTick(); (state.value.kind === 'confirm' ? cancelButton.value : okButton.value)?.focus() } })
function keydown(event: KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); close(false) } }
</script>
<template>
  <Teleport to="body">
    <div v-if="state.open" class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#081724]/70 px-4 py-6" @keydown="keydown">
      <div role="dialog" aria-modal="true" aria-labelledby="ek-dialog-title" aria-describedby="ek-dialog-message" class="w-full max-w-md rounded-2xl border border-[#D6B077] bg-[#F8F4EB] p-6 shadow-2xl sm:p-8">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div class="flex items-center gap-3"><span aria-hidden="true" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE1CB] text-xl text-[#0C1D2D]">{{ state.kind === 'success' ? '✓' : state.kind === 'error' ? '!' : state.kind === 'confirm' ? '?' : 'i' }}</span><h2 id="ek-dialog-title" class="text-xl font-bold text-[#0C1D2D]">{{ state.title }}</h2></div>
          <button type="button" class="rounded-lg px-2 text-xl text-[#536273] hover:bg-[#EDE1CB]" aria-label="Close popup" @click="close(false)">×</button>
        </div>
        <p id="ek-dialog-message" class="whitespace-pre-wrap text-sm leading-6 text-[#354657]">{{ state.message }}</p>
        <div class="mt-7 flex flex-wrap justify-end gap-3">
          <button v-if="state.kind === 'confirm'" ref="cancelButton" type="button" class="rounded-lg border border-[#CBBFAE] px-5 py-2.5 font-medium text-[#0C1D2D] hover:bg-[#EDE1CB]" @click="close(false)">{{ state.cancelText }}</button>
          <button ref="okButton" type="button" class="rounded-lg bg-[#0C1D2D] px-5 py-2.5 font-semibold text-white hover:bg-[#20384E]" @click="close(true)">{{ state.confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
