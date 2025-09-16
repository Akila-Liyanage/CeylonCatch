import React from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import './product.css';
import { Link } from 'react-router';

const Product = ({
    category = 'Seafood',
    image = Fish,
    title = 'Fresh Fish',
    desc = 'Premium quality fresh fish delivered daily from sustainable sources.',
    shopLink = '#'
}) => {
  return (
    <div className='productCard'>
      <div className="imageContainer">
        <img src={image} alt="Fresh Fish" />
        <div className="overlay">
          <button className="quickView">Quick View</button>
        </div>
        <div className="categoryTag">{category}</div>
      </div>
      <div className="productContent">
        <h3 className="productTitle">{title}</h3>
        <p className="productDescription">{desc}</p>
        <Link to={shopLink} className="shopLink">
          View Details
          <span className="iconWrapper">
            <ArrowForwardIcon />
          </span>
        </Link>
      </div>
    </div>
  );
}

export default Product;