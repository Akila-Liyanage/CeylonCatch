import mongoose from "mongoose";

const marketEntrySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            trim: true,
        },
        entryType: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        paymentMethod: {
            type: String,
            required: true,
            trim: true,
        },
        receiptNumber: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        note: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: String,
            ref: "User",
        },
    },
    { timestamps: true }
);

const MarketEntry = mongoose.model("MarketEntry", marketEntrySchema);
export default MarketEntry;


