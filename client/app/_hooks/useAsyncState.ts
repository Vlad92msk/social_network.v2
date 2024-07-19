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
      console.log('1232')
      setState(value)
    }
  }, [isUpdate, setState, value])

  console.log('setState', getValue())

  return [getValue, setState]
}
