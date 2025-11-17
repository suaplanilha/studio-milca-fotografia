import { integer, pgEnum, pgTable, text, varchar, timestamp, boolean, serial } from "drizzle-orm/pg-core";

// Define enums
const roleEnum = pgEnum('role', ['user', 'admin', 'client']);
const photoshootStatusEnum = pgEnum('photoshoot_status', ['pending', 'available', 'archived']);
const paymentMethodEnum = pgEnum('payment_method', ['pix', 'credit', 'debit']);
const deliveryMethodEnum = pgEnum('delivery_method', ['pickup', 'delivery']);
const orderStatusEnum = pgEnum('order_status', [
  'awaiting_payment',
  'payment_approved',
  'in_editing',
  'editing_done',
  'in_printing',
  'printing_done',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled'
]);
const formatEnum = pgEnum('format', ['digital', 'digital_printed']);
const printSizeEnum = pgEnum('print_size', ['10x15', '15x21', '20x25', '20x30']);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('client').notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  clientPassword: varchar("clientPassword", { length: 255 }), // Senha gerada para clientes
  linkingCode: varchar("linkingCode", { length: 10 }).unique(), // Código para vincular conta social
  linkedAt: timestamp("linkedAt"), // Data de vinculação da conta social
  isLinked: integer("isLinked").default(0).notNull(), // 1 se conta social vinculada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Ensaios fotográficos
 */
export const photoshoots = pgTable("photoshoots", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  googleDriveUrl: text("googleDriveUrl"), // URL da pasta do Google Drive
  shootDate: timestamp("shootDate"),
  status: photoshootStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Photoshoot = typeof photoshoots.$inferSelect;
export type InsertPhotoshoot = typeof photoshoots.$inferInsert;

/**
 * Fotos individuais de cada ensaio
 */
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  photoshootId: integer("photoshootId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalUrl: text("originalUrl").notNull(), // URL original do Google Drive
  thumbnailUrl: text("thumbnailUrl"), // URL da thumbnail com marca d'água
  watermarkedUrl: text("watermarkedUrl"), // URL da versão com marca d'água
  fileOrder: integer("fileOrder").notNull(), // Ordem baseada no nome do arquivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * Pedidos de compra
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull(),
  photoshootId: integer("photoshootId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  totalAmount: integer("totalAmount").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  paymentId: varchar("paymentId", { length: 255 }),
  installments: integer("installments").default(1),
  deliveryMethod: deliveryMethodEnum("deliveryMethod").notNull(),
  deliveryAddress: text("deliveryAddress"),
  status: orderStatusEnum("status").default('awaiting_payment').notNull(),
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Itens do pedido (fotos selecionadas)
 */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  photoId: integer("photoId").notNull(),
  format: formatEnum("format").notNull(),
  printSize: printSizeEnum("printSize"),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: integer("unitPrice").notNull(), // Preço unitário em centavos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Trabalhos do portfólio para a landing page
 */
export const portfolioItems = pgTable("portfolioItems", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  category: varchar("category", { length: 100 }),
  displayOrder: integer("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

/**
 * Logs de acesso dos clientes
 */
export const accessLogs = pgTable("accessLogs", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

/**
 * Configurações de preços
 */
export const priceSettings = pgTable("priceSettings", {
  id: serial("id").primaryKey(),
  itemType: varchar("itemType", { length: 50 }).notNull().unique(), // 'digital', '10x15', '15x21', etc.
  price: integer("price").notNull(), // Preço em centavos
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PriceSetting = typeof priceSettings.$inferSelect;
export type InsertPriceSetting = typeof priceSettings.$inferInsert;
