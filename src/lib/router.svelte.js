export const route = $state({ path: location.pathname })

addEventListener('popstate', () => (route.path = location.pathname))

// Click handler for internal links; lets modified clicks open new tabs as usual.
export function go(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
  e.preventDefault()
  history.pushState(null, '', e.currentTarget.getAttribute('href'))
  route.path = location.pathname
  scrollTo(0, 0)
}
