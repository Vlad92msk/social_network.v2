# 🔐 Universal Auth System

Универсальная система авторизации для React приложений с поддержкой множественных провайдеров, Guards системы и TypeScript.

## 📋 Возможности

- ✅ **Множественные провайдеры**: Firebase (Google, Email, GitHub, Microsoft, Apple, etc.) + внешние (Auth0, Okta, Supabase)
- ✅ **TypeScript типизация** с полной поддержкой типов
- ✅ **Guards система** - гибкий контроль доступа к маршрутам
- ✅ **Конфигурируемые редиректы** и обработка ошибок
- ✅ **Защищенные маршруты** с множественными уровнями защиты
- ✅ **Надежная логика возврата** на предыдущую страницу
- ✅ **Дополнительные хуки** (роли, права, таймеры сессии)
- ✅ **Масштабируемая архитектура** с поддержкой плагинов

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install firebase react-router-dom
npm install -D @types/react @types/react-dom
```

### 2. Настройка окружения

Создайте `.env` файл:

```env
# Firebase (обязательно)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. Базовая настройка приложения

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  AuthProvider,
  GuardProvider,
  ProtectedRoute,
  type AuthConfig
} from './auth'

const authConfig: Partial<AuthConfig> = {
  redirects: {
    afterSignIn: '/',
    afterSignOut: '/signin',
    whenUnauthenticated: '/signin',
    onAccessDenied: '/access-denied'
  },
  autoRedirect: true,
  providers: ['google', 'email'], // Добавь провайдеры которые активировал в Firebase Console
  authPages: ['/signin', '/signup', '/access-denied'],
  guards: {
    enabled: true,
    globalTimeout: 5000
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <GuardProvider>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* Простая защита - только авторизованные */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* С guards системой */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute guards={[
                  {
                    id: 'auth',
                    guard: ({ isAuthenticated }) => ({
                      allowed: isAuthenticated,
                      reason: 'Требуется авторизация'
                    }),
                    required: true
                  },
                  {
                    id: 'admin-role',
                    guard: ({ user }) => ({
                      allowed: user?.roles?.includes('admin') || false,
                      reason: 'Требуются права администратора'
                    }),
                    required: true
                  }
                ]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </GuardProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### 4. Создание компонента авторизации

```tsx
// SignIn1.tsx
import { useAuthActions } from './auth'

function SignInPage() {
  const {
    handleGoogleSignIn,
    handleEmailSignIn,
    formData,
    handleInputChange,
    isLoading,
    error,
    availableProviders
  } = useAuthActions()

  return (
    <div>
      {error && <div>Ошибка: {error}</div>}

      {/* Google кнопка - показывается только если провайдер активен */}
      {availableProviders.google && (
        <button onClick={handleGoogleSignIn} disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Войти через Google'}
        </button>
      )}

      {/* Email форма - показывается только если email провайдер активен */}
      {availableProviders.email && (
        <form onSubmit={handleEmailSignIn}>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
          />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Пароль"
          />
          <button type="submit" disabled={isLoading}>
            Войти
          </button>
        </form>
      )}
    </div>
  )
}
```

### 5. Использование в компонентах

```tsx
// Любой компонент
import { useAuth, useRole } from './auth'

function UserProfile() {
  const {
    user,
    isAuthenticated,
    isLoading,
    signOut
  } = useAuth()

  const { hasRole } = useRole()

  if (isLoading) return <div>Загрузка...</div>
  if (!isAuthenticated) return <div>Не авторизован</div>

  return (
    <div>
      <h1>Привет, {user?.name}!</h1>
      <p>Email: {user?.email}</p>

      {hasRole('admin') && (
        <button>Админ панель</button>
      )}

      <button onClick={signOut}>Выйти</button>
    </div>
  )
}
```

## 🛡️ Guards Система

### Что такое Guards?

Guards - это функции, которые определяют может ли пользователь получить доступ к маршруту. Каждый guard получает контекст и возвращает результат проверки.

```typescript
type Guard = (context: GuardContext) => GuardResult | Promise<GuardResult>

interface GuardContext {
  user: User | null          // Данные пользователя из AuthProvider
  isAuthenticated: boolean   // Статус авторизации
  route: {                   // Информация о текущем маршруте
    pathname: string
    params: Record<string, string | undefined>
    search: string
    state?: any
  }
  data?: Record<string, any> // Данные из GuardProvider (для оптимизации)
}

interface GuardResult {
  allowed: boolean              // Разрешен ли доступ
  reason?: string              // Причина отказа (если allowed: false)
  metadata?: Record<string, any> // Дополнительные данные
}
```

### 🎯 Типы Guards

**1. Inline Guards** - создаются прямо в компоненте:
```tsx
{
  id: 'custom',
  guard: ({ user }) => ({
    allowed: user?.verified === true,
    reason: 'Требуется подтвержденный аккаунт'
  }),
  required: true
}
```

**2. Готовые Guards** - базовые примеры для частых случаев:
```tsx
import { authGuard, roleGuard, ownerGuard } from './auth/guards'
```

**3. Кастомные Guards** - создаете под свой проект:
```tsx
export const subscriptionGuard = (plan: string): Guard => ({ user }) => ({
  allowed: user?.subscription === plan,
  reason: `Требуется подписка: ${plan}`
})
```

### 🚀 Быстрые примеры

```tsx
// Простая авторизация
<ProtectedRoute guards={[
  {
    id: 'auth',
    guard: ({ isAuthenticated }) => ({
      allowed: isAuthenticated,
      reason: 'Требуется авторизация'
    }),
    required: true
  }
]}>
  <PrivatePage />
</ProtectedRoute>

// Проверка данных пользователя
<ProtectedRoute guards={[
  {
    id: 'verified',
    guard: ({ user }) => ({
      allowed: user?.emailVerified === true,
      reason: 'Подтвердите email'
    }),
    required: true
  }
]}>
  <VerifiedOnlyPage />
</ProtectedRoute>

// Асинхронная проверка
<ProtectedRoute guards={[
  {
    id: 'subscription',
    guard: async ({ user }) => {
      const sub = await checkSubscription(user?.id)
      return {
        allowed: sub?.active === true,
        reason: 'Требуется активная подписка'
      }
    },
    required: true,
    timeout: 3000 // Таймаут для async guard
  }
]}>
  <PremiumFeature />
</ProtectedRoute>
```

### 📚 Готовые Guards (примеры)

**⚠️ Важно:** Это примеры базовых guards. В вашем проекте создавайте свои!

```tsx
import { 
  authGuard,           // Проверка авторизации
  roleGuard,           // Проверка роли (если есть user.roles)
  permissionGuard,     // Проверка прав (если есть user.permissions)
  ownerGuard,          // Проверка владельца по route.params
  createAuthGuardConfig,
  createRoleGuardConfig
} from './auth/guards'

// Использование готовых guards
<ProtectedRoute guards={[
  createAuthGuardConfig(),
  createRoleGuardConfig('admin')
]}>
  <AdminPanel />
</ProtectedRoute>
```

**Примечание:** `roleGuard` и `permissionGuard` работают только если вы добавили `roles` и `permissions` в объект `User`. По умолчанию эти поля не заполняются.

### 🛠️ Создание кастомных Guards

**Каждый проект уникален!** Создавайте guards под свои бизнес-требования:

```tsx
// E-commerce проект
export const cartNotEmptyGuard: Guard = ({ data }) => ({
  allowed: (data?.cart?.items?.length || 0) > 0,
  reason: 'Корзина пуста'
})

export const minimumOrderGuard = (minAmount: number): Guard => 
  ({ data }) => ({
    allowed: (data?.cart?.total || 0) >= minAmount,
    reason: `Минимальная сумма заказа: ${minAmount}₽`
  })

// SaaS приложение
export const subscriptionGuard = (plan: string): Guard => 
  async ({ user }) => {
    try {
      const subscription = await api.checkSubscription(user?.id)
      return {
        allowed: subscription?.plan === plan && subscription?.active,
        reason: `Требуется активная подписка: ${plan}`,
        metadata: { subscription }
      }
    } catch (error) {
      return {
        allowed: false,
        reason: 'Не удалось проверить подписку'
      }
    }
  }

// Социальная сеть
export const friendshipGuard = (): Guard => 
  async ({ user, route, data }) => {
    const targetUserId = route.params.userId
    const friendships = data?.friendships || []
    
    const isFriend = friendships.some(f => 
      f.userId === user?.id && f.friendId === targetUserId
    )
    
    return {
      allowed: isFriend,
      reason: 'Доступ только для друзей'
    }
  }

// Образовательная платформа
export const courseEnrolledGuard = (courseId: string): Guard =>
  async ({ user }) => {
    const enrollment = await checkEnrollment(user?.id, courseId)
    return {
      allowed: enrollment?.active || false,
      reason: 'Вы не записаны на этот курс',
      metadata: { enrollment }
    }
  }

// Бизнес-правила
export const businessHoursGuard: Guard = ({ user }) => {
  const hour = new Date().getHours()
  const isAdmin = user?.roles?.includes('admin')
  
  return {
    allowed: (hour >= 9 && hour <= 18) || isAdmin,
    reason: 'Доступ только в рабочие часы (9:00-18:00)'
  }
}

// География
export const geoGuard = (allowedCountries: string[]): Guard =>
  async ({ user }) => {
    const country = await detectUserCountry()
    return {
      allowed: allowedCountries.includes(country),
      reason: 'Сервис недоступен в вашем регионе',
      metadata: { userCountry: country, allowedCountries }
    }
  }
```

## 🌐 GuardProvider и глобальные настройки

### Настройка GuardProvider

`GuardProvider` позволяет настроить глобальные параметры для всех Guards в приложении:

```tsx
import { GuardProvider } from './auth'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <GuardProvider config={{
          // Глобальный компонент для отказа в доступе
          accessDeniedComponent: <GlobalAccessDenied />,
          
          // Глобальная страница для отказа в доступе
          accessDeniedPage: '/access-denied',
          
          // Глобальная обработка событий отказа
          onAccessDenied: (reason, metadata) => {
            analytics.track('access_denied', { reason, metadata })
            toast.error(`Доступ запрещен: ${reason}`)
          },
          
          // Глобальный таймаут для всех guards (мс)
          defaultTimeout: 5000,
          
          // Логирование guard данных (для отладки)
          enableLogging: process.env.NODE_ENV === 'development',
          logPrefix: '[🛡️ Guards]'
        }}>
          <Routes>
            {/* Ваши маршруты */}
          </Routes>
        </GuardProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### 🎯 Приоритет обработки отказа в доступе

Система обрабатывает отказ в доступе по следующему приоритету (от высшего к низшему):

1. **Guard уровень** - `guard.accessDeniedComponent` / `guard.accessDeniedPage`
2. **Route уровень** - `ProtectedRoute` пропы
3. **GuardProvider уровень** - глобальные настройки
4. **AuthProvider уровень** - `config.redirects.onAccessDenied`
5. **Fallback** - редирект на главную

```tsx
// 1. Guard уровень (высший приоритет)
<ProtectedRoute guards={[
  {
    id: 'subscription',
    guard: subscriptionGuard,
    accessDeniedComponent: <SubscriptionRequired /> // ← Приоритет 1
  }
]}>
  <PremiumFeature />
</ProtectedRoute>

// 2. Route уровень
<ProtectedRoute 
  guards={[authGuard]}
  accessDeniedComponent={<CustomAccessDenied />} // ← Приоритет 2
>
  <SpecialPage />
</ProtectedRoute>

// 3. GuardProvider уровень (используется по умолчанию)
<ProtectedRoute guards={[authGuard]}>
  <PrivatePage />
  {/* Покажется GlobalAccessDenied из GuardProvider */}
</ProtectedRoute>
```

### 📱 Примеры глобальных компонентов

```tsx
// Простой глобальный компонент
function GlobalAccessDenied() {
  const location = useLocation()
  const reason = location.state?.reason || 'Доступ запрещен'
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
        <p className="text-gray-600 mb-6">{reason}</p>
        <div className="space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Назад
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  )
}

// Продвинутый компонент с разными типами ошибок
function SmartAccessDenied() {
  const location = useLocation()
  const { reason, failedGuards, metadata } = location.state || {}
  
  // Определяем тип ошибки по failedGuards
  const errorType = failedGuards?.[0]?.id || 'unknown'
  
  switch (errorType) {
    case 'auth':
      return <AuthRequired />
    case 'subscription':
      return <SubscriptionRequired plan={metadata?.requiredPlan} />
    case 'role':
      return <InsufficientRole role={metadata?.requiredRole} />
    default:
      return <GenericAccessDenied reason={reason} />
  }
}
```

### 🔧 Динамическое изменение настроек

```tsx
import { useGuardData } from './auth'

function AdminControls() {
  const { updateGlobalConfig, globalConfig } = useGuardData()
  
  const enableStrictMode = () => {
    updateGlobalConfig({
      accessDeniedComponent: <StrictAccessDenied />,
      onAccessDenied: (reason, metadata) => {
        // Строгое логирование
        console.error('STRICT MODE:', reason, metadata)
        sendSecurityAlert({ reason, metadata, timestamp: Date.now() })
      },
      defaultTimeout: 3000 // Более строгие таймауты
    })
  }
  
  const enableDevMode = () => {
    updateGlobalConfig({
      enableLogging: true,
      logPrefix: '[🔧 DEV]',
      accessDeniedComponent: <DevAccessDenied />
    })
  }
  
  return (
    <div>
      <h3>Режимы Guards</h3>
      <button onClick={enableStrictMode}>Строгий режим</button>
      <button onClick={enableDevMode}>Режим разработки</button>
      
      <div>
        Текущие настройки:
        <pre>{JSON.stringify(globalConfig, null, 2)}</pre>
      </div>
    </div>
  )
}
```

### 🌍 Условная конфигурация по окружению

```tsx
function App() {
  const guardConfig = useMemo(() => {
    // Development окружение
    if (process.env.NODE_ENV === 'development') {
      return {
        accessDeniedComponent: <DevAccessDenied />,
        enableLogging: true,
        logPrefix: '[🔧 DEV Guards]',
        defaultTimeout: 10000 // Больше времени для отладки
      }
    }
    
    // Admin поддомен
    if (window.location.hostname.includes('admin')) {
      return {
        accessDeniedComponent: <AdminAccessDenied />,
        onAccessDenied: (reason, metadata) => {
          sendAdminAlert({ reason, metadata, user: getCurrentUser() })
        },
        defaultTimeout: 3000 // Строже для админки
      }
    }
    
    // Production окружение
    return {
      accessDeniedComponent: <GlobalAccessDenied />,
      onAccessDenied: (reason) => {
        analytics.track('access_denied', { reason })
      },
      enableLogging: false,
      defaultTimeout: 5000
    }
  }, [])

  return (
    <GuardProvider config={guardConfig}>
      {/* Маршруты */}
    </GuardProvider>
  )
}
```

### 📊 Работа с Guard Data

`GuardProvider` также управляет данными для Guards:

```tsx
import { useGuardData } from './auth'

function DataLoader() {
  const { setGuardData, getGuardData, clearGuardData } = useGuardData()
  const { userId } = useParams()
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Загружаем все данные одним запросом
        const [profile, permissions, subscription] = await Promise.all([
          api.fetchProfile(userId),
          api.fetchPermissions(userId),
          api.fetchSubscription(userId)
        ])
        
        // Сохраняем для всех Guards
        setGuardData('profile', profile)
        setGuardData('permissions', permissions)
        setGuardData('subscription', subscription)
        
      } catch (error) {
        console.error('Ошибка загрузки данных для Guards:', error)
        // Очищаем данные при ошибке
        clearGuardData()
      }
    }
    
    loadUserData()
  }, [userId, setGuardData, clearGuardData])
  
  return null // Компонент только для загрузки данных
}

