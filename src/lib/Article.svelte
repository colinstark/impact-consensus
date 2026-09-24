<script>
  import Tally from './Tally.svelte'
  import VoteButton from './VoteButton.svelte'
  import Thread from './Thread.svelte'
  import { voteStats, hostOf, headlineOf } from './article.js'
  import { go } from './router.svelte.js'

  let { article, user, canPost, onvote, onjoin, onchange } = $props()

  const stats = $derived(voteStats(article, user?.id))
</script>

<article class="card">
  <div class="card-head">
    <Tally agree={stats.agree} disagree={stats.disagree} mine={stats.mine} {onvote} />
    <div class="body">
      <a class="title" href="/article/{article.id}" onclick={go}>{headlineOf(article)}</a>
      <p class="muted">
        {hostOf(article.url)} · {new Date(article.created_at).toLocaleDateString()}
        {#if article.author}
          · {article.author.nickname}{#if article.author.barrios}<span class="barrio"> · {article.author.barrios.name}</span>{/if}
        {/if}
      </p>
      {#if article.clean_text}<p class="recap">{article.clean_text.slice(0, 280)}…</p>{/if}
    </div>
    <div class="actions">
      <VoteButton stance="agree" mine={stats.mine} {onvote} />
      <VoteButton stance="disagree" mine={stats.mine} {onvote} />
    </div>
  </div>

  <Thread {article} {user} {canPost} {onjoin} {onchange} />
</article>
