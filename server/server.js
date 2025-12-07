import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Connectdb } from './lib/db.js';
import messageRouter from './routes/message.js';
import userRouter from './routes/User.js';
import {Server} from "socket.io";

dotenv.config();
const app = express();
const server=http.createServer(app);

export const io=new Server(server,{
    cors:{
        origin:"*"
    },
});

export const userSocketMap={};
io.on("connection",(socket)=>{
    console.log("New client connected",socket.id);
    const {userid}=socket.handshake.query;
    if(userid)
    userSocketMap[userid]=socket.id;
    io.emit("online-users",Object.keys(userSocketMap));
    socket.on("disconnect",()=>{
        console.log("Client disconnected",socket.id);
        delete userSocketMap[userid];
        io.emit("online-users",Object.keys(userSocketMap));
    });
});

app.use(cors());
// Increase body size limits to allow base64 image payloads from client
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/api/status", (req,res)=>res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages",messageRouter);

Connectdb()     

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
}

//Export server for testing purposes
export default server;

