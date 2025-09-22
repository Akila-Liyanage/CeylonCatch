import React from 'react';
import './Receipt.css';
import logo from '../../assets/images/logo.png';

const Receipt = ({ paymentDetails }) => {
    if (!paymentDetails) return null;

    // Removed debug logs

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

    const maskCardNumber = (cardNumber) => {
        if (!cardNumber) return 'N/A';
        const number = cardNumber.replace(/\s/g, '');
        return '**** **** **** ' + number.slice(-4);
    };

    // Safely derive amounts with comprehensive fallbacks
    const qtyKg = Number(
        paymentDetails.selectedQuantity ||
        paymentDetails.quantity ||
        paymentDetails.weight ||
        paymentDetails.qty ||
        1
    );

    const pricePerKg = Number(
        paymentDetails.price ||
        paymentDetails.pricePerKg ||
        paymentDetails.unitPrice ||
        paymentDetails.rate ||
        0
    );

    const itemsTotal = Number(
        paymentDetails.itemsTotal ||
        paymentDetails.totalPrice ||
        paymentDetails.total ||
        paymentDetails.amount ||
        (qtyKg * pricePerKg)
    );

    const discount = Number(paymentDetails.discount || 0);
    const shippingFee = Number(paymentDetails.shippingFee || 0);
    const subtotal = Number(paymentDetails.subtotal || Math.max(itemsTotal - discount, 0));
    const totalPaid = Number(paymentDetails.totalPrice || paymentDetails.total || subtotal + shippingFee);

    const fmt = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

    // Removed debug logs

    return (
        <div className="receipt-container">
            <div className="receipt">
                {/* Header */}
                <div className="receipt-header">
                    <div className="company-logo">
                        <div className="logo-"><img src={logo} alt="Ceylon Catch" width={100} height={100} /></div>

                        <div className="company-info">
                            <h1>CeylonCatch</h1>
                            <p>Fresh Seafood Marketplace</p>
                        </div>
                    </div>
                    <div className="receipt-title">
                        <h2>PAYMENT RECEIPT</h2>
                        <div className="receipt-number">
                            Receipt #: {paymentDetails.transactionId}
                        </div>
                    </div>
                </div>

                {/* Company Details */}
                <div className="company-details">
                    <div className="address">
                        <p><strong>CeylonCatch Ltd</strong></p>
                        <p>Chilaw Fish Market, Chilaw,</p>
                        <p>Sri Lanka</p>
                        <p>Tel: +94757115177</p>
                        <p>Email: support@ceyloncatch.com</p>
                    </div>
                    <div className="receipt-info">
                        <p><strong>Date:</strong> {formatDate(paymentDetails.paymentDate)}</p>
                        <p><strong>Payment Method:</strong> {getPaymentMethodName(paymentDetails.paymentMethod)}</p>
                        {paymentDetails.usedSavedCard && (
                            <p><strong>Card:</strong> {maskCardNumber(paymentDetails.cardDetails?.cardNumber)}</p>
                        )}
                    </div>
                </div>

                {/* Customer Details */}
                <div className="customer-section">
                    <h3>Customer Information</h3>
                    <div className="customer-details">
                        <p><strong>Name:</strong> {paymentDetails.cardDetails?.cardholderName || 'N/A'}</p>
                        <p><strong>Email:</strong> {paymentDetails.cardDetails?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {paymentDetails.cardDetails?.phone || 'N/A'}</p>
                    </div>
                </div>

                {/* Order Details */}
                <div className="order-section">
                    <h3>Order Details</h3>
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td >
                                    <div className="item-name">{paymentDetails.fishName ?? ''}</div>
                                    {paymentDetails.lotNumber && (
                                        <div className="item-lot">Lot: {paymentDetails.lotNumber}</div>
                                    )}
                                    <div className="item-condition">Condition: Fresh</div>
                                </td>
                                <td className="text-right">
                                    <div className="item-lot">{paymentDetails.selectedQuantity ?? paymentDetails.quantity ?? paymentDetails.weight ?? ''}</div>
                                </td>
                                <td className="text-right">
                                    <div className="item-lot">{paymentDetails.price ?? paymentDetails.pricePerKg ?? ''}</div>
                                </td>
                                <td className="text-right">
                                    <div className="item-lot">{paymentDetails.totalPrice ?? paymentDetails.total ?? paymentDetails.itemsTotal ?? ''}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>


                {/* Payment Summary */}
                <div className="payment-summary">
                    <div className="summary-row">
                        <span>Items total:</span>
                        <span>{fmt(itemsTotal)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Discount:</span>
                        <span>- {fmt(discount)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>{fmt(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (0%):</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping:</span>
                        <span>{shippingFee > 0 ? fmt(shippingFee) : 'Free'}</span>
                    </div>
                    <div className="summary-row total">
                        <span><strong>TOTAL PAID:</strong></span>
                        <span><strong>{fmt(totalPaid)}</strong></span>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="payment-status">
                    <div className="status-badge success">
                        <span className="status-icon">✅</span>
                        <span>PAYMENT SUCCESSFUL</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="receipt-footer">
                    <div className="thank-you">
                        <p>Thank you for your business!</p>

                    </div>
                    <div className="footer-info">
                        <p>Keep this receipt for your records</p>
                        <p>For support, contact us at support@ceyloncatch.com</p>
                        <p>Visit us at www.ceyloncatch.com</p>
                    </div>
                </div>

                
               
            </div>
        </div>
    );
};

export default Receipt;
