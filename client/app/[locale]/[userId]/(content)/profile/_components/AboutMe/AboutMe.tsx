'use client'

import { useCallback, useState } from 'react'
import { ApiProvider } from '@ui/modules/synapse/services/api/examples'
import { PokemonDetails, pokemonEndpoints } from '@ui/modules/synapse/services/api/refactoring1/example'
// import { PokemonDetails, pokemonApi, pokemonEndpoints } from '@ui/modules/synapse/services/api/examples/pokemon-api'
import { cn } from './cn'

export function PokemonCard() {
  const [currentPokemon, setCurrentPokemon] = useState<PokemonDetails | undefined>(undefined)

  const onPokemon = useCallback(async (id: number) => {
    const request = pokemonEndpoints.getPokemonById.request({ id }).subscribe((state) => {
      console.log('State:', state.data)
      switch (state.status) {
        case 'idle': {
          console.log('запрос неактивен')
          break
        }
        case 'loading': {
          console.log('запрос loading')
          break
        }
        case 'success': {
          console.log('запрос success')
          setCurrentPokemon(state.data)
          break
        }
        case 'error': {
          console.log('запрос error')
          break
        }
      }
    })

    request.wait().catch(console.error)
  }, [])

  // console.log('currentPokemon', currentPokemon)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>{currentPokemon?.name}</h2>
      <img src={currentPokemon?.sprites.front_default} alt={currentPokemon?.name} />
      <div>
        Types:
        {' '}
        {currentPokemon?.types.map((t) => t.type.name).join(', ')}
      </div>
      <div>
        <button
          onClick={() => onPokemon((currentPokemon?.id || 0) + 1)}
        >
          Next
        </button>
        <span>
          Pokemon #
          {currentPokemon?.id}
        </span>
        <button
          onClick={() => onPokemon((currentPokemon?.id || 0) - 1)}
        >
          Previous
        </button>
      </div>
    </div>
  )
}

export function AboutMe(props) {
  return (
    <div className={cn()}>
      {/* <MyTest /> */}
      <ApiProvider>
        <PokemonCard />
      </ApiProvider>
    </div>
  )
}
