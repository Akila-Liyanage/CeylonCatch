import Inventory from "../models/Inventory.model.js";

export const getAllInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Function to add a new inventory item
export const addStock = async (req, res) => {
    try {
        const newItem = new Inventory(req.body); // Use the model here
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


//Get a specific inventory item by ID
export const getStock = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//update stock details
export const updateStock = async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id,                         // item id from URL
            req.body,                              // updated data
            { new: true }                          // return updated item
        );
        if (!updatedItem) return res.status(404).json({ message: "Stock not found" });
        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//Delete stock item
export const deleteStock = async (req, res) => {
    try {
        const deleted = await Inventory.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
