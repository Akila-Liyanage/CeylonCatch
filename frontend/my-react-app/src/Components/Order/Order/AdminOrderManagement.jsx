import React, { useState, useEffect } from 'react';
import './AdminOrderManagement.css';

const AdminOrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchOrders();
        fetchAvailableDrivers();
    }, []);

    const fetchOrders = async () => {
        try {
            console.log('Admin - Fetching all orders...');
            const response = await fetch('http://localhost:5000/api/orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Admin - All orders fetched:', data);
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        }
    };

    const fetchPendingOrders = async () => {
        try {
            console.log('Admin - Fetching pending orders...');
            const response = await fetch('http://localhost:5000/api/orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Filter for pending orders on the frontend
            const pendingOrders = Array.isArray(data) ? data.filter(order => order.status === 'pending') : [];
            console.log('Admin - Pending orders:', pendingOrders);
            setPendingOrders(pendingOrders);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            setPendingOrders([]);
        }
    };

    const fetchAvailableDrivers = async () => {
        try {
            // For now, we'll use mock drivers since we don't have a driver system yet
            console.log('Admin - Using mock drivers (no driver system implemented yet)');
            const mockDrivers = [
                { _id: 'driver1', name: 'John Doe', vehicleType: 'Van', vehicleNumber: 'ABC-123' },
                { _id: 'driver2', name: 'Jane Smith', vehicleType: 'Truck', vehicleNumber: 'XYZ-789' },
                { _id: 'driver3', name: 'Mike Johnson', vehicleType: 'Van', vehicleNumber: 'DEF-456' }
            ];
            setAvailableDrivers(mockDrivers);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setAvailableDrivers([]);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setLoading(true);
        try {
            console.log('Admin - Updating order status:', { orderId, newStatus });
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus
                }),
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Order status updated successfully!');
                fetchOrders();
                fetchPendingOrders();
                setSelectedOrder(null);
                setSelectedDriver('');
            } else {
                alert('Error updating order status: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = () => {
        if (!selectedDriver) {
            alert('Please select a new status');
            return;
        }
        updateOrderStatus(selectedOrder._id, selectedDriver);
    };

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const currentOrders = activeTab === 'pending' ? pendingOrders : orders;

    return (
        <div className="admin-order-management">
            <div className="admin-container">
                <h2>🐟 Admin Order Management</h2>
                
                <div className="tabs">
                    <button 
                        className={activeTab === 'pending' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('pending');
                            fetchPendingOrders();
                        }}
                    >
                        Pending Orders ({pendingOrders.length})
                    </button>
                    <button 
                        className={activeTab === 'all' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('all');
                            fetchOrders();
                        }}
                    >
                        All Orders ({orders.length})
                    </button>
                </div>

                <div className="orders-list">
                    {currentOrders.length === 0 ? (
                        <div className="no-orders">
                            <p>No {activeTab} orders found</p>
                        </div>
                    ) : (
                        currentOrders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3>Order #{order._id.slice(-8)}</h3>
                                        <p className="customer-name">
                                            Customer: {order.userId || 'Unknown'}
                                        </p>
                                        <p className="order-date">
                                            Date: {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="order-status">
                                        <span 
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status) }}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-details">
                                    <div className="fish-items">
                                        <h4>Order Items:</h4>
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="fish-item">
                                                <span>Item ID: {item.itemId}</span>
                                                <span>Quantity: {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-summary">
                                        <p><strong>Total Price:</strong> Rs.{order.totalPrice}</p>
                                        <p><strong>Status:</strong> {order.status}</p>
                                        <p><strong>Order ID:</strong> {order._id}</p>
                                        <p><strong>Created:</strong> {formatDate(order.createdAt)}</p>
                                        {order.updatedAt && order.updatedAt !== order.createdAt && (
                                            <p><strong>Last Updated:</strong> {formatDate(order.updatedAt)}</p>
                                        )}
                                    </div>
                                </div>

                                {order.status === 'pending' && (
                                    <div className="order-actions">
                                        <button 
                                            className="assign-btn"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            Update Status
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Order Status Update Modal */}
                {selectedOrder && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h3>Update Order Status - #{selectedOrder._id.slice(-8)}</h3>
                                <button 
                                    className="close-btn"
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setSelectedDriver('');
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="order-summary-modal">
                                    <h4>Order Summary:</h4>
                                    <p><strong>Customer:</strong> {selectedOrder.userId}</p>
                                    <p><strong>Total:</strong> Rs.{selectedOrder.totalPrice}</p>
                                    <p><strong>Current Status:</strong> {selectedOrder.status}</p>
                                    <p><strong>Items:</strong> {selectedOrder.items?.length || 0} items</p>
                                </div>

                                <div className="status-selection">
                                    <label htmlFor="status-select">Select New Status:</label>
                                    <select 
                                        id="status-select"
                                        value={selectedDriver}
                                        onChange={(e) => setSelectedDriver(e.target.value)}
                                    >
                                        <option value="">Choose a status...</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    className="cancel-btn"
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setSelectedDriver('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-btn"
                                    onClick={handleUpdateStatus}
                                    disabled={!selectedDriver || loading}
                                >
                                    {loading ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrderManagement;

