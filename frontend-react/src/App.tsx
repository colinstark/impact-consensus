import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import About from './pages/About'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import SignIn from './pages/SignIn'
import TopicPage from './pages/TopicPage'
import TrendPage from './pages/TrendPage'

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/t/:slug" element={<TopicPage />} />
      <Route path="/t/:slug/trend" element={<TrendPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
