export interface City {
  id: string
  name: string
  available: boolean
}

// Only Barcelona is live for the MVP; the rest show as "coming soon".
export const CITIES: City[] = [
  { id: 'barcelona', name: 'Barcelona', available: true },
  { id: 'madrid', name: 'Madrid', available: false },
  { id: 'valencia', name: 'València', available: false },
  { id: 'sevilla', name: 'Sevilla', available: false },
  { id: 'bilbao', name: 'Bilbao', available: false },
]

export const cityName = (id: string) => CITIES.find((c) => c.id === id)?.name ?? id
