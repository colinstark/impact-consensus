// Anonymous, per-browser id so one person = one vote without an account.
const KEY = 'placa.device'

export function deviceId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

// Remember where someone came from (?src=qr-rambla-01) for the session.
export function entrySource(): string | undefined {
  const src = new URLSearchParams(location.search).get('src')
  if (src) sessionStorage.setItem('placa.src', src)
  return sessionStorage.getItem('placa.src') ?? undefined
}
