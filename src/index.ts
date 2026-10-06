import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { initScheduler } from './jobs/scheduler';

const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Utama
app.use('/api', apiRouter);

// 404 dan Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Inisialisasi Scheduled Cron Jobs
initScheduler();

// Start Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 ProtekSales API Server berjalan pada port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📄 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⏱️ Mode: ${config.nodeEnv}`);
  console.log('====================================================');
});

export default app;
