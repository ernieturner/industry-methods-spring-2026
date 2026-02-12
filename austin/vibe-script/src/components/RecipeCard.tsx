import { RecipeSearchResult } from '../types'
import '../styles/RecipeCard.css'

interface RecipeCardProps {
  recipe: RecipeSearchResult
}

export function RecipeCard({ recipe }: RecipeCardProps): React.ReactNode {
  const matchPercentage = recipe.usedIngredients.length
    ? Math.round(
        (recipe.usedIngredients.length /
          (recipe.usedIngredients.length + recipe.missedIngredients.length)) *
          100,
      )
    : 0

  return (
    <div className="recipe-card">
      <div className="recipe-image">
        <img src={recipe.image} alt={recipe.title} />
        <div className="match-badge">{matchPercentage}% match</div>
      </div>

      <div className="recipe-content">
        <h3 className="recipe-title">{recipe.title}</h3>

        {recipe.usedIngredients.length > 0 && (
          <div className="ingredient-section">
            <h4>You Have:</h4>
            <ul className="ingredient-list used">
              {recipe.usedIngredients.map((ing) => (
                <li key={ing.id}>{ing.original}</li>
              ))}
            </ul>
          </div>
        )}

        {recipe.missedIngredients.length > 0 && (
          <div className="ingredient-section">
            <h4>You Need:</h4>
            <ul className="ingredient-list missed">
              {recipe.missedIngredients.map((ing) => (
                <li key={ing.id}>{ing.original}</li>
              ))}
            </ul>
          </div>
        )}

        <a
          href={`https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-')}-${recipe.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="recipe-link"
        >
          View Recipe →
        </a>
      </div>
    </div>
  )
}
