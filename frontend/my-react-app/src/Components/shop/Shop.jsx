import React, { useState, useEffect } from 'react'; //side effect (fetch data)
import axios from 'axios'; //api
import './shop.css';
import Nav from '../nav/Nav';
import Footer from '../footer/Footer';
import { motion } from 'framer-motion'; //animation libbrary
import PaymentSuccessModal from './PaymentSuccessModal';
import OrderConfirmModal from './OrderConfirmModal';

const Shop = () => {
    const [inventory, setInventory] = useState([]); //holds the list of fish items
    const [loading, setLoading] = useState(true); //shows spinner until load inventory.
    const [error, setError] = useState(null); //error handling

    // Payment flow states
    const [showOrderConfirm, setShowOrderConfirm] = useState(false);

    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showPaymentProcessingModal, setShowPaymentProcessingModal] = useState(false);
    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);//final success modal
    const [selectedItem, setSelectedItem] = useState(null);//holds the item selected for payment
    const [orderDetails, setOrderDetails] = useState(null);//holds order details after quantity selection
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [paymentDetails, setPaymentDetails] = useState(null);

    const loadPayHereScript = () => new Promise((resolve, reject) => {
        if (window.payhere) return resolve(window.payhere);
        const existing = document.querySelector('script[src="https://www.payhere.lk/lib/payhere.js"]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.payhere));
            existing.addEventListener('error', () => reject(new Error('Failed to load PayHere SDK')));
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://www.payhere.lk/lib/payhere.js';
        s.async = true;
        s.onload = () => resolve(window.payhere);
        s.onerror = () => reject(new Error('Failed to load PayHere SDK'));
        document.body.appendChild(s);
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            try {
                const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
                const response = await fetch(`${apiBase}/api/inventory`);
                if (response.ok) {
                    const data = await response.json();
                    const normalized = (Array.isArray(data) ? data : []).map((d) => ({
                        _id: d._id || d.id || String(Math.random()),
                        name: d.name || 'Unknown',
                        description: d.description || '',
                        SKU: d.SKU || '-',
                        type: d.type || 'Fresh',
                        quantity: typeof d.quantity === 'number' ? d.quantity : 0,
                        price: typeof d.price === 'number' ? d.price : 0,
                        stockThreshold: typeof d.stockThreshold === 'number' ? d.stockThreshold : 0,
                        imageURL: d.imageURL || '',
                        dateAdded: d.dateAdded || new Date(),
                        expiryDate: d.expiryDate || new Date(),
                        daysLeft: d.daysLeft || null,
                        qualityStatus: d.qualityStatus || 'Good',
                        stockStatus: d.stockStatus || 'Good'
                    }));
                    setInventory(normalized);
                    return;
                }
            } catch (apiError) {
                console.log('API not available, using mock data');
            }
            setInventory([]); // fallback to empty list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (item) => {
        setSelectedItem(item);
        setShowOrderConfirm(true);
    };

    const recordTransaction = async (orderData, provider) => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            let authUser = null;
            try { authUser = JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { }
            await axios.post(`${apiBase}/api/finance/transactions`, {
                userId: authUser?._id || authUser?.id || undefined,
                amount: Number(orderData.totalPrice || 0),
                type: 'purchase',
                status: 'completed',
                paymentMethod: provider || 'other'
            });
        } catch (e) {
            console.warn('Failed to record transaction:', e?.response?.data?.error || e.message);
        }
    };

    const reduceInventoryQuantity = async (itemId, quantity) => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const response = await axios.post(`${apiBase}/api/inventory/${itemId}/reduce-quantity`, {
                quantity: quantity
            });
            console.log('Inventory quantity reduced:', response.data);
            fetchInventory();
            return response.data;
        } catch (error) {
            console.error('Failed to reduce inventory quantity:', error?.response?.data?.error || error.message);
            throw error;
        }
    };


    const handlePaymentMethodProceed = () => { };

    const handlePaymentSuccess = (paymentData) => {
        setPaymentDetails(paymentData);
        setShowPaymentProcessingModal(false);
        setShowPaymentSuccessModal(true);
    };

    const handlePlaceOrderFromConfirm = async (orderData) => {
        try {
            setOrderDetails(orderData);
            setShowOrderConfirm(false);

            const orderId = `ORD_${Date.now()}`;
            const amountStr = Number(orderData.totalPrice || 0).toFixed(2);
            const currency = 'LKR';

            let authUser = null;
            try { authUser = JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { }

            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            const signRes = await axios.post(`${apiBase}/api/payhere/sign`, {
                order_id: orderId,
                amount: amountStr,
                currency
            });
            const { hash, merchant_id } = signRes.data || {};
            if (!hash || !merchant_id) throw new Error('Failed to sign payment');

            const payhere = await loadPayHereScript();
            if (!payhere) throw new Error('PayHere SDK not loaded');

            payhere.onCompleted = async (completedOrderId) => {
                try {
                    await reduceInventoryQuantity(orderData._id, orderData.selectedQuantity);
                    const paymentData = {
                        ...orderData,
                        paymentMethod: 'payhere',
                        transactionId: completedOrderId || orderId,
                        paymentDate: new Date().toISOString()
                    };
                    setPaymentDetails(paymentData);
                    setShowPaymentSuccessModal(true);
                    recordTransaction(orderData, 'payhere');
                } catch (error) {
                    console.error('Payment completion failed:', error);
                    alert('Payment completed but inventory update failed. Please contact support.');
                }
            };
            payhere.onDismissed = () => {
                setShowOrderConfirm(true);
            };
            payhere.onError = (error) => {
                console.error('PayHere error:', error);
                alert('Payment failed. Please try again.');
                setShowOrderConfirm(true);
            };

            const returnUrl = `${window.location.origin}/shop`;
            const cancelUrl = `${window.location.origin}/shop`;
            const notifyUrl = `${apiBase}/api/payhere/notify`;

            const payment = {
                sandbox: true,
                merchant_id,
                return_url: returnUrl,
                cancel_url: cancelUrl,
                notify_url: notifyUrl,
                order_id: orderId,
                items: orderData.name || 'Seafood Order',
                amount: amountStr,
                currency,
                hash,
                first_name: authUser?.name?.split(' ')[0] || 'Customer',
                last_name: authUser?.name?.split(' ').slice(1).join(' ') || 'User',
                email: authUser?.email || 'customer@example.com',
                phone: authUser?.phone || '0771234567',
                address: authUser?.address || 'No.1, Galle Road',
                city: 'Colombo',
                country: 'Sri Lanka',
                delivery_address: authUser?.address || 'No.1, Galle Road',
                delivery_city: 'Colombo',
                delivery_country: 'Sri Lanka',
                custom_1: orderData.SKU || '',
                custom_2: String(orderData._id || '')
            };

            payhere.startPayment(payment);
        } catch (e) {
            console.error(e);
            const message = (e && e.response && e.response.data && (e.response.data.error || e.response.data.message))
                || e.message
                || 'Unable to initiate payment. Please try again.';

            const paymentLinkUrl = import.meta.env.VITE_PAYHERE_LINK_URL;
            if (paymentLinkUrl && /PAYHERE_MERCHANT_SECRET is not configured/i.test(String(message))) {
                window.location.href = paymentLinkUrl;
                return;
            }

            alert(message);
            setShowOrderConfirm(true);
        }
    };

    const handleCloseModals = () => {
        setShowOrderConfirm(false);
        setShowPaymentMethodModal(false);
        setShowPaymentProcessingModal(false);
        setShowPaymentSuccessModal(false);
        setSelectedItem(null);
        setOrderDetails(null);
        setSelectedPaymentMethod('');
        setPaymentDetails(null);
    };

    if (loading) {
        return (
            <div className="shop-container">
                <Nav />
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading inventory...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="shop-container">
                <Nav />
                <div className="error">
                    <h2>Error loading inventory</h2>
                    <p>{error}</p>
                    <button onClick={fetchInventory} className="retry-btn">Retry</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-grid-container">
            <div className="header-section">
                <h1 className="main-title">Our Products</h1>
                <p className="subtitle">Discover amazing products at great prices</p>
            </div>

            <div className="products-grid">
                {inventory.map((item) => (
                    <div key={item._id} className="product-card">
                        <div className="image-container">
                            {item.imageURL ? (
                                <img src={item.imageURL} alt={item.name} className="product-image" />
                            ) : (
                                <div className="placeholder-image">
                                    <div className="placeholder-icon">📦</div>
                                </div>
                            )}
                            <div className="image-overlay">
                                <button className="quick-view-btn" onClick={() => console.log('Quick view', item)}>
                                    Quick View
                                </button>
                            </div>
                        </div>

                        <div className="product-info">
                            <h3 className="product-name">{item.name}</h3>
                            <p className="product-description">{item.description}</p>

                            <div className="product-meta">
                                <div className="price-section">
                                    <span className="price-label">Price</span>
                                    <span className="price">Rs. {Number(item.price).toFixed(2)}</span>
                                </div>
                                <div className="stock-section">
                                    <span className="stock-label">In Stock</span>
                                    <span className={`stock-count ${item.quantity < 10 ? 'low-stock' : item.quantity === 0 ? 'out-of-stock' : ''}`}>
                                        {item.quantity === 0 ? 'Out of Stock' : `${item.quantity} units`}
                                    </span>
                                </div>

                                <div className="item-actions">
                                    <button
                                        className="bid-btn"
                                        onClick={() => handlePayClick(item)}
                                    >
                                        Pay
                                    </button>
                                    <button className="view-btn">View Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Footer />

            {/* Payment Flow Modals */}
            <OrderConfirmModal
                isOpen={showOrderConfirm}
                item={selectedItem}
                onClose={handleCloseModals}
                onPlaceOrder={handlePlaceOrderFromConfirm}
            />


            <PaymentSuccessModal
                isOpen={showPaymentSuccessModal}
                onClose={handleCloseModals}
                paymentDetails={paymentDetails}
            />
        </div>
    );
};

export default Shop;
