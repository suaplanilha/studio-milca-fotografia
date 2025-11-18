import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { authMiddleware, loginWithCode, loginAsAdmin, logout, ensureAdminExists } from "../simpleAuth";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import cookie from "cookie";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migrations] DATABASE_URL not found, skipping migrations");
    return;
  }
  
  try {
    console.log("[Migrations] Running database migrations...");
    const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);
    await migrate(db, { migrationsFolder: "./drizzle" });
    await migrationClient.end();
    console.log("[Migrations] ✅ Migrations completed successfully!");
  } catch (error) {
    console.error("[Migrations] ⚠️ Migration failed:", error);
    // Não bloqueia o servidor se migrations falharem
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run migrations before starting server
  await runMigrations();
  
  // Ensure admin user exists
  await ensureAdminExists();
  
  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Apply auth middleware globally
  app.use(authMiddleware);
  
  // Simple Auth routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }
    
    const result = await loginWithCode(email, code);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    
    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, result.sessionId!, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    }));
    
    res.json({ success: true, user: result.user });
  });
  
  app.post("/api/auth/admin-login", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    const result = await loginAsAdmin(email);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    
    const cookieOptions = getSessionCookieOptions(req);
    res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, result.sessionId!, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60,
    }));
    
    res.json({ success: true, user: result.user });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies[COOKIE_NAME];
    
    if (sessionId) {
      logout(sessionId);
    }
    
    const cookieOptions = getSessionCookieOptions(req);
    res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
      ...cookieOptions,
      maxAge: -1,
    }));
    
    res.json({ success: true });
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
