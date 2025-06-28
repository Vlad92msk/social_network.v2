/**
 * Константы таймаутов для системы авторизации
 */
export const TIMEOUTS = {
  /** Задержка перед редиректом после авторизации (мс) */
  REDIRECT_DELAY_MS: 0,
  /** Время сессии по умолчанию (минуты) */
  DEFAULT_SESSION_TIMEOUT_MINUTES: 30,
  /** Таймаут выполнения guard по умолчанию (мс) */
  DEFAULT_GUARD_TIMEOUT_MS: 5000,
} as const
