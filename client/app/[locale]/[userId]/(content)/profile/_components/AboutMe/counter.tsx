import { IStorageSegment } from '@ui/modules/synapse/services/storage/storage.interface'
import { useEffect, useState } from 'react'
import { synapse } from '../../../../../../../store/synapse'

export const useCounter = () => {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    synapse.then(({ segments: { counterSegment } }) => {
      // Получаем начальное значение
      counterSegment.select(state => state.value).then(setCount)

      console.log('counterSegment', counterSegment)
      // Подписываемся на изменения
      const unsubscribe = counterSegment.subscribe((state) => {
        console.log('subscribe', state)
        setCount(state.value)
      })

      return () => unsubscribe()
    })
  }, [])

  const increment = async () => {
    const { segments: { counterSegment } } = await synapse
    await counterSegment.update((state) => {
      console.log('before', state)
      state.value += 1
      console.log('after', state)
    })
  }

  return { count, increment }
}
