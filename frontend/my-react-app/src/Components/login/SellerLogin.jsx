import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FaFish, FaEnvelope, FaLock, FaAnchor } from 'react-icons/fa';
import OTPVerification from './OTP'; // Import the OTP component
import './SellerLogin.css';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    gmail: "",
    password: "",
  });
  const [showOTP, setShowOTP] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/slogin", {
        gmail: user.gmail,
        password: user.password,
      });

      if (response.data.status === "otp_required") {
        setShowOTP(true);
        setMessage(response.data.message);
        // Log development OTP for testing
        if (response.data.development_otp) {
          console.log("🔐 Development OTP:", response.data.development_otp);
        }
      } else if (response.data.status === "success") {
        // Login successful
        navigate('/');
      } else {
        setMessage(response.data.err || "Login failed");
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTP) {
    return (
      <OTPVerification 
        gmail={user.gmail} 
        userType="seller" 
        onBack={() => setShowOTP(false)}
      />
    );
  }

  return (
    <div className="seller-login-container">
      <div className="seller-login-card">
        {/* Header with gradient */}
        <div className="seller-login-header">
          <div className="seller-login-icon-container">
            <div className="seller-login-icon-wrapper">
              <FaFish className="seller-login-icon" />
            </div>
          </div>
          <h2 className="seller-login-title">Seller Login</h2>
          <p className="seller-login-subtitle">Access your seafood marketplace account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="seller-login-form">
          <div className="seller-login-form-group">
            {/* Email */}
            <div className="seller-login-input-container">
              <FaEnvelope className="seller-login-input-icon" />
              <input
                type="email"
                name="gmail"
                value={user.gmail}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="seller-login-input"
                required
              />
            </div>
          </div>

          <div className="seller-login-form-group">
            {/* Password */}
            <div className="seller-login-input-container">
              <FaLock className="seller-login-input-icon" />
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="seller-login-input"
                required
              />
            </div>
          </div>

          {message && (
            <div className="seller-login-message">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="seller-login-button"
          >
            {isLoading ? "Processing..." : (
              <>
                <span>Login as Seller</span>
                <FaAnchor />
              </>
            )}
          </button>
        </form>
        
        <div className="seller-login-footer">
          <p className="seller-login-footer-text">
            Don't have an account? <a href="/sellerregister" className="seller-login-footer-link">Register here</a>
          </p>
          <p className="seller-login-footer-text" style={{ marginTop: '0.5rem' }}>
            Are you a buyer? <a href="/buyerlogin" className="seller-login-footer-link">Login as Buyer</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SellerLogin
