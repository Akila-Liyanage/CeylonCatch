import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    items:[
        {
            itemId: { type: String, ref: 'Item', required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;