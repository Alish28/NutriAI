// src/marketplace/marketplace.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import './marketplace.css';

// ─── API helpers ─────────────────────────────────────────────
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

// ─── Cuisine emoji map ────────────────────────────────────────
const cuisineEmoji = {
  nepali:'🍲', italian:'🍝', indian:'🍛', chinese:'🥢',
  mexican:'🌮', japanese:'🍱', american:'🍔', thai:'🍜',
  mediterranean:'🫒', default:'🍽️',
};
const getCuisineEmoji = (type) => cuisineEmoji[(type||'').toLowerCase()] || cuisineEmoji.default;
const formatNpr = (n) => `Rs. ${parseFloat(n||0).toLocaleString()}`;

const statusMeta = {
  pending:          { label:'Pending',          emoji:'⏳' },
  confirmed:        { label:'Confirmed',         emoji:'✅' },
  ready_for_pickup: { label:'Ready for Pickup',  emoji:'📦' },
  completed:        { label:'Completed',         emoji:'🎉' },
  cancelled:        { label:'Cancelled',         emoji:'❌' },
  no_show:          { label:'No Show',           emoji:'🚫' },
};

// ─── Stars ───────────────────────────────────────────────────
const Stars = ({ rating, size = 14 }) => {
  const r = Math.round(parseFloat(rating) || 0);
  return <span className="stars" style={{ fontSize: size }}>{'★'.repeat(r)}{'☆'.repeat(5-r)}</span>;
};

// ─── Skeleton loader ──────────────────────────────────────────
const SkeletonGrid = () => (
  <>{[1,2,3,4,5,6].map(k => (
    <div className="skeletonCard" key={k}>
      <div className="skeletonImage"/>
      <div className="skeletonBody">
        <div className="skeletonLine"/>
        <div className="skeletonLine short"/>
        <div className="skeletonLine shorter"/>
      </div>
    </div>
  ))}</>
);

// ─── Toast ────────────────────────────────────────────────────
const Toast = ({ message }) => <div className="successToast">✓ {message}</div>;

// ════════════════════════════════════════════════════════════
// LEAFLET MAP — used both for viewing (buyers) and setting location (homecooks)
// Uses free OpenStreetMap — no API key needed
// ════════════════════════════════════════════════════════════
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

