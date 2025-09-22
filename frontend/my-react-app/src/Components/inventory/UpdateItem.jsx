import React, { useState } from 'react'
import './inventory.css' // Make sure this points to your CSS file

// Modal to view/update an inventory item
const API_BASE = 'http://localhost:5000/api/inventory'

const UpdateItem = ({ data, onClose, onSaved }) => {
  const { item, mode } = data
  const [form, setForm] = useState({ ...item })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(item.imageURL || null)
  
  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  // Handle image upload from laptop
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF, etc.)')
      return
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Convert image to base64 string for database storage
      const base64String = await convertToBase64(file)
      
      // Update form with the base64 string
      setForm(prev => ({ ...prev, imageURL: base64String }))
      
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error('Image upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        // Set canvas dimensions
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Convert file to base64 string with compression
  const convertToBase64 = async (file) => {
    try {
      // Compress the image first
      const compressedBase64 = await compressImage(file, 600, 0.6)
      return compressedBase64
    } catch (error) {
      // Fallback to original method if compression fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    }
  }

  // Remove uploaded image
  const removeImage = () => {
    setForm(prev => ({ ...prev, imageURL: '' }))
    
    // Clean up the preview URL to prevent memory leaks
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    
    // Clear file input
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setSubmitting(true)
      
      // Prepare the data to send
      const dataToSend = { 
        ...form, 
        price: Number(form.price), 
        quantity: Number(form.quantity), 
        stockThreshold: Number(form.stockThreshold) 
      }
      
      // Log the data being sent (for debugging)
      console.log('Updating data:', dataToSend)
      
      const res = await fetch(`${API_BASE}/${item._id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(dataToSend) 
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Server error:', errorText)
        throw new Error(`Failed to update: ${errorText}`)
      }
      
      onSaved && onSaved()
      onClose && onClose()
    } catch (e) {
      console.error('Update error:', e)
      setError(e.message || 'Error updating item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-header">
          {mode === 'view' ? 'View Item Details' : 'Update Item'}
        </h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <input 
              className="form-input" 
              placeholder="Name" 
              name="name" 
              value={form.name || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            <input 
              className="form-input" 
              placeholder="Description" 
              name="description" 
              value={form.description || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            <input 
              className="form-input" 
              placeholder="SKU" 
              name="SKU" 
              value={form.SKU || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            <select 
              className="form-select" 
              name="type" 
              value={form.type || 'Fresh'} 
              onChange={onChange} 
              disabled={mode === 'view'}
            >
              <option>Fresh</option>
              <option>Frozen</option>
              <option>Imported</option>
            </select>
            <input 
              className="form-input" 
              type="number" 
              placeholder="Price" 
              name="price" 
              value={form.price || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            <input 
              className="form-input" 
              type="number" 
              placeholder="Quantity" 
              name="quantity" 
              value={form.quantity || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            <input 
              className="form-input" 
              type="number" 
              placeholder="Stock Threshold" 
              name="stockThreshold" 
              value={form.stockThreshold || ''} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
            {/* Image Upload Section */}
            <div className="image-upload-section">
              <label className="image-upload-label">Product Image</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  {mode !== 'view' && (
                    <button type="button" className="remove-image-btn" onClick={removeImage}>
                      ✕
                    </button>
                  )}
                </div>
              )}
              
              {/* File Upload - Only show in edit mode */}
              {mode !== 'view' && (
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    disabled={uploading}
                  />
                  <label htmlFor="image-upload" className="file-upload-label">
                    {uploading ? 'Processing...' : '📁 Upload New Image from Laptop'}
                  </label>
                </div>
              )}
            </div>
            <input 
              className="form-input" 
              type="date" 
              placeholder="Expiry Date" 
              name="expiryDate" 
              value={(form.expiryDate || '').slice(0,10)} 
              onChange={onChange} 
              disabled={mode === 'view'} 
            />
          </div>
          <div className="form-actions">
            <button type="button" className="close-btn" onClick={onClose}>
              Close
            </button>
            {mode !== 'view' && (
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Item'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateItem