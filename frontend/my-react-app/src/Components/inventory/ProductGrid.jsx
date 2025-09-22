import React, { useEffect, useState } from 'react'

// Read-only product grid for customers (no admin actions)
const API_BASE = 'http://localhost:5000/api/inventory'

const ProductGrid = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(API_BASE)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message || 'Error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>
  if (error) return <div style={{ padding: 16, color: 'crimson' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((it) => (
          <div key={it._id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
            {it.imageURL ? (
              <img src={it.imageURL} alt="img" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 140, background: '#f3f4f6', borderRadius: 8 }} />
            )}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{it.description}</div>
              <div style={{ marginTop: 6 }}>Price: ${Number(it.price).toFixed(2)}</div>
              <div>Qty: {it.quantity}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button>Buy</button>
                <button>Bid</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductGrid


