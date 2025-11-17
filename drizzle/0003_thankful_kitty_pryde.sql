ALTER TABLE `users` ADD `linkingCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isLinked` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_linkingCode_unique` UNIQUE(`linkingCode`);