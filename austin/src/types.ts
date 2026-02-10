export interface RecipeSearchResult {
  id: number
  title: string
  image: string
  imageType: string
  usedIngredients: UsedIngredient[]
  missedIngredients: MissedIngredient[]
  unusedIngredients: UnusedIngredient[]
}

export interface UsedIngredient {
  id: number
  name: string
  amount: number
  unit: string
  unitLong: string
  unitShort: string
  aisle: string
  image: string
  original: string
}

export interface MissedIngredient {
  id: number
  name: string
  amount: number
  unit: string
  unitLong: string
  unitShort: string
  aisle: string
  image: string
  original: string
}

export interface UnusedIngredient {
  id: number
  name: string
  amount: number
  unit: string
  unitLong: string
  unitShort: string
  aisle: string
  image: string
  original: string
}
