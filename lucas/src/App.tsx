import { useState, useEffect } from 'react';
import './App.css';
import type { Recipe, Meal, WeightUnit } from './types/recipe';
import { searchRecipesByIngredients, fetchRecipeNutritionBulk } from './api/spoonacular';
import IngredientInput from './components/IngredientInput';
import RecipeList from './components/RecipeList';
import ProteinTracker from './components/ProteinTracker';

function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bodyWeight, setBodyWeight] = useState<number>(() => {
    const stored = localStorage.getItem('proteinTracker_bodyWeight');
    return stored ? Number(stored) : 150;
  });

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    const stored = localStorage.getItem('proteinTracker_weightUnit');
    return stored === 'kg' ? 'kg' : 'lbs';
  });

  const [meals, setMeals] = useState<Meal[]>(() => {
    const stored = localStorage.getItem('proteinTracker_meals');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('proteinTracker_bodyWeight', String(bodyWeight));
  }, [bodyWeight]);

  useEffect(() => {
    localStorage.setItem('proteinTracker_weightUnit', weightUnit);
  }, [weightUnit]);

  useEffect(() => {
    localStorage.setItem('proteinTracker_meals', JSON.stringify(meals));
  }, [meals]);

  function handleAddIngredient(ingredient: string) {
    setIngredients((prev) => [...prev, ingredient]);
  }

  function handleRemoveIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((i) => i !== ingredient));
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRecipesByIngredients({ ingredients });
      const recipesWithNullProtein = results.map((r) => ({ ...r, protein: null }));
      setRecipes(recipesWithNullProtein);

      const ids = results.map((r) => r.id);
      if (ids.length > 0) {
        const proteinMap = await fetchRecipeNutritionBulk(ids);
        setRecipes((prev) =>
          prev.map((r) => ({
            ...r,
            protein: proteinMap.get(r.id) ?? null,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToPlan(recipe: Recipe) {
    if (recipe.protein === null) return;
    const meal: Meal = {
      recipeId: recipe.id,
      title: recipe.title,
      protein: recipe.protein,
      addedAt: Date.now(),
    };
    setMeals((prev) => [...prev, meal]);
  }

  function handleRemoveMeal(addedAt: number) {
    setMeals((prev) => prev.filter((m) => m.addedAt !== addedAt));
  }

  return (
    <>
      <h1>Recipe Finder</h1>
      <ProteinTracker
        bodyWeight={bodyWeight}
        weightUnit={weightUnit}
        meals={meals}
        onBodyWeightChange={setBodyWeight}
        onWeightUnitChange={setWeightUnit}
        onRemoveMeal={handleRemoveMeal}
      />
      <IngredientInput ingredients={ingredients} onAdd={handleAddIngredient} onRemove={handleRemoveIngredient} />
      <button className="search-button" onClick={handleSearch} disabled={ingredients.length === 0 || loading}>
        {loading ? 'Searching...' : 'Find Recipes'}
      </button>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading recipes...</div>}
      {!loading && !error && recipes.length === 0 && ingredients.length > 0 && (
        <div className="empty-state">Add ingredients and click "Find Recipes" to get started.</div>
      )}
      {!loading && recipes.length > 0 && <RecipeList recipes={recipes} onAddToPlan={handleAddToPlan} />}
    </>
  );
}

export default App;
