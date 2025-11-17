import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { syncPhotosFromDrive, extractDriveFolderId } from "./googleDrive";
import { createPixPayment, getPaymentStatus } from "./payment";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    linkAccount: protectedProcedure
      .input(z.object({ linkingCode: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Busca cliente pelo código de vinculação
        const clients = await db.getAllClients();
        const client = clients.find((c: any) => c.linkingCode === input.linkingCode);
        
        if (!client) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Código de vinculação inválido',
          });
        }
        
        if (client.isLinked) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Este código já foi utilizado',
          });
        }
        
        // Verificação de segurança: email matching (opcional)
        if (client.email && ctx.user.email && client.email !== ctx.user.email) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'O email da sua conta não corresponde ao cadastro',
          });
        }
        
        // Atualiza o cliente com o openId da conta social
        await db.updateClient(client.id, {
          openId: ctx.user.openId,
          isLinked: 1,
          linkedAt: new Date(),
          linkingCode: null as any, // Remove o código após uso
        });
        
        return { success: true };
      }),
  }),

  // Portfolio management
  portfolio: router({
    getActive: publicProcedure.query(async () => {
      return await db.getActivePortfolioItems();
    }),
    
    getAll: adminProcedure.query(async () => {
      return await db.getAllPortfolioItems();
    }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string(),
        category: z.string().optional(),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createPortfolioItem(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePortfolioItem(id, data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePortfolioItem(input.id);
      }),
  }),

  // Client man  // Payments
  payments: router({
    createPix: protectedProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        
        if (order.clientId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const payment = await createPixPayment({
          transactionAmount: order.totalAmount,
          description: `Pedido #${order.orderNumber} - Studio Milca Fotografia`,
          email: ctx.user.email || '',
          firstName: ctx.user.name?.split(' ')[0],
          lastName: ctx.user.name?.split(' ').slice(1).join(' '),
        });
        
        // Atualiza o pedido com o ID do pagamento
        await db.updateOrder(input.orderId, {
          paymentId: payment.id,
        });
        
        return payment;
      }),
    
    checkStatus: protectedProcedure
      .input(z.object({
        paymentId: z.string(),
      }))
      .query(async ({ input }) => {
        return await getPaymentStatus(input.paymentId);
      }),
  }),

  // Client management
  clients: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllClients();
    }),
    
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Gera código de vinculação único
        const linkingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Cria usuário com openId temporário
        const tempOpenId = `temp_${Date.now()}_${Math.random()}`;
        
        const client = await db.createClient({
          openId: tempOpenId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: 'client' as any,
          linkingCode,
          isLinked: 0,
        });
        
        return client;
      }),
    
    regenerateLinkingCode: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input }) => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.updateClient(input.clientId, { linkingCode: newCode });
        return { linkingCode: newCode };
      }),
  }),

  // Photoshoot management
  photoshoots: router({
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Clients can only see their own photoshoots
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getPhotoshootsByClient(input.clientId);
      }),
    
    getAll: adminProcedure.query(async () => {
      return await db.getAllPhotoshoots();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const photoshoot = await db.getPhotoshootById(input.id);
        if (!photoshoot) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        // Check permissions
        if (ctx.user.role !== 'admin' && ctx.user.id !== photoshoot.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return photoshoot;
      }),
    
    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        googleDriveUrl: z.string().optional(),
        shootDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPhotoshoot(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        googleDriveUrl: z.string().optional(),
        shootDate: z.date().optional(),
        status: z.enum(["pending", "available", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePhotoshoot(id, data);
      }),
    
    syncPhotos: adminProcedure
      .input(z.object({
        photoshootId: z.number(),
        googleDriveUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await syncPhotosFromDrive(
          input.photoshootId,
          input.googleDriveUrl,
          db
        );
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Failed to sync photos',
          });
        }
        
        // Atualiza o status do ensaio para "available" após sincronização
        await db.updatePhotoshoot(input.photoshootId, {
          status: 'available',
          googleDriveUrl: input.googleDriveUrl,
        });
        
        return result;
      }),
  }),

  // Photos
  photos: router({
    getByPhotoshoot: protectedProcedure
      .input(z.object({ photoshootId: z.number() }))
      .query(async ({ input, ctx }) => {
        const photoshoot = await db.getPhotoshootById(input.photoshootId);
        if (!photoshoot) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        // Check permissions
        if (ctx.user.role !== 'admin' && ctx.user.id !== photoshoot.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getPhotosByPhotoshoot(input.photoshootId);
      }),
  }),

  // Orders
  orders: router({
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getOrdersByClient(input.clientId);
      }),
    
    getAll: adminProcedure.query(async () => {
      return await db.getAllOrders();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (ctx.user.role !== 'admin' && ctx.user.id !== order.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return order;
      }),
    
    create: protectedProcedure
      .input(z.object({
        photoshootId: z.number(),
        items: z.array(z.object({
          photoId: z.number(),
          format: z.enum(["digital", "digital_printed"]),
          printSize: z.enum(["10x15", "15x21", "20x25", "20x30"]).optional(),
          quantity: z.number().default(1),
        })),
        paymentMethod: z.enum(["pix", "credit", "debit"]),
        installments: z.number().default(1),
        deliveryMethod: z.enum(["pickup", "delivery"]),
        deliveryAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${ctx.user.id}`;
        
        // Calculate total (simplified - should get prices from settings)
        const totalAmount = input.items.length * 1000; // 10 reais per item as example
        
        // Create order
        const orderResult = await db.createOrder({
          clientId: ctx.user.id,
          photoshootId: input.photoshootId,
          orderNumber,
          totalAmount,
          paymentMethod: input.paymentMethod,
          installments: input.installments,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress,
        });
        
        // Get the inserted order ID
        const orderId = (orderResult as any).insertId;
        
        // Create order items
        for (const item of input.items) {
          await db.createOrderItem({
            orderId: Number(orderId),
            photoId: item.photoId,
            format: item.format,
            printSize: item.printSize,
            quantity: item.quantity,
            unitPrice: 1000, // Example price
          });
        }
        
        return { success: true, orderNumber };
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum([
          "awaiting_payment",
          "payment_approved",
          "in_editing",
          "editing_done",
          "in_printing",
          "printing_done",
          "ready_for_pickup",
          "out_for_delivery",
          "delivered",
          "cancelled"
        ]),
      }))
      .mutation(async ({ input }) => {
        const paymentConfirmedAt = input.status === "payment_approved" ? new Date() : undefined;
        return await db.updateOrderStatus(input.id, input.status, paymentConfirmedAt);
      }),
  }),

  // Price settings
  prices: router({
    getAll: publicProcedure.query(async () => {
      return await db.getPriceSettings();
    }),
    
    upsert: adminProcedure
      .input(z.object({
        itemType: z.string(),
        price: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.upsertPriceSetting(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
