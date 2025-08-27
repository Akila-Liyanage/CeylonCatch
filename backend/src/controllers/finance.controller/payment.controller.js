import PaymentMethod from '../../models/finance.model/PaymentMethod.model.js';

// Add new payment method
export const addPaymentMethod = async (req, res) => {
    try {
        const { userId, type, provider, accountNumber, expiryDate, isDefault } = req.body;
        //const userId = req.user.id; // taken from authenticated user

        // Validate required fields
        if (!type || !provider || !accountNumber) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Validate type
        const validTypes = ["card", "wallet", "bank"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Invalid payment method type." });
        }

        // If card, check expiryDate
        if (type === "card" && !expiryDate) {
            return res.status(400).json({ message: "Expiry date is required for card type." });
        }

        const method = new PaymentMethod({
            userId,
            type,
            provider,
            accountNumber,
            expiryDate,
            isDefault: isDefault || false
        });

        await method.save();

        // Emit event if needed (optional)
        req.io?.emit("newPaymentMethod", { userId, type, provider });

        res.status(201).json(method);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all user payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ userId: req.user.id });
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment method deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
