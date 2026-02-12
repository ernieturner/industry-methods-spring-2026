import type { Recipe } from "../types/recipe";
import RecipeCard from "./RecipeCard";

interface RecipeListProps {
  recipes: Recipe[];
  onAddToPlan: (recipe: Recipe) => void;
}

export default function RecipeList({ recipes, onAddToPlan }: RecipeListProps) {
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onAddToPlan={onAddToPlan} />
      ))}
    </div>
  );
}
