import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
  FaFish,
  FaUpload,
  FaTimes,
  FaPlus,
  FaSave,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaWeight,
  FaCalendar,
  FaTag,
  FaImage
} from 'react-icons/fa';
import './AddFishLot.css';

const AddFishLot = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fishType: '',
    description: '',
    weight: '',
    unit: 'kg',
    startingPrice: '',
    quantity: 1,
    district: '',
    port: '',
    quality: 'Grade A',
    freshness: 'Fresh',
    catchDate: '',
    endTime: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

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
      } catch (error) {
        console.error("Error fetching seller data:", error);
        navigate("/sellerlogin");
      }
    };

    fetchSellerData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!seller) {
      alert('Seller information not loaded');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Add form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Add seller information
      formDataToSend.append('sellerId', seller._id);
      formDataToSend.append('sellerName', seller.name);
      formDataToSend.append('sellerContact', seller.contact);
      formDataToSend.append('currentPrice', formData.startingPrice);

      const response = await axios.post(
        'http://localhost:5000/api/items',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert('Fish lot created successfully!');
      navigate('/sdashboard');
    } catch (error) {
      console.error('Error creating fish lot:', error);
      alert('Error creating fish lot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!seller) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading seller information...</p>
      </div>
    );
  }

  return (
    <div className="add-fish-lot-container">
      <div className="add-fish-lot-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/sdashboard')}
        >
          <FaArrowLeft className="back-icon" />
          Back to Dashboard
        </button>
        <h1>Add New Fish Lot</h1>
      </div>

      <form onSubmit={handleSubmit} className="fish-lot-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">
              <FaFish className="section-icon" />
              Basic Information
            </h2>
            
            <div className="form-group">
              <label htmlFor="name">Fish Lot Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Fresh Tuna Catch"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fishType">Fish Type *</label>
                <select
                  id="fishType"
                  name="fishType"
                  value={formData.fishType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Fish Type</option>
                  <option value="Tuna">Tuna</option>
                  <option value="Salmon">Salmon</option>
                  <option value="Lobster">Lobster</option>
                  <option value="Shrimp">Shrimp</option>
                  <option value="Seaweed">Seaweed</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quality">Quality *</label>
                <select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Premium">Premium</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your fish lot, including freshness, size, and any special characteristics..."
                rows="4"
                required
              />
            </div>
          </div>

          {/* Weight and Pricing */}
          <div className="form-section">
            <h2 className="section-title">
              <FaWeight className="section-icon" />
              Weight & Pricing
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weight">Weight *</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startingPrice">Starting Price (LKR) *</label>
                <input
                  type="number"
                  id="startingPrice"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location and Details */}
          <div className="form-section">
            <h2 className="section-title">
              <FaMapMarkerAlt className="section-icon" />
              Location & Details
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="e.g., Colombo"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="port">Port *</label>
                <input
                  type="text"
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  placeholder="e.g., Colombo Port"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="freshness">Freshness *</label>
                <select
                  id="freshness"
                  name="freshness"
                  value={formData.freshness}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Dried">Dried</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="catchDate">Catch Date *</label>
                <input
                  type="date"
                  id="catchDate"
                  name="catchDate"
                  value={formData.catchDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Auction Settings */}
          <div className="form-section">
            <h2 className="section-title">
              <FaCalendar className="section-icon" />
              Auction Settings
            </h2>

            <div className="form-group">
              <label htmlFor="endTime">Auction End Time *</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <small className="form-help">
                Set when the auction should end. Must be at least 1 hour from now.
              </small>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h2 className="section-title">
              <FaImage className="section-icon" />
              Images
            </h2>

            <div className="image-upload-area">
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-input"
              />
              <label htmlFor="images" className="image-upload-label">
                <FaUpload className="upload-icon" />
                <span>Upload Images (Max 5)</span>
                <small>Click to select or drag and drop images here</small>
              </label>
            </div>

            {imagePreview.length > 0 && (
              <div className="image-preview-grid">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/sdashboard')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Creating...
              </>
            ) : (
              <>
                <FaSave className="btn-icon" />
                Create Fish Lot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFishLot;
