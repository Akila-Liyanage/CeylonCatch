import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import axios from 'axios'
import {io} from 'socket.io-client'
import { Clock, DollarSign, TrendingUp, Eye, Package, Users, Calendar, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import '../bid.css';

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

  // VALIDATION: Handle bid submission with comprehensive validation
  const handleBid = async () => {
    // VALIDATION: Prevent multiple simultaneous submissions
    if (!item || isSubmittingBid) return

    console.log('ItemDetails - Attempting to place bid')

    // VALIDATION: Check user authentication before allowing bid
    if (!userInfo) {
      console.log('ItemDetails - User not authenticated, showing login prompt')
      setShowLoginPrompt(true)
      return
    }

    // VALIDATION: Parse and validate bid amount
    const numericBid = parseFloat(bidAmount);
    
    // VALIDATION: Check if bid amount is a valid number and positive
    if (isNaN(numericBid) || numericBid <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    // VALIDATION: Check if bid meets minimum increment requirement
    if (numericBid < minAllowed) {
      alert(`Bid must be at least Rs.${minAllowed.toLocaleString()}`);
      return;
    }

    // VALIDATION: Check if bid amount is within reasonable limits (max 1 billion)
    if (numericBid > 1000000000) {
      alert('Bid amount is too high. Maximum allowed is Rs.1,000,000,000');
      return;
    }

    // VALIDATION: Check auction status and timing
    if (!isAuctionActive) {
      alert('This auction is no longer accepting bids');
      return;
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

  // VALIDATION: Handle bid input change with strict numeric validation
  // Prevents non-numeric characters and ensures proper decimal format
  const handleBidInputChange = (e) => {
    const value = e.target.value;
    
    // VALIDATION: Allow only numbers and decimal point
    // Regex pattern: ^\d*\.?\d*$ ensures:
    // - ^\d*: Start with zero or more digits
    // - \.?: Optional decimal point
    // - \d*: Zero or more digits after decimal
    // - $: End of string
    // This prevents: negative numbers, multiple decimal points, letters, symbols
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // VALIDATION: Additional check for reasonable bid amount (max 10 digits)
      if (value.length <= 10) {
        setBidAmount(value);
      }
    }
  }

  // Handle Enter key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBid()
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #581c87 0%, #be185d 50%, #312e81 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div
          style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTop: '4px solid #fbbf24',
            borderRadius: '50%',
            position: 'relative',
            zIndex: 10
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #fbbf24 0%, #ec4899 50%, #9333ea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            position: 'relative',
            zIndex: 10
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading auction details...
        </motion.p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #581c87 0%, #be185d 50%, #312e81 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.5rem',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '32rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            zIndex: 10
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #f87171 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem'
          }}>Error</h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.625',
            fontSize: '1.125rem'
          }}>{error}</p>
        </motion.div>
      </div>
    )
  }

  // No item found
  if (!item) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #581c87 0%, #be185d 50%, #312e81 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.5rem',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '32rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            zIndex: 10
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #f87171 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem'
          }}>Item Not Found</h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.625',
            fontSize: '1.125rem'
          }}>The requested item could not be found.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="animated-bg"
      style={{ padding: '2rem' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '1rem',
                padding: '2.5rem',
                textAlign: 'center',
                maxWidth: '28rem',
                width: '90%',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#f87171',
                marginBottom: '1rem',
                fontWeight: '600'
              }}>Login Required</h3>
              <p style={{
                color: '#94a3b8',
                marginBottom: '1.5rem',
                lineHeight: '1.625'
              }}>Please login to place a bid</p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <motion.button
                  style={{
                    background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '140px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/buyerlogin'}
                >
                  Login as Buyer
                </motion.button>
                <motion.button
                  style={{
                    background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '140px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/sellerlogin'}
                >
                  Login as Seller
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        variants={itemVariants}
        style={{ 
          padding: '2rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 25px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.75rem', 
              background: 'var(--accent-gradient)', 
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <Package size={32} style={{ color: 'white' }} />
            </div>
          <div>
              <h1 className="header-title">Auction Details</h1>
              <p className="header-subtitle">Live auction information and bidding</p>
          </div>
        </div>
          <div className="stats-grid">
          <motion.div
              className="stat-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
              <span className="stat-number">{bidHistory.length}</span>
              <span className="stat-label">TOTAL BIDS</span>
          </motion.div>
          <motion.div
              className="stat-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
              <span className="stat-number">
              {isAuctionActive ? 'LIVE' : 'ENDED'}
            </span>
              <span className="stat-label">STATUS</span>
          </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="enhanced-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', position: 'relative', zIndex: 10 }}>
        {/* Item Image and Basic Info */}
        <motion.div
          className="glass-container"
          variants={itemVariants}
        >
          <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <motion.img
              src={item.images && item.images.length > 0 ? `http://localhost:5000/uploads/${item.images[0]}` : '/images/default-item.jpg'}
              alt={item.name}
              style={{ width: '100%', height: '20rem', objectFit: 'cover', borderRadius: '0.75rem' }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <span className="card-badge" style={{ color: 'var(--text-accent)' }}>
                FRESH
              </span>
            </div>
          </div>

          <div style={{ color: 'white' }}>
            <h2 className="card-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.name}</h2>
            <p className="card-description" style={{ marginBottom: '2rem' }}>{item.description}</p>
            
            {/* Price Cards */}
            <div className="card-price-section">
              <div className="price-row">
                <span className="price-label starting">Starting Price</span>
                <span className="price-value">
                  Rs.{Number(item.startingPrice).toLocaleString()}
                </span>
                </div>
              <div className="price-row">
                <span className="price-label current">Current Price</span>
                <span className="price-current">
                  Rs.{Number(item.currentPrice || item.startingPrice).toLocaleString()}
                </span>
                </div>
              <div className="price-row">
                <span className="price-label">Quantity</span>
                <span className="price-value">
                  {item.qty || item.quantity || 1} {item.unit || 'kg'}
                </span>
                </div>
            </div>

            {/* Status and Timer */}
            <div className="card-timer">
              <Clock size={18} className="timer-icon" />
              <span className="timer-label">Ends in:</span>
              <span className={`timer-value ${isCriticalTime ? 'critical' : ''}`}>
                {formatTimeLeft}
              </span>
            </div>

            {/* Highest Bidder */}
            {highestBid && (
              <div
                className="glass-container"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1.5rem',
                  marginTop: '2rem',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                <div style={{ 
                  padding: '0.5rem', 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Crown size={24} style={{ color: 'white' }} />
                  </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500' 
                  }}>
                    Highest Bidder
                </div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 'bold', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {highestBid.userName} - 
                    <span style={{ 
                      background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Rs.{Number(highestBid.bidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bid Section */}
        <motion.div
          className="glass-container"
          variants={itemVariants}
          style={{ height: 'fit-content' }}
        >
          <h3 className="card-title" style={{ marginBottom: '2rem' }}>Place Your Bid</h3>
          
          {isAuctionActive ? (
            userInfo ? (
              // Check if user is seller and this is their own item
              userInfo.userType === 'seller' && userInfo.userId === item.sellerId ? (
                <motion.div
                  className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="text-xl text-red-400 mb-4 font-semibold">🚫 Cannot Bid on Your Own Item</h4>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    As a seller, you cannot bid on your own fish lot. Switch to a buyer account to participate in auctions.
                  </p>
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/buyerlogin'}
                  >
                    Switch to Buyer Account
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={20} style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#ec4899' 
                    }} />
                    <input
                      type='text'
                      placeholder={`Minimum bid: Rs.${minAllowed.toLocaleString()}`}
                      value={bidAmount}
                      onChange={handleBidInputChange}
                      onKeyPress={handleKeyPress}
                      disabled={isSubmittingBid}
                      style={{ 
                        width: '100%', 
                        paddingLeft: '3rem', 
                        paddingRight: '1rem', 
                        paddingTop: '1.25rem', 
                        paddingBottom: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '1rem',
                        color: 'white',
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      className='search-input'
                      autoComplete="off"
                    />
                  </div>
                  {bidAmount && parseFloat(bidAmount) < minAllowed && (
                    <motion.div
                      className="text-sm text-red-400 mt-2 text-center font-medium bg-red-500/10 p-3 rounded-xl border border-red-400/30"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      Bid must be at least Rs.{minAllowed.toLocaleString()}
                    </motion.div>
                  )}
                  <motion.button
                    onClick={handleBid}
                    disabled={isSubmittingBid || !bidAmount || timeLeftSeconds <= 0 || parseFloat(bidAmount) < minAllowed}
                    className='enhanced-button'
                    style={{ 
                      padding: '1.25rem 2rem',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #fbbf24 0%, #ec4899 50%, #9333ea 100%)',
                      border: 'none',
                      borderRadius: '1rem',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      width: '100%'
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmittingBid ? 'Placing Bid...' : 
                     timeLeftSeconds <= 0 ? 'Auction Ended' :
                     !bidAmount ? 'Enter Bid Amount' :
                     parseFloat(bidAmount) < minAllowed ? `Minimum Rs.${minAllowed.toLocaleString()}` :
                     'Place Bid'}
                  </motion.button>
                </motion.div>
              )
            ) : (
              <motion.button
                className="w-full py-5 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none rounded-2xl text-lg font-bold cursor-pointer transition-all shadow-2xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginPrompt(true)}
              >
                Login to Place Bid
              </motion.button>
            )
          ) : (
            <motion.div
              className="text-center p-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl border border-red-400/30 shadow-lg backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h4 className="text-xl font-bold text-red-400 mb-3">🚫 Auction Ended</h4>
              <p className="text-white/80">This auction is no longer accepting bids</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bid History */}
      <motion.div
        className="glass-container"
        variants={itemVariants}
        style={{ marginTop: '2rem', position: 'relative', zIndex: 10 }}
      >
        <h3 className="card-title" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
          <TrendingUp size={24} style={{ marginRight: '0.75rem' }} />
          Bid History
        </h3>
        
        {bidHistory.length === 0 ? (
          <div className='empty-container'>
            <div
              style={{ 
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                borderRadius: '50%',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-xl)',
                margin: '0 auto 1.5rem auto',
                width: 'fit-content'
              }}
            >
              <Users size={48} style={{ color: 'white' }} />
            </div>
            <p style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>No bids placed yet. Be the first to bid!</p>
          </div>
        ) : (
          <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
            {bidHistory.map((bid, index) => (
              <div
                key={`${bid.itemId}-${bid.userName}-${bid.createdAt}-${index}`}
                className='enhanced-card'
                style={{ 
                  marginBottom: '1rem',
                  borderLeft: index === 0 ? '4px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: index === 0 ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)' : 'rgba(255, 255, 255, 0.1)',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 'bold', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {bid.userName}
                        {index === 0 && (
                          <Crown size={20} style={{ color: '#fbbf24' }} />
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem' 
                    }}>
                      <Calendar size={16} />
                      {new Date(bid.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginLeft: '1rem'
                  }}>
                    Rs.{Number(bid.bidAmount).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ItemDetails