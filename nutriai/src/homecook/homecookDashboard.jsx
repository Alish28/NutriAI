// nutriai/src/components/homecookDashboard.jsx
// Homecook recipe management dashboard

import { useState, useEffect } from 'react';
import { 
  getMyRecipes, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe,
  toggleRecipeAvailability 
} from '../services/api';
import './homecookDashboard.css';

export default function HomecookDashboard({ user, onSwitchToConsumer }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    recipe_name: '',
    description: '',
    cuisine_type: 'Nepali',
    price: '',
    prep_time_minutes: '30',
    servings: '2',
    ingredients: '',
    instructions: '',
    is_vegan: false,
    is_vegetarian: false,
    is_gluten_free: false,
    is_dairy_free: false
  });

  const cuisineTypes = [
    'Nepali', 'Indian', 'Chinese', 'Italian', 'Mexican', 
    'Thai', 'Japanese', 'American', 'Continental', 'Other'
  ];

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyRecipes();
      setRecipes(response.recipes || []);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setForm({
      recipe_name: '',
      description: '',
      cuisine_type: 'Nepali',
      price: '',
      prep_time_minutes: '30',
      servings: '2',
      ingredients: '',
      instructions: '',
      is_vegan: false,
      is_vegetarian: false,
      is_gluten_free: false,
      is_dairy_free: false
    });
    setEditingRecipe(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.recipe_name || !form.description || !form.price) {
      setError('Please fill in recipe name, description, and price');
      return;
    }

    try {
      const recipeData = {
        ...form,
        price: parseFloat(form.price),
        prep_time_minutes: parseInt(form.prep_time_minutes),
        servings: parseInt(form.servings),
        ingredients: form.ingredients.split('\n').filter(i => i.trim()),
        instructions: form.instructions.split('\n').filter(i => i.trim())
      };

      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipeData);
        alert('✅ Recipe updated successfully!');
      } else {
        await createRecipe(recipeData);
        alert('✅ Recipe created successfully!');
      }

      resetForm();
      loadRecipes();
    } catch (err) {
      setError(err.message || 'Failed to save recipe');
    }
  };

  const handleEdit = (recipe) => {
    setForm({
      recipe_name: recipe.recipe_name,
      description: recipe.description,
      cuisine_type: recipe.cuisine_type,
      price: recipe.price.toString(),
      prep_time_minutes: recipe.prep_time_minutes.toString(),
      servings: recipe.servings.toString(),
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.join('\n') 
        : (typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients).join('\n') : ''),
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions.join('\n')
        : (typeof recipe.instructions === 'string' ? JSON.parse(recipe.instructions).join('\n') : ''),
      is_vegan: recipe.is_vegan,
      is_vegetarian: recipe.is_vegetarian,
      is_gluten_free: recipe.is_gluten_free,
      is_dairy_free: recipe.is_dairy_free
    });
    setEditingRecipe(recipe);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await deleteRecipe(id);
      alert('✅ Recipe deleted successfully!');
      loadRecipes();
    } catch (err) {
      setError(err.message || 'Failed to delete recipe');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await toggleRecipeAvailability(id);
      loadRecipes();
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
    }
  };

  if (loading) {
    return (
      <div className="homecook-dashboard">
        <div className="loading-state">
          <div className="spinner">👨‍🍳</div>
          <p>Loading your recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homecook-dashboard">
      {/* Header */}
      <div className="homecook-header">
        <div className="header-left">
          <h1 className="homecook-title">👨‍🍳 Homecook Dashboard</h1>
          <p className="homecook-subtitle">
            Manage your recipes and view orders
          </p>
        </div>
        <div className="header-right">
          <button 
            className="btn-switch-mode"
            onClick={onSwitchToConsumer}
          >
            🔄 Switch to Consumer Mode
          </button>
          <button 
            className="btn-add-recipe"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            ➕ Add Recipe
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close">✕</button>
        </div>
      )}

      {/* Add/Edit Recipe Form */}
      {showAddForm && (
        <div className="recipe-form-overlay" onClick={() => resetForm()}>
          <div className="recipe-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>{editingRecipe ? '✏️ Edit Recipe' : '➕ Add New Recipe'}</h2>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>

            <form className="recipe-form" onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="recipe_name">Recipe Name *</label>
                  <input
                    id="recipe_name"
                    type="text"
                    name="recipe_name"
                    value={form.recipe_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Dal Bhat Special"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Describe your delicious recipe..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cuisine_type">Cuisine Type</label>
                    <select
                      id="cuisine_type"
                      name="cuisine_type"
                      value={form.cuisine_type}
                      onChange={handleInputChange}
                    >
                      {cuisineTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Price (NPR) *</label>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleInputChange}
                      placeholder="500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prep_time_minutes">Prep Time (minutes)</label>
                    <input
                      id="prep_time_minutes"
                      type="number"
                      name="prep_time_minutes"
                      value={form.prep_time_minutes}
                      onChange={handleInputChange}
                      min="5"
                      max="300"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="servings">Servings</label>
                    <input
                      id="servings"
                      type="number"
                      name="servings"
                      value={form.servings}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients & Instructions */}
              <div className="form-section">
                <h3 className="section-title">Ingredients & Instructions</h3>
                
                <div className="form-group">
                  <label htmlFor="ingredients">Ingredients (one per line)</label>
                  <textarea
                    id="ingredients"
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleInputChange}
                    placeholder="2 cups rice&#10;1 cup lentils&#10;1 tsp turmeric"
                    rows="5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="instructions">Instructions (one step per line)</label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={form.instructions}
                    onChange={handleInputChange}
                    placeholder="Wash and soak rice&#10;Cook lentils until soft&#10;Season with spices"
                    rows="5"
                  />
                </div>
              </div>

              {/* Dietary Preferences */}
              <div className="form-section">
                <h3 className="section-title">Dietary Information</h3>
                
                <div className="checkbox-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_vegan"
                      checked={form.is_vegan}
                      onChange={handleInputChange}
                    />
                    <span>🌱 Vegan</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_vegetarian"
                      checked={form.is_vegetarian}
                      onChange={handleInputChange}
                    />
                    <span>🥗 Vegetarian</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_gluten_free"
                      checked={form.is_gluten_free}
                      onChange={handleInputChange}
                    />
                    <span>🌾 Gluten-Free</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_dairy_free"
                      checked={form.is_dairy_free}
                      onChange={handleInputChange}
                    />
                    <span>🥛 Dairy-Free</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe List */}
      <div className="recipes-container">
        <div className="recipes-header">
          <h2>Your Recipes ({recipes.length})</h2>
        </div>

        {recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <h3>No Recipes Yet</h3>
            <p>Start adding your delicious recipes to share with the community!</p>
            <button 
              className="btn-add-first"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
            >
              ➕ Add Your First Recipe
            </button>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-card-header">
                  <h3 className="recipe-name">{recipe.recipe_name}</h3>
                  <div className="recipe-status">
                    <button
                      className={`status-toggle ${recipe.is_available ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleAvailability(recipe.id)}
                      title={recipe.is_available ? 'Available in marketplace' : 'Hidden from marketplace'}
                    >
                      {recipe.is_available ? '✅ Available' : '⏸️ Hidden'}
                    </button>
                  </div>
                </div>

                <p className="recipe-description">{recipe.description}</p>

                <div className="recipe-meta">
                  <span className="meta-item">
                    <span className="meta-icon">🍽️</span>
                    {recipe.cuisine_type}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    {recipe.prep_time_minutes} min
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">👥</span>
                    {recipe.servings} servings
                  </span>
                </div>

                <div className="recipe-price">
                  <span className="price-label">Price:</span>
                  <span className="price-value">NPR {recipe.price}</span>
                </div>

                {/* Dietary Tags */}
                {(recipe.is_vegan || recipe.is_vegetarian || recipe.is_gluten_free || recipe.is_dairy_free) && (
                  <div className="dietary-tags">
                    {recipe.is_vegan && <span className="tag tag-vegan">🌱 Vegan</span>}
                    {recipe.is_vegetarian && <span className="tag tag-vegetarian">🥗 Vegetarian</span>}
                    {recipe.is_gluten_free && <span className="tag tag-gluten">🌾 Gluten-Free</span>}
                    {recipe.is_dairy_free && <span className="tag tag-dairy">🥛 Dairy-Free</span>}
                  </div>
                )}

                <div className="recipe-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(recipe)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="recipe-footer">
                  <span className="created-date">
                    Created: {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}