'use client'

import { useEffect, useState } from 'react'
import { MemoryStorage } from '@ui/modules/synapse/services/storage/adapters/memory-storage.service'
import { cn } from './cn'
import { dddd, myStorage, usePokemon, useSelector, useStore } from '../../../../../../../store/synapse'

export function PokemonCard({ id }: { id: number }) {
  const { pokemon, loading, error } = usePokemon(id)
  const d = useSelector(dddd)

  //@ts-ignore
  const data = pokemon?.data
  console.log('pokemon', pokemon)
  console.log('data', data)
  console.log('d', d)
  if (loading) return <div>Loading...</div>
  if (error) {
    return (
      <div>
        Error:
        {error.message}
      </div>
    )
  }
  if (!data) return null

  return (
    <div>
      <h2>{data.name}</h2>
      <img src={data.sprites.front_default} alt={data.name} />
      <div>
        Types:
        {' '}
        {data.types.map((t) => t.type.name).join(', ')}
      </div>
      <button
        onClick={async () => {
          // Очищаем кэш для этого покемона, чтобы перезагрузить данные
          await myStorage.delete(`pokemon-${id}`)
          window.location.reload()
        }}
      >
        Refresh
      </button>
    </div>
  )
}

export function CounterExample() {
  const store = useStore()

  const counter1 = useSelector(store?.selectors.selectCounter1)
  const counter2 = useSelector(store?.selectors.selectCounter2)
  const sum = useSelector(store?.selectors.sum)

  const increment1 = async () => {
    // await store?.segments.counter1.patch({ value: (counter1 || 0) + 1 })
    await store?.segments.counter1.update((state) => {
      state.value += 1
    })
  }

  const increment2 = async () => {
    await store?.segments.counter2.patch({ value: (counter2 || 0) + 1 })
  }

  if (!store) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-bold">
            Counter 1:
            {counter1}
          </h2>
          <button
            onClick={increment1}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment
          </button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-bold">
            Counter 2:
            {counter2}
          </h2>
          <button
            onClick={increment2}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment
          </button>
        </div>
      </div>

      <div className="p-4 border rounded bg-gray-100">
        <h2 className="text-xl font-bold">
          Total Sum:
          {sum}
        </h2>
      </div>
    </div>
  )
}

const storage = new MemoryStorage({
  name: 'test',
  initialState: {
    user: {
      profile: {
        name: 'John',
        age: 25,
      },
    },
  },
})



function MyTest() {
  const [name, setName] = useState()
  const [age, setAge] = useState()

  useEffect(() => {
    // Получаем начальное значение
    storage.get('user.profile.name').then(setName)

    // Подписываемся на изменения
    const sub = storage.subscribe('user.profile.name', (newName) => {
      setName(newName)
    })

    return () => sub()
  }, [])

  useEffect(() => {
    // Получаем начальное значение
    storage.get('user.profile.age').then(setAge)

    // Подписываемся на изменения
    const sub = storage.subscribe('user.profile.age', (newAge) => {
      setAge(newAge)
      console.log('Age changed:', newAge)
    })

    return () => sub()
  }, [])

  // Подписка на весь профиль
  useEffect(() => {
    const sub = storage.subscribe('user.profile', (newProfile) => {
      console.log('Profile updated:', newProfile)
    })

    return () => sub()
  }, [])

  useEffect(() => {
    const sub = storage.subscribeToAll(async (newProfile) => {
      const state = await storage.getState().then(res => {
        console.log(res)
        return res
      })
      console.log('state', state)
    })

    return () => sub()
  }, [])

  return (
    <div>
      <span>{name}</span>
      <button
        onClick={async () => {
          // await storage.set('user.profile.name', 'Max')
          await storage.update((state) => {
            console.log('updatestate', state)
            state.user.profile.name = 'Max'
          })
        }}
      >
        set name
      </button>
      <span>{age}</span>
      <button
        onClick={async () => {
          await storage.set('user.profile.age', 26)
        }}
      >
        set age
      </button>
    </div>
  )
}

export function AboutMe(props) {
  const [pokemonId, setPokemonId] = useState(4)

  return (
    <div className={cn()}>
      {/* <MyTest /> */}
      {/* <CounterExample /> */}
      <div>
        <div>
          <button
            onClick={() => setPokemonId((id) => Math.max(1, id - 1))}
            disabled={pokemonId === 1}
          >
            Previous
          </button>
          <span>
            Pokemon #
            {pokemonId}
          </span>
          <button
            onClick={() => setPokemonId((id) => id + 1)}
          >
            Next
          </button>
        </div>

        <PokemonCard id={pokemonId} />
      </div>
    </div>
  )
}
