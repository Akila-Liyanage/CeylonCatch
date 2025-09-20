import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, Package, TrendingUp, Calendar, Eye } from 'lucide-react';

const BidHistory = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBid, setSelectedBid] = useState(null);
    const userId = "user123"; // Replace with actual userId

    useEffect(() => {
        const fetchBidHistory = async () => {
            try {
                setLoading(true);
                // Replace this section with your actual API call:
                // const res = await axios.get(`http://localhost:5000/api/bids/history/${userId}`)
                // setBids(res.data);
                
                // Simulating API call with mock data
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const mockBids = [
                    {
                        _id: '1',
                        itemId: {
                            name: 'Vintage Watch Collection',
                            image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=200&fit=crop',
                        },
                        bidAmount: 1250,
                        createdAt: '2024-01-15T10:30:00Z',
                        status: 'active'
                    },
                    {
                        _id: '2',
                        itemId: {
                            name: 'Rare Art Piece',
                            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
                        },
                        bidAmount: 850,
                        createdAt: '2024-01-14T15:45:00Z',
                        status: 'outbid'
                    },
                    {
                        _id: '3',
                        itemId: {
                            name: 'Antique Furniture Set',
                            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
                        },
                        bidAmount: 2100,
                        createdAt: '2024-01-13T09:20:00Z',
                        status: 'won'
                    }
                ];
                
                setBids(mockBids);
            } catch (error) {
                console.error("Error fetching bid history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBidHistory();
    }, [userId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'won': return '#4CAF50';
            case 'active': return '#2196F3';
            case 'outbid': return '#FF9800';
            default: return '#757575';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'won': return <TrendingUp size={16} />;
            case 'active': return <Clock size={16} />;
            case 'outbid': return <Eye size={16} />;
            default: return <Package size={16} />;
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
                    Loading your bid history...
                </motion.p>
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
            <motion.div
                style={styles.header}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div style={styles.headerContent}>
                    <Package size={32} style={styles.headerIcon} />
                    <div>
                        <h1 style={styles.title}>My Bid History</h1>
                        <p style={styles.subtitle}>Track all your auction activities</p>
                    </div>
                </div>
                <motion.div
                    style={styles.statsCard}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <span style={styles.statsNumber}>{bids.length}</span>
                    <span style={styles.statsLabel}>Total Bids</span>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {bids.length === 0 ? (
                    <motion.div
                        style={styles.emptyState}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Package size={64} style={styles.emptyIcon} />
                        <h3 style={styles.emptyTitle}>No bids placed yet</h3>
                        <p style={styles.emptyText}>Start bidding on items you love!</p>
                    </motion.div>
                ) : (
                    <motion.div
                        style={styles.bidsGrid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {bids.map((bid, index) => (
                            <motion.div
                                key={bid._id}
                                style={styles.bidCard}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ 
                                    scale: 1.02,
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedBid(selectedBid === bid._id ? null : bid._id)}
                            >
                                <div style={styles.bidImageContainer}>
                                    <img
                                        src={bid.itemId.image}
                                        alt={bid.itemId.name}
                                        style={styles.bidImage}
                                    />
                                    <motion.div
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor: getStatusColor(bid.status)
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: (index * 0.1) + 0.5, type: "spring" }}
                                    >
                                        {getStatusIcon(bid.status)}
                                        <span style={styles.statusText}>
                                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                        </span>
                                    </motion.div>
                                </div>

                                <div style={styles.bidContent}>
                                    <h3 style={styles.bidTitle}>{bid.itemId.name}</h3>
                                    
                                    <div style={styles.bidDetails}>
                                        <motion.div
                                            style={styles.bidAmount}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <DollarSign size={20} style={styles.bidIcon} />
                                            <span style={styles.bidAmountText}>
                                                ${bid.bidAmount.toLocaleString()}
                                            </span>
                                        </motion.div>

                                        <div style={styles.bidDate}>
                                            <Calendar size={16} style={styles.dateIcon} />
                                            <span style={styles.bidDateText}>
                                                {new Date(bid.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {selectedBid === bid._id && (
                                            <motion.div
                                                style={styles.expandedContent}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div style={styles.expandedDetails}>
                                                    <p style={styles.expandedText}>
                                                        Status: <strong>{bid.status.toUpperCase()}</strong>
                                                    </p>
                                                    <p style={styles.expandedText}>
                                                        Bid placed on {new Date(bid.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
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
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
    },
    loadingText: {
        fontSize: '18px',
        color: '#666',
        margin: 0,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        padding: '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    headerIcon: {
        color: '#667eea',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#2c3e50',
        margin: 0,
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '16px',
        color: '#7f8c8d',
        margin: '5px 0 0 0',
    },
    statsCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        borderRadius: '15px',
        color: 'white',
        minWidth: '120px',
        cursor: 'pointer',
    },
    statsNumber: {
        fontSize: '28px',
        fontWeight: '800',
    },
    statsLabel: {
        fontSize: '14px',
        opacity: 0.9,
        marginTop: '5px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        textAlign: 'center',
    },
    emptyIcon: {
        color: '#bdc3c7',
        marginBottom: '20px',
    },
    emptyTitle: {
        fontSize: '24px',
        color: '#2c3e50',
        margin: '0 0 10px 0',
    },
    emptyText: {
        fontSize: '16px',
        color: '#7f8c8d',
        margin: 0,
    },
    bidsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '25px',
    },
    bidCard: {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    bidImageContainer: {
        position: 'relative',
        height: '200px',
        overflow: 'hidden',
    },
    bidImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s ease',
    },
    statusBadge: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '8px 12px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    statusText: {
        fontSize: '12px',
    },
    bidContent: {
        padding: '25px',
    },
    bidTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: '0 0 20px 0',
        lineHeight: '1.3',
    },
    bidDetails: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    bidAmount: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 15px',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        borderRadius: '25px',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
    },
    bidIcon: {
        color: 'white',
    },
    bidAmountText: {
        fontSize: '18px',
        fontWeight: '700',
    },
    bidDate: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#7f8c8d',
    },
    dateIcon: {
        opacity: 0.7,
    },
    bidDateText: {
        fontSize: '14px',
    },
    expandedContent: {
        overflow: 'hidden',
        borderTop: '1px solid #ecf0f1',
        marginTop: '15px',
    },
    expandedDetails: {
        padding: '15px 0',
    },
    expandedText: {
        fontSize: '14px',
        color: '#7f8c8d',
        margin: '5px 0',
    },
};

export default BidHistory;