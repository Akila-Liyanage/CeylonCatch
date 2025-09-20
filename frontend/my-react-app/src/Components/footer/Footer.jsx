// Footer.jsx
import React from 'react';
import './footer.css';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      className="home-footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="footer-content">
        <div className="footer-section">
          <h3>Ceylon Catch</h3>
          <p>Fresh seafood delivered directly from the ocean to your table</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Products</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Info</h4>
          <p>123 Ocean Avenue, Colombo</p>
          <p>+94 11 234 5678</p>
          <p>info@ceyloncatch.com</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Ceylon Catch. All rights reserved.</p>
      </div>
    </motion.footer>
  );
};

export default Footer;