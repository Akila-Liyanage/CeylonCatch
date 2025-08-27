import BuyerRegister from "../models/BuyerRegister.model.js";

// Buyer Registration
export const registerBuyer = async (req, res) => {
    const { name, email, password, contact, address, btype } = req.body;
    try {
        const newBuyer = new BuyerRegister({
            name,
            email,
            password,
            contact,
            address,
            btype
        });
        await newBuyer.save();
        res.status(201).json({ message: "Buyer registered successfully", buyer: newBuyer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Buyer Login
export const loginBuyer = async (req, res) => {
    const { email, password } = req.body;
    try {
        const buyer = await BuyerRegister.findOne({ email });
        if (!buyer) {
            return res.status(404).json({ error: "Buyer not found" });
        }
        if (buyer.password !== password) {
            return res.status(401).json({ error: "Incorrect password" });
        }
        res.json({ message: "Login successful", buyer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

