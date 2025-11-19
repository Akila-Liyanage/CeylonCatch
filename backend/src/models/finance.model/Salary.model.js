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
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
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
    timestamps: true
  }
);

// Add compound index to prevent duplicate salary payments for same employee, month, and year
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true, partialFilterExpression: { status: "paid" } });

const Salary = mongoose.model("Salary", salarySchema);
export default Salary;
