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

### 2. Структура файлов

Создайте следующую структуру в вашем проекте:

```
src/auth/
├── index.ts                    # Главный экспорт
├── AuthProvider.tsx            # Основной провайдер
├── ProtectedRoute.tsx          # Компонент с guards
├── GuardProvider.tsx           # Провайдер для guard data
├── config.ts                   # Firebase конфигурация
│
├── types/
│   ├── index.ts               # Основные типы
│   └── guards.ts              # Типы для guards системы
│
├── constants/index.ts         # Константы и настройки
├── utils/index.ts             # Утилиты
├── guards/index.ts            # Базовые guards
│
├── hooks/
│   ├── index.ts               # Экспорт хуков
│   ├── useAuth.ts             # Хуки авторизации
│   ├── useAuthForm.ts         # Хуки для форм
│   └── useGuards.ts           # Хуки для guards
│
└── providers/
    ├── index.ts               # Фабрика провайдеров
    └── firebase.ts            # Firebase провайдер
```

### 3. Настройка окружения

Создайте `.env` файл:

```env
# Firebase (обязательно)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Дополнительные провайдеры (опционально)
VITE_AUTH0_DOMAIN=your_domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
```

### 4. Базовая настройка приложения

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
    onAccessDenied: '/access-denied'  // Новое: страница отказа в доступе
  },
  autoRedirect: true,
  providers: ['google', 'email'],
  authPages: ['/signin', '/signup', '/access-denied'], // Кастомные страницы авторизации
  guards: {
    enabled: true,        // Включить guards систему
    globalTimeout: 5000   // Таймаут для асинхронных guards
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
            
            {/* Простая защита */}
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
              path="/profile/:userId" 
              element={
                <ProtectedRoute guards={[
                  { id: 'auth', guard: authGuard, required: true },
                  { id: 'owner', guard: ownerGuard(), required: false }
                ]}>
                  <ProfilePage />
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

### 5. Использование в компонентах

```tsx
// Компонент с авторизацией
import { useAuth, useRole } from './auth'

function UserProfile() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    signInWithGoogle, 
    signInWithEmail, 
    signOut 
  } = useAuth()
  
  const { hasRole } = useRole()

  if (isLoading) return <div>Загрузка...</div>
  
  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={signInWithGoogle}>
          Войти через Google
        </button>
        <button onClick={() => signInWithEmail(email, password)}>
          Войти через Email
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1>Привет, {user?.name}!</h1>
      
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

Guards - это функции, которые определяют может ли пользователь получить доступ к определенному маршруту. Каждый guard возвращает результат проверки и может быть:
- **Обязательным** (`required: true`) - должен пройти обязательно
- **Опциональным** (`required: false`) - достаточно одного из группы

### Базовые Guards

```tsx
import { 
  authGuard,           // Проверка авторизации
  roleGuard,           // Проверка роли
  permissionGuard,     // Проверка прав
  ownerGuard,          // Проверка владельца ресурса
  createAuthGuardConfig 
} from './auth'

// Простая защита
<ProtectedRoute guards={[
  createAuthGuardConfig()
]}>
  <PrivatePage />
</ProtectedRoute>

// Проверка роли
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { id: 'admin', guard: roleGuard('admin'), required: true }
]}>
  <AdminPage />
</ProtectedRoute>

// Владелец ИЛИ модератор (OR логика)
<ProtectedRoute guards={[
  { id: 'auth', guard: authGuard, required: true },
  { id: 'owner', guard: ownerGuard(), required: false },
  { id: 'moderator', guard: roleGuard('moderator'), required: false }
]}>
  <EditPostPage />
</ProtectedRoute>
```

### Кастомная обработка отказа

```tsx
<ProtectedRoute guards={[
  {
    id: 'premium',
    guard: subscriptionGuard('premium'),
    required: true,
    accessDeniedComponent: (
      <div className="alert">
        <h3>Требуется Premium подписка</h3>
        <button>Оформить подписку</button>
      </div>
    )
  }
]}>
  <PremiumFeature />
</ProtectedRoute>

// Или редирект на кастомную страницу
<ProtectedRoute guards={[
  {
    id: 'admin',
    guard: roleGuard('admin'),
    accessDeniedPage: '/not-admin',
    onAccessDenied: (reason) => {
      analytics.track('access_denied', { reason })
    }
  }
]}>
  <AdminPanel />
