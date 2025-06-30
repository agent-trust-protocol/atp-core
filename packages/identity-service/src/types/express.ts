import 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: {
        did: string;
        id: string;
        [key: string]: any;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    pendingBackupCodes?: string[];
    [key: string]: any;
  }
}