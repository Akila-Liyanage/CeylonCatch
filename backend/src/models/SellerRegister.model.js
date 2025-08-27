import mongoose from "mongoose";
const schema = mongoose.Schema;

const sellerSchema = new schema({
    name: { type: String, required: true },
    gmail: { type: String, required: true },
    password: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    product: { type: String, required: true },
    bnumb: { type: String, required: true },
});

const SellerRegister = mongoose.model("SellerRegister", sellerSchema);
export default SellerRegister;
