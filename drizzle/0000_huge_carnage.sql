CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`taxId` varchar(50),
	`address` text,
	`city` varchar(100),
	`postalCode` varchar(20),
	`country` varchar(100) DEFAULT 'España',
	`email` varchar(320),
	`phone` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`subject` varchar(255),
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`serviceId` int,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1',
	`description` text NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`ivaRate` int NOT NULL DEFAULT 21,
	`baseAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`ivaAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(10,2) NOT NULL DEFAULT '0',
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `invoice_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`sequence` int NOT NULL,
	`quoteId` int,
	`clientId` int,
	`clientName` varchar(255) NOT NULL,
	`clientTaxId` varchar(50),
	`clientAddress` text,
	`clientCity` varchar(100),
	`clientPostalCode` varchar(20),
	`clientCountry` varchar(100),
	`clientEmail` varchar(320),
	`date` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`notes` text,
	`paymentMethod` text,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0',
	`totalIva` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL DEFAULT '0',
	`pdfUrl` text,
	`pdfKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `link_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`photoUrl` text,
	`photoKey` text,
	`theme` varchar(50) DEFAULT 'default',
	`backgroundColor` varchar(20) DEFAULT '#ffffff',
	`textColor` varchar(20) DEFAULT '#000000',
	`accentColor` varchar(20) DEFAULT '#f97316',
	`links` json,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `link_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `link_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`serviceId` int,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1',
	`description` text NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`ivaRate` int NOT NULL DEFAULT 21,
	`baseAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`ivaAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(10,2) NOT NULL DEFAULT '0',
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`sequence` int NOT NULL,
	`clientId` int,
	`clientName` varchar(255) NOT NULL,
	`clientTaxId` varchar(50),
	`clientAddress` text,
	`clientCity` varchar(100),
	`clientPostalCode` varchar(20),
	`clientCountry` varchar(100),
	`clientEmail` varchar(320),
	`clientExtra` text,
	`date` timestamp NOT NULL DEFAULT (now()),
	`validUntil` timestamp,
	`notes` text,
	`status` enum('draft','sent','accepted','rejected','invoiced') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0',
	`totalIva` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL DEFAULT '0',
	`pdfUrl` text,
	`pdfKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`ivaRate` int NOT NULL DEFAULT 21,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_content_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
