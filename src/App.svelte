<script>
  import { supabase } from './lib/supabase.js'
  import SignIn from './lib/SignIn.svelte'
  import Article from './lib/Article.svelte'

  let user = $state(null)
  let articles = $state([])
  let signingIn = $state(false)
  let url = $state('')
  let error = $state('')

  supabase.auth.getSession().then(({ data }) => (user = data.session?.user ?? null))
  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null
    if (user) signingIn = false
  })

  async function load() {
    const { data, error: err } = await supabase
      .from('articles')
      .select('*, votes(stance, user_id), article_context(*)')
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'article_context' })
    if (err) error = err.message
    else articles = data
  }

  load()
  supabase.channel('feed').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe()

  // Opens the sign-in modal when signed out; returns whether the action may proceed.
  function gate() {
    if (!user) signingIn = true
    return !!user
  }

  async function add(e) {
    e.preventDefault()
    if (!gate()) return
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
  <h1>Impact Consensus</h1>
  {#if user}
    <span class="muted">{user.email}</span>
    <button class="link" onclick={() => supabase.auth.signOut()}>Sign out</button>
  {:else}
    <button class="link" onclick={() => (signingIn = true)}>Sign in</button>
  {/if}
</header>

<main>
  <form class="add" onsubmit={add}>
    <input type="url" required placeholder="Paste an article link…" bind:value={url} />
    <button type="submit">Add</button>
  </form>
  {#if error}<p class="error">{error}</p>{/if}

  {#each articles as article (article.id)}
    <Article {article} {user} {gate} onchange={load} />
  {:else}
    <p class="muted empty">No articles yet. Add the first one.</p>
  {/each}
</main>

{#if signingIn}
  <SignIn onclose={() => (signingIn = false)} />
{/if}
