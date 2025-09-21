import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FaFish, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaStore, FaAnchor } from 'react-icons/fa';
import './BuyerRegister.css';

const BuyerRegister = () => {

     const history = useNavigate();
    const [user, setUser] = useState({
        name: "",
        gmail: "",
        password: "",
        contact: "",
        address: "",
        btype: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({ ...prevUser, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendRequest().then(() => {
            alert("Registration Successful! Please login to continue.");
            history("/buyerlogin");
        }).catch((err) => {
            alert(err.response?.data?.message || "Registration failed. Please try again.");
        });
    };

    const sendRequest = async () => {
        await axios.post("http://localhost:5000/api/auth/BuyerRegister", {
            name: String(user.name),
            gmail: String(user.gmail),
            password: String(user.password),
            contact: String(user.contact),
            address: String(user.address),
            btype: String(user.btype)
        }).then(res => res.data);
    };
  return (
    <div className="buyer-register-container">
      <div className="buyer-register-card">
        {/* Header with gradient */}
        <div className="buyer-register-header">
          <div className="buyer-register-icon-container">
            <div className="buyer-register-icon-wrapper">
              <FaFish className="buyer-register-icon" />
            </div>
          </div>
          <h2 className="buyer-register-title">Buyer Registration</h2>
          <p className="buyer-register-subtitle">Join our seafood marketplace</p>
        </div>
        
        <form onSubmit={handleSubmit} className="buyer-register-form">
          <div className="buyer-register-form-group">
            {/* Name */}
            <div className="buyer-register-input-container">
              <FaUser className="buyer-register-input-icon" />
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          <div className="buyer-register-form-group">
            {/* Email */}
            <div className="buyer-register-input-container">
              <FaEnvelope className="buyer-register-input-icon" />
              <input
                type="email"
                name="gmail"
                value={user.gmail}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          <div className="buyer-register-form-group">
            {/* Password */}
            <div className="buyer-register-input-container">
              <FaLock className="buyer-register-input-icon" />
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          <div className="buyer-register-form-group">
            {/* Contact */}
            <div className="buyer-register-input-container">
              <FaPhone className="buyer-register-input-icon" />
              <input
                type="text"
                name="contact"
                value={user.contact}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          <div className="buyer-register-form-group">
            {/* Address */}
            <div className="buyer-register-input-container">
              <FaMapMarkerAlt className="buyer-register-input-icon" />
              <input
                type="text"
                name="address"
                value={user.address}
                onChange={handleInputChange}
                placeholder="Enter your complete address"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          <div className="buyer-register-form-group">
            {/* Business Type */}
            <div className="buyer-register-input-container">
              <FaStore className="buyer-register-input-icon" />
              <input
                type="text"
                name="btype"
                value={user.btype}
                onChange={handleInputChange}
                placeholder="What type of business do you have?"
                className="buyer-register-input"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="buyer-register-button"
          >
            <span>Register as Buyer</span>
            <FaAnchor />
          </button>
        </form>
        
        <div className="buyer-register-footer">
          <p className="buyer-register-footer-text">
            Already have an account? <a href="/buyerlogin" className="buyer-register-footer-link">Login here</a>
          </p>
          <p className="buyer-register-footer-text" style={{ marginTop: '0.5rem' }}>
            Are you a seller? <a href="/sellerregister" className="buyer-register-footer-link">Register as Seller</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyerRegister
