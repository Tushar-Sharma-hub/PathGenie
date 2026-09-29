import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import llm from "../config/llm.js"

export const resumeAgent = async (resumeText) => {
    const response = await llm.invoke([
        new SystemMessage(`
You are an Expert ATS Resume Analyzer.

Analyze the given resume.

Extract the following information:

- Full Name
- Email
- Phone Number
- Professional Summary
- Technical Skills
- Projects
- Education
- Experience
- Strengths
- Weaknesses
- Missing Skills
- Suggested Job Role
- ATS Score (0-100)
- Recommendations

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Do not use markdown.
3. Do not explain anything.
4. Do not add extra text.
5. Every field must exist.
6. Every array must contain strings only. Do not return objects or nested arrays.
7. Represent each education, experience, and project entry as one concise string containing its relevant details.
8. Keep employment and internships in experience; keep personal, academic, and portfolio work in projects.
9. Do not invent missing details.

Response Format:

{
  "name":"",
  "email":"",
  "phone":"",
  "summary":"",
  "skills":[],
  "projects":[],
  "education":[],
  "experience":[],
  "strengths":[],
  "weaknesses":[],
  "missingSkills":[],
  "suggestedRole":"",
  "score":0,
  "recommendations":[]
}

Examples of array entries:
- education: ["B.Tech in Computer Science | Ramdeobaba University | 2024-2028 | CGPA: 8.97/10"]
- experience: ["Full-Stack Developer at Acme | 2024-2025 | Built and maintained web applications"]
- projects: ["AICRM | React, Node.js, MongoDB | Built an AI-enhanced CRM platform"]

All entries in skills, strengths, weaknesses, missingSkills, and recommendations must also be strings. Use [] when there are no entries.
`),
        new HumanMessage(resumeText), //data provide by us using resume text.
    ])

    return response.content;
}