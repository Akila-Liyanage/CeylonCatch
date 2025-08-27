import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["card", "wallet", "bank"], 
    required: true 
  },
  provider: { 
    type: String, 
    required: true 
  },  
  accountNumber: { 
    type: String, 
    required: true 
  },
  expiryDate: { 
    type: String 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
}, 
{ 
  timestamps: true }
);


const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;