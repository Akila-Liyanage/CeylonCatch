import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import './OrdersTable.css';

const OrdersTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const response = await fetch(`${apiBase}/api/orders`);
            
            if (response.ok) {
                const data = await response.json();
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

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const response = await fetch(`${apiBase}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update the order in the local state
                setOrders(orders.map(order => 
                    order._id === orderId ? { ...order, status: newStatus } : order
                ));
            } else {
                alert('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status');
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order?')) {
            return;
        }

        try {
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const response = await fetch(`${apiBase}/api/orders/${orderId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setOrders(orders.filter(order => order._id !== orderId));
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Error deleting order');
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerDetails?.name && order.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customerDetails?.email && order.customerDetails.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const exportToCSV = () => {
        const csvContent = [
            ['Order ID', 'Customer Name', 'Email', 'Phone', 'Items', 'Total Price', 'Status', 'Payment Method', 'Transaction ID', 'Order Date'],
            ...filteredOrders.map(order => [
                order._id.slice(-8).toUpperCase(),
                order.customerDetails?.name || 'N/A',
                order.customerDetails?.email || 'N/A',
                order.customerDetails?.phone || 'N/A',
                order.items.map(item => `${item.itemName} (${item.quantity}kg)`).join(', '),
                `Rs. ${order.totalPrice.toFixed(2)}`,
                order.status,
                order.paymentDetails?.paymentMethod || 'N/A',
                order.paymentDetails?.transactionId || 'N/A',
                formatDate(order.createdAt)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="orders-loading">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-error">
                <h3>Error loading orders</h3>
                <p>{error}</p>
                <button onClick={fetchOrders} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className="orders-table-container">
            {/* Header with controls */}
            <div className="orders-header">
                <div className="orders-title-section">
                    <h2>Orders Management</h2>
                    <p>Manage and track all customer orders</p>
                </div>
                
                <div className="orders-controls">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <button onClick={exportToCSV} className="export-btn">
                        <FaDownload /> Export CSV
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-orders">
                                    No orders found
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order._id}>
                                    <td className="order-id">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </td>
                                    <td className="customer-info">
                                        <div className="customer-name">
                                            {order.customerDetails?.name || 'N/A'}
                                        </div>
                                        <div className="customer-email">
                                            {order.customerDetails?.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="items-info">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="item-row">
                                                {item.itemName} ({item.quantity}kg)
                                            </div>
                                        ))}
                                    </td>
                                    <td className="total-price">
                                        Rs. {order.totalPrice.toFixed(2)}
                                    </td>
                                    <td className="status-cell">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                            className="status-select"
                                            style={{ color: getStatusColor(order.status) }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="payment-info">
                                        <div className="payment-method">
                                            {order.paymentDetails?.paymentMethod || 'N/A'}
                                        </div>
                                        <div className="transaction-id">
                                            {order.paymentDetails?.transactionId?.slice(-8) || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="order-date">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="actions">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowModal(true);
                                            }}
                                            className="action-btn view-btn"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => deleteOrder(order._id)}
                                            className="action-btn delete-btn"
                                            title="Delete Order"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Order Details - #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="order-details-grid">
                                <div className="detail-section">
                                    <h4>Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.customerDetails?.name || 'N/A'}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customerDetails?.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customerDetails?.phone || 'N/A'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.customerDetails?.address || 'N/A'}</p>
                                </div>
                                
                                <div className="detail-section">
                                    <h4>Order Information</h4>
                                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                                    <p><strong>Status:</strong> 
                                        <span style={{ color: getStatusColor(selectedOrder.status) }}>
                                            {getStatusIcon(selectedOrder.status)} {selectedOrder.status.toUpperCase()}
                                        </span>
                                    </p>
                                    <p><strong>Total Amount:</strong> Rs. {selectedOrder.totalPrice.toFixed(2)}</p>
                                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                
                                <div className="detail-section">
                                    <h4>Payment Information</h4>
                                    <p><strong>Payment Method:</strong> {selectedOrder.paymentDetails?.paymentMethod || 'N/A'}</p>
                                    <p><strong>Transaction ID:</strong> {selectedOrder.paymentDetails?.transactionId || 'N/A'}</p>
                                    <p><strong>Payment Date:</strong> {selectedOrder.paymentDetails?.paymentDate ? formatDate(selectedOrder.paymentDetails.paymentDate) : 'N/A'}</p>
                                    <p><strong>Payment Status:</strong> {selectedOrder.paymentDetails?.paymentStatus || 'N/A'}</p>
                                </div>
                                
                                <div className="detail-section">
                                    <h4>Items Ordered</h4>
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="item-detail">
                                            <p><strong>{item.itemName}</strong></p>
                                            <p>Quantity: {item.quantity} kg</p>
                                            <p>Price per kg: Rs. {item.price.toFixed(2)}</p>
                                            <p>Subtotal: Rs. {(item.quantity * item.price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersTable;
