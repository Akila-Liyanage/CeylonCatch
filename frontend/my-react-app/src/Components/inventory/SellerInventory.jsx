import React, { useEffect, useMemo, useState } from 'react'
import AddItem from './AddItem'
import UpdateItem from './UpdateItem'
import './inventory.css'

// Seller-specific inventory management component
const API_BASE = 'http://localhost:5000/api/inventory'

const SellerInventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [sellerEmail, setSellerEmail] = useState('')

  // Get seller email from localStorage
  useEffect(() => {
    const email = localStorage.getItem('sellerEmail')
    setSellerEmail(email || 'admin@ceyloncatch.com')
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Failed to load inventory')
      const data = await res.json()
      // Filter items by seller email
      const sellerItems = Array.isArray(data) ? data.filter(item => item.sellerEmail === sellerEmail) : []
      setItems(sellerItems)
    } catch (e) {
      setError(e.message || 'Error fetching inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (sellerEmail) {
      fetchItems() 
    }
  }, [sellerEmail])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      const computedStatus = (it.quantity <= it.stockThreshold ? (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good')
      const matchesStatus = statusFilter === 'All' || statusFilter === computedStatus
      const matchesType = typeFilter === 'All' || typeFilter === it.type
      const matchesQuery = !q || `${it.name || ''} ${it.SKU || ''} ${it.description || ''}`.toLowerCase().includes(q)
      return matchesStatus && matchesType && matchesQuery
    })
  }, [items, query, statusFilter, typeFilter])

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item from your inventory?')) return
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) return alert('Delete failed')
    fetchItems()
  }

  const generateSellerReport = () => {
    // Calculate summary data for seller
    const totalItems = items.length
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const lowStockItems = items.filter(item => item.quantity <= item.stockThreshold).length
    const outOfStockItems = items.filter(item => item.quantity === 0).length
    
    // Group by type
    const typeSummary = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})

    // Create HTML content for the seller report
    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seller Inventory Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            min-height: 100vh;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #00c2c9 0%, #156eae 100%);
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
            background: rgba(0, 194, 201, 0.2);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(0, 194, 201, 0.3);
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
            color: #00c2c9;
            border-bottom: 2px solid #00c2c9;
            padding-bottom: 10px;
          }
          .inventory-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }
          .inventory-table th {
            background: linear-gradient(135deg, #00c2c9 0%, #156eae 100%);
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
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            color: #ffffff;
          }
          .inventory-table tr:hover {
            background-color: rgba(255, 255, 255, 0.1);
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
          .status-good { background: rgba(16, 185, 129, 0.3); color: #10b981; }
          .status-medium { background: rgba(245, 158, 11, 0.3); color: #f59e0b; }
          .status-low { background: rgba(239, 68, 68, 0.3); color: #ef4444; }
          .status-expired { background: rgba(239, 68, 68, 0.3); color: #ef4444; }
          .type-badge {
            background: rgba(0, 194, 201, 0.3);
            color: #00c2c9;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .price-value {
            font-weight: 600;
            color: #10b981;
          }
          .footer {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #9ca3af;
          }
          .generated-date {
            font-size: 0.9rem;
            margin-top: 10px;
          }
          @media print {
            body { background: white; color: black; }
            .report-container { box-shadow: none; background: white; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo">🐟</div>
            <h1 class="report-title">SELLER INVENTORY REPORT</h1>
            <div class="report-meta">
              <div>Generated by: CeylonCatch Seller Dashboard</div>
              <div>Seller: ${sellerEmail}</div>
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
                <div class="summary-label">My Products</div>
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

            <h2 class="section-title">My Inventory Overview</h2>
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
                    <td>${totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2 class="section-title">Seller Notes & Recommendations</h2>
            <div style="background: rgba(0, 194, 201, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #00c2c9;">
              <ul style="margin: 0; padding-left: 20px; color: #ffffff;">
                <li>Total inventory value: <strong>LKR ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></li>
                <li>${lowStockItems} items require restocking attention</li>
                <li>${outOfStockItems} items are currently out of stock</li>
                <li>Average item value: <strong>LKR ${totalItems > 0 ? (totalValue / totalItems).toFixed(2) : '0.00'}</strong></li>
                <li>Consider updating low stock items to maintain sales momentum</li>
                <li>Report generated on ${new Date().toLocaleString()}</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div>CeylonCatch Seller Dashboard - ${sellerEmail}</div>
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
    link.download = `seller-inventory-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="inventory-container">
      {/* Seller-specific Header */}
      <div className="inventory-header">
        <div className="header-content">
          <div className="title-section">
            <h2>🐟 My Inventory</h2>
            <p className="header-subtitle">Manage your products and track your inventory performance</p>
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
      
      {/* Enhanced Controls for Sellers */}
      <div className="inventory-controls">
        <div className="controls-wrapper">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              className="search-input"
              placeholder="🔍 Search my products..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapper">
            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>🚦 All Stock Levels</option>
              <option>✅ Good Stock</option>
              <option>⚠️ Medium Stock</option>
              <option>🚨 Low Stock</option>
            </select>
          </div>

          <div className="filter-wrapper">
            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>📋 All Types</option>
              <option>Fresh</option>
              <option>Frozen</option>
              <option>Imported</option>
            </select>
          </div>
          
          <button className="report-btn" onClick={generateSellerReport}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            📊 My Report
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
          <div className="loading-message">Loading your inventory...</div>
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

      {/* Empty State for Sellers */}
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
          <h3 style={{color: '#ffffff', marginBottom: '0.5rem'}}>No products found</h3>
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
          <h3 style={{color: '#ffffff', marginBottom: '0.5rem'}}>Start building your inventory</h3>
          <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>Add your first product to start selling on CeylonCatch</p>
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

      {showAdd && <AddItem onClose={() => setShowAdd(false)} onSaved={fetchItems} sellerEmail={sellerEmail} />}
      {editing && <UpdateItem data={editing} onClose={() => setEditing(null)} onSaved={fetchItems} />}
    </div>
  )
}

export default SellerInventory
