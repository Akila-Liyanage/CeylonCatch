import Bid from '../models/Bid.model.js';
import Item from '../models/Item.model.js';

//Place bid

export const placeBid = async (req, res) => {
    try{
        const{ itemId, userId, userName, bidAmount} = req.body;

        const item = await new Item.findById(itemId);

        if(!item) return res.starus(404).json({message: "Item not found"});

        //Auction closed check
        if(item.status !== "open") return res.status(400).json({message: "Auction is not open or already closed"});

        //Bid must be higher
        if(bidAmount <= item.currentPrice) return res.status(400).json({message: "Bid must be higher than currentPrice"});

        const newBid = new Bid({itemId, userId, userName, bidAmount});
        await newBid.save();

        //Update item's current price
        item.currentPrice = bidAmount;
        await item.save();

        //Emit via socket
        req.io.emit("bidUpdate", {
            itemId,
            userName,
            bidAmount,
        });

        res.status(201).json(newBid);
    }catch(err){
        res.status(500).json({message: err.message});
    }
}

//Get highest bid for an item

export const getHighestBid = async (req, res) => {
    try{
        const {itemId} = req.body;

        const highestBid = await Bid.findOne({itemId})
        .sort({bidAmount: -1})
        .limit(1);

        res.json(highestBid || {message: "No bids yet"});
    }catch(err){
        res.status(500).json({message: err.message});
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