// Использование данных в Guards
<ProtectedRoute guards={[
  {
    id: 'profile-access',
    guard: ({ user, data }) => {
      const profile = data?.profile
      const permissions = data?.permissions
      
      return {
        allowed: profile?.ownerId === user?.id || permissions?.includes('view_profile'),
        reason: 'Нет доступа к профилю'
      }
    }
  }
]}>
  <UserProfile />
</ProtectedRoute>
```

### 🚨 Отладка Guards

При включенном логировании вы увидите полезную информацию:

```typescript
// В GuardProvider config
{
  enableLogging: true,
  logPrefix: '[🛡️ Guards]'
}

// В консоли браузера:
// [🛡️ Guards] Set: profile { id: '123', name: 'John' }
// [🛡️ Guards] Get: profile { id: '123', name: 'John' }
// [🛡️ Guards] Clear all data
```

### 💡 Лучшие практики

1. **Глобальные настройки** - используйте для общих случаев
2. **Route переопределения** - для специфичных страниц
3. **Guard переопределения** - для конкретных бизнес-правил
4. **Условная конфигурация** - разные настройки для dev/prod
5. **Централизованное логирование** - включайте в development
6. **Аналитика** - отслеживайте отказы в доступе
7. **Очистка данных** - не забывайте очищать Guard Data при размонтировании

### ⚡ Оптимизация Guards с GuardData

**Важно!** Не делайте API запросы в каждом guard. Загружайте данные заранее:

```tsx
// ❌ Плохо - медленные запросы в guards
export const expensiveGuard: Guard = async ({ user }) => {
  const userData = await api.fetchUserData(user?.id) // Медленно!
  return { allowed: userData.hasAccess }
}

