import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is required to run the company interview service.");
}

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.2,
  maxRetries: 2,
});

export default llm;
