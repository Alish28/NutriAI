const API_URL = 'http://localhost:5000/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Register user
export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  
  return data;
};

// Login user
export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  return data;
};

// Get user profile (basic - from auth)
export const getProfile = async () => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get profile');
  }
  
  return data;
};

//Profile section

// Get full user profile with all fields
export const getFullProfile = async () => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get profile');
  }
  
  return data;
};

// Update user profile
export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }
  
  return data;
};

// Update password
export const updatePassword = async (passwordData) => {
  const response = await fetch(`${API_URL}/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(passwordData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update password');
  }
  
  return data;
};

// Export user data
export const exportUserData = async () => {
  const response = await fetch(`${API_URL}/profile/export`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to export data');
  }
  
  return data;
};

// Delete account
export const deleteAccount = async (password) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }
  
  return data;
};

// ========== MEAL ENDPOINTS (EXISTING) ==========

// Create meal
export const createMeal = async (mealData) => {
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(mealData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create meal');
  }
  
  return data;
};

// Get all meals
export const getMeals = async () => {
  const response = await fetch(`${API_URL}/meals`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get meals');
  }
  
  return data;
};

// Get meals by date
export const getMealsByDate = async (date) => {
  const response = await fetch(`${API_URL}/meals/date/${date}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get meals');
  }
  
  return data;
};

// Get meals by week
export const getMealsByWeek = async (startDate, endDate) => {
  const response = await fetch(`${API_URL}/meals/week?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get meals');
  }
  
  return data;
};

// Update meal
export const updateMeal = async (mealId, mealData) => {
  const response = await fetch(`${API_URL}/meals/${mealId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(mealData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update meal');
  }
  
  return data;
};

// Delete meal
export const deleteMeal = async (mealId) => {
  const response = await fetch(`${API_URL}/meals/${mealId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete meal');
  }
  
  return data;
};

// Get nutrition summary
export const getNutritionSummary = async (date) => {
  const response = await fetch(`${API_URL}/meals/nutrition/${date}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get nutrition summary');
  }
  
  return data;
};

// Get 7-day nutrition trends
export const getWeeklyTrends = async () => {
  const response = await fetch(`${API_URL}/analytics/weekly`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get weekly trends');
  }
  
  return data;
};

// Get streak data
export const getStreak = async () => {
  const response = await fetch(`${API_URL}/analytics/streak`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get streak');
  }
  
  return data;
};

// Get weekly averages vs goals
export const getWeeklyAverages = async () => {
  const response = await fetch(`${API_URL}/analytics/weekly-averages`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get weekly averages');
  }
  
  return data;
};
// ========== AI RECOMMENDATION ENDPOINTS ==========

// Get AI meal recommendations
export const getAIRecommendations = async (mealType, date = null) => {
  const dateParam = date || new Date().toISOString().split('T')[0];
  const response = await fetch(`${API_URL}/ai/recommendations?meal_type=${mealType}&date=${dateParam}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get AI recommendations');
  }
  
  return data;
};

// Submit feedback on AI recommendation
export const submitAIFeedback = async (recommendationId, accepted, mealTemplateId) => {
  const response = await fetch(`${API_URL}/ai/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      recommendation_id: recommendationId,
      accepted,
      meal_template_id: mealTemplateId
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit feedback');
  }
  
  return data;
};

// Get AI insights about eating patterns
export const getAIInsights = async () => {
  const response = await fetch(`${API_URL}/ai/insights`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get AI insights');
  }
  
  return data;
};
// Logout (clear token)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};