// ✅ Хорошо - загружаем данные заранее
import { useGuardData } from './auth'

function ProfilePage() {
  const { userId } = useParams()
  const { setGuardData } = useGuardData()

  useEffect(() => {
    const loadData = async () => {
      // Загружаем все необходимые данные один раз
      const [profile, permissions, subscription] = await Promise.all([
        api.fetchProfile(userId),
        api.fetchPermissions(userId),
        api.fetchSubscription(userId)
      ])

      // Сохраняем для guards
      setGuardData('profile', profile)
      setGuardData('permissions', permissions)
      setGuardData('subscription', subscription)
    }

    loadData()
  }, [userId, setGuardData])

  return (
    <ProtectedRoute guards={[
      {
        id: 'profile-access',
        guard: ({ user, data }) => {
          const profile = data?.profile
          const permissions = data?.permissions

          const isOwner = profile?.id === user?.id
          const hasPermission = permissions?.includes('view_profile')

          return {
            allowed: isOwner || hasPermission,
            reason: 'Нет доступа к профилю'
          }
        }
      },
      {
        id: 'subscription-check',
        guard: ({ data }) => {
          const subscription = data?.subscription
          return {
            allowed: subscription?.active === true,
            reason: 'Требуется активная подписка'
          }
        }
      }
    ]}>
      <Profile />
    </ProtectedRoute>
  )
}
```

### 🔄 Логика выполнения Guards

Guards разделяются на **обязательные** (`required: true`) и **опциональные** (`required: false`):

```tsx
// ВСЕ обязательные должны пройти
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },      // ✅ Должен пройти
  { id: 'verified', guard: verifiedGuard, required: true } // ✅ Должен пройти
]}>
  <SecurePage />
