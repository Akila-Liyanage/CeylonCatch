import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PaymentSuccessModal.css';
import Receipt from './Receipt';

const PaymentSuccessModal = ({ isOpen, onClose, paymentDetails }) => {
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);
    const receiptWrapRef = useRef(null);

    // Create order in database when payment is successful
    useEffect(() => {
        if (isOpen && paymentDetails && !orderCreated) {
            createOrder();
        }
    }, [isOpen, paymentDetails, orderCreated]);

    const createOrder = async () => {
        try {
            // Check for buyer authentication
            const buyerEmail = localStorage.getItem('buyerEmail');
            const buyerToken = localStorage.getItem('buyerToken');
            
            if (!buyerEmail || !buyerToken) {
                console.warn('No authenticated user found for order creation');
                alert('Please login to create an order');
                return;
            }

            if (!paymentDetails) {
                console.error('No payment details available for order creation');
                alert('Payment details not available');
                return;
            }

            const apiBase = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`;
            
            // First, get the buyer data to get the user ID and details
            const buyerResponse = await fetch(`${apiBase}/api/user/buyer-by-email/${buyerEmail}`);
            
            if (!buyerResponse.ok) {
                console.error('Failed to fetch user data for order creation');
                alert('Failed to fetch user data');
                return;
            }
            
            const buyerData = await buyerResponse.json();
            
            if (!buyerData || !buyerData._id) {
                console.error('Invalid buyer data received');
                alert('Invalid user data');
                return;
            }
            
            // Validate required payment details
            if (!paymentDetails._id || !paymentDetails.selectedQuantity || !paymentDetails.price || !paymentDetails.totalPrice) {
                console.error('Missing required payment details:', paymentDetails);
                alert('Missing required payment information');
                return;
            }

            const orderData = {
                userId: buyerData._id,
                items: [{
                    itemId: paymentDetails._id,
                    itemName: paymentDetails.fishName || paymentDetails.name || 'Unknown Item',
                    quantity: paymentDetails.selectedQuantity,
                    price: paymentDetails.price
                }],
                totalPrice: paymentDetails.totalPrice,
                paymentDetails: {
                    transactionId: paymentDetails.transactionId || `TXN_${Date.now()}`,
                    paymentMethod: paymentDetails.paymentMethod || 'payhere',
                    paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
                    paymentStatus: 'completed'
                },
                customerDetails: {
                    name: buyerData.name || 'Unknown Customer',
                    email: buyerData.gmail || buyerEmail,
                    phone: buyerData.contact || 'N/A',
                    address: buyerData.address || 'N/A'
                }
            };

            console.log('Creating order with data:', orderData);
            
            const response = await fetch(`${apiBase}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const createdOrder = await response.json();
                console.log('Order created successfully:', createdOrder);
                setOrderCreated(true);
                // Show success message to user
                console.log('✅ Order saved to database successfully!');
            } else {
                const errorData = await response.json();
                console.error('Failed to create order:', response.status, errorData);
                alert(`Failed to create order: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error creating order:', error);
        }
    };

    const loadScriptOnce = (src, readyCheck) => new Promise((resolve, reject) => {
        const done = () => {
            if (typeof readyCheck === 'function') {
                const check = () => (readyCheck() ? resolve() : setTimeout(check, 50));
                check();
            } else {
                resolve();
            }
        };
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return done();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = done;
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.body.appendChild(s);
    });

    const downloadReceipt = async () => {
        try {
            // Load html2canvas
            await loadScriptOnce(
                'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
                () => !!window.html2canvas
            );

            const scope = receiptWrapRef.current || document;
            const node = scope.querySelector('.receipt');
            if (!node || !window.html2canvas) {
                console.error('Receipt element or html2canvas not found');
                return;
            }

            // Capture the receipt as canvas
            const canvas = await window.html2canvas(node, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                allowTaint: true
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt_${paymentDetails?.transactionId || Date.now()}.png`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    document.body.removeChild(link);
                }, 100);
            }, 'image/png');

        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed. Please try again.');
        }
    };

    if (!isOpen || !paymentDetails) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentMethodName = (method) => {
        switch (method) {
            case 'visa': return 'Visa';
            case 'mastercard': return 'Mastercard';
            case 'amex': return 'American Express';
            case 'paypal': return 'PayPal';
            case 'bank_transfer': return 'Bank Transfer';
            default: return 'Card';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="success-modal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="success-content">
                        <div className="success-icon">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                ✅
                            </motion.div>
                        </div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Payment Successful!
                        </motion.h2>

                        <motion.p
                            className="success-message"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Your order has been confirmed and payment processed successfully.
                        </motion.p>

                        <div className="payment-details">
                            <h3>Payment Details</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="label">Transaction ID:</span>
                                    <span className="value">{paymentDetails.transactionId}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Item:</span>
                                    <span className="value">{paymentDetails.fishName}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Quantity:</span>
                                    <span className="value">{paymentDetails.selectedQuantity} kg</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Price per kg:</span>
                                    <span className="value">Rs. {paymentDetails.price}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Payment Method:</span>
                                    <span className="value">{getPaymentMethodName(paymentDetails.paymentMethod)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Amount Paid:</span>
                                    <span className="value amount">Rs. {paymentDetails.totalPrice}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Payment Date:</span>
                                    <span className="value">{formatDate(paymentDetails.paymentDate)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h3>What's Next?</h3>
                            <ul>
                                <li>You can view your receipt by clicking the "View Receipt" button</li>
                                <li>Your order has been saved and will be prepared for pickup/delivery</li>
                                <li>You can track your order status in "My Orders" section</li>
                                <li>Keep your transaction ID for reference</li>
                            </ul>
                        </div>

                        <div className="contact-info">
                            <p>
                                <strong>Need help?</strong> Contact us at
                                <a href="tel:+94771234567"> +94 77 123 4567</a> or
                                <a href="mailto:support@ceyloncatch.com"> support@ceyloncatch.com</a>
                            </p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="print-btn" onClick={() => setShowReceipt(true)}>
                            View Receipt
                        </button>
                        <button 
                            className="orders-btn" 
                            onClick={() => {
                                onClose();
                                window.location.href = '/orders';
                            }}
                        >
                            View Orders
                        </button>
                        <button className="done-btn" onClick={onClose}>
                            Done
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Receipt Modal */}
            {showReceipt && (
                <motion.div
                    className="receipt-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowReceipt(false)}
                >
                    <motion.div
                        className="receipt-modal"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="receipt-modal-header">
                            <h2>Payment Receipt</h2>
                            <div className="receipt-actions">
                                <button
                                    className="download-receipt-btn"
                                    onClick={downloadReceipt}
                                >
                                    Download
                                </button>
                                <button
                                    className="close-receipt-btn"
                                    onClick={() => setShowReceipt(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="receipt-content" ref={receiptWrapRef}>
                            <Receipt paymentDetails={paymentDetails} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentSuccessModal;
