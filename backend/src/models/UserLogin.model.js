import mongoose from "mongoose";

const UserLoginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  userType: { type: String, enum: ["buyer", "seller"], required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  loginTime: { type: Date, default: Date.now }
});

const UserLogin = mongoose.model("UserLogin", UserLoginSchema);
export default UserLogin;
