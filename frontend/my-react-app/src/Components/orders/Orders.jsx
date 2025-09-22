import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import Nav from '../nav/Nav';
import Footer from '../footer/Footer';
import './Orders.css';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            // Check for buyer authentication first
            const buyerEmail = localStorage.getItem('buyerEmail');
            const buyerToken = localStorage.getItem('buyerToken');
            
            if (!buyerEmail || !buyerToken) {
                setError('Please login to view your orders');
                setLoading(false);
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/buyerlogin');
                }, 2000);
                return;
            }

            // First, get the buyer data to get the user ID
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const buyerResponse = await fetch(`${apiBase}/api/user/buyer-by-email/${buyerEmail}`);
            
            if (!buyerResponse.ok) {
                setError('Failed to fetch user data');
                setLoading(false);
                return;
            }
            
            const buyerData = await buyerResponse.json();
            const userId = buyerData._id;
            
            if (!userId) {
                setError('User ID not found');
                setLoading(false);
                return;
            }

            // Now fetch orders for this user
            const ordersResponse = await fetch(`${apiBase}/api/orders/user/${userId}`);
            
            if (ordersResponse.ok) {
                const data = await ordersResponse.json();
                setOrders(data);
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'confirmed': return '#3b82f6';
            case 'shipped': return '#8b5cf6';
            case 'delivered': return '#10b981';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'shipped': return '🚚';
            case 'delivered': return '📦';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    };

    if (loading) {
        return (
            <div className="orders-container">
                <Nav />
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading your orders...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-container">
                <Nav />
                <div className="error">
                    <h2>Error loading orders</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={fetchOrders} className="retry-btn">Retry</button>
                        {error.includes('login') && (
                            <button 
                                onClick={() => navigate('/buyerlogin')} 
                                className="login-btn"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="orders-container">
            <Nav />
            
            <div className="orders-content">
                <div className="orders-header">
                    <h1 className="orders-title">My Orders</h1>
                    <p className="orders-subtitle">Track your purchase history and order status</p>
                </div>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <div className="no-orders-icon">📦</div>
                        <h3>No orders found</h3>
                        <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                        <button 
                            className="shop-now-btn"
                            onClick={() => window.location.href = '/shop'}
                        >
                            Shop Now
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                className="order-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3 className="order-id">Order #{order._id.slice(-8).toUpperCase()}</h3>
                                        <p className="order-date">
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div 
                                        className="order-status"
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        <span className="status-icon">{getStatusIcon(order.status)}</span>
                                        <span className="status-text">{order.status.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="order-items">
                                    <h4>Items Ordered:</h4>
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="item-info">
                                                <span className="item-name">{item.itemName}</span>
                                                <span className="item-quantity">Qty: {item.quantity} kg</span>
                                            </div>
                                            <span className="item-price">Rs. {item.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        <span className="total-label">Total Amount:</span>
                                        <span className="total-amount">Rs. {order.totalPrice.toFixed(2)}</span>
                                    </div>
                                    
                                    {order.paymentDetails && (
                                        <div className="payment-info">
                                            <p className="payment-method">
                                                Payment: {order.paymentDetails.paymentMethod}
                                            </p>
                                            <p className="transaction-id">
                                                Transaction ID: {order.paymentDetails.transactionId}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Orders;
