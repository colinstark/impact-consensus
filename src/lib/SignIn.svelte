<script>
  import { supabase } from './supabase.js'

  let { onclose } = $props()
  let dialog
  let email = $state('')
  let status = $state('idle')
  let error = $state('')

  $effect(() => dialog.showModal())

  async function send(e) {
    e.preventDefault()
    status = 'sending'
    error = ''
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin },
    })
    status = err ? 'idle' : 'sent'
    if (err) error = err.message
  }
</script>

<dialog bind:this={dialog} {onclose} onclick={(e) => e.target === dialog && dialog.close()}>
  <div class="panel">
    <h2>Sign in</h2>
    {#if status === 'sent'}
      <p>Check <strong>{email}</strong> for a sign-in link.</p>
      <button onclick={() => dialog.close()}>Done</button>
    {:else}
      <p class="muted">We'll email you a link. No password needed.</p>
      <form onsubmit={send}>
        <!-- svelte-ignore a11y_autofocus -->
        <input type="email" required autofocus placeholder="you@example.com" bind:value={email} />
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send link'}
        </button>
      </form>
      {#if error}<p class="error">{error}</p>{/if}
    {/if}
  </div>
</dialog>
