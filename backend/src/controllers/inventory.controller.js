import Inventory from '../models/Inventory.model.js';

// ✅ Add item
export const addStock = async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Update stock
export const updateStock = async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Delete stock
export const deleteStock = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get all inventory items
export const getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get single stock item
export const getStock = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add quantity to existing stock
export const addQuantity = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (!Number.isInteger(req.body.quantity) || req.body.quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    item.quantity += req.body.quantity;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Check low stock items
export const checkLowStock = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$stockThreshold"] }
    });

    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get inventory items by seller email
export const getInventoryBySeller = async (req, res) => {
  try {
    const { sellerEmail } = req.params;
    const decodedEmail = decodeURIComponent(sellerEmail);
    const items = await Inventory.find({ sellerEmail: decodedEmail });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Reduce quantity after purchase
export const reduceQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be a positive number' });
        }

        const item = await Inventory.findById(id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient quantity in stock' });
        }

        item.quantity -= quantity;
        await item.save();

        res.json({
            message: 'Quantity reduced successfully',
            item: item,
            remainingQuantity: item.quantity
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

