
import { Translations } from '@providers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GuardProvider, ProtectedRoute } from './auth'
import { AuthConfig } from './auth'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AuthProvider, useAuth } from './auth'
import './i18n/config'
import style from './App.module.css'
import { NavigationDebug } from './auth/NavigationDebug.tsx'
import { LanguageSwitcher, LogoutButton } from './components/ui'
import { SignIn } from './pages/signIn/SignIn.tsx'
import { Core } from './providers/core/Core.tsx'
import { ThemeProvider } from './providers/theme'

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


type Pokemon = {
  id: number
  name: string
  height: number
  weight: number
  sprites: {
    front_default: string
  }
}

type ApiState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

// Простой хук для получения покемона
const usePokemon = (pokemonName: string) => {
  const [state, setState] = useState<ApiState<Pokemon>>({
    data: null,
    loading: false,
    error: null
  })

  useEffect(() => {
    if (!pokemonName) return

    const fetchPokemon = async () => {
      setState({ data: null, loading: true, error: null })

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)

        if (!response.ok) {
          throw new Error(`Pokemon не найден: ${response.status}`)
        }

        const pokemon: Pokemon = await response.json()
        setState({ data: pokemon, loading: false, error: null })
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        })
      }
    }

    fetchPokemon()
  }, [pokemonName])

  return state
}

// Публичная главная страница
const HomePage = () => {
  // const { user, signOut } = useAuth()
  const [pokemonName, setPokemonName] = useState('pikachu')
  // const { data: pokemon, loading, error } = usePokemon(pokemonName)


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow"> */}
      {/*   <div className="max-w-6xl mx-auto px-4 py-4"> */}
      {/*     <div className="flex justify-between items-center"> */}
      {/*       <h1 className="text-2xl font-bold text-gray-900">Главная</h1> */}

      {/*       <div className="flex items-center space-x-4"> */}
      {/*         <div className="flex items-center space-x-3"> */}
      {/*           {user?.avatar && ( */}
      {/*             <img */}
      {/*               src={user.avatar} */}
      {/*               alt="Avatar" */}
      {/*               className="w-8 h-8 rounded-full" */}
      {/*             /> */}
      {/*           )} */}
      {/*           <span className="text-sm text-gray-700"> */}
      {/*             {user?.name || user?.email} */}
      {/*           </span> */}
      {/*         </div> */}

      {/*         <button */}
      {/*           onClick={signOut} */}
      {/*           className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors" */}
      {/*         > */}
      {/*           Выйти */}
      {/*         </button> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </div> */}
      {/*   <input value={pokemonName} onChange={(event) => setPokemonName(event.target.value)} /> */}
      {/* </header> */}

      {/* /!* Main content *!/ */}
      {/* <main> */}
      {/*   <div> */}
      {/*     <h2> */}
      {/*       Добро пожаловать, {user?.name || user?.email}! 👋 */}
      {/*     </h2> */}
      {/*     <p> */}
      {/*       Вы авторизованы через <span >{user?.provider}</span> */}
      {/*     </p> */}
      {/*   </div> */}
      {/* </main> */}
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
        <BrowserRouter>
          <NavigationDebug />
          <AuthProvider config={authConfig}>
            <Core>
              <GuardProvider>
                <Routes>
                  <Route path="/signin" element={<SignIn />} />
                  <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                </Routes>
              </GuardProvider>
            </Core>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Translations>
  )
}

export default App
