<script>
  import { supabase } from './supabase.js'
  import Tally from './Tally.svelte'

  let { article, user, canPost, allowVote, voterId, onjoin, onchange } = $props()
  let draft = $state('')
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

  // Returns synchronously whether the vote goes ahead, so the bubble can react instantly.
  function vote(stance) {
    const retracting = mine === stance
    if (!retracting && !allowVote()) return false
    cast(stance, retracting)
    return true
  }

  async function cast(stance, retracting) {
    const uid = await voterId()
    if (!uid) return
    const key = { article_id: article.id, user_id: uid }
    run(retracting ? supabase.from('votes').delete().match(key) : supabase.from('votes').upsert({ ...key, stance }))
  }

  async function addContext(e) {
    e.preventDefault()
    if (!onjoin()) return
    const text = draft.trim()
    // A bare link is stored as a supporting link; anything else is a note.
    const isLink = /^https?:\/\/\S+$/.test(text)
    const row = { article_id: article.id, body: isLink ? null : text, url: isLink ? text : null }
    if (await run(supabase.from('article_context').insert(row))) draft = ''
  }
</script>

{#snippet byline(author)}
  {author.nickname}{#if author.barrios}<span class="barrio"> · {author.barrios.name}</span>{/if}
{/snippet}

<article class="card">
  <div class="card-head">
    <Tally {agree} {disagree} {mine} onvote={vote} />
    <div class="body">
      <a class="title" href={article.url} target="_blank" rel="noopener">{article.title ?? article.url}</a>
      <p class="muted">
        {host} · {new Date(article.created_at).toLocaleDateString()}
        {#if article.author} · {@render byline(article.author)}{/if}
      </p>
      {#if article.clean_text}<p class="recap">{article.clean_text.slice(0, 280)}…</p>{/if}
    </div>
    <div class="actions">
      <button class="vote agree" class:on={mine === 'agree'} onclick={() => vote('agree')}>Agree</button>
      <button class="vote disagree" class:on={mine === 'disagree'} onclick={() => vote('disagree')}>Disagree</button>
    </div>
  </div>

  <section class="thread">
    {#each article.article_context as c (c.id)}
      <div class="msg" class:mine={c.user_id === user?.id}>
        <span class="who">{#if c.author}{@render byline(c.author)}{:else}someone{/if}</span>
        {#if c.body}<p>{c.body}</p>{/if}
        {#if c.url}<a href={c.url} target="_blank" rel="noopener">{c.url}</a>{/if}
      </div>
    {/each}

    {#if canPost}
      <form class="composer" onsubmit={addContext}>
        <input placeholder="Add context or paste a link…" bind:value={draft} />
        <button type="submit" disabled={!draft.trim()} aria-label="Send">↑</button>
      </form>
    {:else}
      <button class="link join" onclick={onjoin}>Join to add context</button>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
  </section>
</article>
