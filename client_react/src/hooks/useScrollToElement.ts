import { RefObject, useCallback } from 'react'

interface TargetEl {
  targetElementId?: string | null
  targetElementRef?: RefObject<HTMLElement | null>
}

interface ScrollToElementProps {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

/**
 * Скролл до элемента
 */
export const useScrollToElement = (props: ScrollToElementProps) => {
  const { behavior, block, inline } = props
  return (
    useCallback((target?: TargetEl) => {

      const targetElement = target?.targetElementRef ? target.targetElementRef.current : document.getElementById(target?.targetElementId || '')

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior,
          block,
          inline,
        })
      }
    }, [behavior, block, inline])
  )
}
