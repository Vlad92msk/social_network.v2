'use client'

import { useCallback } from 'react'
import { cn } from './cn'
import { useSelector, useStore } from '../../../../../../../store/synapse'

export function CounterExample() {
  const store = useStore()
  const value1 = useSelector(store?.selectors.selectCounter1) ?? 0
  const value2 = useSelector(store?.selectors.selectCounter2) ?? 0


  const increment1 = useCallback(async () => {
    if (!store?.segments.counter1) return
    const currentValue = (await store.segments.counter1.select(s => s.value)) ?? 0
    await store.segments.counter1.patch({ value: currentValue + 1 })
  }, [store?.segments.counter1])

  const decrement1 = useCallback(async () => {
    await store?.segments.counter1.update(({ value }) => ({ value: value - 1 }))
  }, [store?.segments.counter1])

  // Вариант с update
  const increment2 = useCallback(async () => {
    await store?.segments.counter2.update(state => ({
      value: (state.value ?? 0) + 1
    }))
  }, [store?.segments.counter2])

  const decrement2 = useCallback(async () => {
    await store?.segments.counter2.update(state => ({
      value: (state.value ?? 0) - 1
    }))
  }, [store?.segments.counter2])


  if (!store) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2>
          Counter 1: {
          //@ts-ignore
          value1?.value ?? 0
        }
        </h2>
        <button onClick={increment1} className="mr-2">+</button>
        <button onClick={decrement1}>-</button>
      </div>

      <div className="mb-4">
        <h3>Counter 2: {value2}</h3>
        <button onClick={increment2} className="mr-2">+</button>
        <button onClick={decrement2}>-</button>
      </div>

    </div>
  )
}

export function AboutMe(props) {
  return (
    <div className={cn()}>
      <CounterExample />
    </div>
  )
}
