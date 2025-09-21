import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { 
  FaFish, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaShoppingBag, 
  FaSignOutAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaHistory,
  FaShoppingCart,
  FaGavel
} from 'react-icons/fa';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        const buyerEmail = localStorage.getItem('buyerEmail');
        if (!buyerEmail) {
          navigate('/blogin');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/user/buyer-by-email/${buyerEmail}`);
        setBuyer(response.data);
        setEditData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching buyer data:', error);
        navigate('/buyer-login');
      }
    };

    fetchBuyerData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('buyerEmail');
    navigate('/blogin');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData(buyer);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const buyerEmail = localStorage.getItem('buyerEmail');
      const response = await axios.put(`http://localhost:5000/api/user/buyer-by-email/${buyerEmail}`, editData);
      
      setBuyer(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
      
      // Dispatch custom event to update navigation
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNavigateToBidHistory = async () => {
    try {
      // Get the current user's email and fetch their _id
      const buyerEmail = localStorage.getItem('buyerEmail');
      if (!buyerEmail) {
        alert('User email not found. Please login again.');
        return;
      }

      // Fetch user details to get the MongoDB _id
      const response = await axios.get(`http://localhost:5000/api/user/buyer-by-email/${buyerEmail}`);
      const userId = response.data._id;
      
      if (userId) {
        console.log('Navigating to bid history with userId:', userId);
        navigate(`/bidHistory/${userId}`);
      } else {
        // Fallback to email if _id not found
        console.log('_id not found, using email as fallback');
        navigate(`/bidHistory/${buyerEmail}`);
      }
    } catch (error) {
      console.error('Error fetching user _id:', error);
      // Fallback to email
      const buyerEmail = localStorage.getItem('buyerEmail');
      navigate(`/bidHistory/${buyerEmail}`);
    }
  };

  const handleNavigateToItems = () => {
    navigate('/items');
  };

  const handleNavigateToOrder = () => {
    navigate('/order');
  };

  const handleNavigateToOrderHistory = () => {
    navigate('/order-history');
  };

  if (loading) {
    return (
      <div className="buyer-loading">
        <div className="buyer-loading-content">
          <div className="buyer-spinner"></div>
          <p className="buyer-loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-dashboard">
      {/* Header */}
      <header className="buyer-header">
        <div className="buyer-header-content">
          <div className="buyer-header-left">
            <FaFish className="buyer-header-icon" />
            <h1 className="buyer-header-title">CeylonCatch Buyer Portal</h1>
          </div>
          <div className="buyer-header-right">
            <button 
              onClick={handleLogout}
              className="buyer-logout-btn"
            >
              <FaSignOutAlt className="buyer-logout-icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="buyer-main">
        {/* Profile Details Card */}
        <div className="buyer-card">
          <div className="buyer-card-header">
            <div className="buyer-card-header-left">
              <h2>Buyer Profile Information</h2>
              <p>Your account details and preferences</p>
            </div>
            {!isEditing ? (
              <button 
                onClick={handleEdit}
                className="buyer-edit-btn"
              >
                <FaEdit className="buyer-edit-icon" />
                Edit Profile
              </button>
            ) : (
              <div className="buyer-edit-buttons">
                <button 
                  onClick={handleSave}
                  className="buyer-save-btn"
                >
                  <FaSave className="buyer-edit-icon" />
                  Save
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="buyer-cancel-btn"
                >
                  <FaTimes className="buyer-edit-icon" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="buyer-card-body">
            <div className="buyer-grid">
              <div className="buyer-field">
                <div className="buyer-field-icon">
                  <FaUser />
                </div>
                <div className="buyer-field-content">
                  <h3 className="buyer-field-label">Full Name</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="buyer-input"
                    />
                  ) : (
                    <p className="buyer-field-value">{buyer.name}</p>
                  )}
                </div>
              </div>

              <div className="buyer-field">
                <div className="buyer-field-icon">
                  <FaEnvelope />
                </div>
                <div className="buyer-field-content">
                  <h3 className="buyer-field-label">Email Address</h3>
                  <p className="buyer-field-value">{buyer.gmail}</p>
                </div>
              </div>

              <div className="buyer-field">
                <div className="buyer-field-icon">
                  <FaPhone />
                </div>
                <div className="buyer-field-content">
                  <h3 className="buyer-field-label">Contact Number</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contact"
                      value={editData.contact}
                      onChange={handleInputChange}
                      className="buyer-input"
                    />
                  ) : (
                    <p className="buyer-field-value">{buyer.contact}</p>
                  )}
                </div>
              </div>

              <div className="buyer-field">
                <div className="buyer-field-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="buyer-field-content">
                  <h3 className="buyer-field-label">Delivery Address</h3>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={editData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="buyer-textarea"
                    />
                  ) : (
                    <p className="buyer-field-value">{buyer.address}</p>
                  )}
                </div>
              </div>

              <div className="buyer-field">
                <div className="buyer-field-icon">
                  <FaShoppingBag />
                </div>
                <div className="buyer-field-content">
                  <h3 className="buyer-field-label">Business Type</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="btype"
                      value={editData.btype}
                      onChange={handleInputChange}
                      className="buyer-input"
                    />
                  ) : (
                    <p className="buyer-field-value">{buyer.btype}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="buyer-card">
          <div className="buyer-card-header">
            <div className="buyer-card-header-left">
              <h2>Quick Actions</h2>
              <p>Access your bidding activities and marketplace features</p>
            </div>
          </div>

          <div className="buyer-card-body">
            <div className="buyer-actions-grid">
              <button 
                onClick={handleNavigateToOrder}
                className="buyer-action-btn buyer-action-primary"
              >
                <div className="buyer-action-icon">
                  <FaShoppingCart />
                </div>
                <div className="buyer-action-content">
                  <h3>Order Now</h3>
                  <p>Place a new order for fresh fish delivery</p>
                </div>
              </button>

              <button 
                onClick={handleNavigateToOrderHistory}
                className="buyer-action-btn buyer-action-secondary"
              >
                <div className="buyer-action-icon">
                  <FaHistory />
                </div>
                <div className="buyer-action-content">
                  <h3>Order History</h3>
                  <p>View your order history and track delivery status</p>
                </div>
              </button>

              <button 
                onClick={handleNavigateToBidHistory}
                className="buyer-action-btn buyer-action-tertiary"
              >
                <div className="buyer-action-icon">
                  <FaGavel />
                </div>
                <div className="buyer-action-content">
                  <h3>Bid History</h3>
                  <p>View your bidding history and track your auctions</p>
                </div>
              </button>

              <button 
                onClick={handleNavigateToItems}
                className="buyer-action-btn buyer-action-quaternary"
              >
                <div className="buyer-action-icon">
                  <FaFish />
                </div>
                <div className="buyer-action-content">
                  <h3>Browse Items</h3>
                  <p>Explore available fish lots and place new bids</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard