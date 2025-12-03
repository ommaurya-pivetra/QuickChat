import User from "../models/User.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/Cloudinary.js";
import { generateToken } from "../lib/utils.js";

export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if(!fullName || !email || !password){
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ fullName, email, password: hashedPassword, bio });
        const token = generateToken(user._id);

        const userObject = user.toObject();
        userObject.password = undefined;

         return res.cookie("token", token, { httpOnly: true }).status(200).json({ success: true, message: "Login successful", user: userObject, token });
         
        } catch (error) {
        console.error("Error during user registration:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found, please register" });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = generateToken(user._id);
            const userObject = user.toObject();
            userObject.password = undefined;
            return res.cookie("token", token, { httpOnly: true }).status(200).json({ success: true, message: "Login successful", user: userObject, token });
        }

        return res.status(403).json({ success: false, message: "Incorrect password" });
    } catch (error) {
        console.error("Error during user login:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const checkAuth = async (req, res) => {
    res.json({ success: true, message: "User is authenticated", user: req.user });
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, bio, profilePic } = req.body;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { fullName, bio }, { new: true });
        } else {
            const upload = await cloudinary.uploader.upload(profilePic, { folder: "profile_pics" });
            updatedUser = await User.findByIdAndUpdate(userId, { fullName, bio, profilePic: upload.secure_url }, { new: true });
        }

        if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
