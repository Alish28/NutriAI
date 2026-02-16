// nutriai/src/components/PantryTracker.jsx

import { useState, useEffect } from 'react';
import { 
  getPantryItems, 
  getExpiringSoon, 
  addPantryItem, 
  updatePantryItem, 
  deletePantryItem,
  getPantryStats 
} from '../services/api';
import './PantryTracker.css';

export default function PantryTracker() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, fresh, expiring, expired
  
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Vegetables',
    quantity: '',
    unit: 'pieces',
    expiry_date: '',
    storage_location: 'Fridge',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        getPantryItems(),
        getPantryStats()
      ]);
      setItems(itemsRes.data.items || []);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error loading pantry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updatePantryItem(editingItem.id, formData);
      } else {
        await addPantryItem(formData);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deletePantryItem(id);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category || 'Vegetables',
      quantity: item.quantity || '',
      unit: item.unit || 'pieces',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      storage_location: item.storage_location || 'Fridge',
      notes: item.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: 'Vegetables',
      quantity: '',
      unit: 'pieces',
      expiry_date: '',
      storage_location: 'Fridge',
      notes: ''
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      fresh: { color: '#e4f7e9', text: '#166534', label: 'Fresh' },
      expiring_soon: { color: '#fff4e1', text: '#c05621', label: 'Expiring Soon' },
      expired: { color: '#ffe5e5', text: '#b91c1c', label: 'Expired' }
    };
    const badge = badges[status] || badges.fresh;
    return (
      <span style={{
        background: badge.color,
        color: badge.text,
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {badge.label}
      </span>
    );
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  if (loading) {
    return <div className="pantry-card"><p>Loading pantry...</p></div>;
  }

  return (
    <div className="pantry-card">
      <div className="pantry-header">
        <h3>Pantry & Expiry Tracker</h3>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          ➕ Add Item
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="pantry-stats">
          <div className="stat-box">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total_items || 0}</span>
          </div>
          <div className="stat-box stat-fresh">
            <span className="stat-label">Fresh</span>
            <span className="stat-value">{stats.fresh || 0}</span>
          </div>
          <div className="stat-box stat-expiring">
            <span className="stat-label">Expiring</span>
            <span className="stat-value">{stats.expiring || 0}</span>
          </div>
          <div className="stat-box stat-expired">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{stats.expired || 0}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="pantry-filters">
        {['all', 'fresh', 'expiring_soon', 'expired'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'expiring_soon' ? 'Expiring' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="pantry-list">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items found</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Add your first item
            </button>
          </div>
        ) : (
          <table className="pantry-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Expiry</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <strong>{item.item_name}</strong>
                      {item.category && <div className="item-category">{item.category}</div>}
                    </div>
                  </td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                  <td>{item.storage_location || '-'}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(item)}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Item' : 'Add Item'}</h3>
              <button className="btn-close" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Grains">Grains</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Condiments">Condiments</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="pieces">pieces</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="cans">cans</option>
                    <option value="bottles">bottles</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Storage</label>
                  <select
                    value={formData.storage_location}
                    onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                  >
                    <option value="Fridge">Fridge</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Cupboard">Cupboard</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}