</ProtectedRoute>
```

### Создание кастомных Guards

```tsx
// Создание собственного guard
const subscriptionGuard = (requiredPlan: string): Guard => 
  ({ user }) => {
    const userPlan = user?.metadata?.subscription || 'free'
    return {
      allowed: userPlan === requiredPlan,
      reason: `Требуется подписка: ${requiredPlan}`,
      metadata: { userPlan, requiredPlan }
    }
  }

// Асинхронный guard с API запросом
const friendGuard = (): Guard => 
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
```

### Работа с Guard Data

```tsx
// Загрузка данных для guards
import { useGuardData } from './auth'

function UserProfilePage() {
  const { userId } = useParams()
  const { setGuardData } = useGuardData()

  useEffect(() => {
    const loadUserData = async () => {
      // Загружаем профиль
      const profile = await fetchUserProfile(userId)
      
      // Загружаем друзей
      const friendships = await fetchUserFriendships(user?.id)
      
      // Сохраняем для guards
      setGuardData('profile', profile)
      setGuardData('friendships', friendships)
    }

    loadUserData()
  }, [userId, setGuardData])

  return <div>Профиль пользователя</div>
}
```

## ⚙️ Конфигурация

### Полная конфигурация

```tsx
const authConfig: AuthConfig = {
  // Редиректы
  redirects: {
    afterSignIn: '/',
    afterSignOut: '/signin',
    whenUnauthenticated: '/signin',
    onAccessDenied: '/access-denied'
  },
  
  // Автоматические редиректы
  autoRedirect: true,
  
  // Активные провайдеры
  providers: ['google', 'email', 'github'],
  
  // Страницы авторизации (не сохраняем в callback)
  authPages: [
    '/signin', 
    '/signup', 
    '/reset-password',
    '/access-denied'
  ],
  
  // Таймаут сессии (минуты)
  sessionTimeout: 60,
  
  // Настройки Guards
  guards: {
    enabled: true,
    globalTimeout: 5000,
    fallback: 'component', // 'component' | 'redirect'
    fallbackComponent: MyCustomAccessDenied
  }
}
```

### Доступные провайдеры

**Firebase провайдеры:**
- `google` - Google OAuth
- `email` - Email/Password
- `github` - GitHub OAuth
- `microsoft` - Microsoft OAuth
- `apple` - Apple OAuth
- `facebook` - Facebook OAuth
- `twitter` - Twitter OAuth
- `yahoo` - Yahoo OAuth

**Внешние провайдеры:**
- `auth0` - Auth0
- `okta` - Okta
- `supabase` - Supabase Auth
- `cognito` - AWS Cognito
- `clerk` - Clerk Auth

## 🔧 Дополнительные хуки

```tsx
import { 
  useRole, 
  usePermissions, 
  useSessionTimer,
  useAutoSignOut,
  useGuards 
} from './auth'

// Проверка ролей
const { hasRole, hasRequiredRole, userRoles } = useRole('admin')

// Проверка прав
const { 
  hasPermission, 
  hasAllPermissions, 
  hasSomePermissions 
} = usePermissions(['read', 'write', 'delete'])

// Таймер сессии
const { 
  sessionStart, 
  sessionDuration, 
  sessionDurationFormatted 
} = useSessionTimer()

// Автоматический выход
const { 
  timeLeft, 
  timeLeftFormatted, 
  resetTimer 
} = useAutoSignOut(30) // 30 минут

// Работа с guards
const { 
  setGuardData,
  createAuthGuard,
  createRoleGuard 
} = useGuards()
```

## 🔒 Примеры защищенных маршрутов

### Простая защита
```tsx
// Только авторизованные пользователи
<ProtectedRoute>
  <PrivatePage />
</ProtectedRoute>

// С кастомным лоадером
<ProtectedRoute fallback={<CustomLoader />}>
  <PrivatePage />
</ProtectedRoute>
```

### Защита по ролям
```tsx
// Только администраторы
<ProtectedRoute guards={[
  createAuthGuardConfig(),
  createGuardConfig('admin', roleGuard('admin'))
]}>
  <AdminPanel />
</ProtectedRoute>

