'use client'

import { cn } from './cn'
import { useCounter } from './counter'

export const AboutMe = (props) => {
  const { count, increment } = useCounter()

  return (
    <div className={cn()}>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>

    </div>
  )
}
