import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import createTables from './models/setup.js';                      // Ensure tables are created before anything else
import classRoutes from './routes/classRoutes.js'

createTables();
config();

const app = express();

// Middleware
app.use(json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes',classRoutes);

export default app;
