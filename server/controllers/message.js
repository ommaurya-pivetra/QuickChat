import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from '../lib/Cloudinary.js'
import { io, userSocketMap } from '../server.js';
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password");

        // Optionally calculate unseen message counts per user
        const promises = users.map(async (user) => {
            const count = await Message.countDocuments({ senderId: user._id, receiverId: userId, seen: false });
            return { userId: user._id, unseen: count };
        });
        const unseenArray = await Promise.all(promises);
        const unseenMap = {};
        unseenArray.forEach((u) => {
            if (u.unseen > 0) unseenMap[u.userId] = u.unseen;
        });

        return res.status(200).json({ success: true, users, unseen: unseenMap });
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getMessage=async(req,res)=>{
    try{
        const userId=req.user._id;
        const {id:selectedUserId}=req.params;
        const messages=await Message.find({
            $or:[
                {senderId:userId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:userId},
            ],
        });
        await Message.updateMany(
            {senderId:selectedUserId,receiverId:userId},
            {seen:true}
        );
        return res.status(200).json({
            success:true,
            messages,
        });
    }catch(error){
        console.error("Error fetching messages:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}

export const markMessagesAsSeen=async(req,res)=>{
    try{

        const {id}=req.params;

        await Message.findByIdAndUpdate(
            id,
            {$set:{seen:true}},
        );
        return res.status(200).json({
            success:true,
            message:"Messages marked as seen",
        });
    }catch(error){
        console.error("Error marking messages as seen:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }       
}
export const sendMessage = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized - No token" });
        }
        const senderId = req.user._id;
        const receiverId = req.params.id;
        const { text, image } = req.body;

        let imageUrl = null;
        if (image) {
            const upload = await cloudinary.uploader.upload(image, { folder: "messages" });
            imageUrl = upload.secure_url;
        }

        const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl });

        // Emit newMessage to receiver if online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        // Respond immediately so the sender's client can append the message first
        res.status(200).json({ success: true, message: "Message sent successfully", newMessage });

        // If sending to the AI user, trigger the AI reply asynchronously so it doesn't arrive before the user's message
        if (receiverId === process.env.AI_USER_ID) {
          aiSendMessage(senderId, text).catch(err => console.error("AI send message error:", err));
        }
        return;
    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const aiSendMessage = async (senderId, text) => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
    });

    const aiReply = response.candidates[0].content.parts[0].text;

   

    // ✅ When ready, you can save and emit:
    const newMessage = await Message.create({
      senderId: process.env.AI_USER_ID,
      receiverId: senderId,
      text: aiReply,
    });

    const receiverSocketId = userSocketMap[senderId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
    }
     console.log("AI USER ID:", process.env.AI_USER_ID);
    

  } catch (err) {
    console.error("❌ GEMINI ERROR:", err.message);
  }
};
