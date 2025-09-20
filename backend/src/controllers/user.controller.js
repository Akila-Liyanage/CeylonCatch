import Seller from "../models/SellerRegister.model.js";
import Buyer from "../models/BuyerRegister.model.js";

// Seller
export const getSeller = async (req, res) => {
  try {
    const seller = await Seller.findOne({ gmail: req.params.email });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};

export const updateSeller = async (req, res) => {
  try {
    console.log("Params email:", req.params.email);
    console.log("Update body:", req.body);

    const seller = await Seller.findOneAndUpdate(
      { gmail: req.params.email },
      req.body,
      { new: true, runValidators: true }
    );

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    console.log("Updated seller:", seller);
    res.json({ message: "Seller updated successfully", seller });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ err: err.message });
  }
};



// Buyer
export const getBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findOne({ gmail: req.params.email });
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.json(buyer);
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};

export const updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findOneAndUpdate({ gmail: req.params.email }, req.body, { new: true, runValidators: true });
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.json(buyer);
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};
