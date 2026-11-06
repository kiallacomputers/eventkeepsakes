<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Account', robots: 'noindex' })
const client = useSupabaseClient()
const user = useSupabaseUser()
const password = ref('')
const confirm = ref('')
const error = ref('')
const success = ref('')
const busy = ref(false)

async function changePassword() {
  error.value = ''
  success.value = ''
  if (password.value !== confirm.value) {
    error.value = 'The two passwords do not match.'
    return
  }
  busy.value = true
  try {
    const { error: err } = await client.auth.updateUser({ password: password.value })
    if (err) throw err
    password.value = ''
    confirm.value = ''
    success.value = 'Your password has been updated.'
  } catch (e: any) {
    error.value = e.message || 'Could not update your password.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6 px-5 py-12">
    <h1 class="font-serif text-3xl font-bold">Your account</h1>
    <section class="panel space-y-1" aria-labelledby="acct-email">
      <h2 id="acct-email" class="text-sm font-semibold uppercase tracking-wider text-[#956B34]">Signed in as</h2>
      <p class="text-lg">{{ user?.email }}</p>
    </section>
    <form class="panel space-y-5" @submit.prevent="changePassword">
      <h2 class="font-serif text-xl font-semibold">Change password</h2>
      <label class="block">New password
        <input v-model="password" type="password" minlength="8" class="input mt-2" required autocomplete="new-password" />
      </label>
      <label class="block">Confirm new password
        <input v-model="confirm" type="password" minlength="8" class="input mt-2" required autocomplete="new-password" />
      </label>
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <p v-if="success" role="status" class="text-[#90612E]">{{ success }}</p>
      <button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Update password' }}</button>
    </form>
    <NuxtLink to="/dashboard" class="inline-block text-sm text-[#90612E] underline underline-offset-2">← Back to dashboard</NuxtLink>
  </div>
</template>
