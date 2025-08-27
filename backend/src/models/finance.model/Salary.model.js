const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    ref: "User", 
    required: true 
  },
  role: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "paid"], 
    default: "pending" 
  },
  paidDate: { 
    type: Date 
  }
}, 
{ 
  timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);
