import React from 'react';

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

interface PokemonCardProps {
  pokemon: Pokemon;
  onPokemonClick: (pokemon: Pokemon) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onPokemonClick }) => {
  return (
    <div className="pokemon-card" onClick={() => onPokemonClick(pokemon)}>
      <img src={pokemon.sprites.front_default} alt={pokemon.name} />
      <h3>{pokemon.name}</h3>
      <p>ID: {pokemon.id}</p>
      <p>Types: {pokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
    </div>
  );
};

export default PokemonCard;
