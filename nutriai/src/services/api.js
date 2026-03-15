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

// ============================================
// ADD THESE FUNCTIONS TO: nutriai/src/services/api.js
// Copy and paste AT THE END of your api.js file (before any export statements)
// ============================================

// ============================================
// PANTRY API FUNCTIONS
// ============================================

export const getPantryItems = async () => {
  const response = await fetch(`${API_URL}/pantry`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get pantry items');
  return data;
};

export const getExpiringSoon = async () => {
  const response = await fetch(`${API_URL}/pantry/expiring-soon`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get expiring items');
  return data;
};

export const getPantryStats = async () => {
  const response = await fetch(`${API_URL}/pantry/stats`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get pantry stats');
  return data;
};

export const addPantryItem = async (itemData) => {
  const response = await fetch(`${API_URL}/pantry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(itemData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to add pantry item');
  return data;
};

export const updatePantryItem = async (itemId, itemData) => {
  const response = await fetch(`${API_URL}/pantry/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(itemData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update pantry item');
  return data;
};

export const deletePantryItem = async (itemId) => {
  const response = await fetch(`${API_URL}/pantry/${itemId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete pantry item');
  return data;
};

// ============================================
// HOMECOOK API FUNCTIONS
// ============================================

export const applyHomecook = async (applicationData) => {
  const response = await fetch(`${API_URL}/homecook/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(applicationData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit application');
  return data;
};

export const getApplicationStatus = async () => {
  const response = await fetch(`${API_URL}/homecook/application`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get application status');
  return data;
};

export const toggleHomecookMode = async () => {
  const response = await fetch(`${API_URL}/homecook/toggle-mode`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to toggle homecook mode');
  return data;
};

export const getMyRecipes = async () => {
  const response = await fetch(`${API_URL}/homecook/my-recipes`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get recipes');
  return data;
};

export const addHomecookRecipe = async (recipeData) => {
  const response = await fetch(`${API_URL}/homecook/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(recipeData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to add recipe');
  return data;
};

export const updateHomecookRecipe = async (recipeId, recipeData) => {
  const response = await fetch(`${API_URL}/homecook/recipes/${recipeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(recipeData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update recipe');
  return data;
};

export const deleteHomecookRecipe = async (recipeId) => {
  const response = await fetch(`${API_URL}/homecook/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete recipe');
  return data;
};

// ============================================
// ADMIN API FUNCTIONS
// ============================================

export const getPendingApplications = async () => {
  const response = await fetch(`${API_URL}/admin/applications/pending`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get applications');
  return data;
};

export const getAllApplications = async (status = null) => {
  const url = status 
    ? `${API_URL}/admin/applications?status=${status}`
    : `${API_URL}/admin/applications`;
    
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get applications');
  return data;
};

export const approveApplication = async (applicationId) => {
  const response = await fetch(`${API_URL}/admin/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to approve application');
  return data;
};

export const rejectApplication = async (applicationId, rejectionReason) => {
  const response = await fetch(`${API_URL}/admin/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reject application');
  return data;
};

export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${API_URL}/admin/users?${params}` : `${API_URL}/admin/users`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get users');
  return data;
};

export const getAdminStats = async () => {
  const response = await fetch(`${API_URL}/admin/stats`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get statistics');
  return data;
};
export const createRecipe = async (recipeData) => {
  const response = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(recipeData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create recipe');
  return data;
};
 
export const getAllRecipes = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.cuisine) queryParams.append('cuisine', filters.cuisine);
  if (filters.min_price) queryParams.append('min_price', filters.min_price);
  if (filters.max_price) queryParams.append('max_price', filters.max_price);
  if (filters.dietary) queryParams.append('dietary', filters.dietary);
  
  const url = queryParams.toString() 
    ? `${API_URL}/recipes/all?${queryParams}`
    : `${API_URL}/recipes/all`;
    
  const response = await fetch(url, {
    method: 'GET',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get recipes');
  return data;
};
 
export const getRecipeById = async (id) => {
  const response = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'GET',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get recipe');
  return data;
};
 
export const updateRecipe = async (id, recipeData) => {
  const response = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(recipeData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update recipe');
  return data;
};
 
export const deleteRecipe = async (id) => {
  const response = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete recipe');
  return data;
};
 
export const toggleRecipeAvailability = async (id) => {
  const response = await fetch(`${API_URL}/recipes/${id}/toggle`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to toggle availability');
  return data;
};
// Logout (clear token)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};