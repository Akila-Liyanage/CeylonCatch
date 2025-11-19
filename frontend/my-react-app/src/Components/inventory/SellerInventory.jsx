import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AddItem from './AddItem';
import UpdateItem from './UpdateItem';
import './inven.css';
import jsPDF from 'jspdf';

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
    console.log('Seller email from localStorage:', email);
    if (!email) {
      navigate('/sellerlogin');
      return;
    }
    setSellerEmail(email);
  }, [navigate]);

  // Fetch items when sellerEmail is set
  useEffect(() => {
    if (sellerEmail) {
      fetchItems();
    }
  }, [sellerEmail]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching inventory for seller:', sellerEmail);
      
      // Fetch all items
      const res = await fetch(API_BASE);
      
      if (!res.ok) {
        throw new Error(`Failed to load inventory: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('All items fetched:', data);
      
      // Filter items by seller email
      const sellerItems = Array.isArray(data) 
        ? data.filter(item => item.sellerEmail === sellerEmail) 
        : [];
      
      console.log('Filtered seller items:', sellerItems);
      setItems(sellerItems);
    } catch (e) {
      console.error('Error fetching items:', e);
      setError(e.message || 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((it) => {
    const computedStatus = (it.quantity <= it.stockThreshold ? 
      (it.quantity <= Math.max(1, Math.floor(it.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good');
    const matchesStatus = statusFilter === 'All' || statusFilter === computedStatus;
    const matchesQuery = !query.trim() || `${it.name || ''} ${it.SKU || ''} ${it.description || ''}`.toLowerCase().startsWith(query.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Delete failed');
        return;
      }
      fetchItems();
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Delete failed');
    }
  };

  const handleGenerateReport = () => {
    // Calculate summary data
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = items.filter(item => item.quantity <= item.stockThreshold).length;
    const outOfStockItems = items.filter(item => item.quantity === 0).length;
    
    // Group by type
    const typeSummary = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addText = (text, x, y, maxWidth = pageWidth - 20) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 7);
    };

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CeylonCatch', 20, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Seller Inventory Report', 20, 22);
    
    doc.setFontSize(10);
    doc.text('My Products Report', pageWidth - 20, 15, { align: 'right' });
    doc.text(new Date().toLocaleDateString('en-US'), pageWidth - 20, 22, { align: 'right' });

    yPosition = 45;

    // Seller Info Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Seller Information', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Seller Email: ${sellerEmail}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Report Generated: ${new Date().toLocaleString('en-US')}`, 20, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('My Inventory Summary', 20, yPosition);
    yPosition += 10;

    // Summary cards
    const cardWidth = (pageWidth - 60) / 4;
    const cardHeight = 25;
    let cardX = 20;

    // Total Items
    doc.setFillColor(248, 250, 252);
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(totalItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('My Products', cardX + cardWidth/2, yPosition + 18, { align: 'center' });
    cardX += cardWidth + 5;

    // Total Value
    doc.setFillColor(248, 250, 252);
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${totalValue.toLocaleString()}`, cardX + cardWidth/2, yPosition + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Value', cardX + cardWidth/2, yPosition + 18, { align: 'center' });
    cardX += cardWidth + 5;

    // Low Stock
    doc.setFillColor(248, 250, 252);
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(lowStockItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Low Stock', cardX + cardWidth/2, yPosition + 18, { align: 'center' });
    cardX += cardWidth + 5;

    // Out of Stock
    doc.setFillColor(248, 250, 252);
    doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(outOfStockItems.toString(), cardX + cardWidth/2, yPosition + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Out of Stock', cardX + cardWidth/2, yPosition + 18, { align: 'center' });

    yPosition += 40;

    // Detailed Inventory Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('My Product Inventory', 20, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['Product', 'SKU', 'Type', 'Price', 'Qty', 'Status', 'Value'];
    const colWidths = [50, 25, 25, 25, 15, 20, 25];
    let xPos = 20;

    // Draw table header
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPosition + 6);
      xPos += colWidths[index];
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);

    // Table rows
    items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
      }

      xPos = 20;
      const stock = (item.quantity <= item.stockThreshold ? 
        (item.quantity <= Math.max(1, Math.floor(item.stockThreshold / 2)) ? 'Low' : 'Medium') : 'Good');
      const totalValue = item.price * item.quantity;

      const rowData = [
        item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name,
        item.SKU || 'N/A',
        item.type,
        `Rs. ${Number(item.price).toFixed(2)}`,
        item.quantity.toString(),
        stock,
        `Rs. ${totalValue.toFixed(0)}`
      ];

      rowData.forEach((data, colIndex) => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        // Color code status
        if (colIndex === 5) { // Status column
          if (stock === 'Good') {
            doc.setTextColor(22, 101, 52); // Green
          } else if (stock === 'Medium') {
            doc.setTextColor(146, 64, 14); // Orange
          } else {
            doc.setTextColor(220, 38, 38); // Red
          }
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.text(data, xPos + 1, yPosition + 6);
        xPos += colWidths[colIndex];
      });

      yPosition += 8;
    });

    yPosition += 15;

    // Category Summary
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('My Product Categories', 20, yPosition);
    yPosition += 10;

    // Category table headers
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    const categoryHeaders = ['Category', 'Items', 'Percentage', 'Total Value'];
    const categoryColWidths = [60, 20, 30, 40];
    xPos = 20;

    categoryHeaders.forEach((header, index) => {
      doc.text(header, xPos + 2, yPosition + 6);
      xPos += categoryColWidths[index];
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);

    // Category data
    Object.entries(typeSummary).forEach(([type, count], index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
      }

      const percentage = ((count / totalItems) * 100).toFixed(1);
      const categoryItems = items.filter(item => item.type === type);
      const categoryValue = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const categoryData = [
        type,
        count.toString(),
        `${percentage}%`,
        `Rs. ${categoryValue.toLocaleString()}`
      ];

      xPos = 20;
      categoryData.forEach((data, colIndex) => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(data, xPos + 1, yPosition + 6);
        xPos += categoryColWidths[colIndex];
      });

      yPosition += 8;
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('CeylonCatch Seller Dashboard', 20, footerY);
    doc.text('Generated: ' + new Date().toLocaleString('en-US'), pageWidth - 20, footerY, { align: 'right' });

    // Download the PDF
    const fileName = `seller-inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="seller-inventory-containerQQQ">
      {/* Header */}
      <div className="seller-inventory-headerQQQ">
        <div className="header-contentQQQ">
          <div className="title-sectionQQQ">
            <h2 className="main-titleQQQ">My Fish Inventory</h2>
            <p className="header-subtitleQQQ">Manage your products and track inventory performance</p>
          </div>
          <div className="stats-sectionQQQ">
            <div className="stat-cardQQQ">
              <div className="stat-valueQQQ">{items.length}</div>
              <div className="stat-labelQQQ">My Products</div>
            </div>
            <div className="stat-cardQQQ">
              <div className="stat-valueQQQ">{items.filter(item => item.quantity <= item.stockThreshold).length}</div>
              <div className="stat-labelQQQ">Low Stock</div>
            </div>
            <div className="stat-cardQQQ">
              <div className="stat-valueQQQ">{items.filter(item => item.quantity === 0).length}</div>
              <div className="stat-labelQQQ">Out of Stock</div>
            </div>
            <div className="stat-cardQQQ">
              <div className="stat-valueQQQ">
                Rs. {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </div>
              <div className="stat-labelQQQ">Total Value</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="seller-inventory-controlsQQQ">
        <div className="controls-wrapperQQQ">
          <div className="search-wrapperQQQ">
            <svg className="search-iconQQQ" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              className="search-inputQQQ"
              placeholder="Search my products..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapperQQQ">
            <svg className="filter-iconQQQ" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
            </svg>
            <select className="filter-selectQQQ" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Stock Levels</option>
              <option value="Good">Good Stock</option>
              <option value="Medium">Medium Stock</option>
              <option value="Low">Low Stock</option>
            </select>
          </div>
          
          <button className="generate-report-btnQQQ" onClick={handleGenerateReport}>
            <svg className="btn-iconQQQ" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            My Report
          </button>
          
          <button className="add-btnQQQ" onClick={() => setShowAdd(true)}>
            <svg className="btn-iconQQQ" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="error-messageQQQ">
          <svg className="error-iconQQQ" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-containerQQQ">
          <div className="loading-spinnerQQQ"></div>
          <div className="loading-messageQQQ">Loading your inventory...</div>
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="empty-stateQQQ">
          <svg className="empty-iconQQQ" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <h3 className="empty-titleQQQ">No Products Found</h3>
          <p className="empty-textQQQ">
            {items.length === 0 
              ? "You haven't added any products to your inventory yet. Click 'Add Product' to get started!" 
              : "No products match your search criteria. Try adjusting your filters."}
          </p>
          {items.length === 0 && (
            <button className="add-btnQQQ" onClick={() => setShowAdd(true)}>
              <svg className="btn-iconQQQ" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="table-containerQQQ">
          <div className="table-wrapperQQQ">
            <table className="inventory-tableQQQ">
              <thead>
                <tr>
                  <th className="th-imageQQQ"></th>
                  <th className="th-nameQQQ">Name</th>
                  <th className="th-skuQQQ">SKU</th>
                  <th className="th-typeQQQ">Type</th>
                  <th className="th-priceQQQ">Price</th>
                  <th className="th-stockQQQ">Stock</th>
                  <th className="th-qualityQQQ">Quality</th>
                  <th className="th-statusQQQ">Status</th>
                  <th className="th-actionsQQQ">Actions</th>
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
                    <tr key={it._id} className="table-rowQQQ">
                      <td className="image-cellQQQ">
                        {it.imageURL ? 
                          <img src={it.imageURL} alt="Product" className="product-imageQQQ" /> : 
                          <div className="no-imageQQQ">No Image</div>
                        }
                      </td>
                      <td className="name-cellQQQ">
                        <div className="product-nameQQQ">{it.name}</div>
                        {it.description && <div className="product-descQQQ">{it.description.substring(0, 50)}...</div>}
                      </td>
                      <td className="sku-cellQQQ">{it.SKU}</td>
                      <td className="type-cellQQQ">
                        <span className="type-badgeQQQ">{it.type}</span>
                      </td>
                      <td className="price-cellQQQ">Rs. {Number(it.price).toFixed(2)}</td>
                      <td className="stock-cellQQQ">
                        <span className="stock-valueQQQ">{it.quantity}</span>
                        <span className="stock-thresholdQQQ">/ {it.stockThreshold}</span>
                      </td>
                      <td className="quality-cellQQQ">
                        <span className={`status-badgeQQQ quality-${quality.toLowerCase()}QQQ`}>
                          {quality} {daysLeft !== '' ? `(${daysLeft}d)` : ''}
                        </span>
                      </td>
                      <td className="status-cellQQQ">
                        <span className={`status-badgeQQQ stock-${stock.toLowerCase()}QQQ`}>
                          <span className={`status-dotQQQ dot-${stock.toLowerCase()}QQQ`}></span>
                          {stock}
                        </span>
                      </td>
                      <td className="actions-cellQQQ">
                        <div className="action-buttonsQQQ">
                          <button 
                            className="action-btnQQQ view-btnQQQ" 
                            onClick={() => setEditing({ item: it, mode: 'view' })}
                            title="View Details"
                          >
                            View
                          </button>
                          <button 
                            className="action-btnQQQ edit-btnQQQ" 
                            onClick={() => setEditing({ item: it, mode: 'edit' })}
                            title="Edit Item"
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btnQQQ delete-btnQQQ" 
                            onClick={() => onDelete(it._id)}
                            title="Delete Item"
                          >
                            Delete
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

