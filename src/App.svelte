<script>
  import { supabase } from './lib/supabase.js'
  import SignIn from './lib/SignIn.svelte'
  import Profile from './lib/Profile.svelte'
  import Article from './lib/Article.svelte'
  import Detail from './lib/Detail.svelte'
  import { voteStats } from './lib/article.js'
  import { route, go } from './lib/router.svelte.js'

  const FREE_VOTES = 3
  const HOUR = 60 * 60 * 1000
  const AUTHOR = 'author:profiles!{fk}(nickname, barrios(name))'

  let user = $state(null)
  let profile = $state(null)
  let articles = $state([])
  let loaded = $state(false)
  let modal = $state(null) // 'signin' | 'limit' | 'profile'
  let url = $state('')
  let error = $state('')

  // Anonymous users are guests who voted; members have an email-backed account.
  const memberId = $derived(user && !user.is_anonymous ? user.id : null)
  const canPostNow = $derived(!!(memberId && profile))
  const detailId = $derived(Number(route.path.match(/^\/article\/(\d+)$/)?.[1]) || null)
  const detail = $derived(detailId && articles.find((a) => a.id === detailId))

  supabase.auth.getSession().then(({ data }) => (user = data.session?.user ?? null))
  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null
    if (user && !user.is_anonymous && modal !== 'profile') modal = null
  })

  $effect(() => {
    const id = memberId
    profile = null
    if (!id) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        profile = data
        if (!data) modal = 'profile'
      })
  })

  async function load() {
    const { data, error: err } = await supabase
      .from('articles')
      .select(
        `*, ${AUTHOR.replace('{fk}', 'submitted_by')}, votes(stance, user_id), article_context(*, ${AUTHOR.replace('{fk}', 'user_id')})`,
      )
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'article_context' })
    if (err) error = err.message
    else articles = data
    loaded = true
  }

  load()
  supabase.channel('feed').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe()

  // Guests get FREE_VOTES per hour, counted in this browser; members are unlimited.
  function allowVote() {
    if (memberId) return true
    const recent = JSON.parse(localStorage.getItem('guest-votes') ?? '[]').filter((t) => Date.now() - t < HOUR)
    if (recent.length >= FREE_VOTES) {
      modal = 'limit'
      return false
    }
    localStorage.setItem('guest-votes', JSON.stringify([...recent, Date.now()]))
    return true
  }

  // Guests vote as an anonymous Supabase user, created on their first vote.
  async function voterId() {
    if (user) return user.id
    const { data, error: err } = await supabase.auth.signInAnonymously()
    if (err) error = err.message
    return data.user?.id
  }

  // Returns synchronously whether the vote goes ahead, so the bubble can react instantly.
  function vote(article, stance) {
    const retracting = voteStats(article, user?.id).mine === stance
    if (!retracting && !allowVote()) return false
    cast(article.id, stance, retracting)
    return true
  }

  async function cast(articleId, stance, retracting) {
    const uid = await voterId()
    if (!uid) return
    const key = { article_id: articleId, user_id: uid }
    const { error: err } = await (retracting
      ? supabase.from('votes').delete().match(key)
      : supabase.from('votes').upsert({ ...key, stance }))
    error = err?.message ?? ''
    if (!err) load()
  }

  // Posting needs an account and a nickname; opens whichever step is missing.
  function canPost() {
    if (!memberId) modal = 'signin'
    else if (!profile) modal = 'profile'
    return canPostNow
  }

  async function add(e) {
    e.preventDefault()
    if (!canPost()) return
    error = ''
    const { error: err } = await supabase.from('articles').insert({ url: url.trim() })
    if (err) error = err.code === '23505' ? 'That article is already here.' : err.message
    else {
      url = ''
      load()
    }
  }
</script>

<header>
  <h1><a href="/" onclick={go}>Impact Consensus</a></h1>
  {#if memberId}
    <button class="link" onclick={() => (modal = 'profile')}>{profile?.nickname ?? user.email}</button>
    <button class="link muted" onclick={() => supabase.auth.signOut()}>Sign out</button>
  {:else}
    <button class="link" onclick={() => (modal = 'signin')}>Sign in</button>
  {/if}
</header>

<main>
  {#if error}<p class="error">{error}</p>{/if}

  {#if detailId}
    {#if detail}
      <Detail article={detail} {user} canPost={canPostNow} onvote={(s) => vote(detail, s)} onjoin={canPost} onchange={load} />
    {:else if loaded}
      <p class="muted empty">Article not found. <a href="/" onclick={go}>Back to all articles</a></p>
    {/if}
  {:else}
    <section class="card compose">
      <form class="add" onsubmit={add}>
        <input type="url" required placeholder="Share an article link…" bind:value={url} />
        <button type="submit">Post</button>
      </form>
    </section>

    {#each articles as article (article.id)}
      <Article {article} {user} canPost={canPostNow} onvote={(s) => vote(article, s)} onjoin={canPost} onchange={load} />
    {:else}
      {#if loaded}<p class="muted empty">No articles yet. Add the first one.</p>{/if}
    {/each}
  {/if}
</main>

{#if modal === 'signin' || modal === 'limit'}
  <SignIn
    anonymous={!!user?.is_anonymous}
    reason={modal === 'limit' ? `You've used your ${FREE_VOTES} free votes this hour. Create an account to keep voting; your votes come with you.` : ''}
    onclose={() => (modal = null)}
  />
{:else if modal === 'profile' && memberId}
  <Profile {profile} userId={memberId} onsaved={(p) => (profile = p)} onclose={() => (modal = null)} />
{/if}
