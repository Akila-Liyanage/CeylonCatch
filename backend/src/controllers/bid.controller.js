import Bid from '../models/Bid.model.js';
import Item from '../models/Item.model.js';
import mongoose from 'mongoose';

//Place bid

export const placeBid = async (req, res) => {
    try {
        const { itemId, userId, userName, bidAmount } = req.body;

        if (!itemId || !userId || !userName || typeof bidAmount !== 'number') {
            return res.status(400).json({ message: 'itemId, userId, userName and numeric bidAmount are required' });
        }

        // Convert string IDs to ObjectId if they're valid ObjectId strings
        let itemObjectId, userObjectId;
        
        try {
            itemObjectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : itemId;
        } catch (error) {
            return res.status(400).json({ message: 'Invalid itemId format' });
        }

        try {
            userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        } catch (error) {
            return res.status(400).json({ message: 'Invalid userId format' });
        }

        const item = await Item.findById(itemObjectId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Prevent seller from bidding on own item (basic authorization)
        if (String(item.sellerId) === String(userObjectId)) {
            return res.status(403).json({ message: 'Seller cannot bid on their own item' });
        }

        // Auction status and expiry checks
        const now = new Date();
        if (item.endTime && now > new Date(item.endTime)) {
            // Auto-close if expired
            if (item.status !== 'closed') {
                item.status = 'closed';
                await item.save();
            }
            return res.status(400).json({ message: 'Auction has ended' });
        }
        if (item.status !== 'open') {
            return res.status(400).json({ message: 'Auction is not open or already closed' });
        }

        if (bidAmount <= item.currentPrice) {
            return res.status(400).json({ message: 'Bid must be higher than currentPrice' });
        }

        const newBid = new Bid({ 
            itemId: itemObjectId, 
            userId: userObjectId, 
            userName, 
            bidAmount 
        });
        await newBid.save();

        item.currentPrice = bidAmount;
        await item.save();

        // Emit realtime update
        req.io.emit('bidUpdate', {
            itemId: itemObjectId,
            userName,
            bidAmount,
            currentPrice: bidAmount,
        });

        res.status(201).json(newBid);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

//Get highest bid for an item

export const getHighestBid = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Convert itemId to ObjectId if it's a valid ObjectId string
        let itemObjectId;
        try {
            itemObjectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : itemId;
        } catch (error) {
            console.log('getHighestBid - Invalid ObjectId format, using as string');
            itemObjectId = itemId;
        }
        
        const highestBid = await Bid.findOne({ itemId: itemObjectId }).sort({ bidAmount: -1 }).lean();
        if (!highestBid) return res.status(404).json({ message: 'No bids yet' });
        res.json(highestBid);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

//Get bid history for an item
export const getBidHistory = async (req, res) => {
    try{
        const { itemId } = req.params;

        // Convert itemId to ObjectId if it's a valid ObjectId string
        let itemObjectId;
        try {
            itemObjectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : itemId;
        } catch (error) {
            console.log('getBidHistory - Invalid ObjectId format, using as string');
            itemObjectId = itemId;
        }

        const bids = await Bid.find({itemId: itemObjectId}).sort({createdAt: -1});
        
        // For each bid, if userName is generic ("Buyer" or "Seller"), try to fetch actual name
        const bidsWithNames = await Promise.all(bids.map(async (bid) => {
            if (bid.userName === 'Buyer' || bid.userName === 'Seller') {
                try {
                    // Try to find the user by userId (which could be _id or email)
                    const BuyerRegister = (await import('../models/BuyerRegister.model.js')).default;
                    const SellerRegister = (await import('../models/SellerRegister.model.js')).default;
                    
                    let user = null;
                    
                    // First try to find by _id (MongoDB ObjectId)
                    if (mongoose.Types.ObjectId.isValid(bid.userId)) {
                        user = await BuyerRegister.findById(bid.userId);
                        if (!user) {
                            user = await SellerRegister.findById(bid.userId);
                        }
                    } else {
                        // Fallback to email search for older bids
                        user = await BuyerRegister.findOne({ gmail: bid.userId });
                        if (!user) {
                            user = await SellerRegister.findOne({ gmail: bid.userId });
                        }
                    }
                    
                    if (user && user.name) {
                        return { ...bid.toObject(), userName: user.name };
                    }
                } catch (error) {
                    console.error('Error fetching user name for bid:', error);
                }
            }
            return bid.toObject();
        }));
        
        res.json(bidsWithNames);
    }catch (err){
        res.status(500).json({message: err.message});
    }
};

//Get bid history for specific user

export const getUserBidHistory = async (req, res) => {
    try{
        const { userId } = req.params;
        console.log('getUserBidHistory - Looking for bids with userId:', userId);

        // Convert userId to ObjectId if it's a valid ObjectId string
        let userObjectId;
        try {
            userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
        } catch (error) {
            console.log('getUserBidHistory - Invalid ObjectId format, using as string');
            userObjectId = userId;
        }

        // First, try to find bids directly with the userId (as ObjectId or string)
        let bids = await Bid.find({ userId: userObjectId })
        .populate("itemId", "name image description") // show item details
        .sort({createdAt: -1});

        console.log('getUserBidHistory - Found bids directly:', bids.length);

        // If no bids found and userId looks like an email, try to find the user's _id
        if (bids.length === 0 && userId.includes('@')) {
            console.log('getUserBidHistory - No direct bids found, trying to find user by email');
            try {
                const BuyerRegister = (await import('../models/BuyerRegister.model.js')).default;
                const SellerRegister = (await import('../models/SellerRegister.model.js')).default;
                
                let user = await BuyerRegister.findOne({ gmail: userId });
                if (!user) {
                    user = await SellerRegister.findOne({ gmail: userId });
                }
                
                if (user && user._id) {
                    console.log('getUserBidHistory - Found user with _id:', user._id);
                    // Try to find bids with the user's _id as ObjectId
                    bids = await Bid.find({ userId: user._id })
                    .populate("itemId", "name image description")
                    .sort({createdAt: -1});
                    console.log('getUserBidHistory - Found bids with _id:', bids.length);
                }
            } catch (userError) {
                console.error('getUserBidHistory - Error finding user by email:', userError);
            }
        }

        // If still no bids found and userId looks like MongoDB _id, try to find user by _id
        if (bids.length === 0 && userId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('getUserBidHistory - Trying to find user by _id');
            try {
                const BuyerRegister = (await import('../models/BuyerRegister.model.js')).default;
                const SellerRegister = (await import('../models/SellerRegister.model.js')).default;
                
                let user = await BuyerRegister.findById(userId);
                if (!user) {
                    user = await SellerRegister.findById(userId);
                }
                
                if (user) {
                    console.log('getUserBidHistory - Found user by _id, trying email as userId');
                    // Try to find bids with the user's email (for backward compatibility)
                    // Now that we use Mixed type, this should work
                    bids = await Bid.find({ userId: user.gmail })
                    .populate("itemId", "name image description")
                    .sort({createdAt: -1});
                    console.log('getUserBidHistory - Found bids with email:', bids.length);
                }
            } catch (userError) {
                console.error('getUserBidHistory - Error finding user by _id:', userError);
            }
        }

        // For each bid, if userName is generic ("Buyer" or "Seller"), try to fetch actual name
        const bidsWithNames = await Promise.all(bids.map(async (bid) => {
            if (bid.userName === 'Buyer' || bid.userName === 'Seller') {
                try {
                    // Try to find the user by userId (which could be _id or email)
                    const BuyerRegister = (await import('../models/BuyerRegister.model.js')).default;
                    const SellerRegister = (await import('../models/SellerRegister.model.js')).default;
                    
                    let user = null;
                    
                    // First try to find by _id (MongoDB ObjectId)
                    if (mongoose.Types.ObjectId.isValid(bid.userId)) {
                        user = await BuyerRegister.findById(bid.userId);
                        if (!user) {
                            user = await SellerRegister.findById(bid.userId);
                        }
                    } else {
                        // Fallback to email search for older bids
                        user = await BuyerRegister.findOne({ gmail: bid.userId });
                        if (!user) {
                            user = await SellerRegister.findOne({ gmail: bid.userId });
                        }
                    }
                    
                    if (user && user.name) {
                        return { ...bid.toObject(), userName: user.name };
                    }
                } catch (error) {
                    console.error('Error fetching user name for bid:', error);
                }
            }
            return bid.toObject();
        }));

        console.log('getUserBidHistory - Returning bids:', bidsWithNames.length);
        res.status(200).json(bidsWithNames);
    }catch(err){
        console.error('getUserBidHistory - Error:', err);
        res.status(500).json({message: "Error fetching bid history", err})
    }
}