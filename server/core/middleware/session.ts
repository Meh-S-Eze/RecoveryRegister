import session from 'express-session';
import MemoryStore from 'memorystore';
import { db } from '../../db';

const MemoryStoreSession = MemoryStore(session);

interface SessionConfig {
  secret: string;
  name?: string;
  proxy?: boolean;
  resave?: boolean;
  rolling?: boolean;
  saveUninitialized?: boolean;
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    domain?: string;
  };
}

/**
 * Configure session middleware with security settings
 */
export function configureSession() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base configuration
  const config: SessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    name: 'recovery.sid', // Custom cookie name
    proxy: isProduction, // Trust proxy in production
    resave: false,
    rolling: true, // Reset expiration on activity
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Only send cookie over HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'none' : 'lax', // Required for cross-origin in production
    }
  };

  // Configure cookie domain in production
  if (isProduction && process.env.COOKIE_DOMAIN) {
    config.cookie!.domain = process.env.COOKIE_DOMAIN;
  }

  // Use memory store for development, database store for production
  const store = isProduction
    ? new MemoryStoreSession({
        checkPeriod: 86400000 // Prune expired entries every 24h
      })
    : new MemoryStoreSession({
        checkPeriod: 86400000
      });

  return session({
    ...config,
    store
  });
}

/**
 * Configure CORS settings
 */
export const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}; 