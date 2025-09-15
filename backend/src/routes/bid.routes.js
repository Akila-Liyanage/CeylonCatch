import express from 'express';
import { placeBid, getHighestBid, getBidHistory} from '../controllers/bid.controller.js';

const router = express.Router();

router.post('/', placeBid);
router.get('/:itemId/highest', getHighestBid);
router.delete('/:itemId/history', getBidHistory);

export default router;