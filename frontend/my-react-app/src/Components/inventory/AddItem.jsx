import React, { useState } from 'react'
import './inventory.css' // Make sure this points to your CSS file

// Modal to add a new inventory item
const API_BASE = 'http://localhost:5000/api/inventory'

const AddItem = ({ onClose, onSaved, sellerEmail }) => {
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    SKU: '', 
    type: 'Fresh', 
    price: '', 
    quantity: '', 
    stockThreshold: '', 
    imageURL: '', 
    expiryDate: '',
    sellerEmail: sellerEmail || 'admin@ceyloncatch.com' // Add seller email to form with default
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  
  const onChange = (e) => {
    const { name, value } = e.target
    
    // Date validation for expiry date
    if (name === 'expiryDate' && value) {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      
      if (selectedDate < today) {
        setError('Expiry date cannot be in the past. Please select a future date.')
        return
      }
    }
    
    setForm((p) => ({ ...p, [name]: value }))
  }

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
    
    // Validate expiry date before submission
    if (form.expiryDate) {
      const selectedDate = new Date(form.expiryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        setError('Expiry date cannot be in the past. Please select a future date.')
        return
      }
    }
    
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
      console.log('Sending data:', dataToSend)
      
      const res = await fetch(API_BASE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(dataToSend) 
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Server error:', errorText)
        throw new Error(`Failed to add: ${errorText}`)
      }
      
      onSaved && onSaved()
      onClose && onClose()
    } catch (e) {
      console.error('Form submission error:', e)
      setError(e.message || 'Error adding item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlayAA" onClick={onClose}>
      <div className="modal-contentAA" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-headerAA">Add New Item</h3>
        {error && <div className="error-messageAA">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-gridAA">
            <input 
              className="form-inputAA" 
              placeholder="Name" 
              name="name" 
              value={form.name} 
              onChange={onChange} 
              required 
            />
            <input 
              className="form-inputAA" 
              placeholder="Description" 
              name="description" 
              value={form.description} 
              onChange={onChange} 
            />
            <input 
              className="form-inputAA" 
              placeholder="SKU" 
              name="SKU" 
              value={form.SKU} 
              onChange={onChange} 
              required 
            />
            <select className="form-selectAA" name="type" value={form.type} onChange={onChange}>
              <option>Fresh</option>
              <option>Frozen</option>
              <option>Imported</option>
            </select>
            <input 
              className="form-inputAA" 
              type="number" 
              placeholder="Price" 
              name="price" 
              value={form.price} 
              onChange={onChange} 
              required 
            />
            <input 
              className="form-inputAA" 
              type="number" 
              placeholder="Quantity" 
              name="quantity" 
              value={form.quantity} 
              onChange={onChange} 
              required 
            />
            <input 
              className="form-inputAA" 
              type="number" 
              placeholder="Stock Threshold" 
              name="stockThreshold" 
              value={form.stockThreshold} 
              onChange={onChange} 
              required 
            />
            {/* Image Upload Section */}
            <div className="image-upload-sectionAA">
              <label className="image-upload-labelAA">Product Image (Optional)</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview-containerAA">
                  <img src={imagePreview} alt="Preview" className="image-previewAA" />
                  <button type="button" className="remove-image-btnAA" onClick={removeImage}>
                    ✕
                  </button>
                </div>
              )}
              
              {/* File Upload */}
              <div className="file-upload-containerAA">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-inputAA"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="file-upload-labelAA">
                  {uploading ? 'Processing...' : '📁 Upload Image from Laptop'}
                </label>
              </div>
            </div>
            <input 
              className="form-inputAA" 
              type="date" 
              placeholder="Expiry Date" 
              name="expiryDate" 
              value={form.expiryDate} 
              onChange={onChange} 
              min={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <div className="form-actionsAA">
            <button type="button" className="cancel-btnAA" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btnAA" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddItem