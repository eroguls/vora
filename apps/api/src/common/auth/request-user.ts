import type { Request } from 'express';

export interface RequestUser {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  adminRole?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}
