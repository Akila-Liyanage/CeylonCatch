import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import axios from 'axios'
import io from 'socket.io-client'
import { Clock, DollarSign, TrendingUp, Eye, Package, Users, Calendar, Crown } from 'lucide-react'
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const minIncrement = 1

  // Fetch all auction data
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('ItemDetails - Fetching data for item:', id)
      
      const [itemRes, highestRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/items/${id}`),
        axios.get(`http://localhost:5000/api/bids/${id}/highest`).catch(() => ({ data: null })),
        axios.get(`http://localhost:5000/api/bids/${id}/history`).catch(() => ({ data: [] }))
      ])
      
      console.log('ItemDetails - Item data:', itemRes.data)
      console.log('ItemDetails - Highest bid:', highestRes?.data)
      console.log('ItemDetails - Bid history:', historyRes.data)
      
      setItem(itemRes.data)
      setHighestBid(highestRes?.data || null)
      setBidHistory(historyRes.data || [])
    } catch (err) {
      console.error('ItemDetails - Error fetching auction data:', err)
      setError('Failed to load auction details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Check user authentication
  const checkUserAuth = useCallback(async () => {
    try {
      const buyerToken = localStorage.getItem('buyerToken')
      const sellerToken = localStorage.getItem('sellerToken')
      const buyerEmail = localStorage.getItem('buyerEmail')
      const sellerEmail = localStorage.getItem('sellerEmail')

      console.log('ItemDetails - Auth check:', { 
        buyerToken: !!buyerToken, 
        sellerToken: !!sellerToken, 
        buyerEmail, 
        sellerEmail 
      })

      if (!buyerToken && !sellerToken) {
        setUserInfo(null)
        return
      }

      const isBuyer = !!buyerToken
      const userEmail = isBuyer ? buyerEmail : sellerEmail
      let userId = userEmail
      let userName = userEmail.split('@')[0]

      try {
        const endpoint = isBuyer 
          ? `http://localhost:5000/api/user/buyer-by-email/${userEmail}`
          : `http://localhost:5000/api/user/seller-by-email/${userEmail}`
        
        console.log('ItemDetails - Fetching user details from:', endpoint)
        const userResponse = await axios.get(endpoint)
        console.log('ItemDetails - User response:', userResponse.data)
        
        if (userResponse.data._id) {
          userId = userResponse.data._id
        }
        if (userResponse.data.name) {
          userName = userResponse.data.name
        }
      } catch (userError) {
        console.warn('ItemDetails - Could not fetch user details, using email:', userError.message)
      }

      setUserInfo({ userId, userName, userEmail, userType: isBuyer ? 'buyer' : 'seller' })
    } catch (error) {
      console.error('ItemDetails - Error checking auth:', error)
      setUserInfo(null)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    checkUserAuth()

    // Socket event listener for real-time bid updates
    const handleBidUpdate = (data) => {
      console.log('ItemDetails - Received bid update:', data)
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
  }, [id, fetchAll, checkUserAuth])

  // Calculate minimum allowed bid
  const minAllowed = useMemo(() => {
    if (!item) return 0
    const current = item.currentPrice || item.startingPrice
    return current + minIncrement
  }, [item, minIncrement])

  // Calculate time left
  const timeLeftSeconds = useMemo(() => {
    if (!item?.endTime) return 0
    return Math.max(0, Math.floor((new Date(item.endTime).getTime() - now) / 1000))
  }, [item?.endTime, now])

  const isAuctionActive = timeLeftSeconds > 0 && item?.status === 'open'

  // Format time left
  const formatTimeLeft = useMemo(() => {
    if (timeLeftSeconds <= 0) return 'Auction Ended'
    
    const days = Math.floor(timeLeftSeconds / 86400)
    const hours = Math.floor((timeLeftSeconds % 86400) / 3600)
    const minutes = Math.floor((timeLeftSeconds % 3600) / 60)
    const seconds = timeLeftSeconds % 60
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }, [timeLeftSeconds])

  const isCriticalTime = timeLeftSeconds < 300 // Less than 5 minutes

  // Handle bid submission
  const handleBid = async () => {
    if (!item || isSubmittingBid) return

    console.log('ItemDetails - Attempting to place bid')

    // Check authentication
    if (!userInfo) {
      console.log('ItemDetails - User not authenticated, showing login prompt')
      setShowLoginPrompt(true)
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
    if (!isAuctionActive) {
      alert('This auction is no longer accepting bids')
      return
    }

    try {
      setIsSubmittingBid(true)
      
      console.log('ItemDetails - Submitting bid:', {
        itemId: id,
        userId: userInfo.userId,
        userName: userInfo.userName,
        bidAmount: numericBid
      })
      
      await axios.post('http://localhost:5000/api/bids', {
        itemId: id,
        userId: userInfo.userId,
        userName: userInfo.userName,
        bidAmount: numericBid
      })
      
      console.log('ItemDetails - Bid submitted successfully')
      setBidAmount('')
      
      // Refresh data
      await fetchAll()
      
    } catch (error) {
      console.error('ItemDetails - Error submitting bid:', error)
      alert('Error placing bid: ' + (error.response?.data?.message || error.message))
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
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading auction details...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <h3 style={styles.errorTitle}>Error</h3>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    )
  }

  // No item found
  if (!item) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <h3 style={styles.errorTitle}>Item Not Found</h3>
          <p style={styles.errorText}>The requested item could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div style={styles.modalOverlay} onClick={() => setShowLoginPrompt(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>🔐</div>
            <h3 style={styles.modalTitle}>Login Required</h3>
            <p style={styles.modalText}>Please login to place a bid</p>
            <div style={styles.modalButtons}>
              <button 
                style={{...styles.modalButton, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}}
                onClick={() => window.location.href = '/buyerlogin'}
              >
                Login as Buyer
              </button>
              <button 
                style={{...styles.modalButton, background: 'linear-gradient(135deg, #10b981, #059669)'}}
                onClick={() => window.location.href = '/sellerlogin'}
              >
                Login as Seller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Package size={32} style={styles.headerIcon} />
          <div>
            <h1 style={styles.title}>Auction Details</h1>
            <p style={styles.subtitle}>Live auction information and bidding</p>
          </div>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statsCard}>
            <span style={styles.statsNumber}>{bidHistory.length}</span>
            <span style={styles.statsLabel}>TOTAL BIDS</span>
          </div>
          <div style={styles.statsCard}>
            <span style={styles.statsNumber}>
              {isAuctionActive ? 'LIVE' : 'ENDED'}
            </span>
            <span style={styles.statsLabel}>STATUS</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Item Image and Basic Info */}
        <div style={styles.itemSection}>
          <div style={styles.imageContainer}>
            <img 
              src={item.images && item.images.length > 0 ? `http://localhost:5000/uploads/${item.images[0]}` : '/images/default-item.jpg'} 
          alt={item.name}
              style={styles.itemImage}
        />
            <div style={styles.imageOverlay}>
              <span style={styles.itemType}>FRESH</span>
            </div>
      </div>

          <div style={styles.itemInfo}>
            <h2 style={styles.itemName}>{item.name}</h2>
            <p style={styles.itemDescription}>{item.description}</p>
            
            {/* Price Cards */}
            <div style={styles.priceCards}>
              <div style={styles.priceCard}>
                <div style={styles.priceLabel}>Starting Price</div>
                <div style={styles.priceValue}>
                  Rs.{Number(item.startingPrice).toLocaleString()}
                </div>
        </div>
              <div style={styles.priceCard}>
                <div style={styles.priceLabel}>Current Price</div>
                <div style={{...styles.priceValue, color: '#00c2c9'}}>
            Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                </div>
        </div>
              <div style={styles.priceCard}>
                <div style={styles.priceLabel}>Quantity</div>
                <div style={styles.priceValue}>
                  {item.qty || item.quantity || 1} {item.unit || 'kg'}
                </div>
        </div>
      </div>

            {/* Status and Timer */}
            <div style={styles.statusSection}>
              <div style={{
                ...styles.statusBadge,
                background: isAuctionActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderColor: isAuctionActive ? '#10b981' : '#ef4444',
                color: isAuctionActive ? '#10b981' : '#ef4444'
              }}>
                <div style={{
                  ...styles.statusDot,
                  backgroundColor: isAuctionActive ? '#10b981' : '#ef4444'
                }}></div>
                {isAuctionActive ? 'LIVE' : 'ENDED'}
              </div>
              
              <div style={{
                ...styles.timerBadge,
                background: isCriticalTime ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                borderColor: isCriticalTime ? '#ef4444' : '#f59e0b',
                color: isCriticalTime ? '#ef4444' : '#f59e0b'
              }}>
                <Clock size={16} />
                {formatTimeLeft}
              </div>
      </div>

      {/* Highest Bidder */}
      {highestBid && (
              <div style={styles.highestBidder}>
                <Crown size={20} style={styles.crownIcon} />
                <div>
                  <div style={styles.highestBidderLabel}>Highest Bidder</div>
                  <div style={styles.highestBidderName}>
          {highestBid.userName} - Rs.{Number(highestBid.bidAmount).toLocaleString()}
                  </div>
                </div>
        </div>
      )}
          </div>
        </div>

      {/* Bid Section */}
        <div style={styles.bidSection}>
          <h3 style={styles.bidSectionTitle}>Place Your Bid</h3>
          
      {isAuctionActive ? (
            userInfo ? (
              // Check if user is seller and this is their own item
              userInfo.userType === 'seller' && userInfo.userId === item.sellerId ? (
                <div style={styles.sellerRestriction}>
                  <h4 style={styles.sellerRestrictionTitle}>🚫 Cannot Bid on Your Own Item</h4>
                  <p style={styles.sellerRestrictionText}>
                    As a seller, you cannot bid on your own fish lot. Switch to a buyer account to participate in auctions.
                  </p>
                  <button 
                    style={styles.switchAccountButton}
                    onClick={() => window.location.href = '/buyerlogin'}
                  >
                    Switch to Buyer Account
                  </button>
                </div>
              ) : (
                <div style={styles.bidForm}>
                  <div style={styles.bidInputContainer}>
                    <DollarSign size={20} style={styles.inputIcon} />
              <input
                type='text'
                placeholder={`Minimum bid: Rs.${minAllowed.toLocaleString()}`}
                value={bidAmount}
                onChange={handleBidInputChange}
                onKeyPress={handleKeyPress}
                disabled={isSubmittingBid}
                style={styles.bidInput}
                autoComplete="off"
              />
                  </div>
                  {bidAmount && parseFloat(bidAmount) < minAllowed && (
                    <div style={styles.bidValidationMessage}>
                      Bid must be at least Rs.{minAllowed.toLocaleString()}
                    </div>
                  )}
              <button
                onClick={handleBid}
                disabled={isSubmittingBid || !bidAmount || timeLeftSeconds <= 0 || parseFloat(bidAmount) < minAllowed}
                    style={styles.bidButton}
              >
                {isSubmittingBid ? 'Placing Bid...' : 
                 timeLeftSeconds <= 0 ? 'Auction Ended' :
                 !bidAmount ? 'Enter Bid Amount' :
                 parseFloat(bidAmount) < minAllowed ? `Minimum Rs.${minAllowed.toLocaleString()}` :
                 'Place Bid'}
              </button>
            </div>
              )
            ) : (
              <button 
                style={styles.loginButton}
                onClick={() => setShowLoginPrompt(true)}
              >
                Login to Place Bid
              </button>
            )
          ) : (
            <div style={styles.auctionEnded}>
              <h4 style={styles.auctionEndedTitle}>🚫 Auction Ended</h4>
              <p style={styles.auctionEndedText}>This auction is no longer accepting bids</p>
        </div>
      )}
        </div>

      {/* Bid History */}
        <div style={styles.historySection}>
          <h3 style={styles.historyTitle}>
            <TrendingUp size={20} style={{ marginRight: '8px' }} />
            Bid History
          </h3>
          
        {bidHistory.length === 0 ? (
            <div style={styles.noBids}>
              <Users size={48} style={styles.noBidsIcon} />
              <p style={styles.noBidsText}>No bids placed yet. Be the first to bid!</p>
          </div>
        ) : (
            <div style={styles.bidHistoryList}>
            {bidHistory.map((bid, index) => (
                <div key={`${bid.itemId}-${bid.userName}-${bid.createdAt}-${index}`} style={styles.bidItem}>
                  <div style={styles.bidItemInfo}>
                    <div style={styles.bidderInfo}>
                      <div style={styles.bidderName}>
                    {bid.userName}
                        {index === 0 && <Crown size={16} style={styles.crownIcon} />}
                  </div>
                      <div style={styles.bidTime}>
                        <Calendar size={14} />
                    {new Date(bid.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                          minute: '2-digit'
                    })}
                  </div>
                </div>
                    <div style={styles.bidAmount}>
                  Rs.{Number(bid.bidAmount).toLocaleString()}
                </div>
          </div>
        </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  loader: {
    width: '50px',
    height: '50px',
    border: '4px solid #374151',
    borderTop: '4px solid #00c2c9',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '18px',
    color: '#9ca3af',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '20px',
  },
  errorCard: {
    background: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '400px',
  },
  errorTitle: {
    fontSize: '24px',
    color: '#ef4444',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },
  errorText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '30px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  headerIcon: {
    color: '#00c2c9',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '5px 0 0 0',
  },
  headerStats: {
    display: 'flex',
    gap: '16px',
  },
  statsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(0, 194, 201, 0.1)',
    borderRadius: '12px',
    color: 'white',
    minWidth: '100px',
    border: '1px solid rgba(0, 194, 201, 0.2)',
  },
  statsNumber: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#00c2c9',
  },
  statsLabel: {
    fontSize: '12px',
    opacity: 0.9,
    marginTop: '5px',
    fontWeight: '600',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  itemSection: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  imageOverlay: {
    position: 'absolute',
    top: '16px',
    right: '16px',
  },
  itemType: {
    background: 'rgba(0, 194, 201, 0.3)',
    color: '#00c2c9',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid rgba(0, 194, 201, 0.5)',
  },
  itemInfo: {
    color: '#ffffff',
  },
  itemName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 12px 0',
  },
  itemDescription: {
    fontSize: '16px',
    color: '#9ca3af',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },
  priceCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  priceCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  priceLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '8px',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
  },
  statusSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  timerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid',
  },
  highestBidder: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  crownIcon: {
    color: '#f59e0b',
  },
  highestBidderLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  highestBidderName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  bidSection: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    height: 'fit-content',
  },
  bidSectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 24px 0',
  },
  bidForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bidInputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  bidInput: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  bidValidationMessage: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '8px',
    textAlign: 'center',
    fontWeight: '500',
  },
  bidButton: {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #00c2c9, #156eae)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loginButton: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  auctionEnded: {
    textAlign: 'center',
    padding: '24px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  auctionEndedTitle: {
    fontSize: '18px',
    color: '#ef4444',
    margin: '0 0 8px 0',
    fontWeight: '600',
  },
  auctionEndedText: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
  historySection: {
    gridColumn: '1 / -1',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '20px',
  },
  historyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
  },
  noBids: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
  noBidsIcon: {
    marginBottom: '16px',
    opacity: 0.5,
  },
  noBidsText: {
    fontSize: '16px',
    margin: 0,
  },
  bidHistoryList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  bidItem: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  bidItemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bidderName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bidTime: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  bidAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#00c2c9',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modal: {
    background: 'rgba(15, 23, 42, 0.95)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '24px',
    color: '#ef4444',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },
  modalText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '0 0 25px 0',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  modalButton: {
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '140px',
  },
  sellerRestriction: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '16px',
    padding: '30px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  },
  sellerRestrictionTitle: {
    fontSize: '20px',
    color: '#ef4444',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },
  sellerRestrictionText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: '0 0 25px 0',
    lineHeight: '1.5',
  },
  switchAccountButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default ItemDetails