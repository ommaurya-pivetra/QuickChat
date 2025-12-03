import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from '../lib/Cloudinary.js'

export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password");

        // Optionally calculate unseen message counts per user
        const promises = users.map(async (user) => {
            const count = await Message.countDocuments({ senderId: user._id, reciverId: userId, seen: false });
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
        const {reciverId}=req.params;
        const messages=await Message.find({
            $or:[
                {senderId:userId,reciverId:reciverId},
                {senderId:reciverId,reciverId:userId},
            ],
        }).sort({createdAt:1});
        await Message.updateMany(
            {senderId:reciverId,reciverId:userId},
            {$set:{seen:true}}
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
        const senderId = req.user._id;
        // Accept receiver id in body (route is POST /send)
        const { reciverId, text, image } = req.body;

        let imageUrl = null;
        if (image) {
            const upload = await cloudinary.uploader.upload(image);
            imageUrl = upload.secure_url;
        }

        const newMessage = new Message({ senderId, reciverId, text, image: imageUrl });

        await newMessage.save();
        return res.status(200).json({ success: true, message: "Message sent successfully", newMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};