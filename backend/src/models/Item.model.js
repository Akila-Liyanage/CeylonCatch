import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: {type: String, required: true},
    description: { type: String, required: true },
    startingPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    qty: {type: Number, required: true, min: 0},
    status: {
        type: String,
        enum: ['pending','open', 'closed'],
        default: 'open',},
    endTime: { type: Date, required: true },
    sellerId: {
        type: String,
        ref: 'User', // Reference to the User model
        required: true,
    }


},{ timestamps: true });

const Item = mongoose.model('Item', itemSchema);
export default Item;