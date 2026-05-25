import { useEffect, useState } from "react";
import { getWeeklyMealPlan } from "../services/api";
import "./weeklyMealPlan.css";

export default function WeeklyMealPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getWeeklyMealPlan();
      setPlan(response.data);
    } catch (err) {
      setError(err.message || "Failed to load weekly plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  if (loading) {
    return (
      <div className="weekly-plan-card">
        <div className="weekly-plan-header">
          <div>
            <h3>Weekly Meal Plan</h3>
            <p>Preparing your 7-day plan...</p>
          </div>
        </div>
        <div className="weekly-plan-loading">Loading plan</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-plan-card">
        <div className="weekly-plan-header">
          <div>
            <h3>Weekly Meal Plan</h3>
            <p>Could not generate plan</p>
          </div>
          <button onClick={loadPlan}>Retry</button>
        </div>
        <div className="weekly-plan-error">{error}</div>
      </div>
    );
  }

  const previewDays = plan?.days?.slice(0, 3) || [];

  return (
    <div className="weekly-plan-card">
      <div className="weekly-plan-header">
        <div>
          <h3>Weekly Meal Plan</h3>
          <p>AI-generated plan using your goals and budget</p>
        </div>
        <button onClick={loadPlan}>Refresh</button>
      </div>

      {plan?.summary && (
        <div className="weekly-plan-summary">
          <div>
            <span>{plan.summary.average_daily_calories || 0}</span>
            <small>avg cal/day</small>
          </div>
          <div>
            <span>{plan.summary.average_daily_protein || 0}g</span>
            <small>avg protein/day</small>
          </div>
          <div>
            <span>NPR {plan.summary.estimated_weekly_cost || 0}</span>
            <small>weekly estimate</small>
          </div>
        </div>
      )}

      <div className="weekly-plan-days">
        {previewDays.map((day) => (
          <div className="weekly-plan-day" key={day.date}>
            <div className="weekly-plan-day-head">
              <strong>{day.day_name}</strong>
              <span>{day.date}</span>
            </div>

            <div className="weekly-plan-meals">
              {day.meals.map((meal) => (
                <div className="weekly-plan-meal" key={`${day.date}-${meal.meal_type}`}>
                  <span className="meal-type">{meal.meal_type}</span>
                  <span className="meal-name">{meal.meal_name}</span>
                  <span className="meal-meta">
                    {Math.round(meal.calories || 0)} cal
                    {meal.protein ? ` · ${Math.round(meal.protein)}g protein` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="weekly-plan-footer">
        Showing next 3 days from the 7-day plan.
      </div>
    </div>
  );
}