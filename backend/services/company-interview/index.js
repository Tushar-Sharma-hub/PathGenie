import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import companyInterviewRouter from "./routes/companyInterview.route.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 6007;

app.get("/", (_req, res) => {
  res.send("Company Interview service");
});

app.use("/", companyInterviewRouter);

app.listen(PORT, () => {
  console.log(`Company Interview service started on port ${PORT}`);
  connectDB();
});
