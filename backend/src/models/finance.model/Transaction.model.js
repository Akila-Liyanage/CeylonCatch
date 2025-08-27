const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { 
      type: String, 
      ref: "User", 
      required: true 
  },
  amount: { 
      type: Number, 
      required: true 
  },
  type: { 
      type: String, 
      enum: ["purchase", "auction", "salary"], 
      required: true 
  },
  status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "completed" 
  },
  paymentMethod: { 
      type: String, 
      ref: "PaymentMethod" 
  },
}, 
{ 
  timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