</ProtectedRoute>

// ХОТЯ БЫ ОДИН опциональный должен пройти
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },        // ✅ Должен пройти
  { id: 'owner', guard: ownerGuard, required: false },     // ✅ ИЛИ этот
  { id: 'moderator', guard: moderatorGuard, required: false } // ✅ ИЛИ этот
]}>
  <EditPostPage />
</ProtectedRoute>
```

### Кастомная обработка отказа

```tsx
<ProtectedRoute guards={[
  {
    id: 'premium',
    guard: ({ user }) => ({
      allowed: user?.subscription === 'premium',
      reason: 'Требуется Premium подписка'
    }),
    required: true,
    // Показать кастомный компонент при отказе
    accessDeniedComponent: (
      <div>
        <h3>Требуется Premium подписка</h3>
        <button>Оформить подписку</button>
      </div>
    ),
    // Или вызвать кастомную функцию
    onAccessDenied: (reason, metadata) => {
      console.log('Доступ запрещен:', reason)
      // Отправить аналитику, показать уведомление и т.д.
    }
  }
]}>
  <PremiumFeature />
</ProtectedRoute>

// Или редирект на кастомную страницу
<ProtectedRoute guards={[
  {
    id: 'admin',
    guard: adminGuard,
    accessDeniedPage: '/not-admin', // Редирект вместо компонента
    required: true
  }
]}>
  <AdminPanel />
