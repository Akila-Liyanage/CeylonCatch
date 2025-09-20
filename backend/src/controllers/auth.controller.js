import Seller from "../models/SellerRegister.model.js";
import Buyer from "../models/BuyerRegister.model.js"
import UserLogin from "../models/UserLogin.model.js";
import jwt from "jsonwebtoken";
import twilio from "twilio";


const otpStore = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Twilio config - with fallback for missing credentials
let client = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("Twilio client initialized successfully");
  } else {
    console.log("Twilio credentials not found - OTP will use development mode");
  }
} catch (error) {
  console.log("Twilio initialization failed:", error.message);
}

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Format phone number
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "94" + cleaned.substring(1);
  return "+" + cleaned;
};

// Send OTP
const sendOTP = async (phone, otp) => {
  try {
    // If Twilio client is not available, return development mode
    if (!client) {
      console.log(`[DEVELOPMENT MODE] OTP for ${phone}: ${otp}`);
      return { success: true, message: "OTP sent successfully (Development Mode)", development_otp: otp };
    }

    const formatted = formatPhoneNumber(phone);
    const message = await client.messages.create({
      body: `Your CeylonCatch verification code is: ${otp}. This code expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
    });
    return { success: true, message: "OTP sent successfully", sid: message.sid };
  } catch (error) {
    console.error("Twilio Error:", error.message);
    // Fallback to development mode if Twilio fails
    console.log(`[FALLBACK MODE] OTP for ${phone}: ${otp}`);
    return { success: true, message: "OTP sent successfully (Fallback Mode)", development_otp: otp };
  }
};

// Seller login
export const sellerLogin = async (req, res) => {
  const { gmail, password } = req.body;
  try {
    const user = await Seller.findOne({ gmail });
    if (!user) return res.json({ err: "User Not found" });

    if (user.password !== password) return res.json({ err: "Incorrect password" });

    const otp = generateOTP();
    otpStore.set(gmail, { otp, expires: Date.now() + 5 * 60 * 1000, userType: "seller", userId: user._id, phone: user.contact });

    const result = await sendOTP(user.contact, otp);
    return res.json({ 
      status: "otp_required", 
      message: result.message, 
      development_otp: result.development_otp || otp,
      user: user // Include user data for fallback
    });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};

// Buyer login - add debugging
export const buyerLogin = async (req, res) => {
  const { gmail, password } = req.body;
  console.log("Buyer login attempt:", gmail);
  
  try {
    const user = await Buyer.findOne({ gmail });
    console.log("Found user:", user);
    
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ err: "User Not found" });
    }

    if (user.password !== password) {
      console.log("Incorrect password");
      return res.status(401).json({ err: "Incorrect password" });
    }

    const otp = generateOTP();
    otpStore.set(gmail, { otp, expires: Date.now() + 5 * 60 * 1000, userType: "buyer", userId: user._id, phone: user.contact });

    const result = await sendOTP(user.contact, otp);
    console.log("OTP sent result:", result);
    
    // Always return success with OTP, even if Twilio fails
    return res.json({ 
      status: "otp_required", 
      message: result.message, 
      development_otp: result.development_otp || otp,
      user: user // Include user data for fallback
    });
  } catch (err) {
    console.error("Buyer login error:", err);
    res.status(500).json({ err: "Server error" });
  }
};



export const sellerRegister = async (req, res) => {
  const { name, gmail, password, contact, address, product, bnumb } = req.body;
  try {
    // Check if user already exists
    const existing = await Seller.findOne({ gmail });
    if (existing) return res.status(400).json({ err: "User already exists" });

    const newSeller = new Seller({ name, gmail, password, contact, address, product, bnumb });
    await newSeller.save();

    res.status(201).json({ status: "ok", message: "Seller registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
};



export const buyerRegister = async (req, res) => {
    const { name, gmail, password, contact, address, btype } = req.body;

    if (!name || !gmail || !password || !contact || !address || !btype) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingBuyer = await Buyer.findOne({ gmail });
        if (existingBuyer) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const newBuyer = new Buyer({ name, gmail, password, contact, address, btype });
        await newBuyer.save();

        res.status(201).json({ message: "Buyer registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


// Verify OTP
export const verifyOtp = async (req, res) => {
  const { gmail, otp } = req.body;
  try {
    const data = otpStore.get(gmail);
    if (!data) return res.status(400).json({ err: "OTP not found or expired" });

    if (Date.now() > data.expires) {
      otpStore.delete(gmail);
      return res.status(400).json({ err: "OTP expired" });
    }

    if (data.otp !== otp) return res.status(400).json({ err: "Invalid OTP" });

    otpStore.delete(gmail);

    await UserLogin.create({ email: gmail, userType: data.userType, ipAddress: req.clientIp, userAgent: req.userAgent });

    const token = jwt.sign({ userId: data.userId, userType: data.userType, userEmail: gmail }, JWT_SECRET, { expiresIn: "24h" });

    return res.json({ status: "ok", userType: data.userType, token, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};
// Get user data by email
export const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    let user = await Buyer.findOne({ gmail: email });
    if (!user) {
      user = await Seller.findOne({ gmail: email });
    }
    
    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  const { gmail, userType } = req.body;
  try {
    let user;
    if (userType === 'buyer') {
      user = await Buyer.findOne({ gmail });
    } else {
      user = await Seller.findOne({ gmail });
    }

    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    const otp = generateOTP();
    otpStore.set(gmail, { otp, expires: Date.now() + 5 * 60 * 1000, userType, userId: user._id, phone: user.contact });

    const result = await sendOTP(user.contact, otp);
    return res.json({ status: "ok", message: result.message, development_otp: otp });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};
