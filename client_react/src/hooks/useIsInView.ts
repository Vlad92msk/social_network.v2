import { RefObject, useEffect, useState } from 'react'

/**
 * Хук для определения, находится ли элемент в зоне видимости.
 * @param ref RefObject на элемент, который нужно отслеживать.
 * @param options Параметры для IntersectionObserver.
 * @returns Булево значение, указывающее, находится ли элемент в зоне видимости.
 */
export const useIsInView = (
  ref: RefObject<HTMLElement | null>,
  options?: IntersectionObserverInit,
): boolean => {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return isInView
}