</ProtectedRoute>
```

### Условный пропуск Guards

```tsx
<ProtectedRoute guards={[
  {
    id: 'business-hours',
    guard: ({ }) => {
      const hour = new Date().getHours()
      return {
        allowed: hour >= 9 && hour <= 17,
        reason: 'Доступ только в рабочие часы (9:00-17:00)'
      }
    },
    required: true,
    // Пропустить проверку для администраторов
    skipIf: ({ user }) => user?.roles?.includes('admin') || false
  }
]}>
  <BusinessHoursOnlyPage />
</ProtectedRoute>
```

### 🎯 Расширение объекта User

**По умолчанию** объект `User` содержит только базовые поля из Firebase:

```typescript
interface User {
  id: string                    // ✅ Firebase UID
  email: string                 // ✅ Email пользователя
  name: string | null          // ✅ Отображаемое имя
  avatar: string | null        // ✅ URL аватара
  emailVerified: boolean       // ✅ Подтвержден ли email
  provider: AuthProvider       // ✅ Провайдер авторизации

  // ❌ ЭТИ ПОЛЯ НУЖНО ДОБАВИТЬ САМОСТОЯТЕЛЬНО:
  roles?: string[]             // Роли пользователя
  permissions?: string[]       // Права пользователя  
  metadata?: Record<string, any> // Подписка, настройки и т.д.
}
```

**Чтобы добавить роли и метаданные**, нужно модифицировать `mapFirebaseUser()` в `firebase.ts`:

```typescript
// Пример добавления данных через API
const mapFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Базовые данные от Firebase
  const baseUser = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    name: firebaseUser.displayName,
    avatar: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    provider: getProviderFromFirebase(firebaseUser)
  }

  try {
    // Дополнительные данные из вашего API
    const userProfile = await fetch(`/api/users/${firebaseUser.uid}`)
      .then(res => res.json())
      .catch(() => null)

    return {
      ...baseUser,
      roles: userProfile?.roles || [],
      permissions: userProfile?.permissions || [],
      metadata: userProfile?.metadata || {}
    }
  } catch (error) {
    // Fallback если API недоступен
    return baseUser
  }
}
```

### Отладка Guards

```tsx
<ProtectedRoute
  guards={[
    { id: 'auth', guard: authGuard },
    { id: 'role', guard: roleGuard('admin') }
  ]}
  onGuardsComplete={(result) => {
    console.log('Guards выполнены:', {
      allowed: result.allowed,
      executedGuards: result.executedGuards,
      failedGuards: result.failedGuards,
      executionTime: result.executionTime
    })
  }}
