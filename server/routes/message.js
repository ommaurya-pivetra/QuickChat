import express from "express";
import {auth} from '../middleware/auth.js';
import { getMessage, getUserForSidebar, markMessagesAsSeen, sendMessage } from "../controllers/message.js";
const messageRouter = express.Router();

// Define your message routes here
messageRouter.get("/users",auth,getUserForSidebar);
messageRouter.get("/:id",auth,getMessage);
messageRouter.put("/mark/:id",auth,markMessagesAsSeen);
messageRouter.post("/send/:id",auth,sendMessage);

export default messageRouter;
