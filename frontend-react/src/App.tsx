import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useCity } from './lib/city'
import About from './pages/About'
import CityPicker from './pages/CityPicker'
import Home from './pages/Home'
import InsightsPage from './pages/InsightsPage'
import { Privacy, Terms } from './pages/Legal'
import NewProposal from './pages/NewProposal'
import NotFound from './pages/NotFound'
import ProposalsPage from './pages/ProposalsPage'
import SignIn from './pages/SignIn'
import TopicPage from './pages/TopicPage'

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
      <Route path="/t/:slug/insights" element={<InsightsPage />} />
      {/* Older links: the barrio map and trend now live on the insights page. */}
      <Route path="/t/:slug/trend" element={<ToInsights />} />
      <Route path="/t/:slug/barrios" element={<ToInsights />} />
      <Route path="/proposals" element={needsCity(<ProposalsPage />)} />
      <Route path="/proposals/new" element={needsCity(<NewProposal />)} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function ToInsights() {
  const { slug } = useParams()
  return <Navigate to={`/t/${slug}/insights`} replace />
}
