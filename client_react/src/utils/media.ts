
// Константы брейкпоинтов (синхронизированы с SCSS)

import { isObject } from '@utils/isObject.ts'
import { isString } from '@utils/isString.ts'

export enum MediaBreakScreen {
  XL = 1600,
  LG = 1440,
  LM = 1200,
  MD = 992,
  SM = 768,
  XS = 576,
  ES = 320,
}

export const mediaBreakpoints = {
  xl: MediaBreakScreen.XL,
  lg: MediaBreakScreen.LG,
  lm: MediaBreakScreen.LM,
  md: MediaBreakScreen.MD,
  sm: MediaBreakScreen.SM,
  xs: MediaBreakScreen.XS,
  es: MediaBreakScreen.ES,
} as const

export type MediaBreakKeys = keyof typeof mediaBreakpoints

export type AdaptiveVariables<Params> = Params | Partial<Record<MediaBreakKeys, Params>>

// Создание классов для адаптивности
export const createBreakPoint = (propName: string, values: AdaptiveVariables<unknown>): Record<string, unknown> => {
  const cls: Record<string, unknown> = {}

  if (isObject(values)) {
    Object.entries(values as Record<string, unknown>)
      .forEach(([key, val]) => {
        cls[`${propName}--${key}`] = val
      })
  }

  if (isString(values)) {
    cls[`${propName}--default`] = values
  }

  return cls
}

// Упрощенная версия для современного использования
export const createMediaClasses = <T>(
  prefix: string,
  values: Partial<Record<MediaBreakKeys, T>>
): Record<string, T> => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[`${prefix}--${key}`] = value
    }
    return acc
  }, {} as Record<string, T>)
}

// Хуки для медиа-запросов (для использования в React)
export const getMediaQuery = (breakpoint: MediaBreakKeys): string => {
  return `(max-width: ${mediaBreakpoints[breakpoint]}px)`
}

export const getMediaQueryMin = (breakpoint: MediaBreakKeys): string => {
  return `(min-width: ${mediaBreakpoints[breakpoint] + 1}px)`
}

// Утилитарные функции для проверки размера экрана
export const isScreenSize = (breakpoint: MediaBreakKeys): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(getMediaQuery(breakpoint)).matches
}

export const isScreenSizeMin = (breakpoint: MediaBreakKeys): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(getMediaQueryMin(breakpoint)).matches
}

// Константы для быстрого использования
export const MOBILE_BREAKPOINT = 'sm' as const
export const TABLET_BREAKPOINT = 'md' as const
export const DESKTOP_BREAKPOINT = 'lg' as const

export const isMobile = (): boolean => isScreenSize(MOBILE_BREAKPOINT)
export const isTablet = (): boolean => isScreenSizeMin(MOBILE_BREAKPOINT) && isScreenSize(TABLET_BREAKPOINT)
export const isDesktop = (): boolean => isScreenSizeMin(DESKTOP_BREAKPOINT)
