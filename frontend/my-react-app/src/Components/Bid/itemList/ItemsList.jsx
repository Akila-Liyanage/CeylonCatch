import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Package, Clock, DollarSign, TrendingUp, Eye, RefreshCw, LayoutGrid, List } from 'lucide-react';
import '../bid.css';

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [viewMode, setViewMode] = useState('grid');

  // VALIDATION: Handle search input change with symbol filtering
  // Prevents special characters and symbols from being entered
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Only allow alphanumeric characters, spaces, hyphens, and underscores
    // This prevents SQL injection, XSS, and other security issues
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    setSearchTerm(sanitizedValue);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/items/legacy/all');
        setItems(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleRefresh = () => {
    setError('');
    setLoading(true);
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/items/legacy/all');
        setItems(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  };

  // VALIDATION: Filter items based on search term and filter type
  // Search input is sanitized to prevent symbols and special characters
  // Only alphanumeric characters, spaces, and basic punctuation are allowed
  const filteredItems = items.filter(item => {
    // Sanitize search term to prevent injection attacks and improve search accuracy
    // Remove all special characters except alphanumeric, spaces, hyphens, and underscores
    const sanitizedSearchTerm = searchTerm.replace(/[^a-zA-Z0-9\s\-_]/g, '').toLowerCase().trim();
    
    // Perform case-insensitive search on item properties
    // VALIDATION: Check if search term exists in item name or description
    const matchesSearch = sanitizedSearchTerm === '' || 
                         item.name?.toLowerCase().includes(sanitizedSearchTerm) ||
                         item.description?.toLowerCase().includes(sanitizedSearchTerm);
    
    // VALIDATION: Filter by status with proper case handling and exact matching
    const matchesFilter = filterType === 'All Types' || 
                         (filterType === 'Open' && item.status === 'open') ||
                         (filterType === 'Closed' && item.status === 'closed') ||
                         (filterType === 'Draft' && item.status === 'draft') ||
                         (filterType === 'Pending' && item.status === 'pending') ||
                         (filterType === 'Sold' && item.status === 'sold');
    
    return matchesSearch && matchesFilter;
  });

  const totalItems = items.length;
  const openItems = items.filter(item => item.status === 'open').length;
  const draftItems = items.filter(item => item.status === 'draft').length;

  const formatTimeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isCriticalTime = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000;
  };

  const getStatusColor = (status) => {
    // Return CSS class names for our enhanced status badges
    switch (status) {
      case 'open':
        return 'status-badge open';
      case 'closed':
        return 'status-badge closed';
      case 'draft':
        return 'status-badge draft';
      case 'pending':
        return 'status-badge pending';
      case 'sold':
        return 'status-badge sold';
      default:
        return 'status-badge draft';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="animated-bg loading-container">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="loading-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading fresh catches...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animated-bg error-container">
        <motion.div
          className="error-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Error</h3>
          <p className="error-message">{error}</p>
          <motion.button
            className="enhanced-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
          >
            <RefreshCw size={16} />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="animated-bg"
      style={{ padding: '2rem' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with Glass Morphism */}
      <motion.div
        variants={itemVariants}
        style={{ 
          padding: '2rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 25px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.75rem', 
              background: 'var(--accent-gradient)', 
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <Package size={32} style={{ color: 'white' }} />
            </div>
          <div>
              <h1 className="header-title">Auction Dashboard</h1>
              <p className="header-subtitle">Browse and bid on fresh seafood auctions</p>
            </div>
          </div>
          
          <div className="stats-grid">
          <motion.div
              className="stat-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
              <span className="stat-number">{totalItems}</span>
              <span className="stat-label">Total Items</span>
          </motion.div>
            
          <motion.div
              className="stat-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
              <span className="stat-number">{openItems}</span>
              <span className="stat-label">Live Auctions</span>
          </motion.div>
            
          <motion.div
              className="stat-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
              <span className="stat-number">{draftItems}</span>
              <span className="stat-label">Draft Items</span>
          </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Search and Filter Bar */}
      <motion.div
        className="search-container"
        variants={itemVariants}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, description, or type..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            maxLength={100}
            title="Only letters, numbers, spaces, hyphens, and underscores are allowed"
          />
        </div>
        
        <div className="filter-controls">
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)', 
              zIndex: 10,
              pointerEvents: 'none'
            }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
              style={{ paddingLeft: '3rem', minWidth: '150px' }}
          >
            <option value="All Types">All Types</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
          
          <div className="view-toggle">
            <motion.button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
          >
              <LayoutGrid size={18} />
            </motion.button>
            <motion.button
              className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('table')}
          >
              <List size={18} />
            </motion.button>
        </div>
          
        <motion.button
            className="refresh-button"
            whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
            transition={{ duration: 0.3 }}
        >
          <RefreshCw size={20} />
        </motion.button>
        </div>
      </motion.div>

      {/* Items Display */}
      <AnimatePresence mode="wait">
        {filteredItems.length === 0 ? (
          <motion.div
            className="empty-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <div className="empty-icon">
              <Package size={64} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="empty-title">No items found</h3>
            <p className="empty-message">
              {searchTerm || filterType !== 'All Types' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No fresh catches available at the moment'}
            </p>
            <motion.button
              className="enhanced-button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('All Types');
              }}
            >
              <Plus size={18} />
              Clear Filters
            </motion.button>
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            className="enhanced-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'inline-block', minWidth: '100%', verticalAlign: 'middle' }}>
                <div className="table-header">
                  <div className="table-header-cell">NAME</div>
                  <div className="table-header-cell">SKU</div>
                  <div className="table-header-cell">TYPE</div>
                  <div className="table-header-cell">PRICE</div>
                  <div className="table-header-cell">STATUS</div>
                  <div className="table-header-cell">TIME LEFT</div>
                  <div className="table-header-cell">ACTIONS</div>
              </div>

              {filteredItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  className="table-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div className="table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        background: 'var(--bg-glass)', 
                        borderRadius: 'var(--radius-xl)', 
                        padding: '0.5rem' 
                      }}>🐟</div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {item.name}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)', 
                          maxWidth: '20rem', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </div>
                    
                  <div className="table-cell">
                    <span style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.75rem', 
                      fontFamily: 'monospace', 
                      background: 'var(--bg-glass)', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-lg)' 
                    }}>
                      #{item._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <span className="card-badge" style={{ color: 'var(--text-accent)' }}>
                      FRESH
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#fbbf24',
                        fontWeight: '600'
                      }}>
                        Rs.{Number(item.startingPrice).toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: '700', 
                        color: '#34d399',
                        textShadow: '0 0 8px rgba(52, 211, 153, 0.3)'
                      }}>
                        Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <span className={`status-badge ${item.status}`}>
                      <div className="status-dot"></div>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <span className={`status-badge ${isCriticalTime(item.endTime) ? 'closed' : 'pending'}`}>
                      <Clock size={14} />
                      {formatTimeLeft(item.endTime)}
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <div className="action-buttons">
                      <motion.button
                        className="action-button primary"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.location.href = `/items/${item._id}`}
                      >
                        <Eye size={18} />
                      </motion.button>
                      <motion.button
                        className="action-button success"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.location.href = `/items/${item._id}`}
                      >
                        <DollarSign size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="enhanced-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item._id}
                className="enhanced-card"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ 
                  scale: 1.03,
                  y: -8,
                  transition: { duration: 0.3 }
                  }}
                >
                <div className="card-image">
                  <motion.img
                      src={item.images && item.images.length > 0 ? `http://localhost:5000/uploads/${item.images[0]}` : '/images/default-item.jpg'}
                      alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="card-overlay"></div>
                  
                  <div className="card-badges">
                    <span className="card-badge" style={{ color: 'var(--text-accent)' }}>
                      FRESH
                    </span>
                    <span className={`status-badge ${item.status}`}>
                      <div className="status-dot"></div>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                <div className="card-content">
                  <h3 className="card-title">{item.name}</h3>
                  <p className="card-description">{item.description}</p>
                  
                  <div className="card-price-section">
                    <div className="price-row">
                      <span className="price-label starting">Starting</span>
                      <span className="price-value">
                          Rs.{Number(item.startingPrice).toLocaleString()}
                        </span>
                      </div>
                    <div className="price-row">
                      <span className="price-label current">Current</span>
                      <span className="price-current">
                          Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>

                  <div className="card-timer">
                    <Clock size={18} className="timer-icon" />
                    <span className="timer-label">Ends in:</span>
                    <span className={`timer-value ${isCriticalTime(item.endTime) ? 'critical' : ''}`}>
                        {formatTimeLeft(item.endTime)}
                      </span>
                    </div>

                  <Link 
                    to={`/items/${item._id}`} 
                    className="enhanced-button"
                    style={{ width: '100%' }}
                  >
                    <DollarSign size={18} />
                    <span>Place Your Bid</span>
                    </Link>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemsList;