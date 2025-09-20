import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  FaFish,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBox,
  FaIdCard,
  FaSignOutAlt,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const sellerEmail = localStorage.getItem("sellerEmail");
        if (!sellerEmail) {
          navigate("/slogin");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/user/seller-by-email/${sellerEmail}`
        );
        setSeller(response.data);
        setEditData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching seller data:", error);
        navigate("/sdashboard");
      }
    };

    fetchSellerData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sellerEmail");
    navigate("/slogin");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData(seller);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const sellerEmail = localStorage.getItem("sellerEmail");
      const response = await axios.put(
        `http://localhost:5001/user/seller-by-email/${sellerEmail}`,
        editData
      );

      setSeller(response.data.seller);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="seller-loading">
        <div className="seller-loading-content">
          <div className="seller-spinner"></div>
          <p className="seller-loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      {/* Header */}
      <header className="seller-header">
        <div className="seller-header-content">
          <div className="seller-header-left">
            <FaFish className="seller-header-icon" />
            <h1 className="seller-header-title">CeylonCatch Seller Portal</h1>
          </div>
          <div className="seller-header-right">
            <button
              onClick={handleLogout}
              className="seller-logout-btn"
            >
              <FaSignOutAlt className="seller-logout-icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="seller-main">
        {/* Profile Details Card */}
        <div className="seller-card">
          <div className="seller-card-header">
            <div className="seller-card-header-left">
              <h2>Seller Profile Information</h2>
              <p>Your account details and business information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="seller-edit-btn"
              >
                <FaEdit className="seller-edit-icon" />
                Edit Profile
              </button>
            ) : (
              <div className="seller-edit-buttons">
                <button
                  onClick={handleSave}
                  className="seller-save-btn"
                >
                  <FaSave className="seller-edit-icon" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="seller-cancel-btn"
                >
                  <FaTimes className="seller-edit-icon" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="seller-card-body">
            <div className="seller-grid">
              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaUser />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Full Name</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="seller-input"
                    />
                  ) : (
                    <p className="seller-field-value">{seller.name}</p>
                  )}
                </div>
              </div>

              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaEnvelope />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Email Address</h3>
                  <p className="seller-field-value">{seller.gmail}</p>
                </div>
              </div>

              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaPhone />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Contact Number</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contact"
                      value={editData.contact}
                      onChange={handleInputChange}
                      className="seller-input"
                    />
                  ) : (
                    <p className="seller-field-value">{seller.contact}</p>
                  )}
                </div>
              </div>

              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Business Address</h3>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={editData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="seller-textarea"
                    />
                  ) : (
                    <p className="seller-field-value">{seller.address}</p>
                  )}
                </div>
              </div>

              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaBox />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Product Type</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="product"
                      value={editData.product}
                      onChange={handleInputChange}
                      className="seller-input"
                    />
                  ) : (
                    <p className="seller-field-value">{seller.product}</p>
                  )}
                </div>
              </div>

              <div className="seller-field">
                <div className="seller-field-icon">
                  <FaIdCard />
                </div>
                <div className="seller-field-content">
                  <h3 className="seller-field-label">Business Number</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="bnumb"
                      value={editData.bnumb}
                      onChange={handleInputChange}
                      className="seller-input"
                    />
                  ) : (
                    <p className="seller-field-value">{seller.bnumb}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard