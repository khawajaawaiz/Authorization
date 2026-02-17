import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/auth/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/auth/login');
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.clearCookie('token');
        return res.redirect('/auth/login');
    }
};

export default verifyToken;
