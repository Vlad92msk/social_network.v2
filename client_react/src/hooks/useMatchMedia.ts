import { useEffect, useState } from 'react'

export interface MatchMediaProps<T extends Record<string, number>> {
  breakpoints: T;
  actions?: Partial<Record<keyof T, Function>>;
}

export const useMatchMedia = <T extends Record<string, number>>(props: MatchMediaProps<T>) => {
  const { breakpoints, actions } = props
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof T | null>(null)

  useEffect(() => {
    const checkBreakpoint = () => {
      const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => b[1] - a[1])
      for (const [key, value] of sortedBreakpoints) {
        if (window.matchMedia(`(min-width: ${value}px)`).matches) {
          if (currentBreakpoint !== key) {
            setCurrentBreakpoint(key as keyof T)
            if (actions && actions[key as keyof T]) {
              actions[key as keyof T]?.()
            }
          }
          break
        }
      }
    }

    checkBreakpoint()

    window.addEventListener('resize', checkBreakpoint)

    return () => {
      window.removeEventListener('resize', checkBreakpoint)
    }
  }, [breakpoints, actions, currentBreakpoint]) // Убрал currentBreakpoint из зависимостей

  return currentBreakpoint
}
