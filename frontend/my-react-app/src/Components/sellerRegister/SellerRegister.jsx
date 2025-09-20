import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaBox, FaIdCard, FaFish, FaAnchor, FaWater } from 'react-icons/fa';
import './SellerRegister.css';

const SellerRegister = () => {
  const history = useNavigate();
    const [user, setUser] = useState({
        name: "",
        gmail: "",
        password: "",
        contact: "",
        address: "",
        product: "",
        bnumb: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({ ...prevUser, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        sendRequest().then(() => {
            alert("Registration Successful! Please login to continue.");
            history("/sellerlogin");
        }).catch((err) => {
            alert(err.response?.data?.message || "Registration failed. Please try again.");
        });
    };

    const sendRequest = async () => {
await axios.post("http://localhost:5000/api/auth/SellerRegister", { 
            name: String(user.name),
            gmail: String(user.gmail),
            password: String(user.password),
            contact: String(user.contact),
            address: String(user.address),
            product: String(user.product),
            bnumb: String(user.bnumb)
        }).then(res => res.data);
    };

    return (
        <div className="seller-register-container">
            <div className="seller-register-card">
                {/* Header with gradient */}
                <div className="seller-register-header">
                    <div className="seller-register-icon-container">
                        <div className="seller-register-icon-wrapper">
                            <FaFish className="seller-register-icon" />
                        </div>
                    </div>
                    <h2 className="seller-register-title">Seller Registration</h2>
                    <p className="seller-register-subtitle">Join our seafood marketplace</p>
                </div>
                
                <form onSubmit={handleSubmit} className="seller-register-form">
                    <div className="seller-register-form-group">
                        {/* Name */}
                        <div className="seller-register-input-container">
                            <FaUser className="seller-register-input-icon" />
                            <input
                                type="text"
                                name="name"
                                value={user.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Email */}
                        <div className="seller-register-input-container">
                            <FaEnvelope className="seller-register-input-icon" />
                            <input
                                type="email"
                                name="gmail"
                                value={user.gmail}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Password */}
                        <div className="seller-register-input-container">
                            <FaLock className="seller-register-input-icon" />
                            <input
                                type="password"
                                name="password"
                                value={user.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Contact */}
                        <div className="seller-register-input-container">
                            <FaPhone className="seller-register-input-icon" />
                            <input
                                type="text"
                                name="contact"
                                value={user.contact}
                                onChange={handleInputChange}
                                placeholder="Enter your contact number"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Address */}
                        <div className="seller-register-input-container">
                            <FaMapMarkerAlt className="seller-register-input-icon" />
                            <input
                                type="text"
                                name="address"
                                value={user.address}
                                onChange={handleInputChange}
                                placeholder="Enter your address"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Product */}
                        <div className="seller-register-input-container">
                            <FaBox className="seller-register-input-icon" />
                            <input
                                type="text"
                                name="product"
                                value={user.product}
                                onChange={handleInputChange}
                                placeholder="Enter product type (e.g., Fresh Fish, Seafood)"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="seller-register-form-group">
                        {/* Business Number */}
                        <div className="seller-register-input-container">
                            <FaIdCard className="seller-register-input-icon" />
                            <input
                                type="text"
                                name="bnumb"
                                value={user.bnumb}
                                onChange={handleInputChange}
                                placeholder="Enter business number"
                                className="seller-register-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="seller-register-button"
                    >
                        <span>Register as Seller</span>
                        <FaAnchor />
                    </button>
                </form>
                
                <div className="seller-register-footer">
                    <p className="seller-register-footer-text">
                        <FaWater className="seller-register-footer-icon" />
                        Join the leading seafood marketplace
                    </p>
                    <p className="seller-register-footer-text" style={{ marginTop: '0.5rem' }}>
                        Are you a buyer? <a href="/buyerregister" className="buyer-register-footer-link">Register as Buyer</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SellerRegister