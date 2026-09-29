

// pdf  ---->  pdf Storage  ---> text ---> llm ---> agent ---> promt ---> data ---> save mongoDb ---> redis -->pdf delete ---> resume data ( score , missing skills , recommen.)

import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs"


export const uploadResume = async (req, res) => {
    try {
        const file = req.file; //from frontend
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF is required"
            })
        }
        const userId = req.headers["x-user-id"]; //headers is set using proxy header in gateway when calling resume api.

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required"
            })
        }

        const resumeText = await extractText(file.path) //pdf.js in conifg used to extract text.

        const aiResponse = await resumeAgent(resumeText) //send the text in resume agent

        const resumeData = JSON.parse(aiResponse)

        let resume = await Resume.findOne({ userId }) //if resume already exist , replace it.

        if (resume) {
            Object.assign(resume, { //replace old resume data with new one
                ...resumeData,
                extractedText: resumeText

            }
            )
            await resume.save()
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData
            })
        }

        await redis.set(`resume:${userId}`, JSON.stringify(resume)); //store in redis to fetch it fastly

        await fs.unlinkSync(file.path); //delete the pdf

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume
        })


    } catch (error) {
        console.log(error)

        if (file) {
            await fs.unlinkSync(file.path); // if error then delete the pdf bcz if we do not delete it , it will create files and if there is an error then it all files will continue to upload.
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        })

    }
}


export const getResume = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const cache = await redis.get(`resume:${userId}`)

        if (cache) {
            return res.status(200).json({
                success: true,
                source: "redis",
                data: JSON.parse(cache)
            })
        }
        const resume = await Resume.findOne({ userId })

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "resume not found"
            })
        }

        await redis.set(`resume:${userId}`, JSON.stringify(resume));


        return res.status(200).json({
            success: true,
            source: "mongoDb",
            data: resume
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}