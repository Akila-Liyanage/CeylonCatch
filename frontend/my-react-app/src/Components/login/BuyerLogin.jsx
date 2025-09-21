import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FaFish, FaEnvelope, FaLock, FaShoppingCart } from 'react-icons/fa';
import OTPVerification from './OTP'; // Import the OTP component
import './BuyerLogin.css';

const BuyerLogin = () => {
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
   const response = await axios.post("http://localhost:5000/api/auth/blogin", {
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
        userType="buyer" 
        onBack={() => setShowOTP(false)}
      />
    );
  }
  return (
    <div className="buyer-login-container">
      <div className="buyer-login-card">
        {/* Header with gradient */}
        <div className="buyer-login-header">
          <div className="buyer-login-icon-container">
            <div className="buyer-login-icon-wrapper">
              <FaFish className="buyer-login-icon" />
            </div>
          </div>
          <h2 className="buyer-login-title">Buyer Login</h2>
          <p className="buyer-login-subtitle">Access your seafood marketplace account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="buyer-login-form">
          <div className="buyer-login-form-group">
            {/* Email */}
            <div className="buyer-login-input-container">
              <FaEnvelope className="buyer-login-input-icon" />
              <input
                type="email"
                name="gmail"
                value={user.gmail}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="buyer-login-input"
                required
              />
            </div>
          </div>

          <div className="buyer-login-form-group">
            {/* Password */}
            <div className="buyer-login-input-container">
              <FaLock className="buyer-login-input-icon" />
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="buyer-login-input"
                required
              />
            </div>
          </div>

          {message && (
            <div className="buyer-login-message">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="buyer-login-button"
          >
            {isLoading ? "Processing..." : (
              <>
                <span>Login as Buyer</span>
                <FaShoppingCart />
              </>
            )}
          </button>
        </form>
        
        <div className="buyer-login-footer">
          <p className="buyer-login-footer-text">
            Don't have an account? <a href="/buyerregister" className="buyer-login-footer-link">Register here</a>
          </p>
          <p className="buyer-login-footer-text" style={{ marginTop: '0.5rem' }}>
            Are you a seller? <a href="/sellerlogin" className="buyer-login-footer-link">Login as Seller</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyerLogin
