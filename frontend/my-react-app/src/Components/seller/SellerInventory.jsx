import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AddItem from '../inventory/AddItem';
import UpdateItem from '../inventory/UpdateItem';
import './SellerInventory.css';

const API_BASE = 'http://localhost:5000/api/inventory';

const SellerInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sellerEmail, setSellerEmail] = useState('');

  useEffect(() => {
    // Get seller email from localStorage
    const email = localStorage.getItem('sellerEmail');
    if (!email) {
      navigate('/slogin');
      return;
    }
    setSellerEmail(email);
    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const email = localStorage.getItem('sellerEmail');
      if (!email) {
        navigate('/slogin');
        return;
      }

      // Fetch only items belonging to this seller
      const url = `${API_BASE}/by-seller/${encodeURIComponent(email)}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          // No items found for this seller
          setItems([]);
          return;
        }
        const errorText = await res.text();
        throw new Error(`Failed to load inventory: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((it) => {
    const computedStatus = (it.quantity <= it.stockThreshold ? 
      (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good');
    const matchesStatus = statusFilter === 'All' || statusFilter === computedStatus;
    const matchesQuery = !query.trim() || `${it.name || ''} ${it.SKU || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Delete failed');
    fetchItems();
  };

  const handleBackToDashboard = () => {
    navigate('/sdashboard');
  };

  return (
    <div className="seller-inventory-container">
      {/* Header */}
      <div className="seller-inventory-header">
        <div className="header-content">
          <div className="title-section">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h2>My Fish Inventory</h2>
            <p className="header-subtitle">Manage your fish products and stock levels</p>
          </div>
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-value">{items.length}</div>
              <div className="stat-label">My Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{items.filter(item => item.quantity <= item.stockThreshold).length}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="seller-inventory-controls">
        <div className="controls-wrapper">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              className="search-input"
              placeholder="Search by name, SKU, or description..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapper">
            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Types</option>
              <option>Good</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          
          <button className="add-btn" onClick={() => setShowAdd(true)}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Fish Item
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading your inventory...</div>
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="empty-state">
          <h3>No Fish Items Yet</h3>
          <p>You haven't added any fish items to your inventory yet. Click "Add Fish Item" to get started!</p>
          <button className="add-btn" onClick={() => setShowAdd(true)} style={{marginTop: '1rem'}}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Fish Item
          </button>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const now = new Date();
                  const exp = it.expiryDate ? new Date(it.expiryDate) : null;
                  const daysLeft = exp ? Math.ceil((exp.getTime() - now.getTime()) / (1000*60*60*24)) : '';
                  const quality = daysLeft === '' ? 'Good' : (daysLeft <= 0 ? 'Expired' : (daysLeft <= 7 ? 'Medium' : 'Good'));
                  const stock = (it.quantity <= it.stockThreshold ? (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good');
                  
                  return (
                    <tr key={it._id} className="table-row">
                      <td className="image-cell">
                        {it.imageURL ? 
                          <img src={it.imageURL} alt="Product" className="product-image" /> : 
                          <div className="no-image">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        }
                      </td>
                      <td className="name-cell">
                        <div className="product-name">{it.name}</div>
                      </td>
                      <td className="sku-cell">{it.SKU}</td>
                      <td className="type-cell">
                        <span className="type-badge">{it.type}</span>
                      </td>
                      <td className="price-cell">Rs. {Number(it.price).toFixed(2)}</td>
                      <td className="stock-cell">
                        <span className="stock-value">{it.quantity}</span>
                        <span className="stock-threshold">/ {it.stockThreshold}</span>
                      </td>
                      <td className="quality-cell">
                        <span className={`status-badge quality-${quality.toLowerCase()}`}>
                          {quality} {daysLeft !== '' ? `(${daysLeft}d)` : ''}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge stock-${stock.toLowerCase()}`}>
                          <span className={`status-dot dot-${stock.toLowerCase()}`}></span>
                          {stock}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => setEditing({ item: it, mode: 'view' })}
                            title="View Details"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => setEditing({ item: it, mode: 'edit' })}
                            title="Edit Item"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => onDelete(it._id)}
                            title="Delete Item"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddItem onClose={() => setShowAdd(false)} onSaved={fetchItems} sellerEmail={sellerEmail} />}
      {editing && <UpdateItem data={editing} onClose={() => setEditing(null)} onSaved={fetchItems} />}
    </div>
  );
};

export default SellerInventory;
