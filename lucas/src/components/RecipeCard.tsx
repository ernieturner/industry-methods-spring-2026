import type { Recipe } from "../types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onAddToPlan: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onAddToPlan }: RecipeCardProps) {
  return (
    <div className="recipe-card">
      <img src={recipe.image} alt={recipe.title} />
      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>
        <p className="recipe-counts">
          <span className="used">{recipe.usedIngredientCount} used</span>
          {" | "}
          <span className="missed">{recipe.missedIngredientCount} missed</span>
        </p>
        <p className="recipe-protein">
          {recipe.protein !== null ? `${recipe.protein}g protein` : "Loading protein..."}
        </p>
        {recipe.missedIngredients.length > 0 && (
          <div className="missed-list">
            <strong>Missing:</strong>{" "}
            {recipe.missedIngredients.map((ing) => ing.name).join(", ")}
          </div>
        )}
        <button
          className="add-to-plan-button"
          disabled={recipe.protein === null}
          onClick={() => onAddToPlan(recipe)}
        >
          Add to Plan
        </button>
      </div>
    </div>
  );
}
