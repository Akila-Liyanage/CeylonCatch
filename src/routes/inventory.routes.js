import express from 'express';
import { getAllInventory, addStock, getStock, updateStock, deleteStock } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', getAllInventory);
router.post('/', addStock);
router.get('/:id', getStock);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);

export default router;