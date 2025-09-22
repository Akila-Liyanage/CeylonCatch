import MarketEntry from '../../models/finance.model/MarketEntry.model.js';
import Salary from '../../models/finance.model/Salary.model.js';
import Transaction from '../../models/finance.model/Transaction.model.js';

// Create income/expense entry
export const createMarketEntry = async (req, res) => {
    try {
        const { entryType, amount, category, description, paymentMethod, receiptNumber, date, notes } = req.body || {};
        if (!entryType || !["income", "expense"].includes(entryType)) {
            return res.status(400).json({ error: 'entryType must be income or expense' });
        }
        if (amount === undefined || Number(amount) < 0) {
            return res.status(400).json({ error: 'amount is required and must be >= 0' });
        }
        const parsedDate = date ? new Date(date) : new Date();
        const entry = new MarketEntry({
            entryType,
            amount: Number(amount),
            category,
            description,
            paymentMethod,
            receiptNumber,
            date: parsedDate,
            note: notes, // Map notes to note field
            createdBy: req.user?.id,
        });
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// List entries with optional month/year filters
export const listMarketEntries = async (req, res) => {
    try {
        const { month, year, type } = req.query || {};
        const filter = {};
        if (type && ["income", "expense"].includes(type)) filter.entryType = type;
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 1);
            filter.date = { $gte: start, $lt: end };
        }
        const entries = await MarketEntry.find(filter).sort({ date: -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Monthly market report: incomes, expenses, shop sales (transactions), salary payouts
export const getMonthlyMarketReport = async (req, res) => {
    try {
        const { month, year } = req.query || {};
        if (!month || !year) return res.status(400).json({ error: 'month and year are required' });
        const m = Number(month);
        const y = Number(year);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);

        // Market entries
        const [incomeAgg, expenseAgg] = await Promise.all([
            MarketEntry.aggregate([
                { $match: { entryType: 'income', date: { $gte: start, $lt: end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            MarketEntry.aggregate([
                { $match: { entryType: 'expense', date: { $gte: start, $lt: end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        // Shop transactions (income from selling items)
        const salesAgg = await Transaction.aggregate([
            { $match: { type: { $in: ['purchase', 'auction'] }, status: 'completed', createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Salary payouts (deductions)
        const salaryAgg = await Salary.aggregate([
            { $match: { status: 'paid', paidDate: { $gte: start, $lt: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const totals = {
            marketIncome: incomeAgg[0]?.total || 0,
            marketExpense: expenseAgg[0]?.total || 0,
            shopSalesIncome: salesAgg[0]?.total || 0,
            salaryPayouts: salaryAgg[0]?.total || 0,
        };
        const net = totals.marketIncome + totals.shopSalesIncome - totals.marketExpense - totals.salaryPayouts;

        res.json({ period: { month: m, year: y }, totals, net });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update market entry
export const updateMarketEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { entryType, amount, category, description, paymentMethod, receiptNumber, date, notes } = req.body || {};

        if (entryType && !["income", "expense"].includes(entryType)) {
            return res.status(400).json({ error: 'entryType must be income or expense' });
        }
        if (amount !== undefined && Number(amount) < 0) {
            return res.status(400).json({ error: 'amount must be >= 0' });
        }

        const updateData = {};
        if (entryType) updateData.entryType = entryType;
        if (amount !== undefined) updateData.amount = Number(amount);
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;
        if (receiptNumber) updateData.receiptNumber = receiptNumber;
        if (date) updateData.date = new Date(date);
        if (notes) updateData.note = notes;

        const entry = await MarketEntry.findByIdAndUpdate(id, updateData, { new: true });
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete market entry
export const deleteMarketEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await MarketEntry.findByIdAndDelete(id);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


