import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import VanillaTilt from 'vanilla-tilt';
import './itemsList.css';

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/items')
      .then(res => setItems(res.data))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load items'))
      .finally(() => setLoading(false));
  }, []);

  // Initialize tilt effect on cards
  useEffect(() => {
    const elements = document.querySelectorAll('.card-tilt');
    if (elements?.length) {
      VanillaTilt.init(elements, {
        max: 8,
        speed: 400,
        glare: true,
        'max-glare': 0.2,
        scale: 1.02,
      });
    }
    return () => {
      elements.forEach((el) => {
        if (el.vanillaTilt) el.vanillaTilt.destroy();
      });
    };
  }, [items]);

  if (loading) {
    return (
      <div className="items-list-container">
        <motion.div 
          className="loading-state"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
        >
          <i className="fas fa-spinner"></i>
          <p>Loading fresh catches...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="items-list-container">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="items-list-container">
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
      >
        <i className="header-decoration fas fa-anchor"></i>
        <i className="header-decoration fas fa-fish"></i>
        <i className="header-decoration fas fa-water"></i>
        <i className="header-decoration fas fa-ship"></i>
        <h1>Fresh Fish Auction</h1>
        <p>Bid on the finest selection of seafood</p>
      </motion.div>

      <div className="items-grid">
        {items.length === 0 ? (
          <motion.div 
            className="no-items-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="fish-icon">🐟</div>
            <p>No fresh catches available</p>
            <p>Check back later for new arrivals!</p>
          </motion.div>
        ) : (
          items.map((item, idx) => (
            <motion.div
              key={item._id}
              className="auction-card card-tilt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ y: -6 }}
            >
              <div className="card-image-container">
                <img src={item.image} alt={item.name} />
                <div className="image-overlay"></div>
                <div className="wave-effect"></div>
                <div className="card-tags">
                  <span className={`status-badge ${item.status === 'open' ? 'status-open' : 'status-closed'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              
              <div className="card-content">
                <div className="card-header">
                  <h3><i className="fas fa-fish"></i> {item.name}</h3>
                </div>
                
                <p className="card-description">{item.description}</p>
                
                <div className="bid-info">
                  <div className="info-row">
                    <span className="info-label"><i className="fas fa-play"></i> Starting</span>
                    <span className="info-value">Rs.{item.startingPrice}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fas fa-arrow-up"></i> Current</span>
                    <span className="info-value current-bid">Rs.{item.currentPrice}</span>
                  </div>
                </div>
                
                <div className="countdown">
                  <div className="countdown-label"><i className="far fa-clock"></i> Ends</div>
                  <div className="timer">{new Date(item.endTime).toLocaleString()}</div>
                </div>
                
                <div className="bid-button-container">
                  <Link to={`/items/${item._id}`} className="bid-button">
                    <i className="fas fa-gavel"></i> Bid Now
                  </Link>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="bubbles">
                  <span className="bubble"></span>
                  <span className="bubble"></span>
                  <span className="bubble"></span>
                  <span className="bubble"></span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ItemsList;