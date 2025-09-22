import React, { useEffect, useMemo, useState } from 'react'
import AddItem from './AddItem'
import UpdateItem from './UpdateItem'
import './inventory.css'

// Simple list table for inventory with search, filter and actions
const API_BASE = 'http://localhost:5000/api/inventory'

const InventoryList = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetchItems = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Failed to load inventory')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Error fetching')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      const computedStatus = (it.quantity <= it.stockThreshold ? (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good')
      const matchesStatus = statusFilter === 'All' || statusFilter === computedStatus
      const matchesQuery = !q || `${it.name || ''} ${it.SKU || ''}`.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [items, query, statusFilter])

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) return alert('Delete failed')
    fetchItems()
  }

  const generateInventoryReport = () => {
    // Calculate summary data
    const totalItems = items.length
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const lowStockItems = items.filter(item => item.quantity <= item.stockThreshold).length
    const outOfStockItems = items.filter(item => item.quantity === 0).length
    
    // Group by type
    const typeSummary = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})

    // Create HTML content for the report
    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventory Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 2rem;
            margin: 0;
            font-weight: 600;
          }
          .report-meta {
            margin-top: 15px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .summary-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary-label {
            font-size: 0.9rem;
            opacity: 0.9;
          }
          .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 30px 0 15px 0;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
          }
          .inventory-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .inventory-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .inventory-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            font-size: 0.9rem;
          }
          .inventory-table tr:hover {
            background-color: #f8f9fa;
          }
          .inventory-table tr:last-child td {
            border-bottom: none;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-good { background: #d4edda; color: #155724; }
          .status-medium { background: #fff3cd; color: #856404; }
          .status-low { background: #f8d7da; color: #721c24; }
          .status-expired { background: #f5c6cb; color: #721c24; }
          .type-badge {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .price-value {
            font-weight: 600;
            color: #28a745;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
          }
          .generated-date {
            font-size: 0.9rem;
            margin-top: 10px;
          }
          @media print {
            body { background: white; }
            .report-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo">🐟</div>
            <h1 class="report-title">INVENTORY REPORT</h1>
            <div class="report-meta">
              <div>Generated by: CeylonCatch System</div>
              <div>Date: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>
          </div>
          
          <div class="content">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">${totalItems}</div>
                <div class="summary-label">Total Products</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">LKR ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div class="summary-label">Total Inventory Value</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${lowStockItems}</div>
                <div class="summary-label">Low Stock Items</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${outOfStockItems}</div>
                <div class="summary-label">Out of Stock</div>
              </div>
            </div>

            <h2 class="section-title">Inventory Overview</h2>
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Stock Threshold</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const now = new Date()
                  const exp = item.expiryDate ? new Date(item.expiryDate) : null
                  const daysLeft = exp ? Math.ceil((exp.getTime() - now.getTime()) / (1000*60*60*24)) : ''
                  const quality = daysLeft === '' ? 'Good' : (daysLeft <= 0 ? 'Expired' : (daysLeft <= 7 ? 'Medium' : 'Good'))
                  const stock = (item.quantity <= item.stockThreshold ? (item.quantity <= Math.max(1, Math.floor(item.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good')
                  const totalValue = item.price * item.quantity
                  
                  return `
                    <tr>
                      <td><strong>${item.name}</strong></td>
                      <td>${item.SKU || 'N/A'}</td>
                      <td><span class="type-badge">${item.type}</span></td>
                      <td class="price-value">LKR ${Number(item.price).toFixed(2)}</td>
                      <td>${item.quantity}</td>
                      <td>${item.stockThreshold}</td>
                      <td class="price-value">LKR ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td><span class="status-badge status-${stock.toLowerCase()}">${stock}</span></td>
                      <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>

            <h2 class="section-title">Product Type Summary</h2>
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>Product Type</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(typeSummary).map(([type, count]) => `
                  <tr>
                    <td><span class="type-badge">${type}</span></td>
                    <td>${count}</td>
                    <td>${((count / totalItems) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2 class="section-title">Comments & Notes</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <ul style="margin: 0; padding-left: 20px;">
                <li>Total inventory value: <strong>LKR ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></li>
                <li>${lowStockItems} items require restocking attention</li>
                <li>${outOfStockItems} items are currently out of stock</li>
                <li>Average item value: <strong>LKR ${totalItems > 0 ? (totalValue / totalItems).toFixed(2) : '0.00'}</strong></li>
                <li>Report generated on ${new Date().toLocaleString()}</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div>CeylonCatch Inventory Management System</div>
            <div class="generated-date">Report generated on ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `

    // Create and download the report
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="inventory-container">
      {/* Modern Header with Stats - Enhanced for Dark Theme */}
      <div className="inventory-header">
        <div className="header-content">
          <div className="title-section">
            <h2>🐟 Inventory Dashboard</h2>
            <p className="header-subtitle">Manage your product inventory and stock levels with precision</p>
          </div>
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-value">{items.length}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{items.filter(item => item.quantity <= item.stockThreshold).length}</div>
              <div className="stat-label">Low Stock</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{items.filter(item => item.quantity === 0).length}</div>
              <div className="stat-label">Out of Stock</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">LKR {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Controls - Oceanic Theme */}
      <div className="inventory-controls">
        <div className="controls-wrapper">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              className="search-input"
              placeholder="🔍 Search by name, SKU, or description..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapper">
            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>📦 All Stock Levels</option>
              <option>✅ Good Stock</option>
              <option>⚠️ Medium Stock</option>
              <option>🚨 Low Stock</option>
            </select>
          </div>
          
          <button className="report-btn" onClick={generateInventoryReport}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            📊 Generate Report
          </button>
          
          <button className="add-btn" onClick={() => setShowAdd(true)}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ➕ Add Product
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
          <div className="loading-message">Loading inventory...</div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>🖼️ Image</th>
                  <th style={{width: '200px'}}>📦 Product Name</th>
                  <th style={{width: '120px'}}>🏷️ SKU</th>
                  <th style={{width: '100px'}}>📋 Type</th>
                  <th style={{width: '100px'}}>💰 Price</th>
                  <th style={{width: '120px'}}>📊 Stock Level</th>
                  <th style={{width: '120px'}}>⭐ Quality</th>
                  <th style={{width: '120px'}}>🚦 Status</th>
                  <th style={{width: '150px', textAlign: 'center'}}>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const now = new Date()
                  const exp = it.expiryDate ? new Date(it.expiryDate) : null
                  const daysLeft = exp ? Math.ceil((exp.getTime() - now.getTime()) / (1000*60*60*24)) : ''
                  const quality = daysLeft === '' ? 'Good' : (daysLeft <= 0 ? 'Expired' : (daysLeft <= 7 ? 'Medium' : 'Good'))
                  const stock = (it.quantity <= it.stockThreshold ? (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good')
                  
                  return (
                    <tr key={it._id} className="table-row">
                      <td className="image-cell" style={{textAlign: 'center'}}>
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
                        {it.description && (
                          <div style={{fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px'}}>
                            {it.description.length > 50 ? `${it.description.substring(0, 50)}...` : it.description}
                          </div>
                        )}
                      </td>
                      <td className="sku-cell">
                        <span className="sku-cell">{it.SKU || 'N/A'}</span>
                      </td>
                      <td className="type-cell" style={{textAlign: 'center'}}>
                        <span className="type-badge">{it.type}</span>
                      </td>
                      <td className="price-cell" style={{textAlign: 'right'}}>
                        <div style={{fontWeight: '700', fontSize: '1.1rem'}}>LKR {Number(it.price).toFixed(2)}</div>
                        <div style={{fontSize: '0.8rem', color: '#9ca3af'}}>
                          Total: LKR {(Number(it.price) * it.quantity).toFixed(2)}
                        </div>
                      </td>
                      <td className="stock-cell" style={{textAlign: 'center'}}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                          <span className="stock-value">{it.quantity}</span>
                          <span className="stock-threshold">/ {it.stockThreshold}</span>
                          <div style={{fontSize: '0.7rem', color: '#9ca3af'}}>
                            {((it.quantity / it.stockThreshold) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </td>
                      <td className="quality-cell" style={{textAlign: 'center'}}>
                        <span className={`status-badge quality-${quality.toLowerCase()}`}>
                          {quality === 'Good' ? '✅' : quality === 'Medium' ? '⚠️' : '❌'} {quality}
                          {daysLeft !== '' && (
                            <div style={{fontSize: '0.7rem', marginTop: '2px'}}>
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="status-cell" style={{textAlign: 'center'}}>
                        <span className={`status-badge stock-${stock.toLowerCase()}`}>
                          <span className={`status-dot dot-${stock.toLowerCase()}`}></span>
                          {stock === 'Good' ? '✅' : stock === 'Medium' ? '⚠️' : '🚨'} {stock}
                        </span>
                      </td>
                      <td className="actions-cell" style={{textAlign: 'center'}}>
                        <div className="action-buttons" style={{justifyContent: 'center'}}>
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => setEditing({ item: it, mode: 'view' })}
                            title="👁️ View Details"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => setEditing({ item: it, mode: 'edit' })}
                            title="✏️ Edit Item"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => onDelete(it._id)}
                            title="🗑️ Delete Item"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && items.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          margin: '2rem 0'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
          <h3 style={{color: '#ffffff', marginBottom: '0.5rem'}}>No items found</h3>
          <p style={{color: '#9ca3af'}}>Try adjusting your search criteria or filters</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          margin: '2rem 0'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📦</div>
          <h3 style={{color: '#ffffff', marginBottom: '0.5rem'}}>No inventory items yet</h3>
          <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>Start building your inventory by adding your first product</p>
          <button 
            className="add-btn" 
            onClick={() => setShowAdd(true)}
            style={{margin: '0 auto'}}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ➕ Add Your First Product
          </button>
        </div>
      )}

      {showAdd && <AddItem onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
      {editing && <UpdateItem data={editing} onClose={() => setEditing(null)} onSaved={fetchItems} />}
    </div>
  )
}

export default InventoryList