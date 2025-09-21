import express from 'express';
import { placeBid, getHighestBid, getBidHistory, getUserBidHistory, getAllBids} from '../controllers/bid.controller.js';

const router = express.Router();

router.post('/', placeBid);
router.get('/:itemId/highest', getHighestBid);
router.get('/:itemId/history', getBidHistory);
router.get("/history/:userId", getUserBidHistory);
router.get("/all", getAllBids); // Test endpoint

export default router;