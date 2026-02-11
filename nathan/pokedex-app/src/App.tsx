import React, { useState, useEffect } from 'react';
import PokemonList from './components/PokemonList';
import SearchBar from './components/SearchBar';
import PokemonDetail from './components/PokemonDetail';
import './App.css';

// Define interfaces directly in App.tsx
export interface PokemonListResponse {
  results: { name: string; url: string }[];
}

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

const typeColors: { [key: string]: string } = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  grass: '#7AC74C',
  electric: '#F7D02C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  steel: '#B7B7CE',
  fairy: '#D685AD',
  dark: '#705746',
};

const pokemonTypes = Object.keys(typeColors);

// Define API functions directly in App.tsx
const API_URL = 'https://pokeapi.co/api/v2';

export const getPokemonList = async (): Promise<PokemonListResponse> => {
  const response = await fetch(`${API_URL}/pokemon?limit=151`);
  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon list');
  }
  return response.json();
};

export const getPokemon = async (url: string): Promise<Pokemon> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon from ${url}`);
  }
  return response.json();
};

const App: React.FC = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const fetchAllPokemon = async () => {
      try {
        const list = await getPokemonList();
        const pokemonDetails = await Promise.all(
          list.results.map(p => getPokemon(p.url))
        );
        setAllPokemon(pokemonDetails);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPokemon();
  }, []);

  useEffect(() => {
    let pokemonToFilter = allPokemon;

    if (selectedType) {
      pokemonToFilter = pokemonToFilter.filter(pokemon =>
        pokemon.types.some(typeInfo => typeInfo.type.name === selectedType)
      );
    }

    if (searchTerm) {
      pokemonToFilter = pokemonToFilter.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPokemon(pokemonToFilter);
    setSelectedPokemon(null);
  }, [searchTerm, selectedType, allPokemon]);

  const handlePokemonClick = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const handleBackClick = () => {
    setSelectedPokemon(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <h1>Pokedex</h1>
      <div className="filters">
        <SearchBar onSearch={setSearchTerm} />
        <select onChange={(e) => setSelectedType(e.target.value)} value={selectedType}>
          <option value="">All Types</option>
          {pokemonTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {selectedPokemon ? (
        <div>
          <button 
            className="detail-back-btn"   // ← Added unique class here
            onClick={handleBackClick}
          >
            Back to List
          </button>
          <PokemonDetail pokemon={selectedPokemon} typeColors={typeColors} />
        </div>
      ) : (
        <PokemonList pokemon={filteredPokemon} onPokemonClick={handlePokemonClick} />
      )}
    </div>
  );
};

export default App;