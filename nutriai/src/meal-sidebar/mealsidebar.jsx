import { useState, useEffect } from "react";
import { createMeal, getMealsByDate, deleteMeal } from "../services/api";
import "./MealSidebar.css";

export default function MealSidebar({ isOpen, onClose }) {
  const [date, setDate] = useState("");
  const [mealType, setMealType] = useState("");
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [addedMeals, setAddedMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", icon: "🌅" },
    { id: "lunch", label: "Lunch", icon: "🌞" },
    { id: "dinner", label: "Dinner", icon: "🌙" },
    { id: "snack", label: "Snack", icon: "🍎" },
  ];

  // Set today's date by default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Load meals when date changes
  useEffect(() => {
    if (date && isOpen) {
      loadMeals();
    }
  }, [date, isOpen]);

  const loadMeals = async () => {
    try {
      const response = await getMealsByDate(date);
      setAddedMeals(response.data.meals || []);
    } catch (err) {
      console.error("Error loading meals:", err);
      setAddedMeals([]);
    }
  };

  const handleSaveMeal = async () => {
    setError("");

    if (!mealType || !mealName.trim()) {
      setError("Please select a meal type and enter a meal name");
      return;
    }

    setLoading(true);

    try {
      await createMeal({
        meal_date: date,
        meal_type: mealType,
        meal_name: mealName.trim(),
        description: description.trim(),
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
      });

      // Reload meals
      await loadMeals();

      // Reset form
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add meal");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) return;

    try {
      await deleteMeal(id);
      await loadMeals();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete meal");
    }
  };

  const resetForm = () => {
    setMealType("");
    setMealName("");
    setDescription("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setError("");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const getMealIcon = (type) => {
    const meal = mealTypes.find((m) => m.id === type);
    return meal ? meal.icon : "🍽️";
  };

  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", options);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`meal-sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`meal-sidebar ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="meal-sidebar-header">
          <h2 className="meal-sidebar-title">Add Meal</h2>
          <button className="meal-sidebar-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="meal-sidebar-content">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Date Selection */}
          <div className="meal-date-section">
            <label htmlFor="meal-date">Date</label>
            <input
              id="meal-date"
              type="date"
              className="meal-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Meal Type Selection */}
          <div className="meal-type-section">
            <label>Meal Type *</label>
            <div className="meal-type-grid">
              {mealTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`meal-type-btn ${mealType === type.id ? "selected" : ""}`}
                  onClick={() => setMealType(type.id)}
                  disabled={loading}
                >
                  <span className="meal-type-icon">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Details */}
          <div className="meal-details-section">
            <div className="meal-input-group">
              <label htmlFor="meal-name">Meal Name *</label>
              <input
                id="meal-name"
                type="text"
                className="meal-input"
                placeholder="e.g., Chicken Salad"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="meal-input-group">
              <label htmlFor="meal-description">Description (Optional)</label>
              <textarea
                id="meal-description"
                className="meal-textarea"
                placeholder="Add notes about your meal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows="3"
              />
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="meal-details-section">
            <label>Nutrition Information (Optional)</label>
            <div className="nutrition-grid">
              <div className="meal-input-group">
                <label htmlFor="meal-calories">Calories</label>
                <input
                  id="meal-calories"
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  disabled={loading}
                  min="0"
                />
              </div>
              <div className="meal-input-group">
                <label htmlFor="meal-protein">Protein (g)</label>
                <input
                  id="meal-protein"
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  disabled={loading}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="meal-input-group">
                <label htmlFor="meal-carbs">Carbs (g)</label>
                <input
                  id="meal-carbs"
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  disabled={loading}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="meal-input-group">
                <label htmlFor="meal-fats">Fats (g)</label>
                <input
                  id="meal-fats"
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  disabled={loading}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Added Meals List */}
          {addedMeals.length > 0 && (
            <div className="added-meals-section">
              <h3>
                Meals for {formatDate(date)} ({addedMeals.length})
              </h3>
              <div className="meals-list">
                {addedMeals.map((meal) => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-card-header">
                      <div className="meal-card-type">
                        <span>{getMealIcon(meal.meal_type)}</span>
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </div>
                      <button
                        className="meal-card-delete"
                        onClick={() => handleDeleteMeal(meal.id)}
                        aria-label="Delete meal"
                        type="button"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="meal-card-name">{meal.meal_name}</div>
                    {meal.description && (
                      <div className="meal-card-description">{meal.description}</div>
                    )}
                    <div className="meal-card-nutrition">
                      <span>🔥 {meal.calories} cal</span>
                      <span>💪 {meal.protein}g protein</span>
                      <span>🍞 {meal.carbs}g carbs</span>
                      <span>🥑 {meal.fats}g fats</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {addedMeals.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-text">
                No meals added for {formatDate(date)} yet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="meal-sidebar-footer">
          <button
            type="button"
            className="meal-btn meal-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="meal-btn meal-btn-save"
            onClick={handleSaveMeal}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Meal"}
          </button>
        </div>
      </div>
    </>
  );
}