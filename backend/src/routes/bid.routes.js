import express from 'express';
import { placeBid, getHighestBid, getBidHistory, getUserBidHistory} from '../controllers/bid.controller.js';

const router = express.Router();

router.post('/', placeBid);
router.get('/:itemId/highest', getHighestBid);
router.get('/:itemId/history', getBidHistory);
router.get("/history/:userId", getUserBidHistory);

export default router;