import express from "express"
import { GoogleAuth, logOut, useCoins , addCoins } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/login",GoogleAuth)

authRouter.get("/logout",logOut)

authRouter.post("/use-coins",useCoins)

authRouter.get("/add-coins",addCoins)

export default authRouter