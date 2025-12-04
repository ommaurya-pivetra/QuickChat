import express from 'express';
import {checkAuth, login,signup,updateUserProfile} from '../controllers/User.js';
import {auth} from '../middleware/auth.js';

const userRouter=express.Router();

userRouter.post('/signup',signup);
userRouter.post('/login',login);
userRouter.put('/update-profile',auth,updateUserProfile);
userRouter.get('/check',auth,checkAuth);

export default userRouter;