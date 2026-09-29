import express from "express"

import { getResume, uploadResume } from "../controllers/resume.controller.js"
import { upload } from "../middleware/multer.js"

const resumeRouter = express.Router()


resumeRouter.post("/upload",upload.single("resume"),uploadResume) //first upload the resume using middleware using multer then run uploadResume controller.

resumeRouter.get("/get-resume",getResume)

export default resumeRouter;