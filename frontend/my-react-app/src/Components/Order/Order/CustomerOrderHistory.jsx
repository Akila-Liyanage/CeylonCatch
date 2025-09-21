import React, { useState, useEffect } from 'react';
import './CustomerOrderHistory.css';

const CustomerOrderHistory = () => {
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCustomerOrders = async (idOverride) => {
        const idToUse = (idOverride ?? customerId)?.trim();
        if (!idToUse) {
            alert('Please login to view your orders');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/orders/user/${idToUse}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched orders:', data); // Debug log
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('Error fetching orders: ' + error.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load customer from localStorage and fetch orders
    useEffect(() => {
        try {
            const buyerToken = localStorage.getItem('buyerToken');
            const sellerToken = localStorage.getItem('sellerToken');
            const buyerEmail = localStorage.getItem('buyerEmail');
            const sellerEmail = localStorage.getItem('sellerEmail');
            
            if (buyerToken && buyerEmail) {
                setCustomerId(buyerEmail);
                setCustomerName('Buyer');
                fetchCustomerOrders(buyerEmail);
            } else if (sellerToken && sellerEmail) {
                setCustomerId(sellerEmail);
                setCustomerName('Seller');
                fetchCustomerOrders(sellerEmail);
            }
        } catch (e) {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f39c12';
            case 'confirmed': return '#3498db';
            case 'shipped': return '#9b59b6';
            case 'delivered': return '#27ae60';
            case 'cancelled': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'shipped': return '🚚';
            case 'delivered': return '🎉';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEstimatedDeliveryTime = (orderDate, status) => {
        if (status === 'delivered') return 'Delivered';
        
        const orderTime = new Date(orderDate);
        const now = new Date();
        const diffHours = Math.floor((now - orderTime) / (1000 * 60 * 60));
        
        if (status === 'pending') {
            return `Estimated: ${diffHours + 2}-${diffHours + 4} hours`;
        } else if (status === 'confirmed') {
            return `Estimated: ${diffHours + 1}-${diffHours + 3} hours`;
        } else if (status === 'shipped') {
            return `Estimated: ${diffHours + 1}-${diffHours + 2} hours`;
        }
        
        return 'Processing...';
    };

    return (
        <div className="customer-order-history">
            <div className="history-container">
                <h2>🐟 Your Order History</h2>
                
                <div className="search-section">
                    <div className="search-form">
                        <input
                            type="text"
                            placeholder="Customer"
                            value={customerName || 'Not logged in'}
                            readOnly
                        />
                        <button 
                            onClick={() => fetchCustomerOrders()}
                            disabled={loading || !customerId}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {orders.length > 0 && (
                    <div className="orders-summary">
                        <div className="summary-stats">
                            <div className="stat">
                                <span className="stat-number">{orders.length}</span>
                                <span className="stat-label">Total Orders</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">
                                    {orders.filter(o => o.status === 'delivered').length}
                                </span>
                                <span className="stat-label">Delivered</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">
                                    {orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped').length}
                                </span>
                                <span className="stat-label">In Progress</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="orders-list">
                    {orders.length === 0 && customerId && !loading ? (
                        <div className="no-orders">
                            <p>No orders found for {customerName || 'you'}</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3>Order #{order._id.slice(-8)}</h3>
                                        <p className="order-date">
                                            Placed: {formatDate(order.createdAt)}
                                        </p>
                                        {order.status === 'delivered' && (
                                            <p className="delivered-date">
                                                Delivered: {formatDate(order.updatedAt)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="order-status">
                                        <span 
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status) }}
                                        >
                                            {getStatusIcon(order.status)} {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-details">
                                    <div className="fish-items">
                                        <h4>Order Items:</h4>
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="fish-item">
                                                <span className="fish-name">Item ID: {item.itemId}</span>
                                                <span className="fish-quantity">{item.quantity} units</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-summary">
                                        <div className="summary-item">
                                            <span>Total Price:</span>
                                            <span className="total-price">Rs.{order.totalPrice}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Order Status:</span>
                                            <span className="delivery-time">
                                                {getEstimatedDeliveryTime(order.createdAt, order.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {order.status === 'shipped' && (
                                    <div className="tracking-info">
                                        <div className="tracking-step active">
                                            <span className="step-icon">📦</span>
                                            <span>Order Placed</span>
                                        </div>
                                        <div className="tracking-step active">
                                            <span className="step-icon">✅</span>
                                            <span>Confirmed</span>
                                        </div>
                                        <div className="tracking-step active">
                                            <span className="step-icon">🚚</span>
                                            <span>Shipped</span>
                                        </div>
                                        <div className="tracking-step">
                                            <span className="step-icon">🎉</span>
                                            <span>Delivered</span>
                                        </div>
                                    </div>
                                )}

                                {order.status === 'delivered' && (
                                    <div className="tracking-info">
                                        <div className="tracking-step completed">
                                            <span className="step-icon">📦</span>
                                            <span>Order Placed</span>
                                        </div>
                                        <div className="tracking-step completed">
                                            <span className="step-icon">✅</span>
                                            <span>Confirmed</span>
                                        </div>
                                        <div className="tracking-step completed">
                                            <span className="step-icon">🚚</span>
                                            <span>Shipped</span>
                                        </div>
                                        <div className="tracking-step completed">
                                            <span className="step-icon">🎉</span>
                                            <span>Delivered</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderHistory;


