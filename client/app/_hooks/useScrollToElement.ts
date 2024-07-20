import { RefObject, useCallback } from 'react'

interface ScrollToElementProps {
  targetElementId?: string | null
  targetElementRef?: RefObject<HTMLElement | null>
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

/**
 * Скролл до элемента
 */
export const useScrollToElement = (props: ScrollToElementProps) => {
  const {
    targetElementId, targetElementRef, behavior, block, inline,
  } = props
  return (
    useCallback(() => {
      const targetElement = targetElementRef ? targetElementRef.current : document.getElementById(targetElementId || '')
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior,
          block,
          inline,
        })
      }
    }, [targetElementRef, targetElementId, behavior, block, inline])
  )
}
