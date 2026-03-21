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
      console.log('📥 Loading recipes...');
      
      const response = await getMyRecipes();
      console.log('✅ Recipes loaded:', response);
      
      setRecipes(response.data.recipes || []);
    } catch (err) {
      console.error('❌ Error loading recipes:', err);
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.recipe_name || !form.description || !form.price) {
      setError('Please fill in recipe name, description, and price');
      return;
    }

    try {
      console.log('💾 Submitting recipe:', form);
      
      const recipeData = {
        recipe_name: form.recipe_name,
        description: form.description,
        cuisine_type: form.cuisine_type,
        price: parseFloat(form.price),
        prep_time_minutes: parseInt(form.prep_time_minutes) || 30,
        servings: parseInt(form.servings) || 2,
        ingredients: form.ingredients.split('\n').filter(i => i.trim()),
        instructions: form.instructions.split('\n').filter(i => i.trim()),
        is_vegan: form.is_vegan,
        is_vegetarian: form.is_vegetarian,
        is_gluten_free: form.is_gluten_free,
        is_dairy_free: form.is_dairy_free
      };

      if (editingRecipe) {
        console.log('📝 Updating recipe:', editingRecipe.id);
        await updateRecipe(editingRecipe.id, recipeData);
      } else {
        console.log('➕ Creating new recipe');
        await createRecipe(recipeData);
      }

      console.log('✅ Recipe saved successfully!');
      
      await loadRecipes();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error('❌ Error saving recipe:', err);
      setError(err.message || 'Failed to save recipe');
    }
  };

  const handleEdit = (recipe) => {
    console.log('✏️ Editing recipe:', recipe);
    
    setForm({
      recipe_name: recipe.recipe_name,
      description: recipe.description,
      cuisine_type: recipe.cuisine_type || 'Nepali',
      price: recipe.price,
      prep_time_minutes: recipe.prep_time_minutes || '30',
      servings: recipe.servings || '2',
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.join('\n') 
        : recipe.ingredients || '',
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions.join('\n')
        : recipe.instructions || '',
      is_vegan: recipe.is_vegan || false,
      is_vegetarian: recipe.is_vegetarian || false,
      is_gluten_free: recipe.is_gluten_free || false,
      is_dairy_free: recipe.is_dairy_free || false
    });
    
    setEditingRecipe(recipe);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting recipe:', id);
      await deleteRecipe(id);
      console.log('✅ Recipe deleted');
      
      await loadRecipes();
    } catch (err) {
      console.error('❌ Error deleting recipe:', err);
      setError(err.message || 'Failed to delete recipe');
    }
  };

  const handleToggleAvailability = async (recipe) => {
    try {
      console.log('🔄 Toggling availability for:', recipe.id);
      await toggleRecipeAvailability(recipe.id);
      console.log('✅ Availability toggled');
      
      await loadRecipes();
    } catch (err) {
      console.error('❌ Error toggling availability:', err);
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
          <h1 className="homecook-title">My Recipes Dashboard</h1>
          <p className="homecook-subtitle">
            Welcome, {user?.full_name}! Manage your homecook recipes here.
          </p>
        </div>
        <div className="header-right">
          <button 
            className="btn-switch-mode"
            onClick={onSwitchToConsumer}
          >
            ← Switch to Consumer Mode
          </button>
          <button 
            className="btn-add-recipe"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            ➕ Add New Recipe
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="error-close"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Recipes Container */}
      <div className="recipes-container">
        <div className="recipes-header">
          <h2>Your Recipes ({recipes.length})</h2>
        </div>

        {recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <h3>No Recipes Yet</h3>
            <p>Start by adding your first delicious recipe!</p>
            <button 
              className="btn-add-first"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
            >
              Add Your First Recipe
            </button>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                {/* Card Header */}
                <div className="recipe-card-header">
                  <h3 className="recipe-name">{recipe.recipe_name}</h3>
                  <div className="recipe-status">
                    <button 
                      className={`status-toggle ${recipe.is_available ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleAvailability(recipe)}
                    >
                      {recipe.is_available ? '✅ Available' : '⏸️ Hidden'}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="recipe-description">{recipe.description}</p>

                {/* Meta Info */}
                <div className="recipe-meta">
                  <div className="meta-item">
                    <span className="meta-icon">🍽️</span>
                    <span>{recipe.cuisine_type}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{recipe.prep_time_minutes} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>

                {/* Price */}
                <div className="recipe-price">
                  <span className="price-label">Price</span>
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

                {/* Actions */}
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

                {/* Footer */}
                <div className="recipe-footer">
                  <p className="created-date">
                    Added {new Date(recipe.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Recipe Form Modal */}
      {showAddForm && (
        <div className="recipe-form-overlay" onClick={() => {
          setShowAddForm(false);
          resetForm();
        }}>
          <div className="recipe-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form className="recipe-form" onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-group">
                  <label>Recipe Name *</label>
                  <input
                    type="text"
                    value={form.recipe_name}
                    onChange={(e) => setForm({...form, recipe_name: e.target.value})}
                    placeholder="e.g., Dal Bhat, Chicken Momo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Describe your delicious recipe..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cuisine Type</label>
                    <select
                      value={form.cuisine_type}
                      onChange={(e) => setForm({...form, cuisine_type: e.target.value})}
                    >
                      {cuisineTypes.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price (NPR) *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({...form, price: e.target.value})}
                      placeholder="500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Prep Time (minutes)</label>
                    <input
                      type="number"
                      value={form.prep_time_minutes}
                      onChange={(e) => setForm({...form, prep_time_minutes: e.target.value})}
                      placeholder="30"
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Servings</label>
                    <input
                      type="number"
                      value={form.servings}
                      onChange={(e) => setForm({...form, servings: e.target.value})}
                      placeholder="2"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients & Instructions */}
              <div className="form-section">
                <h3 className="section-title">Recipe Details</h3>
                
                <div className="form-group">
                  <label>Ingredients (one per line)</label>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm({...form, ingredients: e.target.value})}
                    placeholder={"1 cup rice\n500g chicken\n2 tbsp oil"}
                    rows="5"
                  />
                </div>

                <div className="form-group">
                  <label>Instructions (one step per line)</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({...form, instructions: e.target.value})}
                    placeholder={"Heat oil in pan\nAdd chicken and cook\nServe hot"}
                    rows="5"
                  />
                </div>
              </div>

              {/* Dietary Options */}
              <div className="form-section">
                <h3 className="section-title">Dietary Options</h3>
                
                <div className="checkbox-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_vegan}
                      onChange={(e) => setForm({...form, is_vegan: e.target.checked})}
                    />
                    <span>🌱 Vegan</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_vegetarian}
                      onChange={(e) => setForm({...form, is_vegetarian: e.target.checked})}
                    />
                    <span>🥗 Vegetarian</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_gluten_free}
                      onChange={(e) => setForm({...form, is_gluten_free: e.target.checked})}
                    />
                    <span>🌾 Gluten-Free</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_dairy_free}
                      onChange={(e) => setForm({...form, is_dairy_free: e.target.checked})}
                    />
                    <span>🥛 Dairy-Free</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingRecipe ? 'Update Recipe' : 'Add Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}