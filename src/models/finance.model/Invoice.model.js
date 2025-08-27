import mongoose from 'mongoose' //provides a structured way to interact with MongoDB

const invoiceSchema = new mongoose.Schema({
  transactionId: { 
      type: String, 
      ref: "Transaction", 
      required: true 
  },invoiceNumber: { 
      type: String, 
      required: true, 
      unique: true 
  },
  customerId: { 
      type: String, 
      ref: "User", 
      required: true 
  },
  details: { 
      type: String 
  }, // items, tax, commission, etc.
  pdfPath: { 
      type: String 
    }, //path or urrl
}, 
{ 
  timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
