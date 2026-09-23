import express from "express";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 6001;

app.get("/", (req, res) => {
  res.send("Hello from Auth Service!");
});

app.listen(PORT, () => {
  console.log(`Auth Service started on port ${PORT}`);
  connectDB();
});