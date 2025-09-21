import Item from "../models/Item.model.js";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for multiple image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'fish-lot-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit per image
    }
});

// For multiple image uploads
export const uploadMultiple = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit per image
    }
});

// Create a new fish lot item
export const createItem = async (req, res) => {
    try{
        console.log('Creating fish lot with data:', req.body);
        console.log('Files received:', req.files);
        
        // Handle multiple images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.filename);
        } else if (req.file) {
            images = [req.file.filename];
        } else if (req.body.images) {
            // Handle case where images are passed as JSON array
            images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        }

        if (images.length === 0) {
            return res.status(400).json({message: 'At least one image is required'});
        }

        // Handle location data properly
        let location = {};
        if (req.body.location && req.body.location.district && req.body.location.port) {
            location = req.body.location;
        } else if (req.body.district && req.body.port) {
            location = {
                district: req.body.district,
                port: req.body.port
            };
        }

        const itemData = {
            ...req.body,
            images: images,
            currentPrice: req.body.startingPrice || 0,
            location: location,
            qty: req.body.quantity || req.body.qty || 1  // Map quantity to qty
        };
        
        const item = new Item(itemData);
        await item.save();
        res.status(201).json(item);
    
    }catch(error){
        console.error('Error creating fish lot:', error);
        res.status(500).json({message: error.message, details: error.stack});
    }
};

// Get all items
export const getItems = async (req, res) => {
    try{
        // Auto-close any expired auctions before returning list
        const now = new Date();
        await Item.updateMany(
            { endTime: { $lte: now }, status: { $ne: 'closed' } },
            { $set: { status: 'closed' } }
        );

        const items = await Item.find();
        res.status(200).json(items);
    
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

// Get a single item by ID
export const getItemById = async (req, res) => {
    try{
        let item = await Item.findById(req.params.id);
        if(!item){
            return res.status(404).json({message: 'Item not found'});
        }
        // If expired, ensure status is persisted as closed
        const now = new Date();
        if (item.endTime && now > new Date(item.endTime) && item.status !== 'closed') {
            item.status = 'closed';
            await item.save();
        }
        res.status(200).json(item);
    
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

//delete an item
export const deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get items by seller ID
export const getItemsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const items = await Item.find({ sellerId: sellerId }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an item
export const updateItem = async (req, res) => {
    try {
        // Handle multiple images for updates
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.filename);
        } else if (req.file) {
            images = [req.file.filename];
        } else if (req.body.images) {
            images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        }

        const itemData = {
            ...req.body
        };

        // Map quantity to qty if provided
        if (req.body.quantity) {
            itemData.qty = req.body.quantity;
        }

        // Only update images if new ones are provided
        if (images.length > 0) {
            itemData.images = images;
        }
        
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            itemData,
            { new: true, runValidators: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get fish lots by type
export const getFishLotsByType = async (req, res) => {
    try {
        const { fishType } = req.params;
        const items = await Item.find({ 
            fishType: fishType, 
            status: { $in: ['open', 'pending'] },
            isActive: true 
        }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get active fish lots (for buyers)
export const getActiveFishLots = async (req, res) => {
    try {
        // Auto-close any expired auctions
        const now = new Date();
        await Item.updateMany(
            { endTime: { $lte: now }, status: 'open' },
            { $set: { status: 'closed' } }
        );

        const items = await Item.find({ 
            status: 'open',
            isActive: true 
        }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get fish lots by seller with filtering
export const getFishLotsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { status } = req.query;
        
        let query = { sellerId: sellerId };
        if (status) {
            query.status = status;
        }
        
        const items = await Item.find(query).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update fish lot status (for seller)
export const updateFishLotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['draft', 'pending', 'open', 'closed', 'sold'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const item = await Item.findByIdAndUpdate(
            id,
            { status: status },
            { new: true, runValidators: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Increment views for a fish lot
export const incrementViews = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};