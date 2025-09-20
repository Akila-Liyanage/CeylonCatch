import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import axios from 'axios'
import io from 'socket.io-client'
import './itemDetails.css'

const socket = io('http://localhost:5000')

const ItemDetails = () => {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [highestBid, setHighestBid] = useState(null)
  const [bidHistory, setBidHistory] = useState([])
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)
  const minIncrement = 1

  // Fetch all auction data
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [itemRes, highestRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/items/${id}`),
        axios.get(`http://localhost:5000/api/bids/${id}/highest`).catch(() => ({ data: null })),
        axios.get(`http://localhost:5000/api/bids/${id}/history`).catch(() => ({ data: [] }))
      ])
      
      setItem(itemRes.data)
      setHighestBid(highestRes?.data || null)
      setBidHistory(historyRes.data || [])
    } catch (err) {
      console.error('Error fetching auction data:', err)
      setError('Failed to load auction details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAll()

    // Socket event listener for real-time bid updates
    const handleBidUpdate = (data) => {
      if (data.itemId === id) {
        setItem(prev => ({ 
          ...prev, 
          currentPrice: data.currentPrice ?? data.bidAmount 
        }))
        
        setHighestBid({ 
          bidAmount: data.bidAmount, 
          userName: data.userName, 
          itemId: data.itemId 
        })
        
        setBidHistory(prev => ([
          { 
            itemId: data.itemId, 
            userName: data.userName, 
            bidAmount: data.bidAmount, 
            createdAt: new Date().toISOString() 
          }, 
          ...prev
        ]))
      }
    }

    socket.on('bidUpdate', handleBidUpdate)

    // Timer for countdown
    const timer = setInterval(() => setNow(Date.now()), 1000)

    return () => {
      socket.off('bidUpdate', handleBidUpdate)
      clearInterval(timer)
    }
  }, [id, fetchAll])

  // Calculate minimum allowed bid
  const minAllowed = useMemo(() => {
    if (!item) return 0
    return Number(item.currentPrice || item.startingPrice || 0) + minIncrement
  }, [item])

  // Calculate time left in seconds
  const timeLeftSeconds = useMemo(() => {
    if (!item) return 0
    return Math.max(0, Math.floor((new Date(item.endTime).getTime() - now) / 1000))
  }, [item, now])

  // Format time display
  const formatTimeLeft = useMemo(() => {
    if (timeLeftSeconds <= 0) return 'Auction Ended'
    
    const hours = Math.floor(timeLeftSeconds / 3600)
    const minutes = Math.floor((timeLeftSeconds % 3600) / 60)
    const seconds = timeLeftSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }, [timeLeftSeconds])

  // Handle bid submission
  const handleBid = async () => {
    if (!item || isSubmittingBid) return

    // Check authentication
    const auth = JSON.parse(localStorage.getItem('authUser') || 'null')
    if (!auth?.id || !auth?.name) {
      alert('Please login to place a bid')
      return
    }

    // Validate bid amount
    const numericBid = parseFloat(bidAmount)
    if (isNaN(numericBid) || numericBid <= 0) {
      alert('Please enter a valid bid amount')
      return
    }

    if (numericBid < minAllowed) {
      alert(`Bid must be at least Rs.${minAllowed}`)
      return
    }

    // Check auction status
    if (new Date(item.endTime).getTime() <= Date.now() || item.status !== 'open') {
      alert('This auction is no longer accepting bids')
      return
    }

    try {
      setIsSubmittingBid(true)
      
      await axios.post('http://localhost:5000/api/bids', {
        itemId: id,
        userId: auth.id,
        userName: auth.name,
        bidAmount: numericBid
      })
      
      setBidAmount('')
      
      // Show success message
      const bidSuccessMsg = `Bid of Rs.${numericBid} placed successfully!`
      alert(bidSuccessMsg)
      
    } catch (err) {
      console.error('Bid submission error:', err)
      const errorMsg = err?.response?.data?.message || 'Failed to place bid. Please try again.'
      alert(errorMsg)
    } finally {
      setIsSubmittingBid(false)
    }
  }

  // Handle bid input change
  const handleBidInputChange = (e) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBidAmount(value)
    }
  }

  // Handle Enter key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBid()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className='itemDetails'>
        <div className='loading-state'>
          <div className='loading-spinner'></div>
          <p>Loading auction details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className='itemDetails'>
        <div className='loading-state'>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchAll}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Item not found
  if (!item) {
    return (
      <div className='itemDetails'>
        <div className='loading-state'>
          <p>Auction not found</p>
        </div>
      </div>
    )
  }

  const isAuctionActive = item.status === 'open' && timeLeftSeconds > 0
  const isCriticalTime = timeLeftSeconds <= 30 && timeLeftSeconds > 0

  return (
    <div className={`itemDetails ${isCriticalTime ? 'auction-ending' : ''}`}>
      {/* Item Image */}
      <div className='item-image'>
        <img 
          src={item.image} 
          alt={item.name}
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg' // Fallback image
          }}
        />
      </div>

      {/* Item Details */}
      <h2>{item.name}</h2>
      <p>{item.description}</p>

      {/* Price Information */}
      <div className='price-info'>
        <div className='price-card'>
          <h3>Starting Price</h3>
          <p>Rs.{Number(item.startingPrice).toLocaleString()}</p>
        </div>
        <div className='price-card'>
          <h3>Current Price</h3>
          <p className='current-price'>
            Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <span className={`status ${item.status === 'open' ? 'status-open' : 'status-closed'}`}>
        {item.status === 'open' ? 'Open' : 'Closed'}
      </span>

      {/* Countdown Timer */}
      <div className={`countdown ${isCriticalTime ? 'countdown-critical' : ''}`}>
        <span>⏳ Time Left:</span>
        <strong>{formatTimeLeft}</strong>
      </div>

      {/* Highest Bidder */}
      {highestBid && (
        <div className='highest-bidder'>
          <span className='crown-emoji'>👑</span>
          <strong> Highest Bidder: </strong>
          {highestBid.userName} - Rs.{Number(highestBid.bidAmount).toLocaleString()}
        </div>
      )}

      {/* Bid Section */}
      {isAuctionActive ? (
        <div className='bid-box'>
          <h3>Place Your Bid</h3>
          <div className='bid-input-group'>
            <input
              type='text'
              placeholder={`Minimum Rs.${minAllowed.toLocaleString()}`}
              value={bidAmount}
              onChange={handleBidInputChange}
              onKeyPress={handleKeyPress}
              disabled={isSubmittingBid}
              autoComplete="off"
            />
            <button
              onClick={handleBid}
              disabled={isSubmittingBid || !bidAmount || timeLeftSeconds <= 0}
            >
              {isSubmittingBid ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </div>
      ) : (
        <div className='auction-closed'>
          {timeLeftSeconds <= 0 ? 'Auction has ended' : 'Auction is closed'}
        </div>
      )}

      {/* Bid History */}
      <div className='bid-history'>
        <h3>Bid History</h3>
        {bidHistory.length === 0 ? (
          <div className='no-bids'>
            <p>No bids placed yet. Be the first to bid!</p>
          </div>
        ) : (
          <ul>
            {bidHistory.map((bid, index) => (
              <li key={`${bid.itemId}-${bid.userName}-${bid.createdAt}-${index}`}>
                <div className='bid-info'>
                  <div className='bidder-name'>
                    {bid.userName}
                    {index === 0 && <span className='crown-emoji'> 👑</span>}
                  </div>
                  <div className='bid-time'>
                    {new Date(bid.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
                <div className='bid-amount'>
                  Rs.{Number(bid.bidAmount).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Bid Buttons (Optional Enhancement) */}
      {isAuctionActive && (
        <div className='quick-bid-section' style={{ marginTop: '20px' }}>
          <p style={{ marginBottom: '12px', color: '#64748b', fontSize: '14px' }}>
            Quick bid amounts:
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[minAllowed, minAllowed + 50, minAllowed + 100, minAllowed + 200].map((amount) => (
              <button
                key={amount}
                onClick={() => setBidAmount(amount.toString())}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e2e8f0'
                  e.target.style.borderColor = '#94a3b8'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f1f5f9'
                  e.target.style.borderColor = '#cbd5e1'
                }}
              >
                Rs.{amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auction Info Footer */}
      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <div>
            <strong>Auction ID:</strong> {id}
          </div>
          <div>
            <strong>Total Bids:</strong> {bidHistory.length}
          </div>
          {item.endTime && (
            <div>
              <strong>End Time:</strong> {new Date(item.endTime).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemDetails