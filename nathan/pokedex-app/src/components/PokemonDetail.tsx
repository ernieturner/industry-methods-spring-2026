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

interface PokemonDetailProps {
  pokemon: Pokemon;
  typeColors: { [key: string]: string };
}

const PokemonDetail: React.FC<PokemonDetailProps> = ({ pokemon, typeColors }) => {
  const primaryType = pokemon.types[0]?.type.name;
  const typeColor = primaryType ? typeColors[primaryType.toLowerCase()] : '#607D8B'; // Default gray if no type or color

  return (
    <div className="pokemon-detail">
      <h2>{pokemon.name}</h2>
      <img src={pokemon.sprites.front_default} alt={pokemon.name} />
      <div>
        <h3>Stats</h3>
        <ul>
          {pokemon.stats.map(stat => (
            <li key={stat.stat.name} style={{ backgroundColor: typeColor }}>
              {stat.stat.name}: {stat.base_stat}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Types</h3>
        <ul>
          {pokemon.types.map(typeInfo => (
            <li key={typeInfo.type.name} style={{ backgroundColor: typeColors[typeInfo.type.name.toLowerCase()] || '#607D8B' }}>
              {typeInfo.type.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PokemonDetail;
