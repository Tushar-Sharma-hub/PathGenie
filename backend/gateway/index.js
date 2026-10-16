import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true
}))
app.use(morgan("dev"))
app.use(cookieParser())

const PORT = process.env.PORT || 6000;

app.get("/", (req, res) => {
  res.send("Hello from Gateway!");
});

app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL));
app.use("/api/resume",isAuth ,proxyWithHeaders(process.env.RESUME_SERVICE_URL));
app.use("/api/interview",isAuth ,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL));
app.use("/api/roadmap",isAuth ,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL));
app.use("/api/billing",isAuth ,proxyWithHeaders(process.env.BILLING_SERVICE_URL));

app.get("/api/me",isAuth , getCurrentUser) //first will authorize and put user data in req.user then we can use it in getCurrentUser fxn in controller to fetch data easily.

app.listen(PORT, () => {
  console.log(`Gateway started on port ${PORT}`);
});