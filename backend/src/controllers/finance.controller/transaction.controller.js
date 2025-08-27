const Transaction = require("../../models/finance.model/Transaction.model");

// Create transaction
exports.createTransaction = async (req, res) => {
  try {
    const tx = new Transaction({ ...req.body, userId: req.user.id });
    await tx.save();
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all user transactions
exports.getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.user.id }).populate("paymentMethod");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("userId paymentMethod");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
