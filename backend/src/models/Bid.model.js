import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    itemId: { 
        type: mongoose.Schema.Types.Mixed, 
        ref: 'Item', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.Mixed, 
        ref: 'User', 
        required: true 
    },
    userName: {
        type: String, 
        required: true
    },
    bidAmount: { 
        type: Number, 
        required: true 
    },
}, { timestamps: true });

// Indexes for efficient queries
bidSchema.index({ itemId: 1, createdAt: -1 });
bidSchema.index({ itemId: 1, bidAmount: -1 });
bidSchema.index({ userId: 1, createdAt: -1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;