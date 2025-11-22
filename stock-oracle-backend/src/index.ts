import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { testLLMConnection } from './config/llm';
import { logger } from './utils/logger';
import { errorHandler } from './api/middleware/errorHandler';

// Routes
import chatRoutes from './api/routes/chat';
import authRoutes from './api/routes/auth'; 

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins for hackathon simplicity
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
// Allow all CORS for easier frontend integration during hackathon
app.use(cors({ origin: '*' })); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// --- NEW: Serve Agent 2 (Guardian) Data ---
// This exposes the JSON output from the Python predictive agent
const guardianOutputPath = path.join(__dirname, '../agent2-predictive-guardian/output');
app.use('/api/guardian', express.static(guardianOutputPath));
// ------------------------------------------

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
  });
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Startup
async function start() {
  try {
    logger.info('🚀 Starting Stock Oracle Backend...');

    // Connect to database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test LLM connection
    const llmConnected = await testLLMConnection();
    if (!llmConnected) {
      logger.warn('⚠️  LLM connection test failed, but continuing in Fallback Mode...');
    }

    // Start server
    httpServer.listen(config.server.port, () => {
      logger.info(`✅ Server running on port ${config.server.port}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🌍 Environment: ${config.server.nodeEnv}`);
      logger.info(`🤖 LLM Provider: ${config.llm.provider}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
});

// Start the server
start();