// Session type declaration for express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}