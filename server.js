import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', { user: req.cookies.token ? { username: 'User' } : null });
});

app.use('/auth', authRoutes);
app.use('/blog', blogRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1>');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('<h1>500 - Server Error</h1>');
});

app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 Server is running!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('==========================================');
});
