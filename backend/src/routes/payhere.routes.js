import express from 'express';
import { signPayment, handleNotification } from '../controllers/payhere.controller.js';

const router = express.Router();

router.post('/sign', signPayment);
router.post('/notify', handleNotification);

export default router;