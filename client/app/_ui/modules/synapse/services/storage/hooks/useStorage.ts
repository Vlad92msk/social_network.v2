import { useEffect, useState } from 'react'
import { SelectorAPI } from '../modules/selector/selector.interface'

export const useSelector = <T>(selector: SelectorAPI<T> | undefined): T | undefined => {
  const [value, setValue] = useState<T>()

  useEffect(() => {
    if (!selector) return

    // Получаем начальное значение
    selector.select().then((value) => {
      setValue(value)
    })

    // Подписываемся на изменения
    return selector.subscribe({
      notify: async (newValue: T) => {
        setValue(newValue)
      },
    })
  }, [selector])

  return value
}