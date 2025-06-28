import { useMemo } from 'react'

import { AuthConfig } from '../types'
import { mergeAuthConfig } from '../utils/configMerger'

/**
 * Хук для мемоизации конфигурации авторизации
 */
export function useAuthConfig(userConfig?: Partial<AuthConfig>): AuthConfig {
  return useMemo(() => mergeAuthConfig(userConfig), [userConfig])
}
