export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  unitLong: string;
  unitShort: string;
  aisle: string;
  image: string;
  meta: string[];
  original: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  likes: number;
  usedIngredientCount: number;
  usedIngredients: Ingredient[];
  missedIngredientCount: number;
  missedIngredients: Ingredient[];
  unusedIngredients: Ingredient[];
  protein: number | null;
}

export interface Meal {
  recipeId: number;
  title: string;
  protein: number;
  addedAt: number;
}

export type WeightUnit = 'lbs' | 'kg';

export interface NutrientInfo {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeNutrition {
  nutrients: NutrientInfo[];
}

export interface RecipeInfoBulkItem {
  id: number;
  nutrition: RecipeNutrition;
}
