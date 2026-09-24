<script>
  import { onMount } from 'svelte'
  import { supabase } from './supabase.js'

  let { profile, userId, onsaved, onclose } = $props()
  let dialog
  let nickname = $state('')
  let barrioId = $state('')
  let barrios = $state([])
  let saving = $state(false)
  let error = $state('')

  const districts = $derived(Object.entries(Object.groupBy(barrios, (b) => b.district)))

  supabase
    .from('barrios')
    .select('*')
    .order('id')
    .then(({ data }) => (barrios = data ?? []))

  onMount(() => {
    nickname = profile?.nickname ?? ''
    barrioId = profile?.barrio_id ?? ''
    dialog.showModal()
  })

  async function save(e) {
    e.preventDefault()
    saving = true
    const { data, error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, nickname: nickname.trim(), barrio_id: barrioId || null })
      .select()
      .single()
    saving = false
    if (!err) {
      onsaved(data)
      return dialog.close()
    }
    if (err.code === '23505') error = 'That nickname is taken.'
    else if (err.code === '23514') error = 'Use 2–24 letters, numbers, dots, dashes, or underscores.'
    else error = err.message
  }
</script>

<dialog bind:this={dialog} {onclose} onclick={(e) => e.target === dialog && dialog.close()}>
  <div class="panel">
    <h2>{profile ? 'Your profile' : 'Pick a nickname'}</h2>
    <p class="muted">Shown on everything you post.</p>
    <form onsubmit={save}>
      <!-- svelte-ignore a11y_autofocus -->
      <input required autofocus minlength="2" maxlength="24" placeholder="nickname" bind:value={nickname} />
      <select bind:value={barrioId}>
        <option value="">Barrio (optional)</option>
        {#each districts as [district, list] (district)}
          <optgroup label={district}>
            {#each list as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
          </optgroup>
        {/each}
      </select>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </form>
    {#if error}<p class="error">{error}</p>{/if}
  </div>
</dialog>
