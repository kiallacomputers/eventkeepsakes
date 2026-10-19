
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()

const events = ref<any[]>([])
const name = ref('')
const eventDate = ref('')
const error = ref('')
const busy = ref(false)
const loading = ref(true)

// Load events belonging to the authenticated user
async function load() {
  loading.value = true

  try {
    const { data, error: err } = await client
      .from('events')
      .select('id,title,event_date,slug,status')
      .order('created_at', { ascending: false })

    if (err) {
      throw err
    }

    events.value = data || []
  } catch (err: any) {
    error.value = err.message || 'Unable to load events.'
  } finally {
    loading.value = false
  }
}

// Create a new event
async function createEvent() {
  if (busy.value) return

  busy.value = true
  error.value = ''

  try {
    const title = name.value.trim()

    if (!title) {
      throw new Error('Please enter an event name.')
    }

    // Retrieve the authenticated user directly from Supabase
    const {
      data: { user: currentUser },
      error: authError
    } = await client.auth.getUser()

    if (authError || !currentUser) {
      throw new Error(
        'Your session has expired. Please sign in again.'
      )
    }

    // Generate a unique slug for the event
    const slug = crypto.randomUUID()

    // Insert event with the authenticated owner's ID
    const { error: insertError } = await client
      .from('events')
      .insert({
        owner_id: currentUser.id,
        title,
        event_date: eventDate.value || null,
        slug,
        status: 'draft'
      })

    if (insertError) {
      throw insertError
    }

    // Clear form after successful creation
    name.value = ''
    eventDate.value = ''

    // Refresh the event list
    await load()

  } catch (err: any) {
    error.value =
      err.message || 'An error occurred while creating the event.'

    console.error('Event creation failed:', err)
  } finally {
    busy.value = false
  }
}

// Sign out
async function signOut() {
  const { error: signOutError } = await client.auth.signOut()

  if (signOutError) {
    error.value = signOutError.message
    return
  }

  await navigateTo('/')
}

// Load events when dashboard opens
onMounted(() => {
  load()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-5 py-12">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">
          My events
        </h1>

        <p class="mt-3 text-slate-400">
          Create and manage your EventKeepsakes events.
        </p>
      </div>

      <button
        type="button"
        class="text-teal-300 hover:text-teal-200"
        @click="signOut"
      >
        Sign out
      </button>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
      role="alert"
    >
      {{ error }}
    </div>

    <!-- Create Event -->
    <form
      class="panel mt-8 space-y-4"
      @submit.prevent="createEvent"
    >
      <div>
        <h2 class="text-xl font-semibold">
          Create a new event
        </h2>

        <p class="mt-2 text-sm text-slate-400">
          Start by entering your event details.
        </p>
      </div>

      <div>
        <label
          for="event-name"
          class="mb-2 block text-sm font-medium"
        >
          Event name
        </label>

        <input
          id="event-name"
          v-model="name"
          type="text"
          required
          maxlength="150"
          placeholder="e.g. Ella's 21st Birthday"
          class="input w-full"
        />
      </div>

      <div>
        <label
          for="event-date"
          class="mb-2 block text-sm font-medium"
        >
          Event date
        </label>

        <input
          id="event-date"
          v-model="eventDate"
          type="date"
          class="input w-full"
        />
      </div>

      <button
        type="submit"
        :disabled="busy || !name.trim()"
        class="btn disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ busy ? 'Creating event...' : 'Create Event' }}
      </button>
    </form>

    <!-- Events List -->
    <section class="mt-10">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">
          Your events
        </h2>

        <span class="text-sm text-slate-400">
          {{ events.length }} event(s)
        </span>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="mt-6 text-slate-400"
      >
        Loading events...
      </div>

      <!-- No Events -->
      <div
        v-else-if="events.length === 0"
        class="panel mt-6 text-center"
      >
        <h3 class="text-lg font-semibold">
          No events yet
        </h3>

        <p class="mt-2 text-slate-400">
          Create your first event using the form above.
        </p>
      </div>

      <!-- Event Cards -->
      <div
        v-else
        class="mt-6 grid gap-4 md:grid-cols-2"
      >
        <div
          v-for="event in events"
          :key="event.id"
          class="panel"
        >
          <div class="flex items-start justify-between gap-4">
            <h3 class="text-lg font-semibold">
              {{ event.title }}
            </h3>

            <span
              class="rounded-full bg-slate-700 px-3 py-1 text-xs capitalize text-slate-200"
            >
              {{ event.status }}
            </span>
          </div>

          <p class="mt-3 text-sm text-slate-400">
            {{
              event.event_date
                ? `Event date: ${event.event_date}`
                : 'No date selected'
            }}
          </p>

          <p class="mt-2 break-all text-xs text-slate-500">
            Event reference: {{ event.slug }}
          </p>

          <div class="mt-5">
            <span class="text-sm text-teal-300">
              Event management coming in Phase 2
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Phase Information -->
    <div class="mt-10 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold">
        Coming next
      </h3>

      <p class="mt-2 text-sm text-slate-400">
        Phase 2 will introduce event management, QR codes,
        upload scheduling, privacy settings and PIN protection.
      </p>
    </div>

  </div>
</template>
