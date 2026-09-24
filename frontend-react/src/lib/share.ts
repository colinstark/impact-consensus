export async function shareTopic(title: string, slug: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = `${location.origin}/t/${slug}`
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
