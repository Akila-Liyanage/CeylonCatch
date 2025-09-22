import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    items:[
        {
            itemId: { type: String, ref: 'Item', required: true },
            itemName: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 }
        }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentDetails: {
        transactionId: { type: String, required: true },
        paymentMethod: { type: String, required: true },
        paymentDate: { type: Date, required: true },
        paymentStatus: { type: String, default: 'completed' }
    },
    customerDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String }
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;