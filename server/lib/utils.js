
import jwt from 'jsonwebtoken';

export const generateToken = (userid) => {
    const token = jwt.sign({ userid }, process.env.JWT_SECRET, { expiresIn: '3d' });
    return token;
};