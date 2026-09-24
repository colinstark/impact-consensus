<script>
  import { Spring } from 'svelte/motion'

  let { agree, disagree, mine, onvote } = $props()

  const SIZE = 72
  const R = 24 // radius of a unanimous bubble; area scales with vote share
  const GAP = 2

  const total = $derived(agree + disagree)

  function layout(a) {
    const [big, small] = a >= 0.5 ? [['agree', a], ['disagree', 1 - a]] : [['disagree', 1 - a], ['agree', a]]
    const rb = R * Math.sqrt(big[1])
    const rs = R * Math.sqrt(small[1])
    // Near-even splits sit side by side; lopsided ones tuck the minority down-right.
    const angle = (Math.PI / 4) * Math.min(1, Math.max(0, (0.85 - rs / rb) / 0.25))
    const d = rs ? rb + rs + GAP : 0
    const sx = d * Math.cos(angle)
    const sy = d * Math.sin(angle)
    // Center the pair's bounding box in the viewBox.
    const ox = SIZE / 2 - (Math.min(-rb, sx - rs) + Math.max(rb, sx + rs)) / 2
    const oy = SIZE / 2 - (Math.min(-rb, sy - rs) + Math.max(rb, sy + rs)) / 2
    return {
      [big[0]]: { x: ox, y: oy, r: rb },
      [small[0]]: { x: ox + sx, y: oy + sy, r: rs },
    }
  }

  // Start at the target positions with zero radius so bubbles pop in on mount.
  const pop = (g) => ({ agree: { ...g.agree, r: 0 }, disagree: { ...g.disagree, r: 0 } })
  const target = $derived(layout(total ? agree / total : 0.5))
  const spring = new Spring(pop(target), { stiffness: 0.12, damping: 0.32 })
  $effect(() => {
    spring.target = target
  })

  // Bump the chosen bubble so a vote registers even when the split doesn't move (e.g. unanimous).
  function vote(kind) {
    const casting = mine !== kind
    if (onvote(kind) && casting) {
      spring.target = { ...target, [kind]: { ...target[kind], r: Math.max(target[kind].r * 1.25, 8) } }
      setTimeout(() => (spring.target = target), 140)
    }
  }
</script>

<svg class="tally" class:unvoted={!total} viewBox="0 0 {SIZE} {SIZE}" width={SIZE} height={SIZE} role="group" aria-label="{agree} agree, {disagree} disagree">
  <title>{agree} agree · {disagree} disagree</title>
  {#each ['agree', 'disagree'] as kind}
    {@const b = spring.current[kind]}
    <circle
      class={kind}
      class:mine={mine === kind}
      cx={b.x}
      cy={b.y}
      r={Math.max(0, b.r)}
      role="button"
      tabindex="0"
      aria-label={kind === 'agree' ? 'Agree' : 'Disagree'}
      aria-pressed={mine === kind}
      onclick={() => vote(kind)}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), vote(kind))}
    />
  {/each}
</svg>
