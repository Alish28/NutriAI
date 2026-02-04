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
    // Step 1 - Basic Info
    age: "",
    gender: "",
    height: "",
    weight: "",
    
    // Step 2 - Activity & Goals
    activity_level: "",
    health_goals: [],
    
    // Step 3 - Dietary Preferences
    dietary_preferences: [],
    allergies: "",
    preferred_cuisines: [],
    prioritize_local: false,
    
    // Step 4 - Budget & Shopping
    daily_budget: 25,
    weekly_budget: 150,
    shopping_style: "",
    
    // Step 5 - Home Cooking
    preferred_serving_size: 2,
    pantry_tracking: true,
    leftover_alerts: true,
    expiry_notifications: true,
    marketplace_access: false,
    
    // Step 6 - AI & Notifications
    personalization_strength: 75,
    nutrition_focus: [],
    ai_auto_adjust: true,
    email_notifications: true,
    sms_notifications: false,
    data_sharing: false,
  });

  const totalSteps = 7;

  // Scroll to top when step changes
  useEffect(() => {
    const container = document.querySelector('.onboarding-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateOnboardingData = (newData) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const handleCompleteOnboarding = async () => {
    try {
      // FIXED: Prepare data properly before sending
      const dataToSend = { ...onboardingData };

      // FIXED: Mark onboarding as complete
      dataToSend.onboarding_completed = true;

      // FIXED: Convert allergies string to array if needed
      if (typeof dataToSend.allergies === 'string' && dataToSend.allergies.trim()) {
        dataToSend.allergies = dataToSend.allergies.split(',').map(a => a.trim()).filter(Boolean);
      } else if (!dataToSend.allergies || dataToSend.allergies === '') {
        dataToSend.allergies = []; // Empty array instead of empty string
      }

      // FIXED: Ensure all array fields are proper arrays (not empty strings)
      const arrayFields = ['health_goals', 'dietary_preferences', 'allergies', 'preferred_cuisines', 'nutrition_focus'];
      arrayFields.forEach(field => {
        if (!Array.isArray(dataToSend[field])) {
          dataToSend[field] = [];
        }
        // If array is empty, it's okay - backend will convert to null
      });

      // Save all profile data to database
      await updateProfile(dataToSend);
      
      // Update localStorage to mark onboarding as complete
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        onboarding_completed: true
      }));
      
      // Move to completion step
      setCurrentStep(7);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save your profile. Please try again.');
    }
  };

  const calculateProgress = () => {
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={handleNextStep}
            onSkip={handleSkipStep}
          />
        );
      case 2:
        return (
          <ActivityGoalsStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 3:
        return (
          <DietaryPreferencesStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 4:
        return (
          <BudgetShoppingStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 5:
        return (
          <HomeCookingStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 6:
        return (
          <AINotificationsStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onComplete={handleCompleteOnboarding}
            onBack={handlePreviousStep}
          />
        );
      case 7:
        return <CompletionStep onGoToDashboard={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      {/* Header with Logo and Progress */}
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <span className="logo-mark">🍽</span>
          <span className="logo-text">NutriAI Onboarding</span>
        </div>
        
        {currentStep < 7 && (
          <div className="progress-section">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="step-indicator">
              Step {currentStep} of {totalSteps - 1}
            </div>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        {renderCurrentStep()}
      </div>
    </div>
  );
}