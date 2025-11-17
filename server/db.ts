import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  photoshoots, InsertPhotoshoot,
  photos, InsertPhoto,
  orders, InsertOrder,
  orderItems, InsertOrderItem,
  portfolioItems, InsertPortfolioItem,
  accessLogs, InsertAccessLog,
  priceSettings, InsertPriceSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USERS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "address", "city", "state", "zipCode", "clientPassword"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL: usar onConflictDoUpdate ao invés de onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(users).values(data);
  
  // Busca o cliente recém-criado pelo email
  const result = await db.select().from(users).where(eq(users.email, data.email || '')).limit(1);
  return result[0];
}

export async function updateClient(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(users).set(data).where(eq(users.id, id));
  return await getUserById(id);
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, "client")).orderBy(desc(users.createdAt));
}

// ============ PHOTOSHOOTS ============
export async function createPhotoshoot(photoshoot: InsertPhotoshoot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photoshoots).values(photoshoot);
  return result;
}

export async function getPhotoshootsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photoshoots).where(eq(photoshoots.clientId, clientId)).orderBy(desc(photoshoots.createdAt));
}

export async function getPhotoshootById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(photoshoots).where(eq(photoshoots.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPhotoshoots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photoshoots).orderBy(desc(photoshoots.createdAt));
}

export async function updatePhotoshoot(id: number, data: Partial<InsertPhotoshoot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(photoshoots).set(data).where(eq(photoshoots.id, id));
}

// ============ PHOTOS ============
export async function createPhoto(photo: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(photos).values(photo);
}

export async function getPhotosByPhotoshoot(photoshootId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photos).where(eq(photos.photoshootId, photoshootId)).orderBy(photos.fileOrder);
}

export async function deletePhotosByPhotoshoot(photoshootId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(photos).where(eq(photos.photoshootId, photoshootId));
}

// ============ ORDERS ============
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrdersByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.clientId, clientId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const database = await getDb();
  if (!database) return null;
  
  await database.update(orders).set(data).where(eq(orders.id, id));
  return await getOrderById(id);
}

export async function updateOrderStatus(id: number, status: string, paymentConfirmedAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (paymentConfirmedAt) {
    updateData.paymentConfirmedAt = paymentConfirmedAt;
  }
  return await db.update(orders).set(updateData).where(eq(orders.id, id));
}

// ============ ORDER ITEMS ============
export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orderItems).values(item);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============ PORTFOLIO ============
export async function createPortfolioItem(item: InsertPortfolioItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(portfolioItems).values(item);
}

export async function getActivePortfolioItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolioItems).where(eq(portfolioItems.isActive, true)).orderBy(portfolioItems.displayOrder);
}

export async function getAllPortfolioItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolioItems).orderBy(portfolioItems.displayOrder);
}

export async function updatePortfolioItem(id: number, data: Partial<InsertPortfolioItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id));
}

export async function deletePortfolioItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
}

// ============ ACCESS LOGS ============
export async function createAccessLog(log: InsertAccessLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(accessLogs).values(log);
}

export async function getAccessLogsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accessLogs).where(eq(accessLogs.clientId, clientId)).orderBy(desc(accessLogs.createdAt));
}

// ============ PRICE SETTINGS ============
export async function getPriceSettings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(priceSettings).where(eq(priceSettings.isActive, true));
}

export async function upsertPriceSetting(setting: InsertPriceSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(priceSettings).where(eq(priceSettings.itemType, setting.itemType!)).limit(1);
  
  if (existing.length > 0) {
    return await db.update(priceSettings).set(setting).where(eq(priceSettings.itemType, setting.itemType!));
  } else {
    return await db.insert(priceSettings).values(setting);
  }
}
