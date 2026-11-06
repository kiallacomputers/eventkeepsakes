<script setup lang="ts">
useSeoMeta({ title: 'Sign in', robots: 'noindex' })
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)

async function login() {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
    if (err) throw err
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Login failed.'
  } finally {
    busy.value = false
  }
}

async function forgotPassword() {
  error.value = ''
  notice.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email above, then choose “Forgot password?” again.'
    return
  }
  busy.value = true
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: `${window.location.origin}/account` })
    if (err) throw err
    notice.value = 'If an account exists for that email, a reset link is on its way.'
  } catch (e: any) {
    error.value = e.message || 'Could not send the reset email.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-5 py-16">
    <form class="panel space-y-5" @submit.prevent="login">
      <h1 class="font-serif text-3xl font-bold">Welcome back</h1>
      <label class="block">Email
        <input v-model="email" type="email" class="input mt-2" required autocomplete="email" />
      </label>
      <label class="block">Password
        <input v-model="password" type="password" class="input mt-2" required autocomplete="current-password" />
      </label>
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <p v-if="notice" role="status" class="text-[#90612E]">{{ notice }}</p>
      <button class="btn w-full" :disabled="busy">{{ busy ? 'Please wait…' : 'Sign in' }}</button>
      <div class="flex items-center justify-between text-sm">
        <button type="button" class="text-[#90612E] underline underline-offset-2" :disabled="busy" @click="forgotPassword">Forgot password?</button>
        <NuxtLink to="/auth/register" class="text-[#90612E] underline underline-offset-2">Create an account</NuxtLink>
      </div>
    </form>
  </div>
</template>
