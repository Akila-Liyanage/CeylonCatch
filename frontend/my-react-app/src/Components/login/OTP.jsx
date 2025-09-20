import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FaShieldAlt, FaArrowLeft, FaRedo } from 'react-icons/fa';
import './OTP.css';

const OTPVerification = ({ gmail, userType, onBack }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        gmail,
        otp
      });

      if (response.data.status === "ok") {
        // Store token and redirect to homepage
        localStorage.setItem(`${userType}Token`, response.data.token);
        localStorage.setItem(`${userType}Email`, gmail);
        
        // Dispatch custom login event to update navigation
        window.dispatchEvent(new CustomEvent('userLogin'));
        
        // Navigate to homepage after successful login
        navigate('/');
      } else {
        setMessage(response.data.err || "OTP verification failed");
      }
    } catch (err) {
      setMessage("Error verifying OTP: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setMessage("Please try logging in again to receive a new OTP");
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-icon-container">
            <div className="otp-icon">
              <FaShieldAlt />
            </div>
          </div>
          <h2 className="otp-title">🔐 OTP Verification</h2>
          <p className="otp-subtitle">Enter the code sent to your phone</p>
        </div>
        
        <form onSubmit={handleVerifyOTP} className="otp-form">
          <div className="otp-form-group">
            <label className="otp-label">
              📱 Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="otp-input"
              required
              maxLength={6}
            />
          </div>

          {message && (
            <div className={`otp-message ${
              message.includes("sent") || message.includes("success") ? "success" : "error"
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="otp-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="otp-loading"></span>
                Verifying...
              </>
            ) : (
              "✅ Verify OTP"
            )}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              onClick={onBack}
              className="otp-back-btn"
            >
              <FaArrowLeft />
              Back to Login
            </button>
            
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="otp-resend-btn"
            >
              <FaRedo />
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OTPVerification