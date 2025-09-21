import express from 'express';
import { 
    createItem, 
    getItems, 
    getItemById, 
    deleteItem, 
    getItemsBySeller, 
    updateItem, 
    upload,
    uploadMultiple,
    getFishLotsByType,
    getActiveFishLots,
    getFishLotsBySeller,
    updateFishLotStatus,
    incrementViews
} from '../controllers/item.controller.js';

const router = express.Router();

// Public routes - Fish lots for buyers
router.get('/', getActiveFishLots); // Get active fish lots for auction
router.get('/type/:fishType', getFishLotsByType); // Get fish lots by type
router.get('/:id', getItemById); // Get specific fish lot
router.post('/:id/view', incrementViews); // Increment views

// Seller routes with multiple image upload
router.post('/', uploadMultiple.array('images', 5), createItem); // Create fish lot with multiple images
router.put('/:id', uploadMultiple.array('images', 5), updateItem); // Update fish lot
router.get('/seller/:sellerId', getFishLotsBySeller); // Get seller's fish lots with status filter
router.put('/:id/status', updateFishLotStatus); // Update fish lot status
router.delete('/:id', deleteItem); // Delete fish lot

// Legacy routes for backward compatibility
router.get('/legacy/all', getItems); // Get all items (legacy)
router.get('/legacy/seller/:sellerId', getItemsBySeller); // Get items by seller (legacy)

export default router;