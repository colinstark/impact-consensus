export async function shareLink(title: string, path: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = location.origin + path
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
