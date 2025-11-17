ALTER TABLE `orders` MODIFY COLUMN `installments` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentId` varchar(255);