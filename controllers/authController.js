import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import blogModel from '../models/blogModel.js';

const authController = {
    async registerUser(req, res) {
        try {
            const { username, email, password, confirmPassword } = req.body;

            if (!username || !email || !password || !confirmPassword) {
                return res.status(400).send(`
                    <h1>Registration Failed</h1>
                    <p>All fields are required.</p>
                    <a href="/auth/register">Try again</a>
                `);
            }

            if (password !== confirmPassword) {
                return res.status(400).send(`
                    <h1>Registration Failed</h1>
                    <p>Passwords do not match.</p>
                    <a href="/auth/register">Try again</a>
                `);
            }

            if (password.length < 8) {
                return res.status(400).send(`
                    <h1>Registration Failed</h1>
                    <p>Password must be at least 8 characters long.</p>
                    <a href="/auth/register">Try again</a>
                `);
            }

            const emailExists = await userModel.emailExists(email);
            if (emailExists) {
                return res.status(400).send(`
                    <h1>Registration Failed</h1>
                    <p>This email is already registered.</p>
                    <a href="/auth/login">Login instead</a>
                `);
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await userModel.create(email, hashedPassword, username);

            res.send(`
                <h1>Registration Successful! 🎉</h1>
                <p>Welcome, ${username}! Your account has been created.</p>
                <p>Redirecting to login page...</p>
                <script>setTimeout(() => window.location.href = '/auth/login', 2000);</script>
            `);

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).send(`
                <h1>Server Error</h1>
                <p>Something went wrong. Please try again later.</p>
                <a href="/auth/register">Back to registration</a>
            `);
        }
    },

    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).send(`
                    <h1>Login Failed</h1>
                    <p>Email and password are required.</p>
                    <a href="/auth/login">Try again</a>
                `);
            }

            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).send(`
                    <h1>Login Failed</h1>
                    <p>Invalid email or password.</p>
                    <a href="/auth/login">Try again</a>
                `);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).send(`
                    <h1>Login Failed</h1>
                    <p>Invalid email or password.</p>
                    <a href="/auth/login">Try again</a>
                `);
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 3600000,
                sameSite: 'strict'
            });

            res.redirect('/auth/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).send(`
                <h1>Server Error</h1>
                <p>Something went wrong. Please try again later.</p>
                <a href="/auth/login">Back to login</a>
            `);
        }
    },

    logoutUser(req, res) {
        res.clearCookie('token');
        res.redirect('/');
    },

    async getDashboard(req, res) {
        try {
            // Fetch users posts to display on dashboard
            const posts = await blogModel.findAll({ author_id: req.user.id });
            
            res.render('dashboard', {
                user: req.user,
                posts: posts
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send(`
                <h1>Server Error</h1>
                <p>Could not load dashboard. Please try again.</p>
                <a href="/">Go to home</a>
            `);
        }
    }
};

export default authController;
