import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router'
import './itemList.css'

const ItemsList = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('http://localhost:5000/api/items')
      .then(res => setItems(res.data))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load items'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className='itemList'>
        <div className="loading">
          <i className="fas fa-spinner"></i>
          <p>Loading fresh catches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className='itemList'><p style={{ color: '#b91c1c' }}>{error}</p></div>
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

      <div className='grid'>
        {items.length === 0 ? (
          <div className="no-items">
            <div className="fish-icon">🐟</div>
            <p>No fresh catches available</p>
            <p>Check back later for new arrivals!</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className='card'>
              <div className='image-container'>
                <img src={item.image} alt={item.name} />
                <div className='image-overlay' />
                <div className='water-effect' />
                <div className='card-tags'>
                  <span className='card-tag'>{item.status}</span>
                </div>
              </div>
              <div className='card-content'>
                <div className='card-header'>
                  <h3><i className="fas fa-fish" /> {item.name}</h3>
                  <div className={`status-badge ${item.status === 'open' ? 'status-open' : 'status-closed'}`}>
                    {item.status}
                  </div>
                </div>
                <p className='description'>{item.description}</p>
                <div className='bid-info'>
                  <div className='info-row'>
                    <span className='info-label'><i className="fas fa-play" /> Starting</span>
                    <span className='info-value'>Rs.{item.startingPrice}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-label'><i className="fas fa-arrow-up" /> Current</span>
                    <span className='info-value current-bid'>Rs.{item.currentPrice}</span>
                  </div>
                </div>
                <div className='countdown'>
                  <div className='countdown-label'><i className="far fa-clock" /> Ends</div>
                  <div className='timer'>{new Date(item.endTime).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Link to={`/items/${item._id}`} className='bid-button'><i className="fas fa-gavel" /> Bid Now</Link>
                </div>
              </div>
              <div className='card-footer'>
                <div className='bubbles'>
                  <span className='bubble' />
                  <span className='bubble' />
                  <span className='bubble' />
                  <span className='bubble' />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ItemsList


