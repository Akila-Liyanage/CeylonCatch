import mongoose from "mongoose";

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

const Salary = mongoose.model("Salary", salarySchema);
export default Salary;
