'use client'

import { useState } from 'react'
import { cn } from './cn'
import { cache, usePokemon, useSelector, useStore } from '../../../../../../../store/synapse'

export function PokemonCard({ id }: { id: number }) {
  const { pokemon, loading, error } = usePokemon(id)

  if (loading) return <div>Loading...</div>
  if (error) {
    return (
      <div>
        Error:
        {error.message}
      </div>
    )
  }
  if (!pokemon) return null

  return (
    <div>
      <h2>{pokemon.name}</h2>
      <img src={pokemon.sprites.front_default} alt={pokemon.name} />
      <div>
        Types:
        {' '}
        {pokemon.types.map((t) => t.type.name).join(', ')}
      </div>
      <button
        onClick={async () => {
          // Очищаем кэш для этого покемона, чтобы перезагрузить данные
          await cache.delete(`pokemon-${id}`)
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
  const user = useSelector(store?.selectors.user)

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

export function AboutMe(props) {
  const [pokemonId, setPokemonId] = useState(4)

  return (
    <div className={cn()}>
      <CounterExample />
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
