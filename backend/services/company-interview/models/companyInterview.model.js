import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    idealAnswer: { type: String, default: "" },
    userAnswer: { type: String, default: "" },
    feedback: {
      score: { type: Number, default: 0 },
      correctness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      feedback: { type: String, default: "" },
      improvements: { type: [String], default: [] },
    },
  },
  { _id: false }
);

const companyInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    type: { type: String, enum: ["technical", "hr"], required: true },
    useResume: { type: Boolean, default: false },
    currentQuestion: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] },
    overallScore: { type: Number, default: 0 },
    summary: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
  },
  { timestamps: true }
);

const CompanyInterview = mongoose.model("CompanyInterview", companyInterviewSchema);

export default CompanyInterview;
