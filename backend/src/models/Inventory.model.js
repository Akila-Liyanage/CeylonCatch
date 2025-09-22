import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    SKU: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Fresh', 'Frozen', 'Imported'], required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    stockThreshold: { type: Number, required: true, min: 0 },
    imageURL: { type: String },
    dateAdded: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    sellerEmail: { type: String, required: false, default: 'admin@ceyloncatch.com' } // Add seller email field
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual: days left until expiry
inventorySchema.virtual('daysLeft').get(function () {
    if (!this.expiryDate) return null;
    const diff = this.expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: quality status
inventorySchema.virtual('qualityStatus').get(function () {
    const days = this.daysLeft;
    if (days === null || isNaN(days)) return 'Good';
    if (days <= 0) return 'Expired';
    if (days <= 7) return 'Medium';
    return 'Good';
});

// Virtual: stock status
inventorySchema.virtual('stockStatus').get(function () {
    if (typeof this.quantity !== 'number' || typeof this.stockThreshold !== 'number') return 'Good';
    if (this.quantity <= 0) return 'Low';
    if (this.quantity <= Math.max(1, Math.floor(this.stockThreshold / 2))) return 'Low';
    if (this.quantity <= this.stockThreshold) return 'Medium';
    return 'Good';
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
