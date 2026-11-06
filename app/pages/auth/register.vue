<script setup lang="ts">
useSeoMeta({ title: 'Create account', robots: 'noindex' })
const supabase = useSupabaseClient()
const dialog = useAppDialog()
const email = ref('')
const password = ref('')
const fullName = ref('')
const error = ref('')
const success = ref('')
const busy = ref(false)

async function register() {
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    const { error: err } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: { data: { full_name: fullName.value.trim() } }
    })
    if (err) throw err
    success.value = 'Registration received. Check your email for a confirmation link, if email confirmation is enabled.'
    dialog.show(success.value, 'success', 'Account registration')
  } catch (e: any) {
    error.value = e.message || 'Registration failed.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-5 py-16">
    <form class="panel space-y-5" @submit.prevent="register">
      <h1 class="font-serif text-3xl font-bold">Create account</h1>
      <label class="block">Full name
        <input v-model="fullName" class="input mt-2" required autocomplete="name" />
      </label>
      <label class="block">Email
        <input v-model="email" type="email" class="input mt-2" required autocomplete="email" />
      </label>
      <label class="block">Password
        <input v-model="password" type="password" minlength="8" class="input mt-2" required autocomplete="new-password" aria-describedby="pw-hint" />
        <span id="pw-hint" class="mt-1 block text-xs text-[#647080]">At least 8 characters.</span>
      </label>
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <p v-if="success" role="status" class="text-[#90612E]">{{ success }}</p>
      <button class="btn w-full" :disabled="busy">{{ busy ? 'Creating…' : 'Register' }}</button>
      <NuxtLink to="/auth/login" class="block text-center text-sm text-[#90612E] underline underline-offset-2">Already have an account?</NuxtLink>
    </form>
  </div>
</template>
