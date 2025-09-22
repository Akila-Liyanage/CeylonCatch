import express from 'express';
import { getAllInventory, addStock, getStock, updateStock, deleteStock,addQuantity, checkLowStock, reduceQuantity,getInventoryBySeller } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', getAllInventory);
router.post('/', addStock);
router.get('/:id', getStock);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);
router.post('/:id/add-quantity', addQuantity);
router.post('/:id/reduce-quantity', reduceQuantity);
router.get('/low-stock', checkLowStock);

router.get('/by-seller/:sellerEmail', getInventoryBySeller);

export default router;