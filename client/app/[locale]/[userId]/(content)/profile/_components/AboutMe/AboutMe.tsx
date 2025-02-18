'use client'

import { useState } from 'react'
import { usePokemon } from '../../../../../../../store/synapse'
import { cn } from './cn'

export function PokemonCard({ id }: { id: number }) {
  const { pokemon, loading, error } = usePokemon(id)
  // const d = useSelector(dddd)

  //@ts-ignore
  const data = pokemon?.data
  // console.log('pokemon', pokemon)
  // console.log('data', data)
  // console.log('d', d)
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
      {/* <button */}
      {/*   onClick={async () => { */}
      {/*     // Очищаем кэш для этого покемона, чтобы перезагрузить данные */}
      {/*     await myStorage.delete(`pokemon-${id}`) */}
      {/*     window.location.reload() */}
      {/*   }} */}
      {/* > */}
      {/*   Refresh */}
      {/* </button> */}
    </div>
  )
}


export function AboutMe(props) {
  const [pokemonId, setPokemonId] = useState(4)

  return (
    <div className={cn()}>
      {/* <MyTest /> */}
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
