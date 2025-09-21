import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    images: [{
        type: String, // Array of image filenames for multiple images
        required: true
    }],
    description: { type: String, required: true },
    startingPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    qty: {type: Number, required: true, min: 0},
    
    // Fish lot specific fields
    fishType: { 
        type: String, 
        required: true,
        enum: ['Tuna', 'Salmon', 'Lobster', 'Shrimp', 'Seaweed', 'Other'],
        trim: true 
    },
    weight: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'lbs', 'pieces'],
        default: 'kg'
    },
    location: {
        district: {
            type: String,
            required: true,
            trim: true
        },
        port: {
            type: String,
            required: true,
            trim: true
        }
    },
    quality: {
        type: String,
        enum: ['Premium', 'Grade A', 'Grade B', 'Grade C'],
        default: 'Grade A'
    },
    freshness: {
        type: String,
        enum: ['Fresh', 'Frozen', 'Dried'],
        default: 'Fresh'
    },
    catchDate: {
        type: Date,
        required: true
    },
    
    status: {
        type: String,
        enum: ['draft', 'pending', 'open', 'closed', 'sold'],
        default: 'draft'
    },
    endTime: { type: Date, required: true },
    sellerId: {
        type: String,
        ref: 'User', // Reference to the User model
        required: true,
    },
    sellerName: {
        type: String,
        required: true
    },
    sellerContact: {
        type: String,
        required: true
    },
    
    // Bidding information
    bids: [{
        bidderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BuyerRegister'
        },
        bidderName: String,
        bidAmount: {
            type: Number,
            required: true
        },
        bidTime: {
            type: Date,
            default: Date.now
        }
    }],
    winningBid: {
        bidderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BuyerRegister'
        },
        bidderName: String,
        bidAmount: Number,
        bidTime: Date
    },
    
    // Additional fields
    views: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }

},{ timestamps: true });

const Item = mongoose.model('Item', itemSchema);
export default Item;