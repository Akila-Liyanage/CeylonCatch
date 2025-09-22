import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { FaEye, FaTrash, FaUser, FaGavel, FaClock, FaDollarSign, FaFilter, FaSearch, FaDownload } from 'react-icons/fa';
import './BidManagement.css';

const BidManagement = () => {
  const [bids, setBids] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemFilter, setItemFilter] = useState('All');
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetails, setShowBidDetails] = useState(false);

  useEffect(() => {
    fetchBids();
    fetchItems();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/bids/all');
      console.log('BidManagement - Fetched bids:', response.data);
      setBids(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('BidManagement - Error fetching bids:', error);
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items/legacy/all');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('BidManagement - Error fetching items:', error);
    }
  };

  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      const matchesSearch = 
        bid.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.itemId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.bidAmount?.toString().includes(searchTerm);

      const item = items.find(item => item._id === bid.itemId);
      const bidStatus = item?.status || 'unknown';
      
      const matchesStatus = statusFilter === 'All' || bidStatus === statusFilter.toLowerCase();
      const matchesItem = itemFilter === 'All' || (item && item.name === itemFilter);

      return matchesSearch && matchesStatus && matchesItem;
    });
  }, [bids, searchTerm, statusFilter, itemFilter, items]);

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to delete this bid?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/bids/${bidId}`);
      setBids(bids.filter(bid => bid._id !== bidId));
      alert('Bid deleted successfully');
    } catch (error) {
      console.error('Error deleting bid:', error);
      alert('Failed to delete bid');
    }
  };

  const handleViewBidDetails = (bid) => {
    setSelectedBid(bid);
    setShowBidDetails(true);
  };

  const generateBidReport = () => {
    const totalBids = bids.length;
    const totalValue = bids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    const avgBidAmount = totalBids > 0 ? totalValue / totalBids : 0;
    
    // Group by item
    const itemBids = bids.reduce((acc, bid) => {
      const itemName = bid.itemId?.name || 'Unknown Item';
      acc[itemName] = (acc[itemName] || 0) + 1;
      return acc;
    }, {});

    // Group by user
    const userBids = bids.reduce((acc, bid) => {
      acc[bid.userName] = (acc[bid.userName] || 0) + 1;
      return acc;
    }, {});

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bid Management Report</title>
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
            background: linear-gradient(135deg, #00c2c9 0%, #156eae 100%);
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
            color: #00c2c9;
            border-bottom: 2px solid #00c2c9;
            padding-bottom: 10px;
          }
          .bid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .bid-table th {
            background: linear-gradient(135deg, #00c2c9 0%, #156eae 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .bid-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            font-size: 0.9rem;
          }
          .bid-table tr:hover {
            background-color: #f8f9fa;
          }
          .bid-amount {
            font-weight: 600;
            color: #00c2c9;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo">🎣</div>
            <h1 class="report-title">BID MANAGEMENT REPORT</h1>
          </div>
          
          <div class="content">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">${totalBids}</div>
                <div class="summary-label">Total Bids</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">Rs.${totalValue.toLocaleString()}</div>
                <div class="summary-label">Total Bid Value</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">Rs.${avgBidAmount.toLocaleString()}</div>
                <div class="summary-label">Average Bid</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${Object.keys(userBids).length}</div>
                <div class="summary-label">Active Bidders</div>
              </div>
            </div>

            <h2 class="section-title">Recent Bids</h2>
            <table class="bid-table">
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Item</th>
                  <th>Bid Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${bids.slice(0, 20).map(bid => `
                  <tr>
                    <td>${bid.userName}</td>
                    <td>${bid.itemId?.name || 'Unknown'}</td>
                    <td class="bid-amount">Rs.${bid.bidAmount.toLocaleString()}</td>
                    <td>${new Date(bid.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2 class="section-title">Top Bidders</h2>
            <table class="bid-table">
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Total Bids</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(userBids).slice(0, 10).map(([user, count]) => {
                  const userTotalAmount = bids.filter(bid => bid.userName === user)
                    .reduce((sum, bid) => sum + bid.bidAmount, 0);
                  return `
                    <tr>
                      <td>${user}</td>
                      <td>${count}</td>
                      <td class="bid-amount">Rs.${userTotalAmount.toLocaleString()}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <div>CeylonCatch Bid Management System</div>
            <div>Report generated on ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bid-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return { bg: 'rgba(16, 185, 129, 0.3)', border: '#10b981', color: '#10b981' };
      case 'closed':
        return { bg: 'rgba(239, 68, 68, 0.3)', border: '#ef4444', color: '#ef4444' };
      case 'draft':
        return { bg: 'rgba(156, 163, 175, 0.3)', border: '#9ca3af', color: '#9ca3af' };
      case 'pending':
        return { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b', color: '#f59e0b' };
      case 'sold':
        return { bg: 'rgba(139, 92, 246, 0.3)', border: '#8b5cf6', color: '#8b5cf6' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.3)', border: '#9ca3af', color: '#9ca3af' };
    }
  };

  return (
    <div className="bid-management-container">
      {/* Header */}
      <div className="bid-management-header">
        <div className="header-content">
          <div className="title-section">
            <h2><FaGavel className="header-icon" /> Bid Management</h2>
            <p className="header-subtitle">Monitor and manage all auction bids</p>
          </div>
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-value">{bids.length}</div>
              <div className="stat-label">Total Bids</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{items.filter(item => item.status === 'open').length}</div>
              <div className="stat-label">Active Auctions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{bids.length > 0 ? Math.max(...bids.map(bid => bid.bidAmount)) : 0}</div>
              <div className="stat-label">Highest Bid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bid-management-controls">
        <div className="controls-wrapper">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input 
              className="search-input"
              placeholder="Search by bidder, item, or amount..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="filter-wrapper">
            <FaFilter className="filter-icon" />
            <select 
              className="filter-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="filter-wrapper">
            <select 
              className="filter-select" 
              value={itemFilter} 
              onChange={(e) => setItemFilter(e.target.value)}
            >
              <option value="All">All Items</option>
              {items.map(item => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          
          <button className="report-btn" onClick={generateBidReport}>
            <FaDownload className="btn-icon" />
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading bids...</div>
        </div>
      ) : (
        <div className="bid-table-container">
          <div className="table-wrapper">
            <table className="bid-table">
              <thead>
                <tr>
                  <th><FaUser /> Bidder</th>
                  <th>Item</th>
                  <th><FaDollarSign /> Amount</th>
                  <th><FaClock /> Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.map((bid) => {
                  const item = items.find(item => item._id === bid.itemId);
                  const statusColors = getStatusColor(item?.status);
                  
                  return (
                    <tr key={bid._id} className="bid-row">
                      <td className="bidder-cell">
                        <div className="bidder-info">
                          <FaUser className="bidder-icon" />
                          <span className="bidder-name">{bid.userName}</span>
                        </div>
                      </td>
                      <td className="item-cell">
                        <div className="item-info">
                          <span className="item-name">{item?.name || 'Unknown Item'}</span>
                          <span className="item-type">{item?.fishType || ''}</span>
                        </div>
                      </td>
                      <td className="amount-cell">
                        <span className="bid-amount">Rs.{bid.bidAmount.toLocaleString()}</span>
                      </td>
                      <td className="date-cell">
                        <span className="bid-date">
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </span>
                        <span className="bid-time">
                          {new Date(bid.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: statusColors.bg,
                            borderColor: statusColors.border,
                            color: statusColors.color
                          }}
                        >
                          <span className="status-dot" style={{ backgroundColor: statusColors.color }}></span>
                          {item?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => handleViewBidDetails(bid)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => handleDeleteBid(bid._id)}
                            title="Delete Bid"
                          >
                            <FaTrash />
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

      {/* Bid Details Modal */}
      {showBidDetails && selectedBid && (
        <div className="modal-overlay" onClick={() => setShowBidDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bid Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBidDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Bidder:</label>
                <span>{selectedBid.userName}</span>
              </div>
              <div className="detail-row">
                <label>Item:</label>
                <span>{selectedBid.itemId?.name || 'Unknown Item'}</span>
              </div>
              <div className="detail-row">
                <label>Bid Amount:</label>
                <span className="bid-amount">Rs.{selectedBid.bidAmount.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <label>Date:</label>
                <span>{new Date(selectedBid.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <label>Item Status:</label>
                <span>{selectedBid.itemId?.status || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidManagement;