// ── Read-only map for buyers to see homecook pickup location ──
function HomecookMap({ homecookName, lat, lng, address }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const [loading, setLoading] = useState(true);
  const [resolvedCoords, setResolvedCoords] = useState(null);

  // If we already have lat/lng saved, use them directly.
  // Otherwise geocode the address string.
  useEffect(() => {
    const resolve = async () => {
      if (lat && lng) {
        setResolvedCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setLoading(false);
        return;
      }
      try {
        const q = address || 'Kathmandu, Nepal';
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data.length > 0) setResolvedCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        else setResolvedCoords({ lat: 27.7172, lng: 85.3240 });
      } catch {
        setResolvedCoords({ lat: 27.7172, lng: 85.3240 });
      } finally { setLoading(false); }
    };
    resolve();
  }, [lat, lng, address]);

  useEffect(() => {
    if (!resolvedCoords || !mapRef.current || mapInst.current) return;
    loadLeaflet().then((L) => {
      if (mapInst.current) return;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([resolvedCoords.lat, resolvedCoords.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      const icon = L.divIcon({
        html: `<div style="background:#eea641;width:38px;height:38px;border-radius:50% 50% 50% 0;
               transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);
               display:flex;align-items:center;justify-content:center;">
               <span style="transform:rotate(45deg);font-size:18px;">👨‍🍳</span></div>`,
        className: '', iconSize: [38, 38], iconAnchor: [19, 38],
      });
      L.marker([resolvedCoords.lat, resolvedCoords.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>👨‍🍳 ${homecookName || 'Homecook'}</strong><br/>📍 Pickup location`)
        .openPopup();
      mapInst.current = map;
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [resolvedCoords, homecookName]);

  if (loading) return (
    <div className="mapPlaceholder"><div className="mapLoading">🗺️ Loading map…</div></div>
  );
  return (
    <div className="mapWrapper">
      <div className="mapLabel">📍 Homecook Pickup Location</div>
      <div ref={mapRef} className="leafletMap"/>
      <div className="mapNote">📞 Contact the homecook to confirm exact pickup address.</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HOMECOOK LOCATION MANAGER
// Separate component for homecooks to set/update their location.
// Asks for geolocation permission, lets them drag a pin,
// and saves lat/lng + address to their profile.
// ════════════════════════════════════════════════════════════
function HomecookLocationManager({ currentUser, onLocationSaved }) {
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const markerRef   = useRef(null);
  const [status, setStatus]       = useState('idle'); // idle | requesting | granted | denied | saving | saved
  const [coords, setCoords]       = useState(
    currentUser?.pickup_lat && currentUser?.pickup_lng
      ? { lat: parseFloat(currentUser.pickup_lat), lng: parseFloat(currentUser.pickup_lng) }
      : null
  );
  const [address, setAddress]     = useState(currentUser?.pickup_address || '');
  const [editAddress, setEditAddress] = useState(currentUser?.pickup_address || '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // Request GPS from browser
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus('granted');
        reverseGeocode(c.lat, c.lng);
      },
      (err) => {
        console.warn('Geolocation denied:', err.message);
        setStatus('denied');
        // Fall back to Kathmandu if denied
        setCoords({ lat: 27.7172, lng: 85.3240 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reverse geocode to get human-readable address
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
      setEditAddress(addr);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setEditAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // Init/update map when coords change
  useEffect(() => {
    if (!coords || !mapRef.current) return;
    loadLeaflet().then((L) => {
      if (!mapInst.current) {
        // Create map
        const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
          .setView([coords.lat, coords.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const icon = L.divIcon({
          html: `<div style="background:#eea641;width:38px;height:38px;border-radius:50% 50% 50% 0;
                 transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);
                 display:flex;align-items:center;justify-content:center;">
                 <span style="transform:rotate(45deg);font-size:18px;">📍</span></div>`,
          className: '', iconSize: [38, 38], iconAnchor: [19, 38],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
        marker.bindPopup('Drag me to adjust your pickup location').openPopup();

        // When homecook drags the pin, update coords + reverse geocode
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          setCoords({ lat, lng });
          reverseGeocode(lat, lng);
        });

        // Click on map to move marker
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCoords({ lat, lng });
          reverseGeocode(lat, lng);
        });

        mapInst.current = map;
        markerRef.current = marker;
      } else {
        // Just update existing map view
        mapInst.current.setView([coords.lat, coords.lng], 15);
        markerRef.current?.setLatLng([coords.lat, coords.lng]);
      }
    });
    return () => {
      if (mapInst.current && !coords) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [coords]);

  const handleSave = async () => {
    if (!coords) return alert('Please set your pickup location first.');
    setSaving(true);
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          pickup_lat: coords.lat,
          pickup_lng: coords.lng,
          pickup_address: editAddress || address,
        }),
      });
      // Also update localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.pickup_lat     = coords.lat;
      stored.pickup_lng     = coords.lng;
      stored.pickup_address = editAddress || address;
      localStorage.setItem('user', JSON.stringify(stored));
      setSaved(true);
      onLocationSaved?.({ lat: coords.lat, lng: coords.lng, address: editAddress || address });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save location: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="locationManager">
      <div className="locationManagerHeader">
        <h3 className="locationManagerTitle">📍 My Pickup Location</h3>
        <p className="locationManagerSubtitle">
          Set where customers should come to pick up their orders. You can drag the pin to adjust exactly.
        </p>
      </div>

      {/* Permission / GPS request area */}
      {!coords && (
        <div className="locationPermissionBox">
          <div className="locationPermissionIcon">🗺️</div>
          <h4>Set Your Pickup Location</h4>
          <p>Allow NutriAI to access your location so customers know where to pick up orders.</p>
          <div className="locationPermissionBtns">
            <button className="locationGrantBtn" onClick={requestLocation} disabled={status === 'requesting'}>
              {status === 'requesting' ? '📡 Getting location…' : '📍 Use My Current Location'}
            </button>
            <button className="locationManualBtn" onClick={() => setCoords({ lat: 27.7172, lng: 85.3240 })}>
              🗺️ Set Manually on Map
            </button>
          </div>
          {status === 'denied' && (
            <p className="locationDeniedNote">
              ⚠️ Location access was denied. You can still drag the pin on the map below to set your location manually.
            </p>
          )}
        </div>
      )}

      {/* Map — shown once we have coords */}
      {coords && (
        <>
          <div className="locationMapWrapper">
            <div className="locationMapHint">
              💡 Click anywhere on the map or drag the pin to adjust your exact pickup location.
            </div>
            <div ref={mapRef} className="locationLeafletMap"/>
          </div>

          {/* Address field */}
          <div className="locationAddressRow">
            <div className="locationAddressGroup">
              <label>Pickup Address / Description</label>
              <input
                className="locationAddressInput"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="e.g. Near Boudha Stupa, Kathmandu, 2nd floor"
              />
              <span className="locationAddressHint">
                You can edit this to add a more specific description for customers.
              </span>
            </div>
          </div>

          <div className="locationActions">
            <button className="locationResetBtn" onClick={() => { setCoords(null); setStatus('idle'); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } }}>
              🔄 Reset Location
            </button>
            <button className="locationSaveBtn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Pickup Location'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// AI CHATBOT WIDGET
// Floating chat button + panel powered by Claude API
// ════════════════════════════════════════════════════════════
function AIChatbot({ currentUser }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your NutriAI assistant. I can help you find dishes, understand nutrition, or answer questions about the marketplace. What would you like to know?' }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are NutriAI's friendly marketplace assistant. You help users:
- Find dishes that match their dietary needs (vegetarian, vegan, gluten-free, etc.)
- Understand nutrition and healthy eating
- Navigate the homecook marketplace
- Answer questions about ordering, pickup, and reviews
- Give cooking tips and recipe suggestions

The marketplace is based in Nepal and features homecook meals. Prices are in NPR (Nepali Rupees).
Keep responses concise, friendly, and helpful. Use emojis naturally.
Current user: ${currentUser?.full_name || 'Guest'}`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t process that. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ I\'m having trouble connecting. Please try again shortly.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <button className={`chatbotFab ${open ? 'chatbotFabOpen' : ''}`} onClick={() => setOpen(o => !o)} title="AI Assistant">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chatbotPanel">
          <div className="chatbotHeader">
            <div className="chatbotHeaderLeft">
              <div className="chatbotAvatar">🤖</div>
              <div>
                <div className="chatbotName">NutriAI Assistant</div>
                <div className="chatbotStatus">● Online</div>
              </div>
            </div>
            <button className="chatbotClose" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbotMessages">
            {messages.map((m, i) => (
              <div key={i} className={`chatbotMsg ${m.role}`}>
                {m.role === 'assistant' && <div className="chatbotMsgAvatar">🤖</div>}
                <div className="chatbotMsgBubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chatbotMsg assistant">
                <div className="chatbotMsgAvatar">🤖</div>
                <div className="chatbotMsgBubble chatbotTyping">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="chatbotInputArea">
            <textarea
              className="chatbotInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about dishes, nutrition, orders…"
              rows={1}
              disabled={loading}
            />
            <button className="chatbotSend" onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

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
  const [showMap, setShowMap]               = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      setLoadingReviews(true);
      try {
        const data = await apiFetch(`/marketplace/reviews/recipe/${recipe.id}`);
        setReviews(data.data?.reviews || []);
      } catch { setReviews([]); }
      finally { setLoadingReviews(false); }
    };
    load();
  }, [recipe.id]);

  const handleOrder = async () => {
    if (!pickupDate) return alert('Please select a pickup date.');
    setPlacing(true);
    try {
      await apiFetch('/marketplace/orders', {
        method: 'POST',
        body: JSON.stringify({
          recipe_id: recipe.id, quantity: qty,
          pickup_date: pickupDate, pickup_time: pickupTime, special_notes: notes,
        }),
      });
      setOrderSuccess(true);
      setTimeout(() => { onOrderPlaced?.(); onClose(); }, 1800);
    } catch (err) { alert(err.message); }
    finally { setPlacing(false); }
  };

  const isOwnListing = isHomecook && recipe.user_id === currentUser?.id;

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modalContent">
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
                <span style={{ marginLeft:8 }}>
                  <Stars rating={recipe.average_rating}/>
                  <span style={{ fontSize:12, color:'#7a6e60', marginLeft:4 }}>({recipe.total_orders||0} orders)</span>
                </span>
              )}
            </span>
            <span className="modalPrice">{formatNpr(recipe.price)}</span>
          </div>

          {recipe.description && <p className="modalDesc">{recipe.description}</p>}

          {/* Dietary tags */}
          <div className="modalDietTags">
            {recipe.is_vegetarian  && <span className="recipeTag veg">🥬 Vegetarian</span>}
            {recipe.is_vegan       && <span className="recipeTag vegan">🌱 Vegan</span>}
            {recipe.is_gluten_free && <span className="recipeTag gf">🌾 Gluten-Free</span>}
            {recipe.is_dairy_free  && <span className="recipeTag" style={{ background:'#dbeafe',color:'#1e40af' }}>🥛 Dairy-Free</span>}
            {recipe.cuisine_type   && <span className="recipeTag cuisine">{recipe.cuisine_type}</span>}
            {recipe.prep_time_minutes && <span className="recipeTag" style={{ background:'#f5f5f5',color:'#555' }}>⏱ {recipe.prep_time_minutes} min</span>}
            {recipe.servings && <span className="recipeTag" style={{ background:'#f5f5f5',color:'#555' }}>🍽 {recipe.servings} serving{recipe.servings>1?'s':''}</span>}
          </div>

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div className="modalSection">
              <div className="modalSectionTitle">Ingredients</div>
              <div className="ingredientsList">
                {recipe.ingredients.map((ing, i) => <span key={i} className="ingredientPill">{ing}</span>)}
              </div>
            </div>
          )}

          {/* Map toggle — shows saved homecook location */}
          <div className="modalSection">
            <button className="mapToggleBtn" onClick={() => setShowMap(v => !v)}>
              {showMap ? '🗺️ Hide Map' : '📍 Show Pickup Location on Map'}
            </button>
            {showMap && (
              <HomecookMap
                homecookName={recipe.homecook_name}
                lat={recipe.pickup_lat}
                lng={recipe.pickup_lng}
                address={recipe.pickup_address || recipe.homecook_address || 'Kathmandu, Nepal'}
              />
            )}
          </div>

          {/* Reviews */}
          <div className="modalSection">
            <div className="modalSectionTitle">Reviews</div>
            {loadingReviews ? (
              <p style={{ color:'#7a6e60', fontSize:13 }}>Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p style={{ color:'#7a6e60', fontSize:13 }}>No reviews yet. Be the first!</p>
            ) : (
              <div className="reviewsList">
                {reviews.map(r => (
                  <div key={r.id} className="reviewItem">
                    <div className="reviewItemTop">
                      <span className="reviewerName">{r.reviewer_name}</span>
                      <span className="reviewStars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                    </div>
                    {r.comment && <p className="reviewComment">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Form */}
          {!isOwnListing && (
            <div className="orderForm">
              {orderSuccess ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:48 }}>🎉</div>
                  <p style={{ fontWeight:700, marginTop:8, fontSize:16 }}>Order placed!</p>
                  <p style={{ color:'#7a6e60', fontSize:13, marginTop:4 }}>The homecook will confirm your pickup.</p>
                </div>
              ) : (
                <>
                  <h3 className="orderFormTitle">Place an Order</h3>
                  <div className="orderFormRow">
                    <div className="orderFormGroup">
                      <label>Quantity</label>
                      <input type="number" min={1} max={20} value={qty}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value)||1))}
                        className="orderInput"/>
                    </div>
                    <div className="orderFormGroup">
                      <label>Pickup Date *</label>
                      <input type="date" min={todayStr} value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)} className="orderInput"/>
                    </div>
                  </div>
                  <div className="orderFormGroup" style={{ marginBottom:12 }}>
                    <label>Preferred Pickup Time</label>
                    <input type="time" value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)} className="orderInput"/>
                  </div>
                  <div className="orderFormGroup" style={{ marginBottom:0 }}>
                    <label>Special Notes</label>
                    <textarea placeholder="Any dietary notes or requests…"
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="orderInput" rows={2} style={{ resize:'none' }}/>
                  </div>
                  <div className="orderTotal">
                    <span className="orderTotalLabel">Total ({qty} × {formatNpr(recipe.price)})</span>
                    <span className="orderTotalAmount">{formatNpr(qty * parseFloat(recipe.price||0))}</span>
                  </div>
                  <button className="orderBtn" onClick={handleOrder} disabled={placing}>
                    {placing ? 'Placing Order…' : '🛒 Place Order (Pickup)'}
                  </button>
                  <p style={{ textAlign:'center', fontSize:12, color:'#7a6e60', marginTop:10 }}>
                    Pickup-only. No delivery available.
                  </p>
                </>
              )}
            </div>
          )}

          {isOwnListing && (
            <div style={{ textAlign:'center', padding:'16px', background:'#e8f5ee',
              borderRadius:12, color:'#2d7a4f', fontSize:14, fontWeight:600 }}>
              🌿 This is your listing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADD / EDIT RECIPE MODAL
// ════════════════════════════════════════════════════════════
const emptyRecipeForm = {
  recipe_name:'', description:'', cuisine_type:'', price:'',
  prep_time_minutes:'', servings:'',
  is_vegetarian:false, is_vegan:false, is_gluten_free:false, is_dairy_free:false,
  ingredients:'', instructions:'',
};

function RecipeFormModal({ recipe, onClose, onSaved }) {
  const [form, setForm] = useState(recipe ? {
    ...emptyRecipeForm, ...recipe,
    price: recipe.price || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : (recipe.ingredients||''),
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : (recipe.instructions||''),
  } : { ...emptyRecipeForm });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.recipe_name || !form.description || !form.price)
      return alert('Recipe name, description, and price are required.');
    setSaving(true);
    try {
      const payload = {
        recipe_name: form.recipe_name, description: form.description,
        cuisine_type: form.cuisine_type || 'Nepali',
        price: parseFloat(form.price),
        prep_time_minutes: parseInt(form.prep_time_minutes)||30,
        servings: parseInt(form.servings)||2,
        is_vegetarian: !!form.is_vegetarian, is_vegan: !!form.is_vegan,
        is_gluten_free: !!form.is_gluten_free, is_dairy_free: !!form.is_dairy_free,
        ingredients: form.ingredients ? form.ingredients.split(',').map(s=>s.trim()).filter(Boolean) : [],
        instructions: form.instructions ? form.instructions.split('\n').map(s=>s.trim()).filter(Boolean) : [],
      };
      if (recipe?.id) {
        await apiFetch(`/recipes/${recipe.id}`, { method:'PUT', body:JSON.stringify(payload) });
      } else {
        await apiFetch('/recipes', { method:'POST', body:JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const cuisineTypes = ['Nepali','Indian','Italian','Chinese','Mexican','Japanese','American','Thai','Mediterranean','Other'];

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="recipeFormModal">
        <div className="recipeFormHeader">
          <h2 className="recipeFormTitle">{recipe ? '✏️ Edit Listing' : '➕ Add New Listing'}</h2>
          <button className="modalCloseBtn" onClick={onClose} style={{ position:'static' }}>✕</button>
        </div>
        <div className="recipeFormBody">
          <div className="formGroup">
            <label>Recipe Name <span className="required">*</span></label>
            <input className="formInput" value={form.recipe_name}
              onChange={(e) => set('recipe_name', e.target.value)} placeholder="e.g. Momo with Achar"/>
          </div>
          <div className="formGroup">
            <label>Description <span className="required">*</span></label>
            <textarea className="formTextarea" value={form.description}
              onChange={(e) => set('description', e.target.value)} placeholder="What makes this dish special?"/>
          </div>
          <div className="formGrid2">
            <div className="formGroup">
              <label>Cuisine Type</label>
              <select className="formSelect" value={form.cuisine_type} onChange={(e) => set('cuisine_type', e.target.value)}>
                <option value="">Select cuisine</option>
                {cuisineTypes.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </div>
            <div className="formGroup">
              <label>Price (NPR) <span className="required">*</span></label>
              <input className="formInput" type="number" min="0" step="1"
                value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0"/>
            </div>
          </div>
          <div className="formGrid2">
            <div className="formGroup">
              <label>Prep Time (minutes)</label>
              <input className="formInput" type="number" min="0"
                value={form.prep_time_minutes} onChange={(e) => set('prep_time_minutes', e.target.value)} placeholder="30"/>
            </div>
            <div className="formGroup">
              <label>Servings</label>
              <input className="formInput" type="number" min="1"
                value={form.servings} onChange={(e) => set('servings', e.target.value)} placeholder="2"/>
            </div>
          </div>
          <div className="formGroup">
            <label>Dietary Info</label>
            <div className="formCheckboxRow">
              {[
                { key:'is_vegetarian', label:'🥬 Vegetarian' },
                { key:'is_vegan',      label:'🌱 Vegan' },
                { key:'is_gluten_free',label:'🌾 Gluten-Free' },
                { key:'is_dairy_free', label:'🥛 Dairy-Free' },
              ].map(({ key, label }) => (
                <label className="formCheckbox" key={key}>
                  <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)}/> {label}
                </label>
              ))}
            </div>
          </div>
          <div className="formGroup">
            <label>Ingredients <span style={{ fontWeight:400, color:'#7a6e60', fontSize:12 }}>(comma separated)</span></label>
            <textarea className="formTextarea" value={form.ingredients}
              onChange={(e) => set('ingredients', e.target.value)}
              placeholder="Rice, Lentils, Ghee, Spices…" style={{ minHeight:70 }}/>
          </div>
          <div className="formGroup">
            <label>Instructions <span style={{ fontWeight:400, color:'#7a6e60', fontSize:12 }}>(one step per line)</span></label>
            <textarea className="formTextarea" value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              placeholder={"Heat oil in pan\nAdd ingredients\nServe hot"} style={{ minHeight:90 }}/>
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
        method:'POST',
        body: JSON.stringify({
          order_id: order.id, recipe_id: order.recipe_id,
          reviewee_id: reviewType === 'buyer_to_homecook' ? order.homecook_id : order.buyer_id,
          review_type: reviewType, rating, comment,
        }),
      });
      onSubmitted();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="reviewModal">
        <h3 className="reviewModalTitle">
          {reviewType === 'buyer_to_homecook' ? '⭐ Review the Homecook' : '⭐ Review the Customer'}
        </h3>
        <p style={{ fontSize:14, color:'#7a6e60', marginBottom:16 }}>
          Order: <strong>{order.recipe_name}</strong>
        </p>
        <div className="starPicker">
          {[1,2,3,4,5].map(s => (
            <button key={s} className="starPickerBtn"
              onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}>
              {s <= (hover||rating) ? '★' : '☆'}
            </button>
          ))}
        </div>
        <div className="formGroup">
          <textarea className="formTextarea" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience… (optional)" style={{ minHeight:80 }}/>
        </div>
        <div className="reviewModalActions">
          <button className="cancelFormBtn" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="saveFormBtn" onClick={handleSubmit} disabled={saving} style={{ flex:2 }}>
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
    pending:          ['confirmed','cancelled'],
    confirmed:        ['ready_for_pickup','cancelled'],
    ready_for_pickup: ['completed','no_show'],
  };
  const nextOptions = isHomecookView ? (nextStatusOptions[order.status]||[]) : [];
  const canCancel   = !isHomecookView && order.status === 'pending';
  const canReview   = order.status === 'completed' && !order.has_reviewed;

  return (
    <div className="orderCard">
      <div className="orderCardIcon">{getCuisineEmoji(order.cuisine_type)}</div>
      <div className="orderCardBody">
        <div className="orderCardTop">
          <span className="orderCardName">{order.recipe_name}</span>
          <span className="orderCardPrice">{formatNpr(order.total_price)}</span>
        </div>
        <div className="orderCardMeta">
          <span>{isHomecookView ? `👤 ${order.buyer_name}` : `👨‍🍳 ${order.homecook_name}`}</span>
          <span>📦 Qty: {order.quantity}</span>
          {order.pickup_date && (
            <span>📅 {new Date(order.pickup_date).toLocaleDateString('en-NP',{month:'short',day:'numeric'})}</span>
          )}
          {order.pickup_time && <span>🕐 {order.pickup_time}</span>}
        </div>
        {(order.special_notes||order.special_requests||order.notes) && (
          <p style={{ fontSize:12, color:'#7a6e60', fontStyle:'italic', marginBottom:10 }}>
            "{order.special_notes||order.special_requests||order.notes}"
          </p>
        )}
        <div className="orderCardActions">
          <span className={`statusBadge ${order.status}`}>{meta.emoji} {meta.label}</span>
          {nextOptions.map(s => (
            <button key={s} className={`actionBtn ${s==='cancelled'||s==='no_show'?'danger':'primary'}`}
              onClick={() => onStatusUpdate(order.id, s)}>
              {statusMeta[s]?.label||s}
            </button>
          ))}
          {canCancel && (
            <button className="actionBtn danger" onClick={() => onStatusUpdate(order.id,'cancelled')}>Cancel Order</button>
          )}
          {canReview && (
            <button className="actionBtn success" onClick={() => onReview(order)}>⭐ Leave Review</button>
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

  const [listings, setListings]               = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [search, setSearch]                   = useState('');
  const [activeFilter, setActiveFilter]       = useState('all');
  const [selectedRecipe, setSelectedRecipe]   = useState(null);

  const [myListings, setMyListings]       = useState([]);
  const [loadingMine, setLoadingMine]     = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);

  const [myOrders, setMyOrders]             = useState([]);
  const [homecookOrders, setHomecookOrders] = useState([]);
  const [loadingOrders, setLoadingOrders]   = useState(false);
  const [reviewTarget, setReviewTarget]     = useState(null);
  const [reviewType, setReviewType]         = useState('');

  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setCurrentUser(parsed);
      setIsHomecook(parsed.role === 'homecook' || parsed.homecook_approved === true);
    }
  }, []);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeFilter === 'vegetarian')  params.append('is_vegetarian', 'true');
      if (activeFilter === 'vegan')       params.append('is_vegan', 'true');
      if (activeFilter === 'gluten_free') params.append('is_gluten_free', 'true');
      const q = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch(`/marketplace/listings${q}`);
      setListings(data.data?.listings || []);
    } catch { setListings([]); }
    finally { setLoadingListings(false); }
  }, [search, activeFilter]);

  useEffect(() => { if (activeTab === 'browse') loadListings(); }, [activeTab, loadListings]);
  useEffect(() => { const t = setTimeout(loadListings, 400); return () => clearTimeout(t); }, [search]);

  const loadMyListings = useCallback(async () => {
    if (!isHomecook) return;
    setLoadingMine(true);
    try {
      const data = await apiFetch('/recipes/my/recipes');
      setMyListings(data.data?.recipes || []);
    } catch { setMyListings([]); }
    finally { setLoadingMine(false); }
  }, [isHomecook]);

  useEffect(() => { if (activeTab === 'myListings') loadMyListings(); }, [activeTab, loadMyListings]);

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
    } catch { setMyOrders([]); setHomecookOrders([]); }
    finally { setLoadingOrders(false); }
  }, [isHomecook]);

  useEffect(() => { if (activeTab === 'orders') loadOrders(); }, [activeTab, loadOrders]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      if (status === 'cancelled') {
        await apiFetch(`/marketplace/orders/${orderId}/cancel`, { method:'PUT' });
      } else {
        await apiFetch(`/marketplace/orders/${orderId}/status`, { method:'PUT', body:JSON.stringify({ status }) });
      }
      showToast(`Order marked as ${statusMeta[status]?.label||status}`);
      loadOrders();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await apiFetch(`/recipes/${id}`, { method:'DELETE' });
      showToast('Listing deleted');
      loadMyListings();
    } catch (err) { alert(err.message); }
  };

  const handleReviewSubmitted = () => {
    showToast('Review submitted! Thank you.');
    setReviewTarget(null);
    loadOrders();
  };

  const filters = [
    { id:'all',         label:'All' },
    { id:'vegetarian',  label:'🥬 Vegetarian' },
    { id:'vegan',       label:'🌱 Vegan' },
    { id:'gluten_free', label:'🌾 Gluten-Free' },
  ];

  const tabs = [
    { id:'browse',     label:'🏪 Browse' },
    { id:'orders',     label:'📋 My Orders' },
    ...(isHomecook ? [
      { id:'myListings', label:'🍳 My Listings' },
      { id:'myLocation', label:'📍 My Location' },  // NEW TAB for homecooks
    ] : []),
  ];

  const displayedListings = listings.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.recipe_name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
        || r.homecook_name?.toLowerCase().includes(q) || r.cuisine_type?.toLowerCase().includes(q);
  });

  return (
    <div className="marketplacePage">
      {/* Header */}
      <header className="marketplaceHeader">
        <div className="marketplaceHeaderInner">
          <div className="marketplaceLogo" onClick={onBack}>
            <div className="marketplaceLogoMark">🍽</div>
            <span>NutriAI</span>
          </div>
          <h1 className="marketplaceHeaderTitle">Home<span>cook</span> Marketplace</h1>
          <div className="marketplaceHeaderRight">
            <div className={`headerRoleBadge ${isHomecook ? 'homecook' : 'user'}`}>
              {isHomecook ? '👨‍🍳 Homecook' : '🛒 Browsing as User'}
            </div>
            <div className="tabBtns">
              {tabs.map(t => (
                <button key={t.id} className={`tabBtn ${activeTab===t.id?'active':''}`}
                  onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>
            <button className="backBtn" onClick={onBack}>← Dashboard</button>
          </div>
        </div>
      </header>

      {/* Hero — only on browse tab */}
      {activeTab === 'browse' && (
        <div className={`marketplaceHero ${isHomecook ? 'homecookHero' : ''}`}>
          <div className="heroContent">
            <div className="heroEyebrow">🏘️ {isHomecook ? 'Homecook View' : 'Community Kitchen'}</div>
            <h2 className="heroTitle">
              {isHomecook
                ? <>Your dishes, <span>shared</span> with the community</>
                : <>Real food, made by <span>real people</span></>}
            </h2>
            <p className="heroSubtitle">
              {isHomecook
                ? 'Browse all listings and manage your own. Use the Listings tab to add or edit your dishes.'
                : 'Order homemade meals from approved community cooks near you. Pickup only.'}
            </p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {activeTab === 'browse' && (
        <div className="filterBar">
          <div className="filterBarInner">
            <div className="searchBox">
              <span>🔍</span>
              <input placeholder="Search dishes, cooks, cuisines…"
                value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            <div className="filterDivider"/>
            <div className="filterChips">
              {filters.map(f => (
                <button key={f.id} className={`filterChip ${activeFilter===f.id?'active':''}`}
                  onClick={() => setActiveFilter(f.id)}>{f.label}</button>
              ))}
            </div>
            <span className="resultsCount">
              {!loadingListings && `${displayedListings.length} listing${displayedListings.length!==1?'s':''}`}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="marketplaceMain">

        {/* ── BROWSE TAB ── */}
        {activeTab === 'browse' && (
          <div className="listingsGrid">
            {loadingListings ? <SkeletonGrid/>
            : displayedListings.length === 0 ? (
              <div className="emptyState">
                <div className="emptyStateIcon">🍽️</div>
                <h3 className="emptyStateTitle">No listings found</h3>
                <p className="emptyStateText">
                  {search ? `No dishes matching "${search}".` : 'No listings available yet. Check back soon!'}
                </p>
              </div>
            ) : displayedListings.map(recipe => (
              <div key={recipe.id}
                className={`recipeCard ${isHomecook && recipe.user_id===currentUser?.id ? 'myListing':''}`}
                onClick={() => setSelectedRecipe(recipe)}>
                <div className="recipeCardImage">
                  {getCuisineEmoji(recipe.cuisine_type)}
                  {isHomecook && recipe.user_id===currentUser?.id && <div className="myListingBadge">My Listing</div>}
                </div>
                <div className="recipeCardBody">
                  <div className="recipeCardTop">
                    <span className="recipeCardName">{recipe.recipe_name}</span>
                    <span className="recipeCardPrice">{formatNpr(recipe.price)}</span>
                  </div>
                  <div className="recipeCardCook">👨‍🍳 {recipe.homecook_name||'Homecook'}</div>
                  {recipe.description && <p className="recipeCardDesc">{recipe.description}</p>}
                  <div className="recipeCardTags">
                    {recipe.is_vegetarian  && <span className="recipeTag veg">🥬 Veg</span>}
                    {recipe.is_vegan       && <span className="recipeTag vegan">🌱 Vegan</span>}
                    {recipe.is_gluten_free && <span className="recipeTag gf">🌾 Gluten-Free</span>}
                    {recipe.is_dairy_free  && <span className="recipeTag" style={{ background:'#dbeafe',color:'#1e40af' }}>🥛 DF</span>}
                    {recipe.cuisine_type   && <span className="recipeTag cuisine">{recipe.cuisine_type}</span>}
                  </div>
                  <div className="recipeCardFooter">
                    <div className="recipeRating">
                      <Stars rating={recipe.average_rating}/>
                      <span className="recipeRatingCount">({recipe.total_orders||0})</span>
                    </div>
                    <div className="recipeCardMeta">
                      {recipe.prep_time_minutes && <span>⏱ {recipe.prep_time_minutes}m</span>}
                      {recipe.servings && <span>🍽 {recipe.servings}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MY LISTINGS TAB ── */}
        {activeTab === 'myListings' && isHomecook && (
          <div className="homecookSection">
            <div className="homecookSectionHeader">
              <h2 className="homecookSectionTitle">My Listings</h2>
              <button className="addRecipeBtn" onClick={() => setShowAddForm(true)}>➕ Add Listing</button>
            </div>
            {loadingMine ? <div className="listingsGrid"><SkeletonGrid/></div>
            : myListings.length === 0 ? (
              <div className="emptyState">
                <div className="emptyStateIcon">🍳</div>
                <h3 className="emptyStateTitle">No listings yet</h3>
                <p className="emptyStateText">Add your first dish to start receiving orders.</p>
                <button className="addRecipeBtn" style={{ margin:'20px auto 0', display:'inline-flex' }}
                  onClick={() => setShowAddForm(true)}>➕ Add Your First Dish</button>
              </div>
            ) : (
              <div className="listingsGrid">
                {myListings.map(recipe => (
                  <div key={recipe.id} className="recipeCard myListing">
                    <div className="recipeCardImage">
                      {getCuisineEmoji(recipe.cuisine_type)}
                      <div className="myListingBadge">My Listing</div>
                    </div>
                    <div className="recipeCardBody">
                      <div className="recipeCardTop">
                        <span className="recipeCardName">{recipe.recipe_name}</span>
                        <span className="recipeCardPrice">{formatNpr(recipe.price)}</span>
                      </div>
                      {recipe.description && <p className="recipeCardDesc">{recipe.description}</p>}
                      <div className="recipeCardTags">
                        {recipe.cuisine_type   && <span className="recipeTag cuisine">{recipe.cuisine_type}</span>}
                        {recipe.is_vegetarian  && <span className="recipeTag veg">🥬 Veg</span>}
                        {recipe.is_vegan       && <span className="recipeTag vegan">🌱 Vegan</span>}
                        {recipe.is_gluten_free && <span className="recipeTag gf">🌾 Gluten-Free</span>}
                      </div>
                      <div className="recipeCardFooter">
                        <div className="recipeRating">
                          <Stars rating={recipe.average_rating}/>
                          <span className="recipeRatingCount">({recipe.total_orders||0} orders)</span>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="actionBtn"
                            onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); }}
                            style={{ fontSize:12, padding:'6px 12px' }}>✏️ Edit</button>
                          <button className="actionBtn danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteListing(recipe.id); }}
                            style={{ fontSize:12, padding:'6px 12px' }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY LOCATION TAB (homecook only) ── */}
        {activeTab === 'myLocation' && isHomecook && (
          <HomecookLocationManager
            currentUser={currentUser}
            onLocationSaved={(loc) => {
              setCurrentUser(prev => ({ ...prev, pickup_lat: loc.lat, pickup_lng: loc.lng, pickup_address: loc.address }));
              showToast('📍 Pickup location saved!');
            }}
          />
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <>
            {loadingOrders ? <p style={{ color:'#7a6e60', textAlign:'center', padding:40 }}>Loading orders…</p> : (
              <>
                {isHomecook && (
                  <div style={{ marginBottom:40 }}>
                    <h2 className="homecookSectionTitle" style={{ marginBottom:16 }}>📥 Incoming Orders</h2>
                    {homecookOrders.length === 0 ? (
                      <div className="emptyState" style={{ padding:'40px 0' }}>
                        <div className="emptyStateIcon">📭</div>
                        <p className="emptyStateText">No incoming orders yet.</p>
                      </div>
                    ) : (
                      <div className="ordersSection">
                        {homecookOrders.map(o => (
                          <OrderCard key={o.id} order={o} viewAs="homecook"
                            onStatusUpdate={handleStatusUpdate}
                            onReview={(order) => { setReviewTarget(order); setReviewType('homecook_to_buyer'); }}/>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h2 className="homecookSectionTitle" style={{ marginBottom:16 }}>
                    🛒 {isHomecook ? 'My Placed Orders' : 'My Orders'}
                  </h2>
                  {myOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding:'40px 0' }}>
                      <div className="emptyStateIcon">🛒</div>
                      <h3 className="emptyStateTitle">No orders yet</h3>
                      <p className="emptyStateText">Browse the marketplace and place your first order!</p>
                      <button className="addRecipeBtn" style={{ margin:'16px auto 0', display:'inline-flex' }}
                        onClick={() => setActiveTab('browse')}>Browse Listings</button>
                    </div>
                  ) : (
                    <div className="ordersSection">
                      {myOrders.map(o => (
                        <OrderCard key={o.id} order={o} viewAs="buyer"
                          onStatusUpdate={handleStatusUpdate}
                          onReview={(order) => { setReviewTarget(order); setReviewType('buyer_to_homecook'); }}/>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} currentUser={currentUser} isHomecook={isHomecook}
          onClose={() => setSelectedRecipe(null)}
          onOrderPlaced={() => showToast('Order placed successfully!')}/>
      )}
      {(showAddForm || editingRecipe) && (
        <RecipeFormModal recipe={editingRecipe||null}
          onClose={() => { setShowAddForm(false); setEditingRecipe(null); }}
          onSaved={() => {
            setShowAddForm(false); setEditingRecipe(null);
            showToast(editingRecipe ? 'Listing updated!' : 'Listing added to marketplace!');
            loadMyListings();
          }}/>
      )}
      {reviewTarget && (
        <ReviewModal order={reviewTarget} reviewType={reviewType}
          onClose={() => setReviewTarget(null)} onSubmitted={handleReviewSubmitted}/>
      )}

      {/* AI Chatbot — always visible */}
      <AIChatbot currentUser={currentUser}/>

      {toast && <Toast message={toast}/>}
    </div>
  );
}