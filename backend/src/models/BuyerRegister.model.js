import mongoose from "mongoose";

const bregiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gmail: { type: String, required: true, unique: true }, // unique ensures no duplicates
    password: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    btype: { type: String, required: true },
});

const Buyer  = mongoose.model("BuyerRegister1", bregiSchema);
export default Buyer;
