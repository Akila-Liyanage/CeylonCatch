import React, { useEffect, useState } from 'react'
import axios from "axios";
import { Link } from "react-router";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion } from 'framer-motion';
import './ItemList.css';
import '../../products/product.css';

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 16 }
  }
};

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/items")
      .then(res => {
        setItems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className='itemList'>
        <div className="header-section">
          <i className="header-decoration fas fa-anchor"></i>
          <i className="header-decoration fas fa-fish"></i>
          <i className="header-decoration fas fa-water"></i>
          <i className="header-decoration fas fa-ship"></i>
          <h1>Fresh Fish Auction</h1>
          <p>Bid on the finest selection of seafood</p>
        </div>
        <div className="loading">
          <i className="fas fa-spinner"></i>
          <p>Loading fresh catches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='itemList'>
      <div className="header-section">
        <i className="header-decoration fas fa-anchor"></i>
        <i className="header-decoration fas fa-fish"></i>
        <i className="header-decoration fas fa-water"></i>
        <i className="header-decoration fas fa-ship"></i>
        <h1>Fresh Fish Auction</h1>
        <p>Bid on the finest selection of seafood</p>
      </div>
      
      <motion.div
        className="grid"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {items.length === 0 ? (
          <div className="no-items">
            <div className="fish-icon">🐟</div>
            <p>No fresh catches available</p>
            <p>Check back later for new arrivals!</p>
          </div>
        ) : (
          items.map((item) => (
            <motion.div key={item._id} variants={cardVariants} whileHover={{ y: -6, scale: 1.02 }}>
              <div className='productCard'>
                <div className="imageContainer">
                  <img src={item.image} alt={item.name} />
                  <motion.div className="overlay" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}>
                    <Link to={`/items/${item._id}`} className="quickView">Bid Now</Link>
                  </motion.div>
                  <div className="categoryTag">{item.status}</div>
                </div>
                <div className="productContent">
                  <h3 className="productTitle">{item.name}</h3>
                  <p className="productDescription">{item.description}</p>
                  <Link to={`/items/${item._id}`} className="shopLink">
                    View Details
                    <span className="iconWrapper">
                      <ArrowForwardIcon />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}

export default ItemList;