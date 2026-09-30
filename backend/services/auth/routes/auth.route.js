import express from "express"
import { GoogleAuth, logOut, useCoins } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/login",GoogleAuth)

authRouter.get("/logout",logOut)

authRouter.post("/use-Coins",useCoins)

export default authRouter