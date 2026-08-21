ALTER TABLE `link_pages` ADD `photoSize` varchar(20) DEFAULT 'md';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `photoShape` varchar(20) DEFAULT 'circle';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `backgroundType` varchar(20) DEFAULT 'solid';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `backgroundGradient` varchar(200);--> statement-breakpoint
ALTER TABLE `link_pages` ADD `buttonStyle` varchar(30) DEFAULT 'rounded';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `buttonBg` varchar(20);--> statement-breakpoint
ALTER TABLE `link_pages` ADD `buttonTextColor` varchar(20) DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `fontFamily` varchar(50) DEFAULT 'inter';--> statement-breakpoint
ALTER TABLE `link_pages` ADD `showBranding` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `web_services` ADD `images` json;