import { debounce } from '@utils/debounce.ts'
import { throttle } from '@utils/throttle.ts'
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'

export interface UseRectProps {
  ref: MutableRefObject<HTMLElement | null | undefined>,
  watchProps: Array<keyof DOMRect>,
  options?: {
    stopFunc: 'throttle' | 'debounce',
    ms: number
  },
}

export const useRect = (props: UseRectProps) => {
  const { ref, watchProps, options } = props
  const [rect, setRect] = useState<Partial<DOMRect>>({})
  const observer = useRef<ResizeObserver>(null)
  const prevRectRef = useRef<Partial<DOMRect>>({})

  const updateRect = useCallback((entries: ResizeObserverEntry[]) => {
    const newRect = entries[0].contentRect
    const pickRect = watchProps.reduce((result, prop) => {
      // @ts-ignore
      result[prop] = newRect[prop]

      return result
    }, {})

    // @ts-ignore
    const isEqual = watchProps.every((prop) => prevRectRef.current[prop] === pickRect[prop])

    if (!isEqual) {
      prevRectRef.current = pickRect
      setRect(pickRect)
    }
  }, [watchProps])

  // Обертка updateRect с использованием throttle или debounce, если указаны в options
  const delayedUpdate = useCallback(() => {
    if (options) {
      const { stopFunc, ms } = options
      if (stopFunc === 'throttle') return throttle(updateRect, ms)
      if (stopFunc === 'debounce') return debounce(updateRect, ms)
    }
    return updateRect
  }, [updateRect, options])

  useEffect(() => {
    observer.current = new ResizeObserver(delayedUpdate())
    if (ref?.current) {
      observer.current.observe(ref.current)
    }

    return () => observer.current?.disconnect()
  }, [delayedUpdate, ref])

  return rect
}
