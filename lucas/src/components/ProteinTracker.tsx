import type { Meal, WeightUnit } from "../types/recipe";

interface ProteinTrackerProps {
  bodyWeight: number;
  weightUnit: WeightUnit;
  meals: Meal[];
  onBodyWeightChange: (weight: number) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
  onRemoveMeal: (addedAt: number) => void;
}

export default function ProteinTracker({
  bodyWeight,
  weightUnit,
  meals,
  onBodyWeightChange,
  onWeightUnitChange,
  onRemoveMeal,
}: ProteinTrackerProps) {
  const dailyGoal = Math.round(
    weightUnit === "lbs" ? bodyWeight : bodyWeight * 2.2
  );
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const percentage = dailyGoal > 0 ? Math.min(Math.round((totalProtein / dailyGoal) * 100), 100) : 0;

  return (
    <div className="protein-tracker">
      <h2>Daily Protein Tracker</h2>

      <div className="weight-input-section">
        <label htmlFor="body-weight">Body Weight:</label>
        <input
          id="body-weight"
          type="number"
          min={0}
          value={bodyWeight}
          onChange={(e) => onBodyWeightChange(Number(e.target.value))}
        />
        <div className="unit-toggle">
          <button
            className={weightUnit === "lbs" ? "active" : ""}
            onClick={() => onWeightUnitChange("lbs")}
          >
            lbs
          </button>
          <button
            className={weightUnit === "kg" ? "active" : ""}
            onClick={() => onWeightUnitChange("kg")}
          >
            kg
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="progress-label">
        {totalProtein}g / {dailyGoal}g &mdash; {percentage}%
      </p>

      {meals.length > 0 && (
        <div className="meal-list">
          <h3>Today's Meals</h3>
          {meals.map((meal) => (
            <div key={meal.addedAt} className="meal-item">
              <span className="meal-name">{meal.title}</span>
              <span className="meal-protein">{meal.protein}g</span>
              <button
                className="meal-remove"
                onClick={() => onRemoveMeal(meal.addedAt)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
