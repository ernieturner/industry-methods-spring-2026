import { useState } from "react";

interface IngredientInputProps {
  ingredients: string[];
  onAdd: (ingredient: string) => void;
  onRemove: (ingredient: string) => void;
}

export default function IngredientInput({
  ingredients,
  onAdd,
  onRemove,
}: IngredientInputProps) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      onAdd(trimmed);
      setValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAdd();
    }
  }

  return (
    <div className="ingredient-input">
      <div className="input-row">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter an ingredient..."
        />
        <button onClick={handleAdd} disabled={!value.trim()}>
          Add
        </button>
      </div>
      {ingredients.length > 0 && (
        <div className="tags">
          {ingredients.map((ing) => (
            <span key={ing} className="tag">
              {ing}
              <button className="tag-remove" onClick={() => onRemove(ing)}>
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
