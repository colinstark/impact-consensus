<script>
  import { supabase } from './supabase.js'

  let { article, user, canPost, onjoin, onchange } = $props()
  let draft = $state('')
  let error = $state('')

  async function addContext(e) {
    e.preventDefault()
    if (!onjoin()) return
    const text = draft.trim()
    // A bare link is stored as a supporting link; anything else is a note.
    const isLink = /^https?:\/\/\S+$/.test(text)
    const row = { article_id: article.id, body: isLink ? null : text, url: isLink ? text : null }
    const { error: err } = await supabase.from('article_context').insert(row)
    error = err?.message ?? ''
    if (!err) {
      draft = ''
      onchange()
    }
  }
</script>

{#snippet byline(author)}
  {author.nickname}{#if author.barrios}<span class="barrio"> · {author.barrios.name}</span>{/if}
{/snippet}

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
