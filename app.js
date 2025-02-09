import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes.js';

config();

const app = express();

// Middleware
app.use(json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

export default app;
