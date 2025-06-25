import { MutableRefObject, RefObject, useEffect, useRef } from 'react'

type CombinedRef<T> = ((value: T) => void) | MutableRefObject<T> | RefObject<HTMLTextAreaElement | null> | undefined;

export const useCombinedRefs = <T>(...refs: CombinedRef<T>[]) => {
  // @ts-ignore
  const targetRef: MutableRefObject<T> = useRef()

  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) return

      if (typeof ref === 'function') {
        ref(targetRef.current)
      } else {
        ref.current = targetRef.current
      }
    })
  }, [refs])

  return targetRef
}
