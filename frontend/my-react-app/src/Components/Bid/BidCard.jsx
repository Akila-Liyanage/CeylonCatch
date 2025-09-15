import React from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import '../products/product.css';

const BidCard = ({
  category = 'Auction',
  image,
  title = 'Fresh Catch',
  desc = 'Bid on premium, freshly caught seafood from trusted sources.',
  link = '#'
}) => {
  return (
    <div className='productCard'>
      <div className="imageContainer">
        <img src={image} alt={title} />
        <div className="overlay">
          <button className="quickView">Bid Now</button>
        </div>
        <div className="categoryTag">{category}</div>
      </div>
      <div className="productContent">
        <h3 className="productTitle">{title}</h3>
        <p className="productDescription">{desc}</p>
        <a href={link} className="shopLink">
          Place Bid
          <span className="iconWrapper">
            <ArrowForwardIcon />
          </span>
        </a>
      </div>
    </div>
  );
}

export default BidCard;


