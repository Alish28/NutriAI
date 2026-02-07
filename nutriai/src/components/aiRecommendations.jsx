import { useState, useEffect } from "react";
import {
  getAIRecommendations,
  submitAIFeedback,
  createMeal,
} from "../services/api";
import "./AIRecommendations.css";

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("lunch");
  const [showSuccess, setShowSuccess] = useState(false);

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", icon: "🌅", time: "Morning" },
    { id: "lunch", label: "Lunch", icon: "🌞", time: "Afternoon" },
    { id: "dinner", label: "Dinner", icon: "🌙", time: "Evening" },
    { id: "snack", label: "Snack", icon: "🎯", time: "Anytime" },
  ];

  useEffect(() => {
    loadRecommendations();
  }, [selectedMealType]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await getAIRecommendations(selectedMealType);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error("Error loading AI recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (meal, recommendationId) => {
    try {
      // Add meal to today's log
      const today = new Date().toISOString().split("T")[0];
      await createMeal({
        meal_date: today,
        meal_type: selectedMealType,
        meal_name: meal.meal_name,
        description: meal.description || "Recommended by AI",
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });

      // Submit positive feedback
      if (recommendationId) {
        await submitAIFeedback(recommendationId, true, meal.id);
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload recommendations
      loadRecommendations();
    } catch (error) {
      console.error("Error accepting recommendation:", error);
      alert("Failed to add meal. Please try again.");
    }
  };

  const handleRejectRecommendation = async (meal, recommendationId) => {
    try {
      // Submit negative feedback
      if (recommendationId) {
        await submitAIFeedback(recommendationId, false, meal.id);
      }

      // Remove from recommendations list
      setRecommendations((prev) => prev.filter((r) => r.id !== meal.id));

      // Show feedback message
      alert("Thanks for your feedback! This meal won't be recommended again.");
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      alert("Failed to process feedback. Please try again.");
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return "#22c55e"; // Green
    if (score >= 60) return "#f59e0b"; // Orange
    return "#3b82f6"; // Blue
  };

  const getConfidenceLabel = (score) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Worth Trying";
  };

  return (
    <div className="ai-recommendations-card">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-title-section">
          <h3 className="ai-title">🤖 AI Meal Recommendations</h3>
          <p className="ai-subtitle">
            Personalized suggestions based on your goals and preferences
          </p>
        </div>
        <button
          className="ai-refresh-btn"
          onClick={loadRecommendations}
          disabled={loading}
          title="Get new recommendations"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="ai-success-banner">
          ✅ Meal added successfully! Keep up the great work!
        </div>
      )}

      {/* Meal Type Selector */}
      <div className="ai-meal-type-selector">
        {mealTypes.map((type) => (
          <button
            key={type.id}
            className={`ai-meal-type-btn ${selectedMealType === type.id ? "active" : ""}`}
            onClick={() => setSelectedMealType(type.id)}
          >
            <span className="meal-type-icon">{type.icon}</span>
            <span className="meal-type-label">{type.label}</span>
            <span className="meal-type-time">{type.time}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          <p>AI is analyzing your profile...</p>
        </div>
      )}

      {/* Recommendations List */}
      {!loading && recommendations.length === 0 && (
        <div className="ai-empty-state">
          <div className="empty-icon">🍽️</div>
          <p>No recommendations available right now.</p>
          <button className="btn-refresh" onClick={loadRecommendations}>
            Try Again
          </button>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="ai-recommendations-list">
          {recommendations.map((meal, index) => (
            <div key={meal.id || index} className="ai-recommendation-card">
              {/* Rank Badge */}
              <div className="ai-rank-badge">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                <span className="rank-text">#{index + 1}</span>
              </div>

              {/* Confidence Score */}
              <div
                className="ai-confidence-bar"
                style={{
                  background: getConfidenceColor(meal.confidence_score),
                  width: `${meal.confidence_score}%`,
                }}
              />

              {/* Meal Info */}
              <div className="ai-meal-info">
                <div className="ai-meal-header">
                  <h4 className="ai-meal-name">{meal.meal_name}</h4>
                  <div
                    className="ai-confidence-badge"
                    style={{
                      background: getConfidenceColor(meal.confidence_score),
                    }}
                  >
                    {meal.confidence_score}%{" "}
                    {getConfidenceLabel(meal.confidence_score)}
                  </div>
                </div>

                <p className="ai-meal-description">{meal.description}</p>

                {/* Cuisine & Cost */}
                <div className="ai-meal-meta">
                  {meal.cuisine_type && (
                    <span className="meta-tag">🍴 {meal.cuisine_type}</span>
                  )}
                  {meal.estimated_cost && (
                    <span className="meta-tag">💰 ${meal.estimated_cost}</span>
                  )}
                  {meal.prep_time_minutes && (
                    <span className="meta-tag">
                      ⏱️ {meal.prep_time_minutes} min
                    </span>
                  )}
                </div>

                {/* Nutrition Facts */}
                <div className="ai-nutrition-summary">
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🔥</span>
                    <span className="nutrition-value">
                      {Math.round(meal.calories)}
                    </span>
                    <span className="nutrition-label">cal</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">💪</span>
                    <span className="nutrition-value">
                      {Math.round(meal.protein)}
                    </span>
                    <span className="nutrition-label">g protein</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🍞</span>
                    <span className="nutrition-value">
                      {Math.round(meal.carbs)}
                    </span>
                    <span className="nutrition-label">g carbs</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🥑</span>
                    <span className="nutrition-value">
                      {Math.round(meal.fats)}
                    </span>
                    <span className="nutrition-label">g fats</span>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="ai-explanation">
                  <div className="explanation-header">
                    <span className="explanation-icon">💡</span>
                    <span className="explanation-title">Why This Meal?</span>
                  </div>
                  <p className="explanation-text">{meal.reason}</p>
                </div>

                {/* Dietary Tags */}
                {meal.dietary_tags && meal.dietary_tags.length > 0 && (
                  <div className="ai-dietary-tags">
                    {meal.dietary_tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="dietary-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="ai-actions">
                  <button
                    className="ai-btn ai-btn-accept"
                    onClick={() =>
                      handleAcceptRecommendation(meal, meal.recommendation_id)
                    }
                  >
                    ✓ Add to Today
                  </button>
                  <button
                    className="ai-btn ai-btn-reject"
                    onClick={() =>
                      handleRejectRecommendation(meal, meal.recommendation_id)
                    }
                  >
                    ✕ Not Interested
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Learning Footer */}
      <div className="ai-footer">
        <p className="ai-footer-text">
          🧠 AI learns from your choices and gets smarter over time
        </p>
      </div>
    </div>
  );
}
