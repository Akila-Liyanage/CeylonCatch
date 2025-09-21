import React, { useState, useEffect } from 'react';
import './DriverDeliveryManagement.css';
import Nav from '../nav/Nav';

const DriverDeliveryManagement = () => {
    const [driverId, setDriverId] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // In a real app, this would come from authentication
        // Use a valid 24-char placeholder to avoid backend ObjectId cast errors
        setDriverId('000000000000000000000000');
    }, []);

    useEffect(() => {
        if (driverId) {
            fetchDriverOrders();
        }
    }, [driverId]);

    const fetchDriverOrders = async () => {
        try {
            setError('');
            const response = await fetch(`http://localhost:5000/api/orders/driver/${driverId}`);
            if (!response.ok) {
                const msg = `Failed to load orders (${response.status})`;
                setError(msg);
                setOrders([]);
                return;
            }
            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Network error while fetching orders');
            setOrders([]);
        }
    };

    const markAsDelivered = async (orderId) => {
        if (!orderId) return;
        if (!window.confirm('Are you sure you want to mark this order as delivered?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/orders/driver/${orderId}/delivered`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driver_id: driverId }),
            });

            const result = await response.json().catch(() => ({}));
            
            if (response.ok) {
                fetchDriverOrders();
            } else {
                alert('Error marking order as delivered' + (result?.message ? `: ${result.message}` : ''));
            }
        } catch (err) {
            alert('Network error while marking delivered');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Assigned to Driver': return '#3498db';
            case 'Delivered': return '#27ae60';
            default: return '#95a5a6';
        }
    };

    const formatDate = (dateString) => {
        const d = dateString ? new Date(dateString) : null;
        if (!d || isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDirectionsUrl = (address) => {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`;
    };

    const assignedOrders = Array.isArray(orders) ? orders.filter(order => order?.status === 'Assigned to Driver') : [];
    const deliveredOrders = Array.isArray(orders) ? orders.filter(order => order?.status === 'Delivered') : [];

    return (
        <div className="driver-delivery-management">
            <Nav />
            <div className="driver-container">
                <div className="driver-header">
                    <h2>🚚 Driver Delivery Management</h2>
                    <div className="driver-info">
                        <p><strong>Driver ID:</strong> {driverId || '-'}</p>
                        <p><strong>Status:</strong> <span className="status-active">Active</span></p>
                    </div>
                </div>

                {error && (
                    <div className="no-orders" role="alert" aria-live="polite">
                        {error}
                    </div>
                )}

                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>{assignedOrders.length}</h3>
                        <p>Assigned Orders</p>
                    </div>
                    <div className="stat-card">
                        <h3>{deliveredOrders.length}</h3>
                        <p>Delivered</p>
                    </div>
                    <div className="stat-card">
                        <h3>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>

                <div className="orders-section">
                    <h3>📋 Your Orders</h3>
                    
                    {assignedOrders.length === 0 && deliveredOrders.length === 0 ? (
                        <div className="no-orders">
                            <p>No orders assigned to you yet</p>
                        </div>
                    ) : (
                        <div className="orders-tabs">
                            <div className="tab-content">
                                {assignedOrders.length > 0 && (
                                    <div className="assigned-orders">
                                        <h4>🔄 Assigned Orders ({assignedOrders.length})</h4>
                                        {assignedOrders.map(order => (
                                            <div key={order._id} className="order-card assigned">
                                                <div className="order-header">
                                                    <div className="order-info">
                                                        <h4>Order #{String(order._id).slice(-8)}</h4>
                                                        <p className="customer-name">
                                                            Customer: {order?.customer_id?.name || 'Unknown'}
                                                        </p>
                                                        <p className="order-date">
                                                            Assigned: {formatDate(order?.order_date)}
                                                        </p>
                                                    </div>
                                                    <div className="order-status">
                                                        <span 
                                                            className="status-badge"
                                                            style={{ backgroundColor: getStatusColor(order?.status) }}
                                                        >
                                                            {order?.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="order-details">
                                                    <div className="fish-items">
                                                        <h5>Fish Items:</h5>
                                                        {(order?.fish_items || []).map((item, index) => (
                                                            <div key={index} className="fish-item">
                                                                <span>{item?.fishType}</span>
                                                                <span>{item?.quantity}kg</span>
                                                                <span>${item?.unitPrice}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="delivery-info">
                                                        <p><strong>Total:</strong> ${order?.total_price}</p>
                                                        <p><strong>Delivery Address:</strong></p>
                                                        <p className="address">{order?.delivery_address}</p>
                                                        {order?.special_instructions && (
                                                            <p><strong>Special Instructions:</strong> {order?.special_instructions}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="order-actions">
                                                    <a 
                                                        href={getDirectionsUrl(order?.delivery_address)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="directions-btn"
                                                    >
                                                        📍 Get Directions
                                                    </a>
                                                    <button 
                                                        className="delivered-btn"
                                                        onClick={() => markAsDelivered(order?._id)}
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Processing...' : '✅ Mark as Delivered'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {deliveredOrders.length > 0 && (
                                    <div className="delivered-orders">
                                        <h4>✅ Delivered Orders ({deliveredOrders.length})</h4>
                                        {deliveredOrders.map(order => (
                                            <div key={order._id} className="order-card delivered">
                                                <div className="order-header">
                                                    <div className="order-info">
                                                        <h4>Order #{String(order._id).slice(-8)}</h4>
                                                        <p className="customer-name">
                                                            Customer: {order?.customer_id?.name || 'Unknown'}
                                                        </p>
                                                        <p className="order-date">
                                                            Delivered: {formatDate(order?.delivered_date)}
                                                        </p>
                                                    </div>
                                                    <div className="order-status">
                                                        <span 
                                                            className="status-badge"
                                                            style={{ backgroundColor: getStatusColor(order?.status) }}
                                                        >
                                                            {order?.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="order-details">
                                                    <div className="fish-items">
                                                        <h5>Fish Items:</h5>
                                                        {(order?.fish_items || []).map((item, index) => (
                                                            <div key={index} className="fish-item">
                                                                <span>{item?.fishType}</span>
                                                                <span>{item?.quantity}kg</span>
                                                                <span>${item?.unitPrice}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="delivery-info">
                                                        <p><strong>Total:</strong> ${order?.total_price}</p>
                                                        <p><strong>Delivery Address:</strong> {order?.delivery_address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverDeliveryManagement;
