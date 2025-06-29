import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LanguageSwitcher, LogoutButton } from '@components/app-components'
import { Translations } from '@providers'

import './i18n/config'

import { AuthConfig, AuthProvider, GuardProvider, ProtectedRoute, useAuth } from './auth'
import { NavigationDebug } from './auth/NavigationDebug.tsx'
import { Home } from './pages/home'
import { SignIn } from './pages/signIn/SignIn.tsx'
import { Core } from './providers/core/Core.tsx'
import { NotificationsProvider } from './providers/notifications/NotificationsProvider.tsx'
import { ThemeProvider } from './providers/theme'

import style from './App.module.css'

// Временный компонент профиля
const ProfilePage = () => {
  const { t } = useTranslation()

  return (
    <div className={style.app}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #eee',
        }}
      >
        <h1>Профиль</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        <h2>Добро пожаловать в ваш профиль!</h2>
        <p>Это защищенная страница - вы видите её только после авторизации.</p>
      </main>
    </div>
  )
}

const authConfig: Partial<AuthConfig> = {
  redirects: {
    afterSignIn: '/', // После входа - на главную ПО УМОЛЧАНИЮ
    afterSignOut: '/signin', // После выхода - на страницу входа
    whenUnauthenticated: '/signin', // Неавторизованных - на страницу входа
    // onAccessDenied: '/access-denied'          // ← Куда перенаправлять при отказе в доступе
  },
  autoRedirect: true,
  providers: ['google'],

  // Указываем страницы авторизации (чтобы не сохранять их в callback)
  authPages: ['/signin', '/signup'],
  // guards: {                  // ← Настройки для Guards системы
  //   enabled: true,           // ← Включить Guards (для сложных правил доступа)
  //   globalTimeout: 5000,     // ← Таймаут для асинхронных проверок (API запросы)
  //   fallback: 'component'    // ← Что показывать при отказе: 'component' или 'redirect'
  // }
}

const App = () => {
  return (
    <Translations>
      <ThemeProvider contextProps={{ theme: 'default' }}>
        <NotificationsProvider>
          <BrowserRouter>
            <NavigationDebug />
            <AuthProvider config={authConfig}>
              <Core>
                <GuardProvider>
                  <Routes>
                    <Route path="/signin" element={<SignIn />} />
                    <Route
                      index
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </GuardProvider>
              </Core>
            </AuthProvider>
          </BrowserRouter>
        </NotificationsProvider>
      </ThemeProvider>
    </Translations>
  )
}

export default App
