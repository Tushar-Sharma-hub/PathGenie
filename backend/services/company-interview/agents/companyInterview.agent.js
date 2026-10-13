import llm from "../config/llm.js";
import {
  feedbackPrompt,
  questionPrompt,
  reportPrompt,
} from "../prompts/companyInterview.prompt.js";

const parseJson = (content) => {
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part) => typeof part === "string" ? part : part.text ?? "").join("")
      : "";
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};

const invokeJson = async (prompt, description) => {
  try {
    const response = await llm.invoke(prompt);
    return parseJson(response.content);
  } catch (error) {
    console.error(`Company interview ${description} generation failed:`, error);
    throw new Error(`Failed to generate company interview ${description}.`);
  }
};

export const generateQuestions = async (input) => {
  const questions = await invokeJson(questionPrompt(input), "questions");
  const expectedDifficulties = ["easy", "easy", "medium", "medium", "hard"];
  if (
    !Array.isArray(questions)
    || questions.length !== 5
    || questions.some(
      (item, index) =>
        !item
        || typeof item.question !== "string"
        || !item.question.trim()
        || typeof item.idealAnswer !== "string"
        || !item.idealAnswer.trim()
        || item.difficulty !== expectedDifficulties[index]
    )
  ) {
    throw new Error("The AI returned an invalid interview question set.");
  }
  return questions;
};

export const evaluateAnswer = (input) =>
  invokeJson(feedbackPrompt(input), "answer feedback");

export const generateReport = (input) =>
  invokeJson(reportPrompt(input), "final report");
