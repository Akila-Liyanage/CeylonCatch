import express from 'express';
import { getAllInventory, addStock, getStock, updateStock, deleteStock, getInventoryBySeller, reduceQuantity } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', getAllInventory);
router.post('/', addStock);
router.get('/by-seller/:sellerEmail', getInventoryBySeller);
router.post('/:id/reduce-quantity', reduceQuantity);
router.get('/:id', getStock);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);

export default router;