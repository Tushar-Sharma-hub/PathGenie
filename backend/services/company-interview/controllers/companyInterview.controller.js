import "dotenv/config";
import mongoose from "mongoose";
import {
  evaluateAnswer,
  generateQuestions,
  generateReport,
} from "../agents/companyInterview.agent.js";
import CompanyInterview from "../models/companyInterview.model.js";
import redis from "../../../shared/redis/redis.js";

const HISTORY_CACHE_TTL = 600;

const historyCacheKey = (userId) => `companyInterviews:${userId}`;
const detailCacheKey = (userId, interviewId) =>
  `companyInterview:${userId}:${interviewId}`;

const invalidateInterviewCaches = async (userId, interviewId) => {
  try {
    await redis.del(historyCacheKey(userId), detailCacheKey(userId, interviewId));
  } catch (error) {
    console.error("Failed to invalidate company interview cache:", error);
  }
};

const getCached = async (key) => {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Failed to read company interview cache:", error);
    return null;
  }
};

const setCached = async (key, value) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", HISTORY_CACHE_TTL);
  } catch (error) {
    console.error("Failed to write company interview cache:", error);
  }
};

const toActiveInterview = (interview) => {
  const result = interview.toObject();
  result.questions = result.questions.map(({ idealAnswer, ...question }) => question);
  return result;
};

const toActiveQuestion = ({ idealAnswer, ...question }) => question;

const toHistoryInterview = (interview) => {
  const result = interview.toObject();
  if (result.status !== "completed") {
    result.questions = result.questions.map((question) => {
      if (question.userAnswer) return question;
      const { idealAnswer, ...unansweredQuestion } = question;
      return unansweredQuestion;
    });
  }
  return result;
};

const userIdFromRequest = (req) => {
  const userId = req.headers["x-user-id"];
  return mongoose.Types.ObjectId.isValid(userId) ? userId : null;
};

export const startCompanyInterview = async (req, res) => {
  const userId = userIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authenticated user is required." });
  }

  const { company, role, type = "technical", useResume = false, resume = {} } = req.body;
  if (
    typeof company !== "string"
    || !company.trim()
    || company.trim().length > 80
    || typeof role !== "string"
    || !role.trim()
    || role.trim().length > 100
    || !["technical", "hr"].includes(type)
    || typeof useResume !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "A company, role, valid interview type, and resume setting are required.",
    });
  }

  try {
    const questions = await generateQuestions({
      company: company.trim(),
      role: role.trim(),
      type,
      useResume,
      resume: useResume ? resume : {},
    });
    const interview = await CompanyInterview.create({
      userId,
      company: company.trim(),
      role: role.trim(),
      type,
      useResume,
      questions,
    });
    await invalidateInterviewCaches(userId, interview._id);

    return res.status(201).json({
      success: true,
      interviewId: interview._id,
      interview: toActiveInterview(interview),
      currentQuestion: 0,
      totalQuestions: questions.length,
      question: toActiveQuestion(questions[0]),
    });
  } catch (error) {
    console.error("Failed to start company interview:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start company interview.",
    });
  }
};

export const submitCompanyInterviewAnswer = async (req, res) => {
  const userId = userIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authenticated user is required." });
  }

  const { interviewId, answer } = req.body;
  if (
    !mongoose.Types.ObjectId.isValid(interviewId)
    || typeof answer !== "string"
    || !answer.trim()
    || answer.length > 10000
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid interview ID and an answer of 1-10,000 characters are required.",
    });
  }

  try {
    const interview = await CompanyInterview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Company interview not found." });
    }
    if (interview.status === "completed") {
      return res.status(400).json({ success: false, message: "This interview is already complete." });
    }

    const question = interview.questions[interview.currentQuestion];
    if (!question) {
      return res.status(409).json({ success: false, message: "The interview has no remaining question." });
    }

    const feedback = await evaluateAnswer({
      company: interview.company,
      role: interview.role,
      type: interview.type,
      question: question.question,
      idealAnswer: question.idealAnswer,
      answer: answer.trim(),
    });
    const scoreFields = ["score", "correctness", "clarity", "relevance"];
    if (
      !feedback
      || scoreFields.some(
        (field) => !Number.isFinite(feedback[field]) || feedback[field] < 0 || feedback[field] > 100
      )
      || typeof feedback.feedback !== "string"
      || !Array.isArray(feedback.improvements)
      || feedback.improvements.some((item) => typeof item !== "string")
    ) {
      throw new Error("The AI returned invalid answer feedback.");
    }

    question.userAnswer = answer.trim();
    question.feedback = feedback;
    interview.currentQuestion += 1;

    const completed = interview.currentQuestion >= interview.questions.length;
    if (completed) {
      const report = await generateReport({
        company: interview.company,
        role: interview.role,
        type: interview.type,
        questions: interview.questions,
      });
      if (
        !Number.isFinite(report.overallScore)
        || report.overallScore < 0
        || report.overallScore > 100
        || typeof report.summary !== "string"
        || !Array.isArray(report.strengths)
        || !Array.isArray(report.weaknesses)
        || !Array.isArray(report.recommendations)
      ) {
        throw new Error("The AI returned an invalid final report.");
      }
      interview.overallScore = report.overallScore;
      interview.summary = report.summary;
      interview.strengths = report.strengths;
      interview.weaknesses = report.weaknesses;
      interview.recommendations = report.recommendations;
      interview.status = "completed";
    }

    await interview.save();
    await invalidateInterviewCaches(userId, interview._id);
    return res.status(200).json({
      success: true,
      completed,
      interview: toActiveInterview(interview),
      feedback,
      ...(completed
        ? {}
        : {
          currentQuestion: interview.currentQuestion,
          totalQuestions: interview.questions.length,
          question: toActiveQuestion(interview.questions[interview.currentQuestion].toObject()),
        }),
    });
  } catch (error) {
    console.error("Failed to submit company interview answer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to evaluate the answer.",
    });
  }
};

export const getCompanyInterviews = async (req, res) => {
  const userId = userIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authenticated user is required." });
  }

  try {
    const cacheKey = historyCacheKey(userId);
    const cachedHistory = await getCached(cacheKey);
    if (cachedHistory) {
      return res.status(200).json({
        success: true,
        interviews: JSON.parse(cachedHistory),
        fromCache: true,
      });
    }

    const interviews = await CompanyInterview.find({ userId })
      .select("company role type status overallScore createdAt currentQuestion questions.question questions.difficulty questions.feedback.score")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    await setCached(cacheKey, interviews);
    return res.status(200).json({ success: true, interviews, fromCache: false });
  } catch (error) {
    console.error("Failed to load company interviews:", error);
    return res.status(500).json({ success: false, message: "Failed to load company interviews." });
  }
};

export const getCompanyInterview = async (req, res) => {
  const userId = userIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authenticated user is required." });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid company interview ID." });
  }

  try {
    const cacheKey = detailCacheKey(userId, req.params.id);
    const cachedInterview = await getCached(cacheKey);
    if (cachedInterview) {
      return res.status(200).json({
        success: true,
        interview: JSON.parse(cachedInterview),
        fromCache: true,
      });
    }

    const interview = await CompanyInterview.findOne({ _id: req.params.id, userId });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Company interview not found." });
    }
    const historyInterview = toHistoryInterview(interview);
    await setCached(cacheKey, historyInterview);
    return res.status(200).json({ success: true, interview: historyInterview, fromCache: false });
  } catch (error) {
    console.error("Failed to load company interview:", error);
    return res.status(500).json({ success: false, message: "Failed to load company interview." });
  }
};
