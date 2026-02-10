# Fridge Recipe Finder

A TypeScript React application built with Vite that helps users discover recipes based on ingredients they have available.

## Features

- Search for recipes by ingredients
- View ingredient matches and missing ingredients
- Responsive design for mobile and desktop
- Powered by the Spoonacular Food API

## Prerequisites

- Node.js 16+ 
- npm or yarn
- A free API key from [Spoonacular](https://spoonacular.com/food-api)

## Setup

1. **Get your API key:**
   - Visit https://spoonacular.com/food-api
   - Sign up for a free account
   - Copy your API key

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API key:
   ```
   VITE_SPOONACULAR_API_KEY=your_api_key_here
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

- **Development server:**
  ```bash
  npm run dev
  ```
  Open http://localhost:5173 in your browser

- **Build for production:**
  ```bash
  npm run build
  ```

- **Preview production build:**
  ```bash
  npm run preview
  ```

- **Type check:**
  ```bash
  npm run typecheck
  ```
  This runs TypeScript type checking. All code is fully type-safe and this should always pass.

## Project Structure

```
src/
├── components/
│   ├── IngredientInput.tsx   # Component for adding ingredients
│   ├── RecipeCard.tsx        # Component to display individual recipe
│   └── SearchResults.tsx     # Component to display search results
├── styles/
│   ├── IngredientInput.css
│   ├── RecipeCard.css
│   └── SearchResults.css
├── App.tsx                   # Main application component
├── App.css                   # Application styles
├── api.ts                    # Spoonacular API integration
├── types.ts                  # TypeScript type definitions
├── main.tsx                  # React entry point
└── index.css                 # Global styles
```

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Language with strict type checking
- **Vite** - Build tool and dev server
- **Spoonacular API** - Recipe data source

## Notes

- This is a client-only application with no backend
- All code is fully TypeScript with strict type checking enabled
- The typecheck script must always pass
