import mongoose from 'mongoose';

const BankSchema = new mongoose.Schema({
    name: String,
    account: String,
    branch: String,
}, { _id: false });

const LoanSchema = new mongoose.Schema({
    amount: { type: Number, default: 0 },
    monthlyDeduction: { type: Number, default: 0 },
    startMonth: { type: String }, // YYYY-MM
    endMonth: { type: String },   // YYYY-MM
}, { _id: false });

const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, unique: true, required: true, index: true },
    fullName: { type: String, required: true },
    dob: { type: String }, // YYYY-MM-DD
    nic: { type: String },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    bank: { type: BankSchema },
    loan: { type: LoanSchema },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
    epfEligible: { type: Boolean, default: true },
    etfEligible: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Employee', EmployeeSchema);



