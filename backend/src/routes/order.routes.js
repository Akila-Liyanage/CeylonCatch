import express from 'express';
import { 
            createOrder,
            getOrders,
            getOrderById,
            getOrdersByUserId,
            updateOrderStatus,
            deleteOrder
 } from '../controllers/order.controller.js';

 const router = express.Router();

 //Routes
 router.post('/', createOrder);
router.get('/', getOrders);
router.get('/user/:userId', getOrdersByUserId);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;