>
  <ProtectedPage />
</ProtectedRoute>
```

## ⚙️ Конфигурация провайдеров

### Активация провайдеров в Firebase Console

1. **Google:**
    - Перейди в Firebase Console → Authentication → Sign-in method
    - Включи Google provider
    - Настрой OAuth (обычно автоматически)

2. **Email/Password:**
    - Включи Email/Password provider
    - Настрой требования к паролю

3. **GitHub:**
    - Включи GitHub provider
    - Создай OAuth App в GitHub
    - Добавь Client ID и Client Secret

4. **Microsoft:**
    - Включи Microsoft provider
    - Настрой в Azure Portal

### Добавление новых провайдеров в код

```tsx
// 1. В App.tsx добавь провайдер в конфигурацию
const authConfig = {
  providers: ['google', 'email', 'github'], // ← Добавил github
}

// 2. В AuthProvider.tsx методы автоматически станут доступны
// 3. В useAuthActions они появятся автоматически
// 4. В SignIn1.tsx добавь кнопку:

const {
  handleGitHubSignIn, // ← Автоматически доступен
  availableProviders
} = useAuthActions()

// И в JSX:
{availableProviders.github && (
  <button onClick={handleGitHubSignIn}>
    Войти через GitHub
  </button>
)}
```

## 🔧 Дополнительные хуки

```tsx
import { 
  useRole, 
  usePermissions, 
  useSessionTimer,
  useAutoSignOut,
  useGuardsExecutor 
} from './auth'

// Проверка ролей
function AdminPanel() {
  const { hasRole, userRoles } = useRole('admin')
  
  if (!hasRole('admin')) {
    return <div>Нет доступа</div>
  }
  
  return <div>Админ панель</div>
}

// Проверка прав
function DocumentEditor() {
  const { hasAllPermissions } = usePermissions(['read', 'write', 'edit'])
  
  return (
    <div>
      {hasAllPermissions && <button>Редактировать</button>}
    </div>
  )
}

// Таймер сессии
function SessionInfo() {
  const { sessionDurationFormatted } = useSessionTimer()
  return <div>В сети: {sessionDurationFormatted}</div>
}

