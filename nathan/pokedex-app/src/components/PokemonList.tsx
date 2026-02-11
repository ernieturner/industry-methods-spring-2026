import React from 'react';
import PokemonCard from './PokemonCard';

// Re-defining Pokemon interface locally to avoid module resolution issues
interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: {
    type: {
      name: string;
    };
  }[];
  stats: {
    stat: {
      name: string;
    };
    base_stat: number;
  }[];
}

interface PokemonListProps {
  pokemon: Pokemon[];
  onPokemonClick: (pokemon: Pokemon) => void;
}

const PokemonList: React.FC<PokemonListProps> = ({ pokemon, onPokemonClick }) => {
  return (
    <div className="pokemon-list">
      {pokemon.map(p => (
        <PokemonCard key={p.id} pokemon={p} onPokemonClick={onPokemonClick} />
      ))}
    </div>
  );
};

export default PokemonList;
