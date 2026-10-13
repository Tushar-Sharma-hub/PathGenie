import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Company Interview service connected to MongoDB");
  } catch (error) {
    console.error("Company Interview service MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
