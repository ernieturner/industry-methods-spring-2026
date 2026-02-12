# Quick Start Guide

## 1. Get Your API Key

1. Go to https://spoonacular.com/food-api
2. Sign up for a free account (if you don't have one)
3. Copy your API key from the dashboard

## 2. Set Up Environment

Create `.env.local` in the `austin/` directory:
```
VITE_SPOONACULAR_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual API key.

## 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 4. Using the App

1. Enter ingredients you have in your fridge (e.g., "chicken", "tomato", "garlic")
2. Click "Add" after each ingredient (or press Enter)
3. Click "Search Recipes" to find matching recipes
4. Browse the results to see:
   - Match percentage (ingredients you have)
   - Ingredients you have available (with ✓)
   - Ingredients you still need (with ◦)
5. Click "View Recipe →" to see the full recipe details

## 5. Verify Type Safety

Always run type checking before committing:
```bash
npm run typecheck
```

## Troubleshooting

- **"API key not configured" error**: Make sure you added your key to `.env.local` and restarted the dev server
- **No results found**: Try different ingredients or check that your API key is valid
- **Build errors**: Run `npm install` again to ensure all dependencies are installed
