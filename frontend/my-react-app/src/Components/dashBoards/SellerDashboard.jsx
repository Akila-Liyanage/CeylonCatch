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
  FaPlus,
  FaList,
  FaEye,
  FaTrash,
  FaPlay,
  FaPause,
  FaUpload,
} from "react-icons/fa";
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Fish lot management states
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'fishlots'
  const [fishLots, setFishLots] = useState([]);
  const [fishLotLoading, setFishLotLoading] = useState(false);
  const [showAddFishLot, setShowAddFishLot] = useState(false);
  const [editingFishLot, setEditingFishLot] = useState(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const sellerEmail = localStorage.getItem("sellerEmail");
        if (!sellerEmail) {
          navigate("/sellerlogin");
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
    navigate("/sellerlogin");
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
        `http://localhost:5000/api/user/seller-by-email/${sellerEmail}`,
        editData
      );

      setSeller(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
      
      // Dispatch custom event to update navigation
      window.dispatchEvent(new CustomEvent('profileUpdated'));
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

  // Fish lot management functions
  const fetchFishLots = async () => {
    if (!seller) return;
    
    setFishLotLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/items/seller/${seller._id}`
      );
      setFishLots(response.data);
    } catch (error) {
      console.error("Error fetching fish lots:", error);
      alert("Error fetching fish lots. Please try again.");
    } finally {
      setFishLotLoading(false);
    }
  };

  const handleDeleteFishLot = async (fishLotId) => {
    if (!window.confirm("Are you sure you want to delete this fish lot?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/items/${fishLotId}`);
      setFishLots(fishLots.filter(lot => lot._id !== fishLotId));
      alert("Fish lot deleted successfully!");
    } catch (error) {
      console.error("Error deleting fish lot:", error);
      alert("Error deleting fish lot. Please try again.");
    }
  };

  const handleUpdateFishLotStatus = async (fishLotId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/items/${fishLotId}/status`, {
        status: newStatus
      });
      
      setFishLots(fishLots.map(lot => 
        lot._id === fishLotId ? { ...lot, status: newStatus } : lot
      ));
      
      alert(`Fish lot status updated to ${newStatus}!`);
    } catch (error) {
      console.error("Error updating fish lot status:", error);
      alert("Error updating fish lot status. Please try again.");
    }
  };

  // Load fish lots when seller data is available and fish lots tab is active
  useEffect(() => {
    if (seller && activeTab === 'fishlots') {
      fetchFishLots();
    }
  }, [seller, activeTab]);

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
        {/* Tab Navigation */}
        <div className="seller-tab-navigation">
          <button 
            className={`seller-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser className="seller-tab-icon" />
            Profile
          </button>
          <button 
            className={`seller-tab-btn ${activeTab === 'fishlots' ? 'active' : ''}`}
            onClick={() => setActiveTab('fishlots')}
          >
            <FaFish className="seller-tab-icon" />
            Fish Lots
          </button>
        </div>

        {activeTab === 'profile' && (
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
        )}

        {activeTab === 'fishlots' && (
          <div className="fish-lots-section">
            <div className="fish-lots-header">
              <h2>My Fish Lots</h2>
              <button 
                className="add-fish-lot-btn"
                onClick={() => navigate('/add-fish-lot')}
              >
                <FaPlus className="btn-icon" />
                Add New Fish Lot
              </button>
            </div>

            {fishLotLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading fish lots...</p>
              </div>
            ) : (
              <div className="fish-lots-grid">
                {fishLots.length === 0 ? (
                  <div className="no-fish-lots">
                    <FaFish className="no-lots-icon" />
                    <h3>No Fish Lots Yet</h3>
                    <p>Start by adding your first fish lot to begin auctioning</p>
                    <button 
                      className="add-first-lot-btn"
                      onClick={() => navigate('/add-fish-lot')}
                    >
                      <FaPlus className="btn-icon" />
                      Add Your First Fish Lot
                    </button>
                  </div>
                ) : (
                  fishLots.map((fishLot) => (
                    <div key={fishLot._id} className="fish-lot-card">
                      <div className="fish-lot-images">
                        {fishLot.images && fishLot.images.length > 0 ? (
                          <img 
                            src={`http://localhost:5000/uploads/${fishLot.images[0]}`} 
                            alt={fishLot.name}
                            className="fish-lot-main-image"
                          />
                        ) : (
                          <div className="no-image-placeholder">
                            <FaFish className="placeholder-icon" />
                          </div>
                        )}
                        <div className="fish-lot-status">
                          <span className={`status-badge status-${fishLot.status}`}>
                            {fishLot.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="fish-lot-details">
                        <h3 className="fish-lot-name">{fishLot.name}</h3>
                        <p className="fish-lot-type">{fishLot.fishType}</p>
                        <p className="fish-lot-weight">{fishLot.weight} {fishLot.unit}</p>
                        <p className="fish-lot-location">{fishLot.location?.district}, {fishLot.location?.port}</p>
                        <p className="fish-lot-price">LKR {fishLot.currentPrice?.toLocaleString()}</p>
                        <p className="fish-lot-views">
                          <FaEye className="view-icon" />
                          {fishLot.views || 0} views
                        </p>
                      </div>
                      
                      <div className="fish-lot-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => navigate(`/edit-fish-lot/${fishLot._id}`)}
                        >
                          <FaEdit className="btn-icon" />
                          Edit
                        </button>
                        
                        {fishLot.status === 'draft' && (
                          <button 
                            className="action-btn activate-btn"
                            onClick={() => handleUpdateFishLotStatus(fishLot._id, 'open')}
                          >
                            <FaPlay className="btn-icon" />
                            Activate
                          </button>
                        )}
                        
                        {fishLot.status === 'open' && (
                          <button 
                            className="action-btn pause-btn"
                            onClick={() => handleUpdateFishLotStatus(fishLot._id, 'closed')}
                          >
                            <FaPause className="btn-icon" />
                            Close
                          </button>
                        )}
                        
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteFishLot(fishLot._id)}
                        >
                          <FaTrash className="btn-icon" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;