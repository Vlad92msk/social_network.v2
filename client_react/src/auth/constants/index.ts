export const AUTH_CONSTANTS = {
  // SessionStorage ключи
  CALLBACK_URL_KEY: 'auth_callback_url',
  GUARD_DATA_KEY: 'auth_guard_data',

  // Таймауты
  REDIRECT_DELAY: 0,
  DEFAULT_SESSION_TIMEOUT: 30,
  DEFAULT_GUARD_TIMEOUT: 5000,

  // Размеры UI
  LOADER_SIZE: 'w-12 h-12',
  LOADER_COLORS: 'border-blue-200 border-t-blue-600',

  // Страницы авторизации по умолчанию (убираем readonly)
  DEFAULT_AUTH_PAGES: [
    '/signin',
    '/signup',
    '/login',
    '/register',
    '/reset-password',
    '/forgot-password',
    '/auth/callback',
    '/access-denied'
  ],

  // Сообщения по умолчанию
  MESSAGES: {
    CHECKING_AUTH: 'Проверка авторизации...',
    CHECKING_ACCESS: 'Проверка прав доступа...',
    ACCESS_DENIED: 'Доступ запрещен',
    SIGN_OUT_ERROR: 'Ошибка при выходе из системы',
    AUTH_ERROR: 'Ошибка авторизации',
    REGISTRATION_ERROR: 'Ошибка регистрации',
    AUTH_REQUIRED: 'useAuth must be used within an AuthProvider',
    GUARD_ERROR: 'Ошибка проверки прав доступа',
    GUARD_TIMEOUT: 'Превышено время ожидания проверки доступа'
  },

  // Группы guards
  GUARD_GROUPS: {
    AUTH: 'auth',
    SOCIAL: 'social',
    PREMIUM: 'premium',
    ADMIN: 'admin',
    CONTENT: 'content'
  }
}
