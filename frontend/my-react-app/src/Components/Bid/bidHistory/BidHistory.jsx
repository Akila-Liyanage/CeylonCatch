import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, Package, TrendingUp, Calendar, Eye, RefreshCw, Search, Filter, Plus } from 'lucide-react';
import axios from 'axios';
import '../bid.css';

const BidHistory = () => {
    const { id } = useParams(); // Get user ID from URL parameter
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBid, setSelectedBid] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Types');

    // VALIDATION: Handle search input change with symbol filtering
    // Prevents special characters and symbols from being entered
    const handleSearchChange = (e) => {
        const value = e.target.value;
        // Only allow alphanumeric characters, spaces, hyphens, and underscores
        // This prevents SQL injection, XSS, and other security issues
        const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
        setSearchTerm(sanitizedValue);
    };

    console.log('BidHistory component rendered with user ID:', id);

    // Fetch bid history for specific user
    useEffect(() => {
        const fetchBidHistoryForUser = async () => {
            if (!id) {
                setError("No user ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('BidHistory - Fetching bid history for user ID:', id);

                // Try to get user details first to get the name and proper _id
                let userName = 'User';
                let actualUserId = id; // Default to the provided ID

                // Check if the ID is an email or MongoDB _id
                if (id.includes('@')) {
                    // It's an email, try to get user details and _id
                    try {
                        const buyerEndpoint = `http://localhost:5000/api/user/buyer-by-email/${id}`;
                        const sellerEndpoint = `http://localhost:5000/api/user/seller-by-email/${id}`;
                        
                        let userResponse;
                        try {
                            userResponse = await axios.get(buyerEndpoint);
                            console.log('BidHistory - Found buyer:', userResponse.data);
                        } catch (buyerError) {
                            userResponse = await axios.get(sellerEndpoint);
                            console.log('BidHistory - Found seller:', userResponse.data);
                        }
                        
                        if (userResponse.data.name) {
                            userName = userResponse.data.name;
                        }
                        if (userResponse.data._id) {
                            // Use the MongoDB _id for fetching bids
                            actualUserId = userResponse.data._id;
                            console.log('BidHistory - Using MongoDB _id for bids:', actualUserId);
                        }
                    } catch (userError) {
                        console.warn('BidHistory - Could not fetch user details:', userError.message);
                    }
                } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
                    // It's a MongoDB _id, try to get user details using the new endpoint
                    try {
                        const userEndpoint = `http://localhost:5000/api/user/user-by-id/${id}`;
                        const userResponse = await axios.get(userEndpoint);
                        
                        if (userResponse.data.name) {
                            userName = userResponse.data.name;
                        }
                        console.log('BidHistory - Using provided MongoDB _id:', actualUserId);
                    } catch (userError) {
                        console.warn('BidHistory - Could not fetch user details by _id:', userError.message);
                    }
                } else {
                    console.log('BidHistory - Unknown ID format, using as-is:', id);
                }

                setUserInfo({ userId: actualUserId, userName, originalId: id });

                // Fetch bid history using the actual user ID (MongoDB _id)
                const bidResponse = await axios.get(`http://localhost:5000/api/bids/history/${actualUserId}`);
                console.log('BidHistory - Bid response:', bidResponse.data);
                
                setBids(Array.isArray(bidResponse.data) ? bidResponse.data : []);

            } catch (error) {
                console.error('BidHistory - Error:', error);
                console.error('BidHistory - Error response:', error.response?.data);
                
                if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                    setError("Server connection failed. Please make sure the backend server is running.");
                } else if (error.response?.status === 404) {
                    setError("No bid history found for this user.");
                } else {
                    setError(error.response?.data?.message || "Failed to fetch bid history");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBidHistoryForUser();
    }, [id]);

    const handleRefresh = () => {
        setError(null);
        setLoading(true);
        // Re-trigger the fetch for the current user ID
        const fetchBidHistoryForUser = async () => {
            try {
                const userIdToUse = userInfo?.userId || id;
                console.log('BidHistory - Refreshing bid history for user ID:', userIdToUse);
                const bidResponse = await axios.get(`http://localhost:5000/api/bids/history/${userIdToUse}`);
                console.log('BidHistory - Refresh bid response:', bidResponse.data);
                setBids(Array.isArray(bidResponse.data) ? bidResponse.data : []);
            } catch (error) {
                console.error('BidHistory - Refresh error:', error);
                setError(error.response?.data?.message || "Failed to fetch bid history");
            } finally {
                setLoading(false);
            }
        };

        fetchBidHistoryForUser();
    };

    const getBidStatus = (bid, allBids) => {
        const itemBids = allBids.filter(b => b.itemId === bid.itemId);
        const highestBid = itemBids.reduce((max, current) => 
            current.bidAmount > max.bidAmount ? current : max
        );
        
        return bid._id === highestBid._id ? 'leading' : 'outbid';
    };

    const getStatusColor = (status) => {
        // Return CSS class names for our enhanced status badges
        switch (status) {
            case 'leading': return 'status-badge open';
            case 'outbid': return 'status-badge pending';
            default: return 'status-badge draft';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'leading': return <TrendingUp size={16} />;
            case 'outbid': return <Eye size={16} />;
            default: return <Package size={16} />;
        }
    };

    // Filter bids based on search term
    // VALIDATION: Filter bids based on search term with sanitization
    // Search input is sanitized to prevent symbols and special characters
    const filteredBids = bids.filter(bid => {
        // Sanitize search term to prevent injection attacks and improve search accuracy
        const sanitizedSearchTerm = searchTerm.replace(/[^a-zA-Z0-9\s\-_]/g, '').toLowerCase().trim();
        
        // Perform case-insensitive search on bid item properties
        // VALIDATION: Check if search term exists in item name or description
        return sanitizedSearchTerm === '' || 
               bid.itemId?.name?.toLowerCase().includes(sanitizedSearchTerm) ||
               bid.itemId?.description?.toLowerCase().includes(sanitizedSearchTerm);
    });

    // Calculate statistics
    const totalBids = bids.length;
    const leadingBids = bids.filter(bid => getBidStatus(bid, bids) === 'leading').length;
    const outbidBids = bids.filter(bid => getBidStatus(bid, bids) === 'outbid').length;

    // Animation variants
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

    const statsVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { 
            scale: 1, 
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    if (loading) {
        return (
            <div className="animated-bg" style={{ padding: '2rem' }}>
                <div className="glass-container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                    padding: '5rem',
                    textAlign: 'center'
            }}>
                <motion.div
                    style={{
                        width: '4rem',
                        height: '4rem',
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                            borderTop: '4px solid #64ffda',
                            borderRadius: '50%'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.p
                        className="card-title"
                        style={{ marginTop: '2rem' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Loading your bid history...
                </motion.p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animated-bg" style={{ padding: '2rem' }}>
                <motion.div
                    className="glass-container"
                    style={{
                        padding: '3rem',
                        textAlign: 'center',
                        maxWidth: '32rem',
                        margin: '0 auto'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div 
                        style={{ fontSize: '4rem', marginBottom: '1.5rem' }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🔐
                    </motion.div>
                    <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>
                        {error === "Please login to view your bid history" ? "Login Required" : "Error"}
                    </h3>
                    <p className="card-description" style={{ marginBottom: '2rem' }}>{error}</p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {error === "Please login to view your bid history" ? (
                            <>
                                <motion.button
                                    className="enhanced-button"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = '/buyerlogin'}
                                >
                                    Login as Buyer
                                </motion.button>
                                <motion.button
                                    className="enhanced-button"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = '/sellerlogin'}
                                >
                                    Login as Seller
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                className="enhanced-button"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRefresh}
                            >
                                <RefreshCw size={20} />
                                Try Again
                            </motion.button>
                        )}
                    </div>
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
                            <h1 className="header-title">Bid History Dashboard</h1>
                            <p className="header-subtitle">{userInfo ? `Welcome, ${userInfo.userName}` : 'Track all your auction activities'}</p>
                    </div>
                </div>
                    <div className="stats-grid">
                        <motion.div
                            className="stat-card"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -2 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <span className="stat-number">{totalBids}</span>
                            <span className="stat-label">Total Bids</span>
                        </motion.div>
                        
                    <motion.div
                            className="stat-card"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                            <span className="stat-number">{leadingBids}</span>
                            <span className="stat-label">Leading Bids</span>
                    </motion.div>
                        
                <motion.div
                            className="stat-card"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                            <span className="stat-number">{outbidBids}</span>
                            <span className="stat-label">Outbid</span>
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Filter size={16} className="filter-icon" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="All Types">All Types</option>
                        <option value="Leading">Leading</option>
                        <option value="Outbid">Outbid</option>
                    </select>
                </div>
                <motion.button
                    className="refresh-btn"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRefresh}
                >
                    <RefreshCw size={20} />
                </motion.button>
            </motion.div>

            {/* Bids Table */}
            <AnimatePresence>
                {filteredBids.length === 0 ? (
                    <motion.div
                        className="glass-container"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '5rem',
                            textAlign: 'center'
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                                borderRadius: '50%',
                                marginBottom: '1.5rem',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Package size={64} style={{ color: 'white' }} />
                        </motion.div>
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>No bids found</h3>
                        <p className="card-description" style={{ marginBottom: '2rem' }}>Start bidding on items you love!</p>
                        <motion.button
                            className="enhanced-button"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = '/items'}
                        >
                            <Plus size={20} />
                            Browse Items
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="glass-container"
                        style={{
                            overflow: 'hidden'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div style={{ width: '100%' }}>
                            {/* Table Header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>NAME</div>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>TYPE</div>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>PRICE</div>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>STATUS</div>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>QUALITY</div>
                                <div style={{
                                    padding: '1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>ACTIONS</div>
                            </div>

                            {/* Table Rows */}
                            {filteredBids.map((bid, index) => {
                                const bidStatus = getBidStatus(bid, bids);
                                const statusColors = getStatusColor(bidStatus);
                                return (
                            <motion.div
                                key={bid._id}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(6, 1fr)',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    >
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <motion.div 
                                                    style={{ fontSize: '1.5rem' }}
                                                    animate={{ rotate: [0, 10, -10, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                                                >
                                                    🐟
                                                </motion.div>
                                                <span style={{
                                                    fontWeight: '600',
                                                    fontSize: '1.125rem'
                                                }}>
                                                    {bid.itemId?.name || 'Unknown Item'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <span style={{
                                                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.3) 100%)',
                                                color: '#6ee7b7',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(16, 185, 129, 0.3)'
                                            }}>
                                                {bid.itemId?.fishType || 'FRESH'}
                                            </span>
                                        </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                fontSize: '1.125rem',
                                                background: 'linear-gradient(90deg, #fbbf24 0%, #fb923c 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>
                                                Rs.{bid.bidAmount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <span                                             className={statusColors}>
                                                <div className="status-dot"></div>
                                                {bidStatus.toUpperCase()}
                                        </span>
                                </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <span style={{
                                                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.3) 100%)',
                                                color: '#fcd34d',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(245, 158, 11, 0.3)'
                                            }}>
                                                {bid.itemId?.quality || 'Grade A'}
                                            </span>
                                        </div>
                                        <div style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            color: 'white'
                                        }}>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <motion.button
                                                    style={{
                                                        width: '2.5rem',
                                                        height: '2.5rem',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: 'white',
                                                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedBid(selectedBid === bid._id ? null : bid._id)}
                                                >
                                                    <Eye size={18} />
                                                </motion.button>
                                                <motion.button
                                                    style={{
                                                        width: '2.5rem',
                                                        height: '2.5rem',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: 'white',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    whileHover={{ scale: 1.15, rotate: -5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => window.location.href = `/items/${bid.itemId?._id}`}
                                                >
                                                    <TrendingUp size={18} />
                                                </motion.button>
                                                <motion.button
                                                    style={{
                                                        width: '2.5rem',
                                                        height: '2.5rem',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: 'white',
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Package size={18} />
                                                </motion.button>
                                        </div>
                                    </div>
                                    </motion.div>
                                );
                            })}
                                                </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default BidHistory;