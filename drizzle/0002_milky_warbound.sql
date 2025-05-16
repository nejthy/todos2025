PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`ingredients` text NOT NULL,
	`steps` text NOT NULL,
	`averageRating` real DEFAULT 0,
	`votesCount` integer DEFAULT 0,
	`userId` integer,
	`imagePath` text DEFAULT 'default.jpg',
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recipes`("id", "title", "ingredients", "steps", "averageRating", "votesCount", "userId", "imagePath") SELECT "id", "title", "ingredients", "steps", "averageRating", "votesCount", "userId", "imagePath" FROM `recipes`;--> statement-breakpoint
DROP TABLE `recipes`;--> statement-breakpoint
ALTER TABLE `__new_recipes` RENAME TO `recipes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;