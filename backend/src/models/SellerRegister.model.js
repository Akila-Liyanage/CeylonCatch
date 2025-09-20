import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gmail: { type: String, required: true },
    password: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    product: { type: String, required: true },
    bnumb: { type: String, required: true },
});

const Seller = mongoose.model("SellerRegister", sellerSchema);
export default Seller;
