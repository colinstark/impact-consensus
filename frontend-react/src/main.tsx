import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './lib/auth'
import { I18nProvider } from './lib/i18n'
import { VotesProvider } from './lib/votes'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <VotesProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </VotesProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
