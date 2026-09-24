<script>
  import Tally from './Tally.svelte'
  import VoteButton from './VoteButton.svelte'
  import Thread from './Thread.svelte'
  import { voteStats, hostOf, headlineOf } from './article.js'
  import { go } from './router.svelte.js'

  let { article, user, canPost, onvote, onjoin, onchange } = $props()

  const stats = $derived(voteStats(article, user?.id))
</script>

<a class="back muted" href="/" onclick={go}>← All articles</a>

<article class="card detail">
  <div class="detail-body">
    <div class="detail-vote">
      <VoteButton stance="agree" mine={stats.mine} {onvote} />
      <Tally agree={stats.agree} disagree={stats.disagree} mine={stats.mine} {onvote} />
      <VoteButton stance="disagree" mine={stats.mine} {onvote} />
    </div>

    <h2 class="headline">{headlineOf(article)}</h2>
    <p class="source muted">
      <a href={article.url} target="_blank" rel="noopener">{hostOf(article.url)} ↗</a>
      {#if article.statement && article.title}<span> · {article.title}</span>{/if}
    </p>
    {#if article.description}<p class="description">{article.description}</p>{/if}
  </div>

  <Thread {article} {user} {canPost} {onjoin} {onchange} />
</article>
