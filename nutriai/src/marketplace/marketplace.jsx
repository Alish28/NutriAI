// src/marketplace/marketplace.jsx
import { useState, useEffect, useCallback } from 'react';
import './marketplace.css';

// ─── Helpers ────────────────────────────────────────────────
const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ─── Cuisine emoji map ───────────────────────────────────────
const cuisineEmoji = {
  nepali: '🍲', italian: '🍝', indian: '🍛', chinese: '🥢',
  mexican: '🌮', japanese: '🍱', american: '🍔', thai: '🍜',
  mediterranean: '🫒', default: '🍽️',
};

const getCuisineEmoji = (type) =>
  cuisineEmoji[(type || '').toLowerCase()] || cuisineEmoji.default;

// FIX: use recipe.price everywhere (not price_npr)
const formatNpr = (n) => `Rs. ${parseFloat(n || 0).toLocaleString()}`;

const statusMeta = {
  pending:           { label: 'Pending',           emoji: '⏳' },
  confirmed:         { label: 'Confirmed',          emoji: '✅' },
  ready_for_pickup:  { label: 'Ready for Pickup',   emoji: '📦' },
  completed:         { label: 'Completed',          emoji: '🎉' },
  cancelled:         { label: 'Cancelled',          emoji: '❌' },
  no_show:           { label: 'No Show',            emoji: '🚫' },
};

// ─── Star display ────────────────────────────────────────────
const Stars = ({ rating, size = 14 }) => {
  const r = Math.round(parseFloat(rating) || 0);
  return (
    <span className="stars" style={{ fontSize: size }}>
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
    </span>
  );
};

// ─── Skeleton loader ─────────────────────────────────────────
const SkeletonGrid = () => (
  <>
    {[1, 2, 3, 4, 5, 6].map((k) => (
      <div className="skeletonCard" key={k}>
        <div className="skeletonImage" />
        <div className="skeletonBody">
          <div className="skeletonLine" />
          <div className="skeletonLine short" />
          <div className="skeletonLine shorter" />
        </div>
      </div>
    ))}
  </>
);

// ─── Toast ───────────────────────────────────────────────────
const Toast = ({ message }) => (
  <div className="successToast">✓ {message}</div>
);

