import { useEffect, useState } from 'react'

/**
 * Хук для наблюдения за элементами и определения тех, которые находятся в зоне видимости.
 * @param elements Список элементов для наблюдения.
 * @param options Параметры для IntersectionObserver.
 * @returns Массив элементов, которые находятся в зоне видимости.
 */
export const useInViewElements = (
  elements: HTMLElement[],
  options?: IntersectionObserverInit,
) => {
  const [visibleElements, setVisibleElements] = useState<Element[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleElements((prev) => [...new Set([...prev, entry.target])])
        } else {
          setVisibleElements((prev) => prev.filter((el) => el !== entry.target))
        }
      })
    }, options)

    elements.forEach((element) => {
      if (element) observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [elements])

  return visibleElements
}
