import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Package, Clock, DollarSign, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import './itemsList.css';

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [viewMode, setViewMode] = useState('grid');

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

  // Filter items based on search term and filter type
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'All Types' || 
                         (filterType === 'Open' && item.status === 'open') ||
                         (filterType === 'Closed' && item.status === 'closed') ||
                         (filterType === 'Draft' && item.status === 'draft') ||
                         (filterType === 'Pending' && item.status === 'pending') ||
                         (filterType === 'Sold' && item.status === 'sold');
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalItems = items.length;
  const openItems = items.filter(item => item.status === 'open').length;
  const draftItems = items.filter(item => item.status === 'draft').length;

  // Format time left
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          style={styles.loader}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          style={styles.loadingText}
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
      <div style={styles.errorContainer}>
        <motion.div
          style={styles.errorCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={styles.errorTitle}>Error</h3>
          <p style={styles.errorText}>{error}</p>
          <motion.button
            style={styles.retryButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
          >
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div style={styles.headerContent}>
          <Package size={32} style={styles.headerIcon} />
          <div>
            <h1 style={styles.title}>Items Dashboard</h1>
            <p style={styles.subtitle}>Browse and bid on fresh seafood auctions</p>
          </div>
        </div>
        <div style={styles.headerStats}>
          <motion.div
            style={styles.statsCard}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span style={styles.statsNumber}>{totalItems}</span>
            <span style={styles.statsLabel}>TOTAL ITEMS</span>
          </motion.div>
          <motion.div
            style={styles.statsCard}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span style={styles.statsNumber}>{openItems}</span>
            <span style={styles.statsLabel}>LIVE AUCTIONS</span>
          </motion.div>
          <motion.div
            style={styles.statsCard}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span style={styles.statsNumber}>{draftItems}</span>
            <span style={styles.statsLabel}>DRAFT ITEMS</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        style={styles.searchBar}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, description, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterContainer}>
          <Filter size={16} style={styles.filterIcon} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All Types">All Types</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'grid' ? 'rgba(0, 194, 201, 0.2)' : 'transparent'
            }}
            onClick={() => setViewMode('grid')}
          >
            <Package size={16} />
          </button>
          <button
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'table' ? 'rgba(0, 194, 201, 0.2)' : 'transparent'
            }}
            onClick={() => setViewMode('table')}
          >
            <TrendingUp size={16} />
          </button>
        </div>
        <motion.button
          style={styles.refreshButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
        >
          <RefreshCw size={20} />
        </motion.button>
      </motion.div>

      {/* Items Display */}
      <AnimatePresence>
        {filteredItems.length === 0 ? (
          <motion.div
            style={styles.emptyState}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <Package size={64} style={styles.emptyIcon} />
            <h3 style={styles.emptyTitle}>No items found</h3>
            <p style={styles.emptyText}>
              {searchTerm || filterType !== 'All Types' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No fresh catches available at the moment'}
            </p>
            <motion.button
              style={styles.browseButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('All Types');
              }}
            >
              <Plus size={16} style={{ marginRight: '8px' }} />
              Clear Filters
            </motion.button>
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            style={styles.tableContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div style={styles.table}>
              {/* Table Header */}
              <div style={styles.tableHeader}>
                <div style={styles.headerCell}>NAME</div>
                <div style={styles.headerCell}>SKU</div>
                <div style={styles.headerCell}>TYPE</div>
                <div style={styles.headerCell}>PRICE</div>
                <div style={styles.headerCell}>STATUS</div>
                <div style={styles.headerCell}>TIME LEFT</div>
                <div style={styles.headerCell}>ACTIONS</div>
              </div>

              {/* Table Rows */}
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  style={styles.tableRow}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={styles.tableCell}>
                    <div style={styles.itemInfo}>
                      <div style={styles.itemIcon}>🐟</div>
                      <div>
                        <div style={styles.itemName}>{item.name}</div>
                        <div style={styles.itemDescription}>
                          {item.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.skuText}>
                      SKU-{item._id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.typeBadge}>FRESH</span>
                  </div>
                  <div style={styles.tableCell}>
                    <div style={styles.priceInfo}>
                      <div style={styles.startingPrice}>
                        Rs.{Number(item.startingPrice).toLocaleString()}
                      </div>
                      <div style={styles.currentPrice}>
                        Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={styles.tableCell}>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(item.status).bg,
                        borderColor: getStatusColor(item.status).border,
                        color: getStatusColor(item.status).color
                      }}
                    >
                      <div style={{
                        ...styles.statusDot,
                        backgroundColor: getStatusColor(item.status).color
                      }}></div>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={{
                      ...styles.timeBadge,
                      backgroundColor: isCriticalTime(item.endTime) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      borderColor: isCriticalTime(item.endTime) ? '#ef4444' : '#f59e0b',
                      color: isCriticalTime(item.endTime) ? '#ef4444' : '#f59e0b'
                    }}>
                      <Clock size={14} />
                      {formatTimeLeft(item.endTime)}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <motion.button
                        style={{...styles.actionButton, backgroundColor: '#8b5cf6'}}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.location.href = `/items/${item._id}`}
                      >
                        <Eye size={16} />
                      </motion.button>
                      <motion.button
                        style={{...styles.actionButton, backgroundColor: '#10b981'}}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.location.href = `/items/${item._id}`}
                      >
                        <DollarSign size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            style={styles.gridContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div style={styles.itemsGrid}>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  style={styles.itemCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={styles.cardImageContainer}>
                    <img
                      src={item.images && item.images.length > 0 ? `http://localhost:5000/uploads/${item.images[0]}` : '/images/default-item.jpg'}
                      alt={item.name}
                      style={styles.cardImage}
                    />
                    <div style={styles.imageOverlay}>
                      <span style={styles.itemType}>FRESH</span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(item.status).bg,
                        borderColor: getStatusColor(item.status).border,
                        color: getStatusColor(item.status).color
                      }}>
                        <div style={{
                          ...styles.statusDot,
                          backgroundColor: getStatusColor(item.status).color
                        }}></div>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{item.name}</h3>
                    <p style={styles.cardDescription}>
                      {item.description?.substring(0, 100)}...
                    </p>
                    
                    <div style={styles.priceSection}>
                      <div style={styles.priceRow}>
                        <span style={styles.priceLabel}>Starting</span>
                        <span style={styles.priceValue}>
                          Rs.{Number(item.startingPrice).toLocaleString()}
                        </span>
                      </div>
                      <div style={styles.priceRow}>
                        <span style={styles.priceLabel}>Current</span>
                        <span style={{...styles.priceValue, color: '#00c2c9'}}>
                          Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div style={styles.timeSection}>
                      <Clock size={16} style={styles.timeIcon} />
                      <span style={styles.timeLabel}>Ends in:</span>
                      <span style={{
                        ...styles.timeValue,
                        color: isCriticalTime(item.endTime) ? '#ef4444' : '#f59e0b'
                      }}>
                        {formatTimeLeft(item.endTime)}
                      </span>
                    </div>

                    <Link to={`/items/${item._id}`} style={styles.bidButton}>
                      <DollarSign size={16} />
                      Bid Now
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  loader: {
    width: '50px',
    height: '50px',
    border: '4px solid #374151',
    borderTop: '4px solid #00c2c9',
    borderRadius: '50%',
  },
  loadingText: {
    fontSize: '18px',
    color: '#9ca3af',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '20px',
  },
  errorCard: {
    background: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '400px',
  },
  errorTitle: {
    fontSize: '24px',
    color: '#ef4444',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },
  errorText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '0 0 25px 0',
    lineHeight: '1.5',
  },
  retryButton: {
    background: 'linear-gradient(135deg, #00c2c9, #156eae)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '30px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  headerIcon: {
    color: '#00c2c9',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '5px 0 0 0',
  },
  headerStats: {
    display: 'flex',
    gap: '16px',
  },
  statsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(0, 194, 201, 0.1)',
    borderRadius: '12px',
    color: 'white',
    minWidth: '120px',
    border: '1px solid rgba(0, 194, 201, 0.2)',
  },
  statsNumber: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#00c2c9',
  },
  statsLabel: {
    fontSize: '12px',
    opacity: 0.9,
    marginTop: '5px',
    fontWeight: '600',
  },
  searchBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '30px',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  filterContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterIcon: {
    position: 'absolute',
    left: '12px',
    color: '#9ca3af',
    zIndex: 1,
  },
  filterSelect: {
    padding: '12px 16px 12px 40px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    minWidth: '120px',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    background: 'rgba(0, 194, 201, 0.1)',
    color: '#00c2c9',
    border: '1px solid rgba(0, 194, 201, 0.2)',
    borderRadius: '12px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  tableContainer: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
    background: 'rgba(0, 194, 201, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  headerCell: {
    padding: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background-color 0.2s ease',
  },
  tableCell: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#ffffff',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemIcon: {
    fontSize: '20px',
  },
  itemName: {
    fontWeight: '500',
    marginBottom: '4px',
  },
  itemDescription: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  skuText: {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '500',
  },
  typeBadge: {
    background: 'rgba(0, 194, 201, 0.3)',
    color: '#00c2c9',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  priceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  startingPrice: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  currentPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#00c2c9',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ffffff',
  },
  gridContainer: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  itemCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
  },
  cardImageContainer: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemType: {
    background: 'rgba(0, 194, 201, 0.3)',
    color: '#00c2c9',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid rgba(0, 194, 201, 0.5)',
  },
  cardContent: {
    padding: '24px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 12px 0',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: '1.5',
    margin: '0 0 20px 0',
  },
  priceSection: {
    marginBottom: '20px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  priceLabel: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  priceValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  timeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  timeIcon: {
    color: '#f59e0b',
  },
  timeLabel: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  timeValue: {
    fontSize: '14px',
    fontWeight: '600',
  },
  bidButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #00c2c9, #156eae)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: {
    color: '#6b7280',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '24px',
    color: '#ffffff',
    margin: '0 0 10px 0',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '0 0 30px 0',
  },
  browseButton: {
    background: 'linear-gradient(135deg, #00c2c9, #156eae)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

export default ItemsList;
