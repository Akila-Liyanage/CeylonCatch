import express from 'express';
import { getSeller, getBuyer, updateSeller, updateBuyer, getUserById } from '../controllers/user.controller.js';

const router = express.Router();
// Seller routes
router.get("/seller-by-email/:email", getSeller);
router.put("/seller-by-email/:email", updateSeller);

// Buyer routes
router.get("/buyer-by-email/:email", getBuyer);
router.put("/buyer-by-email/:email", updateBuyer);

// User by ID routes
router.get("/user-by-id/:id", getUserById);

export default router;
