'use client'

import { useCallback, useState } from 'react'
import { ApiProvider } from '@ui/modules/synapse/services/api/examples'
import { PokemonDetails, pokemonApi, pokemonEndpoints } from '@ui/modules/synapse/services/api/examples/pokemon-api'
import { cn } from './cn'

export function PokemonCard() {
  const [currentPokemon, setCurrentPokemon] = useState<PokemonDetails | undefined>(undefined)

  const onPokemon = useCallback(async (id: number) => {
    const request = pokemonEndpoints.getPokemonById.fetch(id);
    console.log('Request object in component:', request); // Для отладки

    const unsubscribe = request.subscribe((state) => {
      console.log('State:', state);
      if (state.status === 'success') {
        setCurrentPokemon(state.data);
      }
    });

    try {
      const result = await request.wait();
      console.log('Request completed:', result);
    } finally {
      unsubscribe();
    }
  }, []);

  console.log('currentPokemon', currentPokemon)
  return (
    <div style={{ display: 'flex', flexDirection: 'column'}}>
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
