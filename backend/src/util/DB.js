import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ceyloncatch';
    console.log(`Attempting to connect to MongoDB: ${mongoURI}`);
    const conn = await mongoose.connect(mongoURI);
    console.log(`Connected to MongoDB`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Please make sure MongoDB is running on your system');
    console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
}

export default connectDB;