import Bid from '../models/Bid.model.js';
import Item from '../models/Item.model.js';

//Place a new bid
export const placeBid = async (req, res) => {
    try {
        const { itemId, userId, bidAmount } = req.body;

        // Check if the item exists
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        if(item.status !== 'open'){
            return res.status(400).json({ message: 'Auction closed.' });
        }

        const bid = new Bid({ itemId, userId, bidAmount });
        await bid.save();

        req.io?.emit('newBid', { itemId, userId, bidAmount });
        res.status(201).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Get all bids for a specific item
export const getBidsForItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const bids = await Bid.find({ itemId }).sort({ bidAmount: -1 });
        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//delete a bid
export const deleteBid = async (req, res) => {
    try {
        const bid = await Bid.findByIdAndDelete(req.params.id);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }
        res.status(200).json({ message: 'Bid deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

