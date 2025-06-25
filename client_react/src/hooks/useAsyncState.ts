import { useEffect, useRef } from 'react'

export type UseAsyncStateReturn<T = any> = [() => T, (newValue: T) => void];

export const useAsyncState = <T = any>(
  value: T,
  { isUpdate = false } = {},
): UseAsyncStateReturn<T> => {
  const state = useRef<T>(value)

  const getValue = () => state.current

  const setState = (newValue: T) => {
    state.current = newValue
  }

  useEffect(() => {
    if (isUpdate) {
      setState(value)
    }
  }, [isUpdate, setState, value])


  return [getValue, setState]
}
