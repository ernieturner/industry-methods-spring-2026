import { RecipeSearchResult } from './types'

const API_BASE_URL = 'https://api.spoonacular.com'
const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY

if (!API_KEY) {
  console.warn('VITE_SPOONACULAR_API_KEY is not set in environment variables')
}

export async function searchRecipesByIngredients(
  ingredients: string[],
  number: number = 12,
): Promise<RecipeSearchResult[]> {
  if (!API_KEY) {
    throw new Error('API key not configured')
  }

  if (ingredients.length === 0) {
    return []
  }

  const ingredientsList = ingredients.join(',')

  const response = await fetch(
    `${API_BASE_URL}/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${encodeURIComponent(ingredientsList)}&number=${number}&ranking=2`,
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data: RecipeSearchResult[] = await response.json()
  return data
}