// Админы ИЛИ модераторы
<ProtectedRoute guards={[
  createAuthGuardConfig(),
  createGuardConfig('admin', roleGuard('admin'), { required: false }),
  createGuardConfig('moderator', roleGuard('moderator'), { required: false })
]}>
  <ModerationPanel />
</ProtectedRoute>
```

### Социальная сеть - пример
```tsx
// Профиль: владелец ИЛИ друг ИЛИ публичный
<ProtectedRoute guards={[
  createAuthGuardConfig(),
  createGuardConfig('owner', ownerGuard(), { required: false }),
  createGuardConfig('friend', friendGuard(), { required: false }),
  createGuardConfig('public', publicProfileGuard(), { required: false })
]}>
  <UserProfile />
</ProtectedRoute>

// Личные сообщения: только участники
<ProtectedRoute guards={[
  createAuthGuardConfig(),
  createGuardConfig('participant', chatParticipantGuard(), { required: true })
]}>
  <ChatPage />
</ProtectedRoute>
```

## 🎛️ Расширение системы

### Добавление нового провайдера

1. Создайте файл `src/auth/providers/newProvider.ts`:

```tsx
import type { AuthMethods, AuthResult } from '../types'

export const newProviderMethods: Partial<AuthMethods> = {
  async signInWithNewProvider(): Promise<AuthResult> {
    try {
      // Ваша реализация
      const user = await newProviderAuth()
      return { user, success: true }
    } catch (error) {
      return { error: error.message, success: false }
    }
  }
}
```

2. Добавьте в `providers/index.ts`:

```tsx
import { newProviderMethods } from './newProvider'

const EXTERNAL_PROVIDERS = {
  // ...
  newProvider: {
    name: 'newProvider',
    methods: newProviderMethods
  }
}
```

3. Обновите типы в `types/index.ts`:

```tsx
export type ExternalProvider = 'auth0' | 'okta' | 'supabase' | 'cognito' | 'clerk' | 'newProvider'
```

### Создание кастомных Guards

```tsx
// guards/custom.ts
export const ageGuard = (minAge: number): Guard => 
  ({ user }) => ({
    allowed: (user?.metadata?.age || 0) >= minAge,
    reason: `Требуется возраст от ${minAge} лет`
  })

export const timeGuard = (startHour: number, endHour: number): Guard => 
  () => {
    const hour = new Date().getHours()
    return {
      allowed: hour >= startHour && hour <= endHour,
      reason: `Доступ разрешен с ${startHour}:00 до ${endHour}:00`
    }
  }

export const geoGuard = (allowedCountries: string[]): Guard => 
  ({ user }) => ({
    allowed: allowedCountries.includes(user?.metadata?.country || ''),
    reason: 'Доступ ограничен по географическому положению'
  })
```

## 🚨 Миграция и обратная совместимость

### Миграция со старой версии

```tsx
// БЫЛО (старая версия):
<ProtectedRoute requireAuth={true}>
  <PrivatePage />
</ProtectedRoute>

// СТАЛО (все еще работает):
<ProtectedRoute>
  <PrivatePage />
</ProtectedRoute>

// ИЛИ с новой Guards системой:
<ProtectedRoute guards={[createAuthGuardConfig()]}>
  <PrivatePage />
</ProtectedRoute>
```

### Постепенная миграция

1. **Этап 1**: Обновите файлы, старые маршруты продолжают работать
2. **Этап 2**: Добавьте Guards для новых маршрутов
3. **Этап 3**: Постепенно переводите старые маршруты на Guards
4. **Этап 4**: Уберите `requireAuth` props (опционально)

## 🚨 Troubleshooting

### Проблемы с Firebase
- Проверьте `.env` переменные
- Убедитесь что домен добавлен в Firebase Console
- Проверьте настройки OAuth провайдеров

### Проблемы с Guards
- Проверьте что `GuardProvider` оборачивает ваши маршруты
- Убедитесь что асинхронные guards не превышают таймаут
- Проверьте консоль на ошибки выполнения guards

### TypeScript ошибки
- Убедитесь что все типы импортированы корректно
- Проверьте что `User` интерфейс содержит `roles` и `permissions`
- Для кастомных guards используйте правильные типы

### Проблемы с редиректами
- Очистите localStorage/sessionStorage
- Проверьте конфигурацию `authPages`
- Убедитесь что все маршруты существуют

---

