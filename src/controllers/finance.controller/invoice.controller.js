import Invoice from '../../models/finance.model/Invoice.model.js';

// Generate invoice
export const generateInvoice = async (req, res) => {
  try {
    const { transactionId, customerId, details } = req.body;
    const invoice = new Invoice({
      transactionId,
      customerId,
      invoiceNumber: "INV-" + Date.now(),
      details
    });
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get customer invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.user.id });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
