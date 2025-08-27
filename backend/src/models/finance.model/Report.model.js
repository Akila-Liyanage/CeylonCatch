import mongoose from "mongoose";

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

const Report = mongoose.model("Report", reportSchema);
export default Report;
