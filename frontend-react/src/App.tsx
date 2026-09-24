import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useCity } from './lib/city'
import About from './pages/About'
import BarrioPage from './pages/BarrioPage'
import CityPicker from './pages/CityPicker'
import Home from './pages/Home'
import NewProposal from './pages/NewProposal'
import NotFound from './pages/NotFound'
import ProposalsPage from './pages/ProposalsPage'
import SignIn from './pages/SignIn'
import TopicPage from './pages/TopicPage'
import TrendPage from './pages/TrendPage'

export default function App() {
  const { pathname } = useLocation()
  const { city } = useCity()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // First visit: ask for a city. QR deep links (/t/...) skip this; the topic sets the city.
  const needsCity = (el: React.ReactElement) =>
    city ? el : <Navigate to={`/city?next=${encodeURIComponent(pathname)}`} replace />

  return (
    <Routes>
      <Route path="/" element={needsCity(<Home />)} />
      <Route path="/city" element={<CityPicker />} />
      <Route path="/t/:slug" element={<TopicPage />} />
      <Route path="/t/:slug/trend" element={<TrendPage />} />
      <Route path="/t/:slug/barrios" element={<BarrioPage />} />
      <Route path="/proposals" element={needsCity(<ProposalsPage />)} />
      <Route path="/proposals/new" element={needsCity(<NewProposal />)} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
