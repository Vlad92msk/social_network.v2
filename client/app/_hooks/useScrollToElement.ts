import { RefObject, useCallback } from 'react'

type Position = 'top' | 'bottom' | 'center'

interface ScrollToElementProps {
    targetElementId?: string | null
    targetElementRef?: RefObject<HTMLElement>
    containerRef: RefObject<HTMLElement>
    position: Position
}

const calculateScrollPosition = (position: Position, targetRect: DOMRect, containerRect: DOMRect): number => {
  switch (position) {
    case 'top':
      return targetRect.top - containerRect.top
    case 'bottom':
      return targetRect.bottom - containerRect.bottom
    case 'center':
      return (
        targetRect.top
                - containerRect.top
                - containerRect.height / 2
                + targetRect.height / 2
      )
    default:
      return 0
  }
}

/**
 * Скролл до элемента
 */
export const useScrollToElement = ({ targetElementId, targetElementRef, containerRef, position }: ScrollToElementProps) => (
  useCallback(() => {
    if (containerRef.current) {
      const targetElement = targetElementRef ? targetElementRef.current : document.getElementById(targetElementId || '')
      if (targetElement) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const targetRect = targetElement.getBoundingClientRect()

        const scrollPosition = calculateScrollPosition(
          position,
          targetRect,
          containerRect,
        )

        containerRef.current.scrollTo({
          top: containerRef.current.scrollTop + scrollPosition,
          behavior: 'smooth',
        })
      }
    }
  }, [targetElementId, targetElementRef, containerRef, position])
)
