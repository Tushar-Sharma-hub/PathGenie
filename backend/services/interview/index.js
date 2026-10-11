import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import interviewRouter from "./routes/interview.routes.js";

dotenv.config();

const app = express();

app.use(express.json())

const PORT = process.env.PORT || 6003;

app.use("/", interviewRouter)

app.listen(PORT, () => {
  console.log(`Interview Service started on port ${PORT}`);
  connectDB();
});