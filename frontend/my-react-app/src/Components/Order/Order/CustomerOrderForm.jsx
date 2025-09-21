import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './CustomerOrderForm.css';
import axios from 'axios';

const CustomerOrderForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customer_id: '',
        fish_items: [],
        total_price: 0,
        delivery_address: '',
        special_instructions: ''
    });

    const [availableFish, setAvailableFish] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedFish, setSelectedFish] = useState({
        itemId: '',
        fishType: '',
        quantity: 1,
        unitPrice: 0
    });

    // Load items from backend Item model
    useEffect(() => {
        const fetchItems = async () => {
            try {
                console.log('Order form - Fetching items from backend...');
                const res = await axios.get('http://localhost:5000/api/items');
                console.log('Order form - Items fetched:', res.data);
                // Expecting array of { _id, name, currentPrice, status, image, ... }
                setAvailableFish(res.data || []);
            } catch (err) {
                console.error('Order form - Error fetching items:', err);
                setAvailableFish([]);
            }
        };
        fetchItems();
    }, []);

    // Auto-assign customer_id from localStorage after login
    useEffect(() => {
        try {
            const buyerToken = localStorage.getItem('buyerToken');
            const sellerToken = localStorage.getItem('sellerToken');
            const buyerEmail = localStorage.getItem('buyerEmail');
            const sellerEmail = localStorage.getItem('sellerEmail');
            
            console.log('Order form - Auth check:', { buyerToken: !!buyerToken, sellerToken: !!sellerToken, buyerEmail, sellerEmail });
            
            if (buyerToken && buyerEmail) {
                setFormData(prev => ({ ...prev, customer_id: buyerEmail }));
                setCustomerName('Buyer');
                setIsLoggedIn(true);
                console.log('Order form - Logged in as buyer:', buyerEmail);
            } else if (sellerToken && sellerEmail) {
                setFormData(prev => ({ ...prev, customer_id: sellerEmail }));
                setCustomerName('Seller');
                setIsLoggedIn(true);
                console.log('Order form - Logged in as seller:', sellerEmail);
            } else {
                setIsLoggedIn(false);
                console.log('Order form - Not logged in, redirecting to login');
                // Don't auto-redirect, let user see the login prompt
            }
        } catch (e) {
            console.error('Order form - Auth check error:', e);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleFishSelection = (fish) => {
        setSelectedFish({
            itemId: fish._id,
            fishType: fish.name,
            quantity: 1,
            unitPrice: Number(fish.currentPrice ?? fish.startingPrice ?? 0)
        });
    };

    const addFishToOrder = () => {
        if (!selectedFish.itemId || selectedFish.quantity <= 0) {
            alert('Please select a fish item and enter a valid quantity');
            return;
        }

        const newItem = {
            itemId: selectedFish.itemId,
            fishType: selectedFish.fishType,
            quantity: selectedFish.quantity,
            unitPrice: selectedFish.unitPrice
        };

        setFormData(prev => ({
            ...prev,
            fish_items: [...prev.fish_items, newItem],
            total_price: prev.total_price + (selectedFish.quantity * selectedFish.unitPrice)
        }));

        setSelectedFish({ itemId: '', fishType: '', quantity: 1, unitPrice: 0 });
    };

    const removeFishFromOrder = (index) => {
        const item = formData.fish_items[index];
        setFormData(prev => ({
            ...prev,
            fish_items: prev.fish_items.filter((_, i) => i !== index),
            total_price: prev.total_price - (item.quantity * item.unitPrice)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Order form - Submit attempt:', {
            customer_id: formData.customer_id,
            fish_items_count: formData.fish_items.length,
            delivery_address: formData.delivery_address,
            isLoggedIn,
            total_price: formData.total_price
        });
        
        if (!formData.customer_id || formData.fish_items.length === 0 || !formData.delivery_address.trim()) {
            alert('Please fill in all required fields: customer ID, at least one fish item, and delivery address');
            return;
        }

        if (!isLoggedIn) {
            alert('Please login to place an order');
            navigate('/buyerlogin');
            return;
        }

        try {
            // Transform data to match backend API expectations
            const orderData = {
                userId: formData.customer_id, // Backend expects 'userId'
                totalPrice: formData.total_price, // Backend expects 'totalPrice'
                items: formData.fish_items.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity
                })), // Backend expects 'items' with itemId and quantity
                delivery_address: formData.delivery_address,
                special_instructions: formData.special_instructions
            };

            console.log('Sending order data:', orderData); // Debug log

            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Order placed successfully!');
                // Reset form
                setFormData({
                    customer_id: formData.customer_id, // Keep customer_id
                    fish_items: [],
                    total_price: 0,
                    delivery_address: '',
                    special_instructions: ''
                });
                setSelectedFish({ itemId: '', fishType: '', quantity: 1, unitPrice: 0 });
                // Navigate to order history
                navigate('/order-history');
            } else {
                alert('Error placing order: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Order submission error:', error);
            alert('Error placing order: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="customer-order-form">
                <div className="form-container">
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <h2>Loading...</h2>
                        <p>Please wait while we load the order form.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="customer-order-form">
                <div className="form-container">
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <h2>🔐 Login Required</h2>
                        <p>Please login to place an order.</p>
                        <button 
                            onClick={() => navigate('/buyerlogin')}
                            style={{
                                background: '#3498db',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginTop: '20px'
                            }}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-order-form">
            <div className="form-container">
                <h2>🐟 Place Your Fish Order</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="customer_name">Customer:</label>
                        <input
                            type="text"
                            id="customer_name"
                            value={customerName}
                            placeholder="Auto-filled after login"
                            readOnly
                        />
                        {/* Hidden input to carry customer_id */}
                        <input type="hidden" value={formData.customer_id} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="delivery_address">Delivery Address:</label>
                        <textarea
                            id="delivery_address"
                            value={formData.delivery_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                            placeholder="Enter your delivery address"
                            required
                        />
                    </div>

                    <div className="fish-selection">
                        <h3>🐟 Select Your Fresh Fish</h3>
                        
                        <div className="fish-grid">
                            {availableFish.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '40px', 
                                    color: '#4a5568',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '16px',
                                    border: '2px dashed #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐟</div>
                                    <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                        No fish items available at the moment
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#718096' }}>
                                        Please check back later or contact us for availability
                                    </p>
                                </div>
                            ) : (
                                availableFish.map(fish => (
                                    <div 
                                        key={fish._id}
                                        className={`fish-card ${selectedFish.itemId === fish._id ? 'selected' : ''}`}
                                        onClick={() => handleFishSelection(fish)}
                                    >
                                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🐟</div>
                                        <h4>{fish.name}</h4>
                                        <p>Rs.{Number(fish.currentPrice ?? fish.startingPrice ?? 0).toFixed(2)} per kg</p>
                                        {fish.status && (
                                            <small style={{ 
                                                color: fish.status === 'active' ? '#48bb78' : '#f56565',
                                                background: fish.status === 'active' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
                                                padding: '4px 8px',
                                                borderRadius: '12px'
                                            }}>
                                                {fish.status}
                                            </small>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedFish.itemId && (
                            <div className="quantity-selector">
                                <label>📦 Quantity (kg):</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={selectedFish.quantity}
                                    onChange={(e) => setSelectedFish(prev => ({ 
                                        ...prev, 
                                        quantity: parseInt(e.target.value) || 1 
                                    }))}
                                />
                                <button type="button" onClick={addFishToOrder}>
                                    ➕ Add to Order
                                </button>
                            </div>
                        )}
                    </div>

                    {formData.fish_items.length > 0 && (
                        <div className="order-summary">
                            <h3>🛒 Your Order Summary</h3>
                            {formData.fish_items.map((item, index) => (
                                <div key={index} className="order-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '20px' }}>🐟</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#2d3748' }}>
                                                {item.fishType}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#718096' }}>
                                                {item.quantity}kg × Rs.{item.unitPrice}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontWeight: '600', color: '#2d3748' }}>
                                            Rs.{(item.quantity * item.unitPrice).toFixed(2)}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFishFromOrder(index)}
                                            className="remove-btn"
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="total">
                                <strong>💰 Total: Rs.{formData.total_price.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="special_instructions">📝 Special Instructions (Optional):</label>
                        <textarea
                            id="special_instructions"
                            value={formData.special_instructions}
                            onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                            placeholder="Any special instructions for your order... (e.g., delivery time preferences, packaging requirements)"
                            rows="3"
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        🚀 Place Your Order Now
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomerOrderForm;

