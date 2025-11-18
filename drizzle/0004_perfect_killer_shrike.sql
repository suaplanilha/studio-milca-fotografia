CREATE TABLE "accessLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"details" text,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"photoId" integer NOT NULL,
	"format" "format" NOT NULL,
	"printSize" "print_size",
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"photoshootId" integer NOT NULL,
	"orderNumber" varchar(50) NOT NULL,
	"totalAmount" integer NOT NULL,
	"paymentMethod" "payment_method" NOT NULL,
	"paymentId" varchar(255),
	"installments" integer DEFAULT 1,
	"deliveryMethod" "delivery_method" NOT NULL,
	"deliveryAddress" text,
	"status" "order_status" DEFAULT 'awaiting_payment' NOT NULL,
	"paymentConfirmedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"photoshootId" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"originalUrl" text NOT NULL,
	"thumbnailUrl" text,
	"watermarkedUrl" text,
	"fileOrder" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photoshoots" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"googleDriveUrl" text,
	"shootDate" timestamp,
	"status" "photoshoot_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolioItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"imageUrl" text NOT NULL,
	"category" varchar(100),
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "priceSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemType" varchar(50) NOT NULL,
	"price" integer NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "priceSettings_itemType_unique" UNIQUE("itemType")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'client' NOT NULL,
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zipCode" varchar(10),
	"clientPassword" varchar(255),
	"linkingCode" varchar(10),
	"linkedAt" timestamp,
	"isLinked" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_linkingCode_unique" UNIQUE("linkingCode")
);
