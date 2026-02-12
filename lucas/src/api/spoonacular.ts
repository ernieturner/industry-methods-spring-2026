import type { Recipe, RecipeInfoBulkItem } from '../types/recipe';

interface SearchParams {
  ingredients: string[];
  number?: number;
  ranking?: 1 | 2;
  ignorePantry?: boolean;
}

const BASE_URL = 'https://api.spoonacular.com/recipes/findByIngredients';
const BULK_INFO_URL = 'https://api.spoonacular.com/recipes/informationBulk';

export async function searchRecipesByIngredients(params: SearchParams): Promise<Recipe[]> {
  const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Spoonacular API key is missing. Set VITE_SPOONACULAR_API_KEY in your .env file.');
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('ingredients', params.ingredients.join(','));
  url.searchParams.set('number', String(params.number ?? 12));
  url.searchParams.set('ranking', String(params.ranking ?? 1));
  url.searchParams.set('ignorePantry', String(params.ignorePantry ?? true));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data: Recipe[] = await response.json();
  return data;
}

export async function fetchRecipeNutritionBulk(ids: number[]): Promise<Map<number, number>> {
  const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Spoonacular API key is missing. Set VITE_SPOONACULAR_API_KEY in your .env file.');
  }

  const url = new URL(BULK_INFO_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('ids', ids.join(','));
  url.searchParams.set('includeNutrition', 'true');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data: RecipeInfoBulkItem[] = await response.json();
  const proteinMap = new Map<number, number>();

  for (const item of data) {
    const proteinNutrient = item.nutrition?.nutrients?.find((n) => n.name === 'Protein');
    proteinMap.set(item.id, proteinNutrient ? Math.round(proteinNutrient.amount) : 0);
  }

  return proteinMap;
}
