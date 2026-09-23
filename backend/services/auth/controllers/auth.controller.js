import { app } from "../configs/firebase"
import {getAuth} from "firebase-admin/auth"
import User from "../models/user.model"
import crypto from "crypto"

export const GoogleAuth = async (req,res) => {
    try{
        const {token} = req.body

        const decoded = await getAuth(app).verifyIdToken(token) //it is the decoded value , we can use .uid .name to access it.(data of user)

        let user = await User.findOne({
            firebaseUid: decoded.uid
        })

        if(!user){
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email
            })
        }

        const sessionId = crypto.randomUUID()

        res.cookie("session",sessionId,{
            httponly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000,
        })

        return res.status(200).json({success:true,user});

    }catch(error){
        return res.status(500).json("Google auth error.",error);
    }
}