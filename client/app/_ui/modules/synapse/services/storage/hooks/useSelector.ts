'use client'

import { useEffect, useState } from 'react'
import { SelectorAPI } from '../modules/selector/selector.interface'

export const useSelector = <T>(selector: SelectorAPI<T> | undefined): T | undefined => {
  const [value, setValue] = useState<T>()

  useEffect(() => {
    if (!selector) return
    selector.select().then((value) => {
      setValue(value)
    })

    return selector.subscribe({
      notify: async (newValue: T) => {
        setValue(newValue)
      },
    })
  }, [selector])

  return value
}
