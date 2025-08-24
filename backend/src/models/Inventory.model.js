import mongoose from 'mongoose';


const inventorySchema = new mongoose.Schema({
    fishName: { type: String, required: true },
    lotNumber: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true }, // in kg
    pricePerKg: { type: Number, required: true },
    condition: { type: String, enum: ['Fresh', 'Frozen', 'Spoiled'], default: 'Fresh' },
    reorderLevel: { type: Number, required: true }, // alert for low stock
    
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
