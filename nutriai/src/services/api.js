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

// Get user profile
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

// Logout (clear token)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};