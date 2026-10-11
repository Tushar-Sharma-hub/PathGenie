import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import roadmapRouter from "./routes/roadmap.routes.js";

dotenv.config();

const app = express();

app.use(express.json())

const PORT = process.env.PORT || 6004;

app.use("/", roadmapRouter);

app.listen(PORT, () => {
  console.log(`Roadmap Service started on port ${PORT}`);
  connectDB();
});