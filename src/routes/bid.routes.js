import express from 'express';
import { placeBid, getBidsForItem, deleteBid } from '../controllers/bid.controller.js';

const router = express.Router();

router.post('/', placeBid);
router.get('/:itemId', getBidsForItem);
router.delete('/:id', deleteBid);

export default router;