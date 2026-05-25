import { useState, useEffect } from "react";
import { updateProfile } from "../services/api";
import BasicInfoStep from "./steps/basicInfoStep";
import ActivityGoalsStep from "./steps/activityGoalsStep";
import DietaryPreferencesStep from "./steps/dietaryPreferencesStep";
import BudgetShoppingStep from "./steps/budgetShoppingStep";
import HomeCookingStep from "./steps/homeCookingStep";
import AINotificationsStep from "./steps/aiNotificationsStep";
import CompletionStep from "./steps/completionStep";
import "./onboarding.css";

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    phone_number: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activity_level: "",
    health_goals: [],
    dietary_preferences: [],
    allergies: "",
    preferred_cuisines: [],
    daily_budget: 400,
    weekly_budget: 2800,
    shopping_style: "",
    preferred_serving_size: 2,
    personalization_strength: 75,
    nutrition_focus: [],
    ai_auto_adjust: true,
  });

  const totalSteps = 7;

  useEffect(() => {
    document.querySelector(".onboarding-container")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const updateOnboardingData = (newData) => {
    setOnboardingData((prev) => ({ ...prev, ...newData }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const cleanNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleCompleteOnboarding = async () => {
    try {
      const dataToSend = {
        ...onboardingData,
        onboarding_completed: true,
        age: cleanNumber(onboardingData.age),
        height: cleanNumber(onboardingData.height),
        weight: cleanNumber(onboardingData.weight),
        daily_budget: cleanNumber(onboardingData.daily_budget) || 400,
        weekly_budget: (cleanNumber(onboardingData.daily_budget) || 400) * 7,
        preferred_serving_size: cleanNumber(onboardingData.preferred_serving_size) || 2,
        personalization_strength: cleanNumber(onboardingData.personalization_strength) || 75,
        allergies:
          typeof onboardingData.allergies === "string" && onboardingData.allergies.trim()
            ? onboardingData.allergies.split(",").map((a) => a.trim()).filter(Boolean)
            : [],
      };

      ["health_goals", "dietary_preferences", "preferred_cuisines", "nutrition_focus"].forEach((field) => {
        if (!Array.isArray(dataToSend[field])) dataToSend[field] = [];
      });

      await updateProfile(dataToSend);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, onboarding_completed: true }));

      setCurrentStep(7);
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      alert(error.message || "Failed to save your profile. Please try again.");
    }
  };

  const calculateProgress = () => ((currentStep - 1) / (totalSteps - 1)) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep data={onboardingData} updateData={updateOnboardingData} onNext={handleNextStep} />;
      case 2:
        return <ActivityGoalsStep data={onboardingData} updateData={updateOnboardingData} onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 3:
        return <DietaryPreferencesStep data={onboardingData} updateData={updateOnboardingData} onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 4:
        return <BudgetShoppingStep data={onboardingData} updateData={updateOnboardingData} onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 5:
        return <HomeCookingStep data={onboardingData} updateData={updateOnboardingData} onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 6:
        return <AINotificationsStep data={onboardingData} updateData={updateOnboardingData} onComplete={handleCompleteOnboarding} onBack={handlePreviousStep} />;
      case 7:
        return <CompletionStep onGoToDashboard={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <span className="logo-mark">N</span>
          <span className="logo-text">NutriAI Onboarding</span>
        </div>

        {currentStep < 7 && (
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${calculateProgress()}%` }} />
            </div>
            <div className="step-indicator">Step {currentStep} of {totalSteps - 1}</div>
          </div>
        )}
      </div>

      <div className="onboarding-content">{renderCurrentStep()}</div>
    </div>
  );
}