import express from 'express';
import {sellerLogin, buyerLogin, verifyOtp, buyerRegister, sellerRegister } from '../controllers/auth.controller.js'

const router = express.Router();

// Make sure these routes are defined
router.post("/slogin", sellerLogin);
router.post("/blogin", buyerLogin); // This should match your frontend request
router.post("/verify-otp", verifyOtp);
router.post("/BuyerRegister", buyerRegister);
router.post("/SellerRegister", sellerRegister);

// Add to your authRoutes.js
router.get("/all-buyers", async (req, res) => {
  try {
    const buyers = await Buyer.find({});
    console.log("All buyers:", buyers);
    res.json({ buyers: buyers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;