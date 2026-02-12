import { RecipeSearchResult } from '../types'
import { RecipeCard } from './RecipeCard'
import '../styles/SearchResults.css'

interface SearchResultsProps {
  results: RecipeSearchResult[]
  isLoading: boolean
  error: string | null
}

export function SearchResults({
  results,
  isLoading,
  error,
}: SearchResultsProps): React.ReactNode {
  if (isLoading) {
    return (
      <div className="search-results">
        <div className="loading-message">Searching for recipes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="search-results">
        <div className="error-message">Error: {error}</div>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="search-results">
      <h2>Recipes Found ({results.length})</h2>
      <div className="recipe-grid">
        {results.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}
