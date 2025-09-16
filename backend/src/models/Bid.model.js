import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    itemId: { type: String, ref: 'Item', required: true },//for development
    userId: { type: String, ref: 'User', required: true },//for development
    userName: {type: String, ref: 'User', required: true},
    bidAmount: { type: Number, required: true },
}, { timestamps: true });

// Indexes for efficient queries
bidSchema.index({ itemId: 1, createdAt: -1 });
bidSchema.index({ itemId: 1, bidAmount: -1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;