<script>
  let { stance, mine, onvote } = $props()
</script>

<button class="vote {stance}" class:on={mine === stance} aria-pressed={mine === stance} onclick={() => onvote(stance)}>
  {stance === 'agree' ? 'Agree' : 'Disagree'}
</button>