// ════════════════════════════════════════════════════════════
// RECIPE DETAIL MODAL
// ════════════════════════════════════════════════════════════
function RecipeDetailModal({ recipe, currentUser, onClose, onOrderPlaced, isHomecook }) {
  const [reviews, setReviews]               = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [qty, setQty]                       = useState(1);
  const [pickupDate, setPickupDate]         = useState('');
  const [pickupTime, setPickupTime]         = useState('');
  const [notes, setNotes]                   = useState('');
  const [placing, setPlacing]               = useState(false);
  const [orderSuccess, setOrderSuccess]     = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await apiFetch(`/marketplace/reviews/recipe/${recipe.id}`);
        setReviews(data.data?.reviews || []);
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    loadReviews();
  }, [recipe.id]);

  const handleOrder = async () => {
    if (!pickupDate) return alert('Please select a pickup date.');
    setPlacing(true);
    try {
      await apiFetch('/marketplace/orders', {
        method: 'POST',
        body: JSON.stringify({
          recipe_id: recipe.id,
          quantity: qty,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          special_notes: notes,
        }),
      });
      setOrderSuccess(true);
      setTimeout(() => {
        onOrderPlaced && onOrderPlaced();
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setPlacing(false);
    }
  };

  // FIX: use user_id (not homecook_id) to check own listing
  const isOwnListing = isHomecook && recipe.user_id === currentUser?.id;

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modalContent">
        {/* Image area */}
        <div className="modalImageArea">
          {getCuisineEmoji(recipe.cuisine_type)}
          <button className="modalCloseBtn" onClick={onClose}>✕</button>
        </div>

        <div className="modalBody">
          <h2 className="modalRecipeName">{recipe.recipe_name}</h2>

          <div className="modalCookRow">
            <span className="modalCookName">
              👨‍🍳 by <strong>{recipe.homecook_name || 'Homecook'}</strong>
              {recipe.average_rating > 0 && (
                <span style={{ marginLeft: 8 }}>
                  <Stars rating={recipe.average_rating} />
                  <span style={{ fontSize: 12, color: '#7a6e60', marginLeft: 4 }}>
                    ({recipe.total_orders || 0} orders)
                  </span>
                </span>
              )}
            </span>
            {/* FIX: use recipe.price */}
            <span className="modalPrice">{formatNpr(recipe.price)}</span>
          </div>

          {recipe.description && (
            <p className="modalDesc">{recipe.description}</p>
          )}

          {/* Diet tags */}
          <div className="modalDietTags">
            {recipe.is_vegetarian  && <span className="recipeTag veg">🥬 Vegetarian</span>}
            {recipe.is_vegan       && <span className="recipeTag vegan">🌱 Vegan</span>}
            {recipe.is_gluten_free && <span className="recipeTag gf">🌾 Gluten-Free</span>}
            {recipe.is_dairy_free  && <span className="recipeTag" style={{ background: '#dbeafe', color: '#1e40af' }}>🥛 Dairy-Free</span>}
            {recipe.cuisine_type   && <span className="recipeTag cuisine">{recipe.cuisine_type}</span>}
            {recipe.prep_time_minutes && (
              <span className="recipeTag" style={{ background: '#f5f5f5', color: '#555' }}>
                ⏱ {recipe.prep_time_minutes} min
              </span>
            )}
            {recipe.servings && (
              <span className="recipeTag" style={{ background: '#f5f5f5', color: '#555' }}>
                🍽 {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div className="modalSection">
              <div className="modalSectionTitle">Ingredients</div>
              <div className="ingredientsList">
                {recipe.ingredients.map((ing, i) => (
                  <span key={i} className="ingredientPill">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="modalSection">
            <div className="modalSectionTitle">Reviews</div>
            {loadingReviews ? (
              <p style={{ color: '#7a6e60', fontSize: 13 }}>Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p style={{ color: '#7a6e60', fontSize: 13 }}>No reviews yet. Be the first!</p>
            ) : (
              <div className="reviewsList">
                {reviews.map((r) => (
                  <div key={r.id} className="reviewItem">
                    <div className="reviewItemTop">
                      <span className="reviewerName">{r.reviewer_name}</span>
                      <span className="reviewStars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="reviewComment">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order form — only for non-own listings */}
          {!isOwnListing && (
            <div className="orderForm">
              {orderSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48 }}>🎉</div>
                  <p style={{ fontWeight: 700, marginTop: 8, fontSize: 16 }}>Order placed!</p>
                  <p style={{ color: '#7a6e60', fontSize: 13, marginTop: 4 }}>
                    The homecook will confirm your pickup time.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="orderFormTitle">Place an Order</h3>
                  <div className="orderFormRow">
                    <div className="orderFormGroup">
                      <label>Quantity</label>
                      <input
                        type="number" min={1} max={20}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="orderInput"
                      />
                    </div>
                    <div className="orderFormGroup">
                      <label>Pickup Date *</label>
                      <input
                        type="date" min={todayStr} value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="orderInput"
                      />
                    </div>
                  </div>
                  <div className="orderFormGroup" style={{ marginBottom: 12 }}>
                    <label>Preferred Pickup Time</label>
                    <input
                      type="time" value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="orderInput"
                    />
                  </div>
                  <div className="orderFormGroup" style={{ marginBottom: 0 }}>
                    <label>Special Notes</label>
                    <textarea
                      placeholder="Any dietary notes or requests…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="orderInput" rows={2}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  {/* FIX: use recipe.price */}
                  <div className="orderTotal">
                    <span className="orderTotalLabel">Total ({qty} × {formatNpr(recipe.price)})</span>
                    <span className="orderTotalAmount">
                      {formatNpr(qty * parseFloat(recipe.price || 0))}
                    </span>
                  </div>
                  <button className="orderBtn" onClick={handleOrder} disabled={placing}>
                    {placing ? 'Placing Order…' : '🛒 Place Order (Pickup)'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#7a6e60', marginTop: 10 }}>
                    This is a pickup-only system. No delivery available.
                  </p>
                </>
              )}
            </div>
          )}

          {isOwnListing && (
            <div style={{
              textAlign: 'center', padding: '16px', background: '#e8f5ee',
              borderRadius: 12, color: '#2d7a4f', fontSize: 14, fontWeight: 600,
            }}>
              🌿 This is your listing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADD / EDIT RECIPE MODAL (Homecook only)
// ════════════════════════════════════════════════════════════

// FIX: removed price_npr, calories, protein, carbs, fats, max_orders_per_day
// (not in DB schema). Added is_dairy_free. price is now just 'price'.
const emptyRecipeForm = {
  recipe_name: '',
  description: '',
  cuisine_type: '',
  price: '',
  prep_time_minutes: '',
  servings: '',
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  is_dairy_free: false,
  ingredients: '',
  instructions: '',
};

function RecipeFormModal({ recipe, onClose, onSaved }) {
  const [form, setForm] = useState(recipe ? {
    ...emptyRecipeForm,
    ...recipe,
    price: recipe.price || '',
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(', ')
      : (recipe.ingredients || ''),
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions.join('\n')
      : (recipe.instructions || ''),
  } : { ...emptyRecipeForm });

  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    // FIX: validate price (not price_npr), and also require description
    if (!form.recipe_name || !form.description || !form.price) {
      return alert('Recipe name, description, and price are required.');
    }

    setSaving(true);
    try {
      const payload = {
        recipe_name: form.recipe_name,
        description: form.description,
        cuisine_type: form.cuisine_type || 'Nepali',
        // FIX: send as 'price' to match DB column
        price: parseFloat(form.price),
        prep_time_minutes: parseInt(form.prep_time_minutes) || 30,
        servings: parseInt(form.servings) || 2,
        is_vegetarian: !!form.is_vegetarian,
        is_vegan: !!form.is_vegan,
        is_gluten_free: !!form.is_gluten_free,
        is_dairy_free: !!form.is_dairy_free,
        ingredients: form.ingredients
          ? form.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        instructions: form.instructions
          ? form.instructions.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (recipe?.id) {
        // FIX: use /recipes/:id route (matches recipeRoutes.js)
        await apiFetch(`/recipes/${recipe.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // FIX: use /recipes route (matches recipeRoutes.js)
        await apiFetch('/recipes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cuisineTypes = [
    'Nepali', 'Indian', 'Italian', 'Chinese', 'Mexican',
    'Japanese', 'American', 'Thai', 'Mediterranean', 'Other',
  ];

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="recipeFormModal">
        <div className="recipeFormHeader">
          <h2 className="recipeFormTitle">
            {recipe ? '✏️ Edit Listing' : '➕ Add New Listing'}
          </h2>
          <button className="modalCloseBtn" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div className="recipeFormBody">
          {/* Recipe Name */}
          <div className="formGroup">
            <label>Recipe Name <span className="required">*</span></label>
            <input className="formInput" value={form.recipe_name}
              onChange={(e) => set('recipe_name', e.target.value)}
              placeholder="e.g. Momo with Achar" />
          </div>

          {/* Description */}
          <div className="formGroup">
            <label>Description <span className="required">*</span></label>
            <textarea className="formTextarea" value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What makes this dish special?" />
          </div>

          {/* Cuisine + Price */}
          <div className="formGrid2">
            <div className="formGroup">
              <label>Cuisine Type</label>
              <select className="formSelect" value={form.cuisine_type}
                onChange={(e) => set('cuisine_type', e.target.value)}>
                <option value="">Select cuisine</option>
                {cuisineTypes.map((c) => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
            <div className="formGroup">
              {/* FIX: label and field now use 'price' */}
              <label>Price (NPR) <span className="required">*</span></label>
              <input className="formInput" type="number" min="0" step="1"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0" />
            </div>
          </div>

          {/* Prep time + Servings */}
          <div className="formGrid2">
            <div className="formGroup">
              <label>Prep Time (minutes)</label>
              <input className="formInput" type="number" min="0"
                value={form.prep_time_minutes}
                onChange={(e) => set('prep_time_minutes', e.target.value)}
                placeholder="30" />
            </div>
            <div className="formGroup">
              <label>Servings</label>
              <input className="formInput" type="number" min="1"
                value={form.servings}
                onChange={(e) => set('servings', e.target.value)}
                placeholder="2" />
            </div>
          </div>

          {/* Dietary flags — FIX: added is_dairy_free */}
          <div className="formGroup">
            <label>Dietary Info</label>
            <div className="formCheckboxRow">
              {[
                { key: 'is_vegetarian', label: '🥬 Vegetarian' },
                { key: 'is_vegan',      label: '🌱 Vegan' },
                { key: 'is_gluten_free', label: '🌾 Gluten-Free' },
                { key: 'is_dairy_free',  label: '🥛 Dairy-Free' },
              ].map(({ key, label }) => (
                <label className="formCheckbox" key={key}>
                  <input type="checkbox" checked={!!form[key]}
                    onChange={(e) => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="formGroup">
            <label>
              Ingredients{' '}
              <span style={{ fontWeight: 400, color: '#7a6e60', fontSize: 12 }}>
                (comma separated)
              </span>
            </label>
            <textarea className="formTextarea" value={form.ingredients}
              onChange={(e) => set('ingredients', e.target.value)}
              placeholder="Rice, Lentils, Ghee, Spices…"
              style={{ minHeight: 70 }} />
          </div>

          {/* Instructions */}
          <div className="formGroup">
            <label>
              Instructions{' '}
              <span style={{ fontWeight: 400, color: '#7a6e60', fontSize: 12 }}>
                (one step per line)
              </span>
            </label>
            <textarea className="formTextarea" value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              placeholder={"Heat oil in pan\nAdd ingredients\nServe hot"}
              style={{ minHeight: 90 }} />
          </div>
        </div>

        <div className="recipeFormFooter">
          <button className="cancelFormBtn" onClick={onClose}>Cancel</button>
          <button className="saveFormBtn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : recipe ? 'Save Changes' : 'Add to Marketplace'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REVIEW MODAL
// ════════════════════════════════════════════════════════════
function ReviewModal({ order, reviewType, onClose, onSubmitted }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) return alert('Please select a rating.');
    setSaving(true);
    try {
      await apiFetch('/marketplace/reviews', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          recipe_id: order.recipe_id,
          reviewee_id: reviewType === 'buyer_to_homecook' ? order.homecook_id : order.buyer_id,
          review_type: reviewType,
          rating,
          comment,
        }),
      });
      onSubmitted();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="reviewModal">
        <h3 className="reviewModalTitle">
          {reviewType === 'buyer_to_homecook' ? '⭐ Review the Homecook' : '⭐ Review the Customer'}
        </h3>
        <p style={{ fontSize: 14, color: '#7a6e60', marginBottom: 16 }}>
          Order: <strong>{order.recipe_name}</strong>
        </p>

        <div className="starPicker">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} className="starPickerBtn"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}>
              {s <= (hover || rating) ? '★' : '☆'}
            </button>
          ))}
        </div>

        <div className="formGroup">
          <textarea className="formTextarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience… (optional)"
            style={{ minHeight: 80 }} />
        </div>

        <div className="reviewModalActions">
          <button className="cancelFormBtn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="saveFormBtn" onClick={handleSubmit} disabled={saving} style={{ flex: 2 }}>
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ORDER CARD
// ════════════════════════════════════════════════════════════
function OrderCard({ order, viewAs, onStatusUpdate, onReview }) {
  const meta           = statusMeta[order.status] || statusMeta.pending;
  const isHomecookView = viewAs === 'homecook';

  const nextStatusOptions = {
    pending:          ['confirmed', 'cancelled'],
    confirmed:        ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['completed', 'no_show'],
  };

  const nextOptions = isHomecookView ? (nextStatusOptions[order.status] || []) : [];
  const canCancel   = !isHomecookView && order.status === 'pending';
  const canReview   = order.status === 'completed' && !order.has_reviewed;

  return (
    <div className="orderCard">
      <div className="orderCardIcon">
        {getCuisineEmoji(order.cuisine_type)}
      </div>
      <div className="orderCardBody">
        <div className="orderCardTop">
          <span className="orderCardName">{order.recipe_name}</span>
          {/* FIX: total_price (not total_price_npr) */}
          <span className="orderCardPrice">{formatNpr(order.total_price)}</span>
        </div>
        <div className="orderCardMeta">
          <span>
            {isHomecookView ? `👤 ${order.buyer_name}` : `👨‍🍳 ${order.homecook_name}`}
          </span>
          <span>📦 Qty: {order.quantity}</span>
          {order.pickup_date && (
            <span>
              📅 {new Date(order.pickup_date).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {order.pickup_time && <span>🕐 {order.pickup_time}</span>}
        </div>
        {order.special_notes && (
          <p style={{ fontSize: 12, color: '#7a6e60', fontStyle: 'italic', marginBottom: 10 }}>
            "{order.special_notes}"
          </p>
        )}
        <div className="orderCardActions">
          <span className={`statusBadge ${order.status?.replace('_', '') === 'readyforpickup' ? 'ready' : order.status}`}>
            {meta.emoji} {meta.label}
          </span>

          {nextOptions.map((s) => (
            <button key={s}
              className={`actionBtn ${s === 'cancelled' || s === 'no_show' ? 'danger' : 'primary'}`}
              onClick={() => onStatusUpdate(order.id, s)}>
              {statusMeta[s]?.label || s}
            </button>
          ))}

          {canCancel && (
            <button className="actionBtn danger" onClick={() => onStatusUpdate(order.id, 'cancelled')}>
              Cancel Order
            </button>
          )}

          {canReview && (
            <button className="actionBtn success" onClick={() => onReview(order)}>
              ⭐ Leave Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN MARKETPLACE COMPONENT
// ════════════════════════════════════════════════════════════
export default function Marketplace({ onBack }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [isHomecook, setIsHomecook]     = useState(false);
  const [activeTab, setActiveTab]       = useState('browse');

  // Browse state
  const [listings, setListings]               = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [search, setSearch]                   = useState('');
  const [activeFilter, setActiveFilter]       = useState('all');
  const [selectedRecipe, setSelectedRecipe]   = useState(null);

  // Homecook state
  const [myListings, setMyListings]       = useState([]);
  const [loadingMine, setLoadingMine]     = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);

  // Orders state
  const [myOrders, setMyOrders]             = useState([]);
  const [homecookOrders, setHomecookOrders] = useState([]);
  const [loadingOrders, setLoadingOrders]   = useState(false);
  const [reviewTarget, setReviewTarget]     = useState(null);
  const [reviewType, setReviewType]         = useState('');

  // UI state
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Load user ──────────────────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setCurrentUser(u);
      setIsHomecook(u.role === 'homecook' || u.homecook_approved === true);
    }
  }, []);

  // ── Load listings ──────────────────────────────────────────
  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeFilter === 'vegetarian') params.append('is_vegetarian', 'true');
      if (activeFilter === 'vegan') params.append('is_vegan', 'true');
      if (activeFilter === 'gluten_free') params.append('is_gluten_free', 'true');
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch(`/marketplace/listings${query}`);
      // FIX: backend returns data.data.listings (not .recipes)
      setListings(data.data?.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [search, activeFilter]);

  useEffect(() => {
    if (activeTab === 'browse') loadListings();
  }, [activeTab, loadListings]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(loadListings, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Load my listings (homecook) ───────────────────────────
  const loadMyListings = useCallback(async () => {
    if (!isHomecook) return;
    setLoadingMine(true);
    try {
      // FIX: use the correct route that matches recipeRoutes.js
      const data = await apiFetch('/recipes/my/recipes');
      setMyListings(data.data?.recipes || []);
    } catch {
      setMyListings([]);
    } finally {
      setLoadingMine(false);
    }
  }, [isHomecook]);

  useEffect(() => {
    if (activeTab === 'myListings') loadMyListings();
  }, [activeTab, loadMyListings]);

  // ── Load orders ────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      if (isHomecook) {
        const [myData, hcData] = await Promise.all([
          apiFetch('/marketplace/orders/my-orders'),
          apiFetch('/marketplace/orders/homecook-orders'),
        ]);
        setMyOrders(myData.data?.orders || []);
        setHomecookOrders(hcData.data?.orders || []);
      } else {
        const myData = await apiFetch('/marketplace/orders/my-orders');
        setMyOrders(myData.data?.orders || []);
      }
    } catch {
      setMyOrders([]);
      setHomecookOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [isHomecook]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab, loadOrders]);

  // ── Status update ──────────────────────────────────────────
  const handleStatusUpdate = async (orderId, status) => {
    try {
      if (status === 'cancelled') {
        await apiFetch(`/marketplace/orders/${orderId}/cancel`, { method: 'PUT' });
      } else {
        await apiFetch(`/marketplace/orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
      }
      showToast(`Order marked as ${statusMeta[status]?.label || status}`);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Delete listing ─────────────────────────────────────────
  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      // FIX: use /recipes/:id route
      await apiFetch(`/recipes/${id}`, { method: 'DELETE' });
      showToast('Listing deleted');
      loadMyListings();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Review submitted ───────────────────────────────────────
  const handleReviewSubmitted = () => {
    showToast('Review submitted! Thank you.');
    setReviewTarget(null);
    loadOrders();
  };

  // ── Filter chips ───────────────────────────────────────────
  const filters = [
    { id: 'all',         label: 'All' },
    { id: 'vegetarian',  label: '🥬 Veg' },
    { id: 'vegan',       label: '🌱 Vegan' },
    { id: 'gluten_free', label: '🌾 GF' },
  ];

  const tabs = [
    { id: 'browse',     label: '🏪 Browse' },
    { id: 'orders',     label: '📋 My Orders' },
    ...(isHomecook ? [{ id: 'myListings', label: '🍳 My Listings' }] : []),
  ];

  // Client-side search filter
  const displayedListings = listings.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.recipe_name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.homecook_name?.toLowerCase().includes(q) ||
      r.cuisine_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="marketplacePage">
      {/* ── Header ── */}
      <header className="marketplaceHeader">
        <div className="marketplaceHeaderInner">
          <div className="marketplaceLogo" onClick={onBack}>
            <div className="marketplaceLogoMark">🍽</div>
            <span>NutriAI</span>
          </div>

          <h1 className="marketplaceHeaderTitle">
            Home<span>cook</span> Marketplace
          </h1>

          <div className="marketplaceHeaderRight">
            <div className={`headerRoleBadge ${isHomecook ? 'homecook' : 'user'}`}>
              {isHomecook ? '👨‍🍳 Homecook' : '🛒 Browsing as User'}
            </div>

            <div className="tabBtns">
              {tabs.map((t) => (
                <button key={t.id}
                  className={`tabBtn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            <button className="backBtn" onClick={onBack}>← Dashboard</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      {activeTab === 'browse' && (
        <div className={`marketplaceHero ${isHomecook ? 'homecookHero' : ''}`}>
          <div className="heroContent">
            <div className="heroEyebrow">
              🏘️ {isHomecook ? 'Homecook View' : 'Community Kitchen'}
            </div>
            <h2 className="heroTitle">
              {isHomecook
                ? <>Your dishes, <span>shared</span> with the community</>
                : <>Real food, made by <span>real people</span></>
              }
            </h2>
            <p className="heroSubtitle">
              {isHomecook
                ? 'You can browse all listings and manage your own. Use the Listings tab to add or edit your dishes.'
                : 'Order homemade meals from approved community cooks near you. Pickup only.'
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Filter bar (browse tab only) ── */}
      {activeTab === 'browse' && (
        <div className="filterBar">
          <div className="filterBarInner">
            <div className="searchBox">
              <span>🔍</span>
              <input
                placeholder="Search dishes, cooks, cuisines…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filterDivider" />
            <div className="filterChips">
              {filters.map((f) => (
                <button key={f.id}
                  className={`filterChip ${activeFilter === f.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="resultsCount">
              {!loadingListings && `${displayedListings.length} listing${displayedListings.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="marketplaceMain">

        {/* ── BROWSE TAB ── */}
        {activeTab === 'browse' && (
          <div className="listingsGrid">
            {loadingListings ? (
              <SkeletonGrid />
            ) : displayedListings.length === 0 ? (
              <div className="emptyState">
                <div className="emptyStateIcon">🍽️</div>
                <h3 className="emptyStateTitle">No listings found</h3>
                <p className="emptyStateText">
                  {search
                    ? `No dishes matching "${search}". Try a different search.`
                    : 'No homecook listings are available yet. Check back soon!'}
                </p>
              </div>
            ) : (
              displayedListings.map((recipe) => (
                <div key={recipe.id}
                  className={`recipeCard ${isHomecook && recipe.user_id === currentUser?.id ? 'myListing' : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}>

                  <div className="recipeCardImage">
                    {getCuisineEmoji(recipe.cuisine_type)}
                    {isHomecook && recipe.user_id === currentUser?.id && (
                      <div className="myListingBadge">My Listing</div>
                    )}
                  </div>

                  <div className="recipeCardBody">
                    <div className="recipeCardTop">
                      <span className="recipeCardName">{recipe.recipe_name}</span>
                      {/* FIX: use recipe.price */}
                      <span className="recipeCardPrice">{formatNpr(recipe.price)}</span>
                    </div>
                    {/* FIX: use homecook_name (from backend JOIN) */}
                    <div className="recipeCardCook">
                      👨‍🍳 {recipe.homecook_name || 'Homecook'}
                    </div>
                    {recipe.description && (
                      <p className="recipeCardDesc">{recipe.description}</p>
                    )}
                    <div className="recipeCardTags">
                      {recipe.is_vegetarian  && <span className="recipeTag veg">Veg</span>}
                      {recipe.is_vegan       && <span className="recipeTag vegan">Vegan</span>}
                      {recipe.is_gluten_free && <span className="recipeTag gf">GF</span>}
                      {recipe.is_dairy_free  && <span className="recipeTag" style={{ background: '#dbeafe', color: '#1e40af' }}>DF</span>}
                      {recipe.cuisine_type   && (
                        <span className="recipeTag cuisine">{recipe.cuisine_type}</span>
                      )}
                    </div>
                    <div className="recipeCardFooter">
                      <div className="recipeRating">
                        <Stars rating={recipe.average_rating} />
                        <span className="recipeRatingCount">({recipe.total_orders || 0})</span>
                      </div>
                      <div className="recipeCardMeta">
                        {recipe.prep_time_minutes && <span>⏱ {recipe.prep_time_minutes}m</span>}
                        {recipe.servings && <span>🍽 {recipe.servings}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MY LISTINGS TAB (homecook) ── */}
        {activeTab === 'myListings' && isHomecook && (
          <div className="homecookSection">
            <div className="homecookSectionHeader">
              <h2 className="homecookSectionTitle">My Listings</h2>
              <button className="addRecipeBtn" onClick={() => setShowAddForm(true)}>
                ➕ Add Listing
              </button>
            </div>

            {loadingMine ? (
              <div className="listingsGrid"><SkeletonGrid /></div>
            ) : myListings.length === 0 ? (
              <div className="emptyState">
                <div className="emptyStateIcon">🍳</div>
                <h3 className="emptyStateTitle">No listings yet</h3>
                <p className="emptyStateText">
                  Add your first dish to start receiving orders from the community.
                </p>
                <button className="addRecipeBtn"
                  style={{ margin: '20px auto 0', display: 'inline-flex' }}
                  onClick={() => setShowAddForm(true)}>
                  ➕ Add Your First Dish
                </button>
              </div>
            ) : (
              <div className="listingsGrid">
                {myListings.map((recipe) => (
                  <div key={recipe.id} className="recipeCard myListing">
                    <div className="recipeCardImage">
                      {getCuisineEmoji(recipe.cuisine_type)}
                      <div className="myListingBadge">My Listing</div>
                    </div>
                    <div className="recipeCardBody">
                      <div className="recipeCardTop">
                        <span className="recipeCardName">{recipe.recipe_name}</span>
                        {/* FIX: use recipe.price */}
                        <span className="recipeCardPrice">{formatNpr(recipe.price)}</span>
                      </div>
                      {recipe.description && (
                        <p className="recipeCardDesc">{recipe.description}</p>
                      )}
                      <div className="recipeCardTags">
                        {recipe.cuisine_type   && <span className="recipeTag cuisine">{recipe.cuisine_type}</span>}
                        {recipe.is_vegetarian  && <span className="recipeTag veg">Veg</span>}
                        {recipe.is_vegan       && <span className="recipeTag vegan">Vegan</span>}
                        {recipe.is_gluten_free && <span className="recipeTag gf">GF</span>}
                        {recipe.is_dairy_free  && <span className="recipeTag" style={{ background: '#dbeafe', color: '#1e40af' }}>DF</span>}
                      </div>
                      <div className="recipeCardFooter">
                        <div className="recipeRating">
                          <Stars rating={recipe.average_rating} />
                          <span className="recipeRatingCount">({recipe.total_orders || 0} orders)</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="actionBtn"
                            onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); }}
                            style={{ fontSize: 12, padding: '6px 12px' }}>
                            ✏️ Edit
                          </button>
                          <button className="actionBtn danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteListing(recipe.id); }}
                            style={{ fontSize: 12, padding: '6px 12px' }}>
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <>
            {loadingOrders ? (
              <p style={{ color: '#7a6e60', textAlign: 'center', padding: 40 }}>Loading orders…</p>
            ) : (
              <>
                {/* Incoming orders for homecooks */}
                {isHomecook && (
                  <div style={{ marginBottom: 40 }}>
                    <h2 className="homecookSectionTitle" style={{ marginBottom: 16 }}>
                      📥 Incoming Orders
                    </h2>
                    {homecookOrders.length === 0 ? (
                      <div className="emptyState" style={{ padding: '40px 0' }}>
                        <div className="emptyStateIcon">📭</div>
                        <p className="emptyStateText">No incoming orders yet.</p>
                      </div>
                    ) : (
                      <div className="ordersSection">
                        {homecookOrders.map((o) => (
                          <OrderCard key={o.id} order={o} viewAs="homecook"
                            onStatusUpdate={handleStatusUpdate}
                            onReview={(order) => {
                              setReviewTarget(order);
                              setReviewType('homecook_to_buyer');
                            }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My placed orders */}
                <div>
                  <h2 className="homecookSectionTitle" style={{ marginBottom: 16 }}>
                    🛒 {isHomecook ? 'My Placed Orders' : 'My Orders'}
                  </h2>
                  {myOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding: '40px 0' }}>
                      <div className="emptyStateIcon">🛒</div>
                      <h3 className="emptyStateTitle">No orders yet</h3>
                      <p className="emptyStateText">
                        Browse the marketplace and place your first order!
                      </p>
                      <button className="addRecipeBtn"
                        style={{ margin: '16px auto 0', display: 'inline-flex' }}
                        onClick={() => setActiveTab('browse')}>
                        Browse Listings
                      </button>
                    </div>
                  ) : (
                    <div className="ordersSection">
                      {myOrders.map((o) => (
                        <OrderCard key={o.id} order={o} viewAs="buyer"
                          onStatusUpdate={handleStatusUpdate}
                          onReview={(order) => {
                            setReviewTarget(order);
                            setReviewType('buyer_to_homecook');
                          }} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          currentUser={currentUser}
          isHomecook={isHomecook}
          onClose={() => setSelectedRecipe(null)}
          onOrderPlaced={() => { showToast('Order placed successfully!'); }}
        />
      )}

      {(showAddForm || editingRecipe) && (
        <RecipeFormModal
          recipe={editingRecipe || null}
          onClose={() => { setShowAddForm(false); setEditingRecipe(null); }}
          onSaved={() => {
            setShowAddForm(false);
            setEditingRecipe(null);
            showToast(editingRecipe ? 'Listing updated!' : 'Listing added to marketplace!');
            loadMyListings();
          }}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          order={reviewTarget}
          reviewType={reviewType}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}