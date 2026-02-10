import { useState } from 'react'
import { searchRecipesByIngredients } from './api'
import { RecipeSearchResult } from './types'
import { IngredientInput } from './components/IngredientInput'
import { SearchResults } from './components/SearchResults'
import './App.css'

function App(): React.ReactNode {
  const [results, setResults] = useState<RecipeSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (ingredients: string[]): Promise<void> => {
    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const data = await searchRecipesByIngredients(ingredients)
      setResults(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fridge Recipe Finder</h1>
        <p>Discover recipes based on ingredients you have</p>
      </header>

      <main className="app-main">
        <IngredientInput onSearch={handleSearch} isLoading={isLoading} />
        <SearchResults
          results={results}
          isLoading={isLoading}
          error={error}
        />
      </main>

      <footer className="app-footer">
        <p>
          Powered by{' '}
          <a
            href="https://spoonacular.com/food-api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Spoonacular API
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
