import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import path from 'path';

dotenv.config();

const distPath = path.join(__dirname, '..', 'dist');
const logger = require(path.join(distPath, 'utils', 'logger'));
const voiceService = require(path.join(distPath, 'services', 'voice.service')).default;
const { envValidator } = require(path.join(distPath, 'config', 'env.validation'));
const envValidation = envValidator.validate();
if (!envValidation.isValid) {
  console.error(envValidator.getReport());
  console.error(' Environment validation failed. Server will not start.');
  process.exit(1);
}
if (envValidation.warnings.length > 0) {
  console.warn(envValidator.getReport());
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

const wss = new WebSocketServer({
  server,
  noServer: false,
  verifyClient: (info, callback) => {
    const url = parse(info.req?.url || '', true);
    logger.default.info('WebSocket verification', { pathname: url.pathname, url: info.req?.url });
    callback(true);
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api', require(path.join(distPath, 'middleware', 'rateLimit.middleware')).generalRateLimiter);
app.use(logger.requestLoggerMiddleware);
if (process.env.USE_MORGAN !== 'false') {
  app.use(morgan('dev'));
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suban_ai';
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  directConnection: false,
};

mongoose.connection.on('connected', () => {
  logger.default.info('MongoDB Connected', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
});
mongoose.connection.on('error', (err: Error) => {
  logger.default.error('MongoDB Connection Error', { error: err.message, stack: err.stack });
});
mongoose.connection.on('disconnected', () => {
  logger.default.warn('MongoDB Disconnected');
});
mongoose.connection.on('reconnected', () => {
  logger.default.info('MongoDB Reconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.default.info('MongoDB connection closed due to application termination');
  process.exit(0);
});

mongoose.connect(MONGODB_URI, mongooseOptions).catch((err: Error) => {
  logger.default.error('MongoDB Initial Connection Error', {
    error: err.message,
    stack: err.stack,
    note: 'Connection will retry automatically. If this persists, check your MONGODB_URI and network connectivity.',
  });
});

app.get('/', (_req, res) => {
  res.send('Likable AI API is running');
});

const authRoutes = require('../dist/api/auth.routes').default;
const chatRoutes = require('../dist/api/chat.routes').default;
const voiceRoutes = require('../dist/api/voice.routes').default;
const tokenRoutes = require('../dist/api/token.routes').default;
const memeRoutes = require('../dist/api/meme.routes').default;

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/meme', memeRoutes);

const useBsc = !!(process.env.TOKEN_CONTRACT_ADDRESS && process.env.TREASURY_WALLET_ADDRESS);

async function initializeBlockchainServices(): Promise<void> {
  try {
    if (useBsc) {
      logger.default.info('Initializing BSC services...');
      const bscPriceOracle = require(path.join(distPath, 'services', 'bsc', 'bsc-price-oracle.service')).default;
      await bscPriceOracle.fetchCurrentPrice();
      setInterval(async () => {
        try {
          await bscPriceOracle.fetchCurrentPrice();
        } catch (e: unknown) {
          logger.default.error('BSC price update failed', {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }, 2 * 60 * 1000);
      logger.default.info('BSC services initialized');
    } else {
      logger.default.warn(
        'BSC not configured (TOKEN_CONTRACT_ADDRESS and TREASURY_WALLET_ADDRESS required). Token price and deposit features will be limited.'
      );
    }
  } catch (error: unknown) {
    logger.default.error('Failed to initialize blockchain services', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

app.use(logger.errorLoggerMiddleware);

wss.on('connection', (ws, req) => {
  const url = parse(req.url || '', true);
  const pathname = url.pathname || '';
  logger.default.info('WebSocket connection attempt', { pathname, url: req.url });

  if (!pathname.includes('/voice/ws/')) {
    logger.default.warn('WebSocket connection rejected - invalid path', { path: pathname });
    ws.close(1008, 'Invalid path');
    return;
  }

  const pathParts = pathname.split('/').filter((p) => p);
  const sessionIdIndex = pathParts.indexOf('ws');
  const sessionId = sessionIdIndex >= 0 ? pathParts[sessionIdIndex + 1] : null;

  if (!sessionId) {
    logger.default.warn('WebSocket connection without sessionId', { path: url.pathname });
    ws.close(1008, 'Session ID required');
    return;
  }

  logger.default.info('WebSocket connection established', { sessionId });

  const session = voiceService.getSession(sessionId);
  if (!session) {
    logger.default.warn('WebSocket connection for non-existent session', { sessionId });
    ws.close(1008, 'Session not found');
    return;
  }

  const onAudio = (audioBuffer: Buffer) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'audio', data: audioBuffer.toString('base64') }));
    }
  };
  const onTranscript = (text: string) => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'transcript', text }));
  };
  const onTranscriptDone = () => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'transcript_done' }));
  };
  const onUserTranscript = (text: string) => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'user_transcript', text }));
  };
  const onSpeechStarted = () => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'speech_started' }));
  };
  const onSpeechStopped = () => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'speech_stopped' }));
  };
  const onResponseCreated = () => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'response_created' }));
  };
  const onResponseDone = () => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'response_done' }));
  };
  const onError = (error: Error) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'error', message: error.message || 'An error occurred' }));
    }
  };

  session.on('audio', onAudio);
  session.on('transcript', onTranscript);
  session.on('transcript_done', onTranscriptDone);
  session.on('user_transcript', onUserTranscript);
  session.on('speech_started', onSpeechStarted);
  session.on('speech_stopped', onSpeechStopped);
  session.on('response_created', onResponseCreated);
  session.on('response_done', onResponseDone);
  session.on('error', (error: Error) => {
    logger.default.error('Grok Voice session error', { error: error.message, sessionId });
    onError(error);
  });
  session.on('close', () => {
    logger.default.warn('Grok Voice session closed', { sessionId });
    if (ws.readyState === 1) ws.close(1001, 'Grok session closed');
  });
  session.on('error', (error: Error) => {
    logger.default.error('Grok Voice session error in handler', { error: error.message, sessionId });
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'error', message: error.message || 'Grok session error' }));
    }
  });
  session.on('connected', () => {
    logger.default.info('Grok Voice session connected', { sessionId });
  });

  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'connected', sessionId }));
  }

  ws.on('message', (message: Buffer) => {
    try {
      const currentSession = voiceService.getSession(sessionId);
      if (!currentSession || !currentSession.isConnected) {
        logger.default.warn('Received message for disconnected session', { sessionId });
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'error', message: 'Session disconnected' }));
          ws.close(1008, 'Session disconnected');
        }
        return;
      }
      const messageStr = message.toString();
      let data: { type?: string; data?: string; text?: string };
      try {
        data = JSON.parse(messageStr);
      } catch {
        logger.default.error('Failed to parse WebSocket message as JSON', {
          messagePreview: messageStr.substring(0, 100),
          sessionId,
        });
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        return;
      }
      if (data.type === 'audio' && data.data) {
        try {
          const audioBuffer = Buffer.from(data.data, 'base64');
          session.sendAudio(audioBuffer);
        } catch (audioError: unknown) {
          logger.default.error('Error sending audio to Grok', {
            error: audioError instanceof Error ? audioError.message : String(audioError),
            sessionId,
          });
        }
      } else if (data.type === 'text' && data.text) {
        try {
          session.sendText(data.text);
        } catch (textError: unknown) {
          logger.default.error('Error sending text to Grok', {
            error: textError instanceof Error ? textError.message : String(textError),
            sessionId,
          });
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to send text message' }));
        }
      } else if (data.type === 'input_audio_buffer.commit') {
        // no-op
      } else {
        logger.default.debug('Unknown WebSocket message type', { type: data.type, sessionId });
      }
    } catch (error: unknown) {
      logger.default.error('WebSocket message processing error', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
        } catch (sendError: unknown) {
          logger.default.error('Failed to send error message to client', {
            error: sendError instanceof Error ? sendError.message : String(sendError),
            sessionId,
          });
        }
      }
    }
  });

  ws.on('close', () => {
    logger.default.info('WebSocket connection closed', { sessionId });
    session.removeListener('audio', onAudio);
    session.removeListener('transcript', onTranscript);
    session.removeListener('transcript_done', onTranscriptDone);
    session.removeListener('user_transcript', onUserTranscript);
    session.removeListener('speech_started', onSpeechStarted);
    session.removeListener('speech_stopped', onSpeechStopped);
    session.removeListener('response_created', onResponseCreated);
    session.removeListener('response_done', onResponseDone);
    session.removeListener('error', onError);
  });

  ws.on('error', (error: Error) => {
    logger.default.error('WebSocket error', { error: error.message, sessionId });
  });
});

server.listen(PORT, async () => {
  logger.default.info('Server started', {
    service: 'suban-ai-backend',
    port: PORT,
    env: process.env.NODE_ENV || 'development',
  });
  console.log(`Server running on port ${PORT}`);
  await initializeBlockchainServices();
});
