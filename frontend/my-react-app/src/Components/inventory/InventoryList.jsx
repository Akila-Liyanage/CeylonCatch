import React, { useEffect, useMemo, useState } from 'react'
import AddItem from './AddItem'
import UpdateItem from './UpdateItem'
import './inven.css'
import jsPDF from 'jspdf'

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

    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20

    // Helper function to add text with word wrapping
    const addText = (text, x, y, maxWidth = pageWidth - 20) => {
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + (lines.length * 7)
    }

    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('CeylonCatch', 20, 15)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Premium Seafood Marketplace', 20, 22)
    
    doc.setFontSize(10)
    doc.text('Inventory Report', pageWidth - 20, 15, { align: 'right' })
    doc.text(new Date().toLocaleDateString('en-US'), pageWidth - 20, 22, { align: 'right' })

    yPosition = 45

    // Summary Section
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Inventory Summary', 20, yPosition)
    yPosition += 10

    // Summary cards
    const cardWidth = (pageWidth - 60) / 4
    const cardHeight = 25
    let cardX = 20

    // Total Items
    doc.setFillColor(248, 250, 252)
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(totalItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Total Products', cardX + cardWidth/2, yPosition + 18, { align: 'center' })
    cardX += cardWidth + 5

    // Total Value
    doc.setFillColor(248, 250, 252)
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`LKR ${totalValue.toLocaleString()}`, cardX + cardWidth/2, yPosition + 8, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Total Value', cardX + cardWidth/2, yPosition + 18, { align: 'center' })
    cardX += cardWidth + 5

    // Low Stock
    doc.setFillColor(248, 250, 252)
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(lowStockItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Low Stock', cardX + cardWidth/2, yPosition + 18, { align: 'center' })
    cardX += cardWidth + 5

    // Out of Stock
    doc.setFillColor(248, 250, 252)
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(outOfStockItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Out of Stock', cardX + cardWidth/2, yPosition + 18, { align: 'center' })

    yPosition += 40

    // Detailed Inventory Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detailed Inventory Listing', 20, yPosition)
    yPosition += 10

    // Table headers
    const headers = ['Product', 'SKU', 'Type', 'Price', 'Qty', 'Status', 'Value']
    const colWidths = [50, 25, 25, 25, 15, 20, 25]
    let xPos = 20

    // Draw table header
    doc.setFillColor(37, 99, 235)
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPosition + 6)
      xPos += colWidths[index]
    })

    yPosition += 10
    doc.setTextColor(0, 0, 0)

    // Table rows
    items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F')
      }

      xPos = 20
      const stock = (item.quantity <= item.stockThreshold ? 
        (item.quantity <= Math.max(1, Math.floor(item.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good')
      const totalValue = item.price * item.quantity

      const rowData = [
        item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name,
        item.SKU || 'N/A',
        item.type,
        `LKR ${Number(item.price).toFixed(2)}`,
        item.quantity.toString(),
        stock,
        `LKR ${totalValue.toFixed(0)}`
      ]

      rowData.forEach((data, colIndex) => {
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        
        // Color code status
        if (colIndex === 5) { // Status column
          if (stock === 'Good') {
            doc.setTextColor(22, 101, 52) // Green
          } else if (stock === 'Medium') {
            doc.setTextColor(146, 64, 14) // Orange
          } else {
            doc.setTextColor(220, 38, 38) // Red
          }
        } else {
          doc.setTextColor(0, 0, 0)
        }

        doc.text(data, xPos + 1, yPosition + 6)
        xPos += colWidths[colIndex]
      })

      yPosition += 8
    })

    yPosition += 15

    // Category Summary
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Product Category Distribution', 20, yPosition)
    yPosition += 10

    // Category table headers
    doc.setFillColor(37, 99, 235)
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')

    const categoryHeaders = ['Category', 'Items', 'Percentage', 'Total Value']
    const categoryColWidths = [60, 20, 30, 40]
    xPos = 20

    categoryHeaders.forEach((header, index) => {
      doc.text(header, xPos + 2, yPosition + 6)
      xPos += categoryColWidths[index]
    })

    yPosition += 10
    doc.setTextColor(0, 0, 0)

    // Category data
    Object.entries(typeSummary).forEach(([type, count], index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F')
      }

      const percentage = ((count / totalItems) * 100).toFixed(1)
      const categoryItems = items.filter(item => item.type === type)
      const categoryValue = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const categoryData = [
        type,
        count.toString(),
        `${percentage}%`,
        `LKR ${categoryValue.toLocaleString()}`
      ]

      xPos = 20
      categoryData.forEach((data, colIndex) => {
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(data, xPos + 1, yPosition + 6)
        xPos += categoryColWidths[colIndex]
      })

      yPosition += 8
    })

    // Footer
    const footerY = pageHeight - 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('CeylonCatch Inventory Management System', 20, footerY)
    doc.text('Generated: ' + new Date().toLocaleString('en-US'), pageWidth - 20, footerY, { align: 'right' })

    // Download the PDF
    const fileName = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  return (
    <div className="inventory-containerAA">
      {/* Modern Header with Stats - Enhanced for Dark Theme */}
      <div className="inventory-headerAA">
        <div className="header-contentAA">
          <div className="title-sectionAA">
            <h2>🐟 Inventory Dashboard</h2>
            <p className="header-subtitleAA">Manage your product inventory and stock levels with precision</p>
          </div>
          <div className="stats-sectionAA">
            <div className="stat-cardAA">
              <div className="stat-valueAA">{items.length}</div>
              <div className="stat-labelAA">Total Products</div>
            </div>
            <div className="stat-cardAA">
              <div className="stat-valueAA">{items.filter(item => item.quantity <= item.stockThreshold).length}</div>
              <div className="stat-labelAA">Low Stock</div>
            </div>
            <div className="stat-cardAA">
              <div className="stat-valueAA">{items.filter(item => item.quantity === 0).length}</div>
              <div className="stat-labelAA">Out of Stock</div>
            </div>
            <div className="stat-cardAA">
              <div className="stat-valueAA">LKR {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</div>
              <div className="stat-labelAA">Total Value</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Controls - Oceanic Theme */}
      <div className="inventory-controlsAA">
        <div className="controls-wrapperAA">
          <div className="search-wrapperAA">
            <svg className="search-iconAA" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              className="search-inputAA"
              placeholder="🔍 Search by name, SKU, or description..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapperAA">
            <svg className="filter-iconAA" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <select className="filter-selectAA stock-level-dropdownAA" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Stock Levels</option>
              <option value="Good">Good Stock</option>
              <option value="Medium">Medium Stock</option>
              <option value="Low">Low Stock</option>
            </select>
          </div>
          
          <button className="report-btnAA" onClick={generateInventoryReport}>
            <svg className="btn-iconAA" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            📊 Generate Report
          </button>
          
          <button className="add-btnAA" onClick={() => setShowAdd(true)}>
            <svg className="btn-iconAA" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="error-messageAA">
          <svg className="error-iconAA" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-containerAA">
          <div className="loading-spinnerAA"></div>
          <div className="loading-messageAA">Loading inventory...</div>
        </div>
      ) : (
        <div className="table-containerAA">
          <div className="table-wrapperAA">
            <table className="inventory-tableAA">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>Image</th>
                  <th style={{width: '200px'}}>Product Name</th>
                  <th style={{width: '120px'}}>SKU</th>
                  <th style={{width: '100px'}}>Type</th>
                  <th style={{width: '100px'}}>Price</th>
                  <th style={{width: '120px'}}>Stock Level</th>
                  <th style={{width: '120px'}}>Quality</th>
                  <th style={{width: '120px'}}>Status</th>
                  <th style={{width: '150px', textAlign: 'center'}}>Actions</th>
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
                    <tr key={it._id} className="table-rowAA">
                      <td className="image-cellAA" style={{textAlign: 'center'}}>
                        {it.imageURL ? 
                          <img src={it.imageURL} alt="Product" className="product-imageAA" /> : 
                          <div className="no-imageAA">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        }
                      </td>
                      <td className="name-cellAA">
                        <div className="product-nameAA">{it.name}</div>
                        {it.description && (
                          <div style={{fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px'}}>
                            {it.description.length > 50 ? `${it.description.substring(0, 50)}...` : it.description}
                          </div>
                        )}
                      </td>
                      <td className="sku-cellAA">
                        <span className="sku-cellAA">{it.SKU || 'N/A'}</span>
                      </td>
                      <td className="type-cell" style={{textAlign: 'center'}}>
                        <span className="type-badgeAA">{it.type}</span>
                      </td>
                      <td className="price-cellAA" style={{textAlign: 'right'}}>
                        <div style={{fontWeight: '700', fontSize: '1.1rem', color: '#000000'}}>LKR {Number(it.price).toFixed(2)}</div>
                        <div style={{fontSize: '0.8rem', color: '#9ca3af'}}>
                          Total: LKR {(Number(it.price) * it.quantity).toFixed(2)}
                        </div>
                      </td>
                      <td className="stock-cellAA">
                        <span className="stock-valueAA">{it.quantity}</span>
                        <span className="stock-thresholdAA">/ {it.stockThreshold}</span>
                        <div style={{fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px'}}>
                          {((it.quantity / it.stockThreshold) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="quality-cell" style={{textAlign: 'center'}}>
                        <span className={`status-badgeAA quality-${quality.toLowerCase()}`}>
                          {quality === 'Good' ? '' : quality === 'Medium' ? '' : ''} {quality}
                          {daysLeft !== '' && (
                            <div style={{fontSize: '0.7rem', marginTop: '2px'}}>
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="status-cell" style={{textAlign: 'center'}}>
                        <span className={`status-badgeAA stock-${stock.toLowerCase()}`}>
                          <span className={`status-dotAA dot-${stock.toLowerCase()}`}></span>
                          {stock === 'Good' ? '' : stock === 'Medium' ? '' : ''} {stock}
                        </span>
                      </td>
                      <td className="actions-cell" style={{textAlign: 'center'}}>
                        <div className="action-buttonsAA" style={{justifyContent: 'center'}}>
                          <button 
                            className="action-btnAA view-btnAA" 
                            onClick={() => setEditing({ item: it, mode: 'view' })}
                            title="View Details"
                          >
                            View
                          </button>
                          <button 
                            className="action-btnAA edit-btnAA" 
                            onClick={() => setEditing({ item: it, mode: 'edit' })}
                            title="Edit Item"
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btnAA delete-btnAA" 
                            onClick={() => onDelete(it._id)}
                            title="Delete Item"
                          >
                            Delete
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
            className="add-btnAA" 
            onClick={() => setShowAdd(true)}
            style={{margin: '0 auto'}}
          >
            <svg className="btn-iconAA" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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