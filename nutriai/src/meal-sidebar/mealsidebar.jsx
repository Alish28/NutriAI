import { useState, useEffect } from "react";
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

  // Set today's date by default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", icon: "🌅" },
    { id: "lunch", label: "Lunch", icon: "🌞" },
    { id: "dinner", label: "Dinner", icon: "🌙" },
    { id: "snack", label: "Snack", icon: "🍎" },
  ];

  const handleSaveMeal = () => {
    if (!mealType || !mealName) {
      alert("Please select a meal type and enter a meal name");
      return;
    }

    const newMeal = {
      id: Date.now(),
      date,
      type: mealType,
      name: mealName,
      description,
      calories: calories || "0",
      protein: protein || "0",
      carbs: carbs || "0",
      fats: fats || "0",
    };

    setAddedMeals([...addedMeals, newMeal]);

    // Reset form
    setMealType("");
    setMealName("");
    setDescription("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");

    alert("Meal added successfully!");
  };

  const handleDeleteMeal = (id) => {
    setAddedMeals(addedMeals.filter((meal) => meal.id !== id));
  };

  const handleCancel = () => {
    // Reset form
    setMealType("");
    setMealName("");
    setDescription("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    onClose();
  };

  const getMealIcon = (type) => {
    const meal = mealTypes.find((m) => m.id === type);
    return meal ? meal.icon : "🍽️";
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
          <button className="meal-sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="meal-sidebar-content">
          {/* Date Selection */}
          <div className="meal-date-section">
            <label>Date</label>
            <input
              type="date"
              className="meal-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Meal Type */}
          <div className="meal-type-section">
            <label>Meal Type</label>
            <div className="meal-type-grid">
              {mealTypes.map((type) => (
                <button
                  key={type.id}
                  className={`meal-type-btn ${
                    mealType === type.id ? "selected" : ""
                  }`}
                  onClick={() => setMealType(type.id)}
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
              <label>Meal Name *</label>
              <input
                type="text"
                className="meal-input"
                placeholder="e.g., Chicken Salad"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </div>

            <div className="meal-input-group">
              <label>Description (Optional)</label>
              <textarea
                className="meal-textarea"
                placeholder="Add notes about your meal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="meal-details-section">
            <label>Nutrition Information (Optional)</label>
            <div className="nutrition-grid">
              <div className="meal-input-group">
                <label>Calories</label>
                <input
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
              <div className="meal-input-group">
                <label>Protein (g)</label>
                <input
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
              <div className="meal-input-group">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>
              <div className="meal-input-group">
                <label>Fats (g)</label>
                <input
                  type="number"
                  className="nutrition-input-small"
                  placeholder="0"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Added Meals List */}
          {addedMeals.length > 0 && (
            <div className="added-meals-section">
              <h3>Today's Meals ({addedMeals.length})</h3>
              {addedMeals.map((meal) => (
                <div key={meal.id} className="meal-card">
                  <div className="meal-card-header">
                    <div className="meal-card-type">
                      <span>{getMealIcon(meal.type)}</span>
                      {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                    </div>
                    <button
                      className="meal-card-delete"
                      onClick={() => handleDeleteMeal(meal.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="meal-card-name">{meal.name}</div>
                  <div className="meal-card-nutrition">
                    <span>🔥 {meal.calories} cal</span>
                    <span>💪 {meal.protein}g protein</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {addedMeals.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-text">
                No meals added yet. Start tracking your meals!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="meal-sidebar-footer">
          <button className="meal-btn meal-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="meal-btn meal-btn-save" onClick={handleSaveMeal}>
            Add Meal
          </button>
        </div>
      </div>
    </>
  );
}