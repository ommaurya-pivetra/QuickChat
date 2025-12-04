import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

export const auth=async(req,res,next)=>{
    try{
        const token=req.headers.token;
        if(!token || token===undefined){
            return res.status(401).json({
                success:false,
                message:"No token provided,authorization denied"});
        }
        try{
            const payload=jwt.verify(token,process.env.JWT_SECRET);
            const user=await User.findById(payload.userId).select("-password");
            console.log("payload token:",payload);
            req.user=user;
            next();
        }catch(err){
            console.error("Token verification failed:",err);
            return res.status(401).json({
                success:false,
                message:"Invalid token,authorization denied"});
        }

    }catch(error){
        console.error("Error in auth middleware:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}
