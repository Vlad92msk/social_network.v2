import { SignIn } from '@pages/signIn/SignIn.tsx'
import { GuardProvider, ProtectedRoute } from './auth'
import { AuthConfig } from './auth'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher, LogoutButton } from '@components/ui'
import { Translations } from '@providers/translations'
import { AuthProvider, useAuth } from './auth'
import './i18n/config'
import { Link } from 'react-router-dom'
import style from './App.module.css'
import { NavigationDebug } from './auth/NavigationDebug.tsx'

// Временный компонент профиля
const ProfilePage = () => {
  const { t } = useTranslation()

  return (
    <div className={style.app}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #eee'
      }}>
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

// Публичная главная страница
const HomePage = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Главная</h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">
                  {user?.name || user?.email}
                </span>
              </div>

              <button
                onClick={signOut}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Добро пожаловать, {user?.name || user?.email}! 👋
          </h2>
          <p className="text-gray-600">
            Вы авторизованы через <span className="font-medium">{user?.provider}</span>
          </p>
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/profile"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-xl">👤</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Профиль</h3>
            </div>
            <p className="text-gray-600">
              Управление настройками аккаунта и личной информацией
            </p>
          </Link>

          <Link
            to="/dashboard"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Панель управления</h3>
            </div>
            <p className="text-gray-600">
              Аналитика, статистика и основные метрики
            </p>
          </Link>

          <Link
            to="/settings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Настройки</h3>
            </div>
            <p className="text-gray-600">
              Конфигурация приложения и пользовательские предпочтения
            </p>
          </Link>

          <Link
            to="/projects"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Проекты</h3>
            </div>
            <p className="text-gray-600">
              Управление проектами и рабочими пространствами
            </p>
          </Link>

          <Link
            to="/team"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <span className="text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Команда</h3>
            </div>
            <p className="text-gray-600">
              Участники команды и управление доступами
            </p>
          </Link>

          <Link
            to="/help"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <span className="text-xl">❓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Помощь</h3>
            </div>
            <p className="text-gray-600">
              Документация, FAQ и техническая поддержка
            </p>
          </Link>
        </div>

        {/* User info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация об аккаунте</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Имя:</span>
                <p className="text-gray-900">{user?.name || 'Не указано'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Провайдер:</span>
                <p className="text-gray-900 capitalize">{user?.provider}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email подтвержден:</span>
                <p className="text-gray-900">
                  {user?.emailVerified ? (
                    <span className="text-green-600">✅ Да</span>
                  ) : (
                    <span className="text-red-600">❌ Нет</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const authConfig: Partial<AuthConfig> = {
  redirects: {
    afterSignIn: '/',              // После входа - на главную ПО УМОЛЧАНИЮ
    afterSignOut: '/signin',       // После выхода - на страницу входа
    whenUnauthenticated: '/signin', // Неавторизованных - на страницу входа
    // onAccessDenied: '/access-denied'          // ← Куда перенаправлять при отказе в доступе
  },
  autoRedirect: true,
  providers: ['google', 'email'],

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
    <BrowserRouter>
      <NavigationDebug />
      <AuthProvider config={authConfig}>
        <GuardProvider>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          </Routes>
        </GuardProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
