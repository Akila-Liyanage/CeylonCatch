import Bid from '../models/Bid.model.js';
import Item from '../models/Item.model.js';

//Place bid

export const placeBid = async (req, res) => {
    try {
        const { itemId, userId, userName, bidAmount } = req.body;

        if (!itemId || !userId || !userName || typeof bidAmount !== 'number') {
            return res.status(400).json({ message: 'itemId, userId, userName and numeric bidAmount are required' });
        }

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Prevent seller from bidding on own item (basic authorization)
        if (String(item.sellerId) === String(userId)) {
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

        const newBid = new Bid({ itemId, userId, userName, bidAmount });
        await newBid.save();

        item.currentPrice = bidAmount;
        await item.save();

        // Emit realtime update
        req.io.emit('bidUpdate', {
            itemId,
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
        const highestBid = await Bid.findOne({ itemId }).sort({ bidAmount: -1 }).lean();
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

        const bids = await Bid.find({itemId}).sort({createdAt: -1});
        res.json(bids);
    }catch (err){
        res.status(500).json({message: err.message});
    }
};

//Get bid history for specific user

export const getUserBidHistory = async (req, res) => {
    try{
        const { userId } = req.params;

        const bids = await Bid.find({ userId })
        .populate("ItemId", "name image description") // show item details
        .sort({createdAt: -1});

        res.status(200).json(bids);
    }catch(err){
        res.status(500).json({message: "Error fetching bid history", err})
    }
}