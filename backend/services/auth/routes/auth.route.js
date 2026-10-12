import express from "express"
import { login, logOut, useCoins , addCoins } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/login",login)

authRouter.get("/logout",logOut)

authRouter.post("/add-coins",addCoins)

authRouter.post(
  "/use-coins",
  useCoins
);

export default authRouter