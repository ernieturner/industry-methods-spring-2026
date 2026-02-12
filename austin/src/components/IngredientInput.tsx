import { useState } from 'react'
import '../styles/IngredientInput.css'

interface IngredientInputProps {
  onSearch: (ingredients: string[]) => void
  isLoading: boolean
}

export function IngredientInput({
  onSearch,
  isLoading,
}: IngredientInputProps): React.ReactNode {
  const [input, setInput] = useState<string>('')
  const [ingredients, setIngredients] = useState<string[]>([])

  const handleAddIngredient = (): void => {
    const trimmed = input.trim()
    if (trimmed && !ingredients.includes(trimmed.toLowerCase())) {
      const newIngredients = [
        ...ingredients,
        trimmed.toLowerCase(),
      ]
      setIngredients(newIngredients)
      setInput('')
    }
  }

  const handleRemoveIngredient = (index: number): void => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSearch = (): void => {
    if (ingredients.length > 0) {
      onSearch(ingredients)
    }
  }

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Enter') {
      handleAddIngredient()
    }
  }

  return (
    <div className="ingredient-input-container">
      <h2>Find Meals by Ingredients</h2>
      
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter an ingredient (e.g., chicken, tomato)"
          disabled={isLoading}
          className="ingredient-input"
        />
        <button
          onClick={handleAddIngredient}
          disabled={isLoading || !input.trim()}
          className="btn-add"
        >
          Add
        </button>
      </div>

      {ingredients.length > 0 && (
        <div className="ingredients-list">
          <div className="ingredients-header">
            <h3>Selected Ingredients ({ingredients.length})</h3>
          </div>
          <div className="ingredient-tags">
            {ingredients.map((ingredient, index) => (
              <div key={`${ingredient}-${index}`} className="ingredient-tag">
                <span>{ingredient}</span>
                <button
                  onClick={() => handleRemoveIngredient(index)}
                  disabled={isLoading}
                  className="btn-remove"
                  aria-label={`Remove ${ingredient}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || ingredients.length === 0}
            className="btn-search"
          >
            {isLoading ? 'Searching...' : 'Search Recipes'}
          </button>
        </div>
      )}
    </div>
  )
}
