import express from "express";
import {
  getCompanyInterview,
  getCompanyInterviews,
  startCompanyInterview,
  submitCompanyInterviewAnswer,
} from "../controllers/companyInterview.controller.js";

const router = express.Router();

router.post("/start", startCompanyInterview);
router.post("/answer", submitCompanyInterviewAnswer);
router.get("/all", getCompanyInterviews);
router.get("/:id", getCompanyInterview);

export default router;
