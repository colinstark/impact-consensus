<script>
  import { supabase } from './supabase.js'
  import Tally from './Tally.svelte'

  let { article, user, gate, onchange } = $props()
  let open = $state(false)
  let body = $state('')
  let link = $state('')
  let error = $state('')

  const agree = $derived(article.votes.filter((v) => v.stance === 'agree').length)
  const disagree = $derived(article.votes.length - agree)
  const mine = $derived(article.votes.find((v) => v.user_id === user?.id)?.stance)
  const host = $derived(URL.parse(article.url)?.hostname.replace(/^www\./, '') ?? article.url)

  async function run(query) {
    const { error: err } = await query
    error = err?.message ?? ''
    if (!err) onchange()
    return !err
  }

  function vote(stance) {
    if (!gate()) return
    const key = { article_id: article.id, user_id: user.id }
    // Clicking your current stance again retracts the vote.
    run(
      mine === stance
        ? supabase.from('votes').delete().match(key)
        : supabase.from('votes').upsert({ ...key, stance }),
    )
  }

  async function addContext(e) {
    e.preventDefault()
    if (!gate()) return
    const row = { article_id: article.id, body: body.trim() || null, url: link.trim() || null }
    if (await run(supabase.from('article_context').insert(row))) body = link = ''
  }
</script>

<article>
  <Tally {agree} {disagree} {mine} onvote={vote} />

  <div class="body">
    <a class="title" href={article.url} target="_blank" rel="noopener">{article.title ?? article.url}</a>
    <p class="muted">{host} · {new Date(article.created_at).toLocaleDateString()}</p>
    {#if article.clean_text}<p class="recap">{article.clean_text.slice(0, 280)}…</p>{/if}
    <button class="toggle" class:open onclick={() => (open = !open)}>
      Context ({article.article_context.length})
    </button>
    {#if error}<p class="error">{error}</p>{/if}
  </div>

  <div class="actions">
    <button class="vote agree" class:on={mine === 'agree'} onclick={() => vote('agree')}>Agree</button>
    <button class="vote disagree" class:on={mine === 'disagree'} onclick={() => vote('disagree')}>Disagree</button>
  </div>

  {#if open}
    <section class="context">
      {#each article.article_context as c (c.id)}
        <div class="note">
          {#if c.body}<p>{c.body}</p>{/if}
          {#if c.url}<a href={c.url} target="_blank" rel="noopener">{c.url}</a>{/if}
        </div>
      {/each}
      {#if user}
        <form onsubmit={addContext}>
          <textarea rows="2" placeholder="Add context…" bind:value={body}></textarea>
          <input type="url" placeholder="Supporting link (optional)" bind:value={link} />
          <button type="submit" disabled={!body.trim() && !link.trim()}>Post</button>
        </form>
      {:else}
        <button class="link" onclick={gate}>Sign in to add context</button>
      {/if}
    </section>
  {/if}
</article>
