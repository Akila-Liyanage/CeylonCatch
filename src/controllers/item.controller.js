import Item from "../models/Item.model.js";

// Create a new item
export const createItem = async (req, res) => {
    try{
        const item = new Item(req.body);
        await item.save();
        res.status(201).json(item);
    
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

// Get all items
export const getItems = async (req, res) => {
    try{
        const items = await Item.find();
        res.status(200).json(items);
    
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

// Get a single item by ID
export const getItemById = async (req, res) => {
    try{
        const item = await Item.findById(req.params.id);
        if(!item){
            return res.status(404).json({message: 'Item not found'});
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