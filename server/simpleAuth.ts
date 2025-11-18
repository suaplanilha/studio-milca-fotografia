import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import cookie from 'cookie';
import { COOKIE_NAME } from '../shared/const';
import { getSessionCookieOptions } from './_core/cookies';
import * as db from './db';

/**
 * Sistema de autenticação simples sem OAuth
 * Login com email e código de vinculação
 */

export interface SimpleAuthRequest extends Request {
  user?: any;
}

// Store de sessões em memória (em produção, use Redis)
const sessions = new Map<string, { userId: number; createdAt: Date }>();

/**
 * Middleware para verificar autenticação
 */
export async function authMiddleware(req: SimpleAuthRequest, res: Response, next: NextFunction) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies[COOKIE_NAME];

  if (!sessionId) {
    return next();
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return next();
  }

  // Verificar se sessão expirou (30 dias)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (session.createdAt < thirtyDaysAgo) {
    sessions.delete(sessionId);
    return next();
  }

  // Buscar usuário
  const user = await db.getUserById(session.userId);
  if (user) {
    req.user = user;
  }

  next();
}

/**
 * Login com email e código de vinculação
 */
export async function loginWithCode(email: string, linkingCode: string): Promise<{ success: boolean; sessionId?: string; user?: any; error?: string }> {
  try {
    // Buscar todos os clientes
    const clients = await db.getAllClients();
    
    // Encontrar cliente por email e código
    const client = clients.find((c: any) => 
      c.email?.toLowerCase() === email.toLowerCase() && 
      c.linkingCode === linkingCode.toUpperCase()
    );

    if (!client) {
      return { success: false, error: 'Email ou código inválidos' };
    }

    // Criar sessão
    const sessionId = nanoid();
    sessions.set(sessionId, {
      userId: client.id,
      createdAt: new Date(),
    });

    // Marcar como vinculado
    if (!client.isLinked) {
      await db.updateClient(client.id, {
        isLinked: 1,
        linkedAt: new Date(),
      });
    }

    return { success: true, sessionId, user: client };
  } catch (error) {
    console.error('[SimpleAuth] Login error:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
}

/**
 * Login direto para admin (desenvolvimento)
 */
export async function loginAsAdmin(email: string): Promise<{ success: boolean; sessionId?: string; user?: any; error?: string }> {
  try {
    const clients = await db.getAllClients();
    const admin = clients.find((c: any) => 
      c.email?.toLowerCase() === email.toLowerCase() && 
      c.role === 'admin'
    );

    if (!admin) {
      return { success: false, error: 'Admin não encontrado' };
    }

    const sessionId = nanoid();
    sessions.set(sessionId, {
      userId: admin.id,
      createdAt: new Date(),
    });

    return { success: true, sessionId, user: admin };
  } catch (error) {
    console.error('[SimpleAuth] Admin login error:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
}

/**
 * Logout
 */
export function logout(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Criar usuário admin inicial (se não existir)
 */
export async function ensureAdminExists() {
  try {
    const clients = await db.getAllClients();
    const hasAdmin = clients.some((c: any) => c.role === 'admin');

    if (!hasAdmin) {
      console.log('[SimpleAuth] Creating default admin user...');
      
      const adminOpenId = `admin_${nanoid()}`;
      await db.createClient({
        openId: adminOpenId,
        name: 'Administrador',
        email: 'admin@studiomilca.com',
        role: 'admin' as any,
        isLinked: 1,
        linkedAt: new Date(),
      });

      console.log('[SimpleAuth] ✅ Admin created!');
      console.log('[SimpleAuth] Email: admin@studiomilca.com');
      console.log('[SimpleAuth] Use this email to login as admin');
    }
  } catch (error) {
    console.error('[SimpleAuth] Error ensuring admin exists:', error);
  }
}
