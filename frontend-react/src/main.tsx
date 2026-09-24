import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './lib/auth'
import { CityProvider } from './lib/city'
import { FriendsProvider } from './lib/friends'
import { I18nProvider } from './lib/i18n'
import { ProfileProvider } from './lib/profile'
import { VotesProvider } from './lib/votes'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <CityProvider>
            <ProfileProvider>
              <VotesProvider>
                <FriendsProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </FriendsProvider>
              </VotesProvider>
            </ProfileProvider>
          </CityProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
