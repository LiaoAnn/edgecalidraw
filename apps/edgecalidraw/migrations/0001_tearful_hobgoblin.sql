CREATE TABLE `library_items` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`elements` text NOT NULL,
	`created` integer NOT NULL,
	`name` text,
	`error` text
);
