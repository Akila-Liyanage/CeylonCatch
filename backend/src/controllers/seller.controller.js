import SellerRegister from "../models/SellerRegister.model.js";

// Register a new seller
export const registerSeller = async (req, res) => {
    try {
        const { name, gmail, password, contact, address, product, bnumb} = req.body;
        const newSeller = new SellerRegister({
        name,
        gmail,
        password,
        contact,
        address,
        product,
        bnumb,
        });
        await newSeller.save();
        res.status(201).json({ message: "Seller registered successfully", seller: newSeller });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Seller login
export const loginSeller = async (req, res) => {
    try {
        const { gmail, password } = req.body;
        const seller = await SellerRegister.findOne({ gmail });
        if (!seller) {
            return res.status(404).json({ error: "Seller not found" });
        }
        if (seller.password !== password) {
            return res.status(401).json({ error: "Incorrect password" });
        }
        res.json({ message: "Login successful", seller });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}