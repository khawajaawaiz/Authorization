import express from 'express';
import authController from '../controllers/authController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

router.get('/register', (req, res) => {
    if (req.cookies.token) {
        return res.redirect('/auth/dashboard');
    }
    res.render('register');
});

router.post('/register', authController.registerUser);

router.get('/login', (req, res) => {
    if (req.cookies.token) {
        return res.redirect('/auth/dashboard');
    }
    res.render('login');
});

router.post('/login', authController.loginUser);

router.post('/logout', authController.logoutUser);

router.get('/dashboard', verifyToken, authController.getDashboard);

export default router;
