import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, Package, TrendingUp, Calendar, Eye, RefreshCw, Search, Filter, Plus } from 'lucide-react';
import axios from 'axios';

const BidHistory = () => {
    const { id } = useParams(); // Get user ID from URL parameter
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBid, setSelectedBid] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Types');

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
        switch (status) {
            case 'leading': return '#10b981'; // Green
            case 'outbid': return '#f59e0b'; // Orange
            default: return '#6b7280'; // Gray
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
    const filteredBids = bids.filter(bid => 
        bid.itemId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.itemId?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const totalBids = bids.length;
    const leadingBids = bids.filter(bid => getBidStatus(bid, bids) === 'leading').length;
    const outbidBids = bids.filter(bid => getBidStatus(bid, bids) === 'outbid').length;

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
                    Loading your bid history...
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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                    <h3 style={styles.errorTitle}>
                        {error === "Please login to view your bid history" ? "Login Required" : "Error"}
                    </h3>
                    <p style={styles.errorText}>{error}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {error === "Please login to view your bid history" ? (
                            <>
                                <motion.button
                                    style={{...styles.retryButton, backgroundColor: '#3b82f6'}}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = '/buyerlogin'}
                                >
                                    Login as Buyer
                                </motion.button>
                                <motion.button
                                    style={{...styles.retryButton, backgroundColor: '#10b981'}}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = '/sellerlogin'}
                                >
                                    Login as Seller
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                style={{...styles.retryButton, backgroundColor: '#667eea'}}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRefresh}
                            >
                                <RefreshCw size={16} style={{ marginRight: '8px' }} />
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
                        <h1 style={styles.title}>Bid History Dashboard</h1>
                        <p style={styles.subtitle}>
                            {userInfo ? `Welcome, ${userInfo.userName}` : 'Track all your auction activities'}
                        </p>
                    </div>
                </div>
                <div style={styles.headerStats}>
                    <motion.div
                        style={styles.statsCard}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <span style={styles.statsNumber}>{totalBids}</span>
                        <span style={styles.statsLabel}>TOTAL BIDS</span>
                    </motion.div>
                <motion.div
                    style={styles.statsCard}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                        <span style={styles.statsNumber}>{leadingBids}</span>
                        <span style={styles.statsLabel}>LEADING</span>
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
                        placeholder="Search by name, SKU, or description..."
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
                        <option value="Leading">Leading</option>
                        <option value="Outbid">Outbid</option>
                    </select>
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

            {/* Bids Table */}
            <AnimatePresence>
                {filteredBids.length === 0 ? (
                    <motion.div
                        style={styles.emptyState}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Package size={64} style={styles.emptyIcon} />
                        <h3 style={styles.emptyTitle}>No bids found</h3>
                        <p style={styles.emptyText}>Start bidding on items you love!</p>
                        <motion.button
                            style={styles.browseButton}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = '/items'}
                        >
                            <Plus size={16} style={{ marginRight: '8px' }} />
                            Browse Items
                        </motion.button>
                    </motion.div>
                ) : (
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
                                <div style={styles.headerCell}>TYPE</div>
                                <div style={styles.headerCell}>PRICE</div>
                                <div style={styles.headerCell}>STATUS</div>
                                <div style={styles.headerCell}>QUALITY</div>
                                <div style={styles.headerCell}>ACTIONS</div>
                            </div>

                            {/* Table Rows */}
                            {filteredBids.map((bid, index) => {
                                const bidStatus = getBidStatus(bid, bids);
                                return (
                            <motion.div
                                key={bid._id}
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
                                                <span style={styles.itemName}>
                                                    {bid.itemId?.name || 'Unknown Item'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={styles.tableCell}>
                                            <span style={styles.typeBadge}>{bid.itemId?.fishType || 'FRESH'}</span>
                                        </div>
                                        <div style={styles.tableCell}>
                                            <span style={styles.priceText}>
                                                Rs.{bid.bidAmount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={styles.tableCell}>
                                            <span 
                                        style={{
                                            ...styles.statusBadge,
                                                    backgroundColor: getStatusColor(bidStatus)
                                        }}
                                    >
                                                <div style={styles.statusDot}></div>
                                                {bidStatus.toUpperCase()}
                                        </span>
                                </div>
                                        <div style={styles.tableCell}>
                                            <span style={styles.qualityBadge}>
                                                {bid.itemId?.quality || 'Grade A'}
                                            </span>
                                        </div>
                                        <div style={styles.tableCell}>
                                            <div style={styles.actionButtons}>
                                                <motion.button
                                                    style={{...styles.actionButton, backgroundColor: '#8b5cf6'}}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedBid(selectedBid === bid._id ? null : bid._id)}
                                                >
                                                    <Eye size={16} />
                                                </motion.button>
                                                <motion.button
                                                    style={{...styles.actionButton, backgroundColor: '#10b981'}}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => window.location.href = `/items/${bid.itemId?._id}`}
                                                >
                                                    <TrendingUp size={16} />
                                                </motion.button>
                                                <motion.button
                                                    style={{...styles.actionButton, backgroundColor: '#ef4444'}}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Package size={16} />
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
        minWidth: '100px',
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
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
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
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
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
    },
    skuText: {
        color: '#9ca3af',
        fontSize: '12px',
        fontWeight: '500',
    },
    typeBadge: {
        background: 'rgba(0, 194, 201, 0.2)',
        color: '#00c2c9',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
    },
    priceText: {
        fontWeight: '600',
        color: '#ffffff',
    },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#ffffff',
    },
    statusDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor',
    },
    qualityBadge: {
        background: 'rgba(245, 158, 11, 0.2)',
        color: '#f59e0b',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
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
};

export default BidHistory;