// Автоматический выход
function App() {
  const { timeLeftFormatted, resetTimer } = useAutoSignOut(30) // 30 минут
  
  useEffect(() => {
    // Сбрасываем таймер при активности пользователя
    const handleUserActivity = () => resetTimer()
    
    document.addEventListener('click', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)
    
    return () => {
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [resetTimer])
  
  return (
    <div>
      <div>Автовыход через: {timeLeftFormatted}</div>
      {/* Остальное приложение */}
    </div>
  )
}
```

## 🔒 Примеры реальных сценариев

## 🔒 Примеры реальных сценариев

### E-commerce магазин

```tsx
// Страница оформления заказа
<ProtectedRoute guards={[
  // Обязательная авторизация
  { id: 'auth', guard: ({ isAuthenticated }) => ({ 
    allowed: isAuthenticated, reason: 'Войдите в аккаунт' 
  })},
  
  // Корзина не пустая
  { id: 'cart', guard: ({ data }) => ({
    allowed: (data?.cart?.items?.length || 0) > 0,
    reason: 'Добавьте товары в корзину'
  })},
  
  // Минимальная сумма
  { id: 'min-order', guard: ({ data }) => ({
    allowed: (data?.cart?.total || 0) >= 500,
    reason: 'Минимальная сумма заказа: 500₽'
  })}
]}>
  <CheckoutPage />
</ProtectedRoute>

// Админка магазина - админ ИЛИ менеджер
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { id: 'admin', guard: ({ user }) => ({
    allowed: user?.roles?.includes('admin') || false
  }), required: false },
  { id: 'manager', guard: ({ user }) => ({
    allowed: user?.roles?.includes('store-manager') || false  
  }), required: false }
]}>
  <StoreAdmin />
</ProtectedRoute>
```

### Социальная сеть

```tsx
// Профиль: владелец ИЛИ друг ИЛИ публичный
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  
  // Владелец профиля
  { id: 'owner', guard: ({ user, route }) => ({
    allowed: user?.id === route.params.userId
  }), required: false },
  
  // Друг пользователя  
  { id: 'friend', guard: ({ user, data, route }) => {
    const friendships = data?.friendships || []
    return {
      allowed: friendships.some(f => 
        f.userId === user?.id && f.friendId === route.params.userId
      )
    }
  }, required: false },
  
  // Публичный профиль
  { id: 'public', guard: ({ data }) => ({
    allowed: data?.profile?.privacy === 'public'
  }), required: false }
]}>
  <UserProfile />
</ProtectedRoute>

// Личные сообщения - только участники чата
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { id: 'chat-member', guard: async ({ user, route }) => {
    const chatId = route.params.chatId
    const participants = await fetchChatParticipants(chatId)
    return {
      allowed: participants.some(p => p.userId === user?.id),
      reason: 'Вы не участник этого чата'
    }
  }, timeout: 3000 }
]}>
  <ChatPage />
</ProtectedRoute>
```

### SaaS приложение

```tsx
// Премиум функция
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { 
    id: 'premium', 
    guard: async ({ user }) => {
      const subscription = await checkSubscription(user?.id)
      return {
        allowed: subscription?.plan === 'premium' && subscription?.active,
        reason: 'Требуется Premium подписка',
        metadata: { subscription }
      }
    },
    accessDeniedComponent: (
      <div>
        <h3>Нужна Premium подписка</h3>
        <button>Оформить подписку</button>
      </div>
    )
  }
]}>
  <PremiumFeature />
</ProtectedRoute>

// API Dashboard - лимит запросов не превышен
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { id: 'api-limit', guard: async ({ user }) => {
    const usage = await checkApiUsage(user?.id)
    return {
      allowed: usage.requestsToday < usage.dailyLimit,
      reason: `Превышен дневной лимит (${usage.dailyLimit} запросов)`,
      metadata: { usage }
    }
  }}
]}>
  <ApiDashboard />
</ProtectedRoute>
```

## 🚨 Troubleshooting

### Проблемы с Firebase
- **Ошибка `auth/operation-not-allowed`**: Провайдер не активирован в Firebase Console
- **Ошибка `auth/popup-blocked`**: Браузер блокирует всплывающие окна
- Проверьте `.env` переменные и настройки домена в Firebase Console

### Проблемы с Guards
- **Guards не выполняются**: Убедитесь что `GuardProvider` оборачивает маршруты
- **Таймаут guards**: Увеличьте `globalTimeout` или `timeout` для конкретного guard
- **Бесконечная загрузка**: Проверьте что guards возвращают `GuardResult`

### TypeScript ошибки
- **Ошибки типов User**: Убедитесь что `roles` и `permissions` добавлены в интерфейс `User`
- **Ошибки провайдеров**: Проверьте что провайдер добавлен в `AuthProvider` тип

### Производительность
- **Медленные guards**: Используйте `data` из `GuardProvider` вместо запросов в guards
- **Частые ререндеры**: Мемоизируйте тяжелые guards и данные

---
