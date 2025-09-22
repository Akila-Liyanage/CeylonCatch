import React, { useEffect, useMemo, useState } from 'react';//
import { motion, AnimatePresence } from 'framer-motion';
import './OrderConfirmModal.css';

const currency = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

const OrderConfirmModal = ({
    isOpen,
    item,
    onClose,
    onPlaceOrder
}) => {
    const [qtyKg, setQtyKg] = useState(1);
    const [method, setMethod] = useState('new_card'); // new_card | saved:<id> | gpay | paypal
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [shipping, setShipping] = useState('standard'); // standard | express
   

    useEffect(() => {
        if (isOpen) {
            setQtyKg(1);
            setMethod('new_card');
            setPromoCode('');
            setAppliedPromo(null);
            setShipping('standard');
        }
    }, [isOpen]);



    const limits = useMemo(() => ({ min: 0.1, step: 0.1, max: item?.quantity || 0 }), [item]);

    const itemsTotal = useMemo(() => (qtyKg * (item?.price || 0)), [qtyKg, item]);
    const discount = useMemo(() => {
        if (!appliedPromo) return 0;
        if (appliedPromo.type === 'flat') return appliedPromo.value;
        if (appliedPromo.type === 'percent') return (itemsTotal * appliedPromo.value) / 100;
        return 0;
    }, [appliedPromo, itemsTotal]);
    const shippingFee = useMemo(() => (shipping === 'express' ? 850 : 300), [shipping]);
    const subtotal = useMemo(() => Math.max(itemsTotal - discount, 0), [itemsTotal, discount]);
    const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

    const applyPromo = () => {
        const code = promoCode.trim().toUpperCase();
        if (!code) return;
        if (code === 'WELCOME10') setAppliedPromo({ code, type: 'percent', value: 10 });
        else if (code === 'FISH100') setAppliedPromo({ code, type: 'flat', value: 100 });
        else setAppliedPromo(null);
    };

    const increment = () => setQtyKg((q) => Math.min(Number((q + limits.step).toFixed(2)), limits.max));
    const decrement = () => setQtyKg((q) => Math.max(Number((q - limits.step).toFixed(2)), limits.min));

    const handlePlaceOrder = () => {
        if (!item) return;
        let selectedSavedCard = null;
        if (method.startsWith('saved:')) {
            const id = method.split(':')[1];
            // For now, set to null since savedCards is not implemented
            selectedSavedCard = null;
        }
        onPlaceOrder({                                           // Pass all order details...
            ...item,
            selectedQuantity: Number(qtyKg.toFixed(2)),
            price: item.price,
            itemsTotal: Number(itemsTotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            shippingFee: Number(shippingFee.toFixed(2)),
            subtotal: Number(subtotal.toFixed(2)),
            totalPrice: Number(total.toFixed(2)),
            promo: appliedPromo,
            shippingMethod: shipping,
            paymentSelection: method,
            savedCard: selectedSavedCard || undefined
        });
    };

    if (!isOpen || !item) return null;

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
                    className="order-confirm-modal"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Order confirmation</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>

                    <div className="modal-content">
                        {/* Item details */}
                        <div className="block">
                            <h3>Items' details</h3>
                            <div className="item-row">
                                <div className="thumb">🐟</div>
                                <div className="info">
                                    <div className="name">{item.fishName}</div>
                                    <div className="price">{currency(itemsTotal)}</div>
                                    <div className="old-price">{currency(itemsTotal * 1.1)}</div>
                                </div>
                                <div className="qty">
                                    <button onClick={decrement} disabled={qtyKg <= limits.min}>-</button>
                                    <input
                                        type="number"
                                        value={qtyKg}
                                        min={limits.min}
                                        step={limits.step}
                                        max={limits.max}
                                        onChange={(e) => setQtyKg(Math.max(limits.min, Math.min(limits.max, Number(e.target.value))))}
                                    />
                                    <button onClick={increment} disabled={qtyKg >= limits.max}>+</button>
                                    <span className="unit">kg</span>
                                </div>
                            </div>
                        </div>



                        {/* Summary */}
                        <div className="block">
                            <h3>Summary</h3>
                            <div className="summary-row">
                                <span>Items total</span>
                                <span>{currency(itemsTotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Items discount</span>
                                <span className={discount > 0 ? 'danger' : ''}>{discount > 0 ? `-${currency(discount)}` : currency(0)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{currency(subtotal)}</span>
                            </div>
                            <div className="promo">
                                <label>Promo codes</label>
                                <div className="promo-row">
                                    <input
                                        type="text"
                                        placeholder="Enter"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                    />
                                    <button onClick={applyPromo}>Apply</button>
                                </div>
                                {appliedPromo && (
                                    <div className="promo-applied">Applied: {appliedPromo.code}</div>
                                )}
                            </div>
                            <div className="shipping">
                                <label>Shipping</label>
                                <div className="ship-options">
                                    <label>
                                        <input type="radio" name="ship" checked={shipping === 'standard'} onChange={() => setShipping('standard')} />
                                        Standard (300)
                                    </label>
                                    <label>
                                        <input type="radio" name="ship" checked={shipping === 'express'} onChange={() => setShipping('express')} />
                                        Express ({currency(850)})
                                    </label>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping fee</span>
                                    <span>{currency(shippingFee)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="total">
                            <span>Total:</span>
                            <strong>{currency(total)}</strong>
                        </div>
                        <button className="place-btn" onClick={handlePlaceOrder}>Place order</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderConfirmModal;


