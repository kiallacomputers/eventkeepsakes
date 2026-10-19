<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref(''), password = ref(''), error = ref(''), busy = ref(false)
async function login() { busy.value = true; error.value = ''; try { const { error: err } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value }); if (err) throw err; await navigateTo('/dashboard') } catch (e: any) { error.value = e.message || 'Login failed.' } finally { busy.value = false } }
</script>
<template><div class="mx-auto max-w-md px-5 py-16"><form class="panel space-y-5" @submit.prevent="login"><h1 class="text-3xl font-bold">Welcome back</h1><label class="block">Email<input v-model="email" type="email" class="input mt-2" required autocomplete="email" /></label><label class="block">Password<input v-model="password" type="password" class="input mt-2" required autocomplete="current-password" /></label><p v-if="error" role="alert" class="text-red-700">{{ error }}</p><button class="btn w-full" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button><NuxtLink to="/auth/register" class="block text-center text-sm text-[#90612E]">Create an account</NuxtLink></form></div></template>
