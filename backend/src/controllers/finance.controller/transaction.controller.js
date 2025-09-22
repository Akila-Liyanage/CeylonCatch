import Transaction from '../../models/finance.model/Transaction.model.js';

// Create transaction
export const createTransaction = async (req, res) => {
  try {
    const fallbackUserId = req.body?.userId || 'guest';
    const tx = new Transaction({ ...req.body, userId: req.user?.id || fallbackUserId });
    await tx.save();
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all user transactions
export const getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.user.id }).populate("paymentMethod");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("userId paymentMethod");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
