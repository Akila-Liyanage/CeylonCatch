const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  type: { 
      type: String, 
      enum: ["sales", "commission", "tax"], 
      required: true 
  },
  generatedBy: { 
      type: String, 
      ref: "User" 
  },
  period: { 
      type: String, 
      enum: ["daily", "weekly", "monthly", "yearly"], 
      required: true 
  }, 
  data: { 
      type: Object 
  },
  filePath: { 
      type: String 
  },
}, 
{ 
  timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
