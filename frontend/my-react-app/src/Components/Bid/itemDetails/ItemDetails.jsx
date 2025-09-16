import React, { useEffect, useMemo, useState } from 'react'
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
  const minIncrement = 1

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [itemRes, highestRes, historyRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/items/${id}`),
          axios.get(`http://localhost:5000/api/bids/${id}/highest`).catch(() => ({ data: null })),
          axios.get(`http://localhost:5000/api/bids/${id}/history`)
        ])
        setItem(itemRes.data)
        setHighestBid(highestRes?.data || null)
        setBidHistory(historyRes.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchAll()

    socket.on('bidUpdate', (data) => {
      if (data.itemId === id) {
        setItem(prev => ({ ...prev, currentPrice: data.currentPrice ?? data.bidAmount }))
        setHighestBid({ bidAmount: data.bidAmount, userName: data.userName, itemId: data.itemId })
        setBidHistory(prev => ([{ itemId: data.itemId, userName: data.userName, bidAmount: data.bidAmount, createdAt: new Date().toISOString() }, ...prev]))
      }
    })

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { socket.off('bidUpdate'); clearInterval(timer) }
  }, [id])

  const minAllowed = useMemo(() => (item ? Number(item.currentPrice || 0) + minIncrement : 0), [item])
  const timeLeftSeconds = useMemo(() => item ? Math.max(0, Math.floor((new Date(item.endTime).getTime() - now) / 1000)) : 0, [item, now])

  const handleBid = async () => {
    if (!item) return
    const auth = JSON.parse(localStorage.getItem('authUser') || 'null')
    if (!auth?.id || !auth?.name) return alert('Please login to place a bid')
    const numericBid = parseFloat(bidAmount)
    if (isNaN(numericBid)) return alert('Enter a valid bid amount')
    if (numericBid < minAllowed) return alert(`Bid must be at least ${minAllowed}`)
    if (new Date(item.endTime).getTime() <= Date.now() || item.status !== 'open') return alert('Auction is closed')
    try {
      await axios.post('http://localhost:5000/api/bids', { itemId: id, userId: auth.id, userName: auth.name, bidAmount: numericBid })
      setBidAmount('')
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to place bid')
    }
  }

  if (!item) return <div className='itemDetails'><p>Loading...</p></div>

  return (
    <div className={`itemDetails ${timeLeftSeconds <= 30 ? 'auction-ending' : ''}`}>
      <div className='item-image'>
        <img src={item.image} alt={item.name} />
      </div>
      <h2>{item.name}</h2>
      <p>{item.description}</p>

      <div className='price-info'>
        <div className='price-card'>
          <h3>Starting Price</h3>
          <p>Rs.{item.startingPrice}</p>
        </div>
        <div className='price-card'>
          <h3>Current Price</h3>
          <p className='current-price'>Rs.{item.currentPrice}</p>
        </div>
      </div>

      <span className={`status ${item.status === 'open' ? 'status-open' : 'status-closed'}`}>{item.status === 'open' ? 'Open' : 'Closed'}</span>

      <div className='countdown'>
        <span>⏳ Time Left:</span>
        <strong style={{ marginLeft: 8 }}>{timeLeftSeconds}s</strong>
      </div>

      {highestBid && (
        <p><b>Highest Bidder:</b> 👑 {highestBid.userName} - Rs.{highestBid.bidAmount}</p>
      )}

      {item.status === 'open' ? (
        <div className='bid-box'>
          <h3>Place Your Bid</h3>
          <div className='bid-input-group'>
            <input type='number' placeholder={`Minimum Rs.${minAllowed}`} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
            <button onClick={handleBid} disabled={timeLeftSeconds <= 0}>Place Bid</button>
          </div>
        </div>
      ) : (
        <p>Auction Closed</p>
      )}

      <div className='bid-history' style={{ marginTop: 24, textAlign: 'left' }}>
        <h3>Bid History</h3>
        {bidHistory.length === 0 ? <p>No bids yet</p> : (
          <ul>
            {bidHistory.map((b, idx) => (
              <li key={idx}>{new Date(b.createdAt).toLocaleTimeString()} - {b.userName}: Rs.{b.bidAmount}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ItemDetails


