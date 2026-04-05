CREATE TABLE `advice_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text,
	`is_default` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `advice_templates_clinic_title_idx` ON `advice_templates` (`clinic_id`,`title`);--> statement-breakpoint
CREATE INDEX `advice_templates_clinic_category_idx` ON `advice_templates` (`clinic_id`,`category`);--> statement-breakpoint
CREATE INDEX `advice_templates_clinic_usage_idx` ON `advice_templates` (`clinic_id`,`usage_count`);--> statement-breakpoint
CREATE TABLE `budget_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`target_revenue` real NOT NULL,
	`target_expenses` real,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_clinic_year_month_idx` ON `budget_targets` (`clinic_id`,`year`,`month`);--> statement-breakpoint
CREATE TABLE `callback_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`handled_by` text,
	`handled_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `callback_clinic_status_idx` ON `callback_requests` (`clinic_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`website` text,
	`current_shared_receipt_id` text,
	`current_shared_receipt_expires_at` text,
	`receipt_share_duration_minutes` integer DEFAULT 10 NOT NULL,
	`logo_url` text,
	`header_text` text,
	`footer_text` text,
	`tax_info` text,
	`public_profile` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clinics_slug_unique` ON `clinics` (`slug`);--> statement-breakpoint
CREATE TABLE `diagnosis_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`icd_code` text,
	`category` text,
	`description` text,
	`is_default` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diag_templates_clinic_name_idx` ON `diagnosis_templates` (`clinic_id`,`name`);--> statement-breakpoint
CREATE INDEX `diag_templates_clinic_usage_idx` ON `diagnosis_templates` (`clinic_id`,`usage_count`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`expense_date` text NOT NULL,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurring_frequency` text,
	`vendor` text,
	`invoice_number` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expenses_clinic_date_idx` ON `expenses` (`clinic_id`,`expense_date`);--> statement-breakpoint
CREATE INDEX `expenses_clinic_category_idx` ON `expenses` (`clinic_id`,`category`);--> statement-breakpoint
CREATE INDEX `expenses_clinic_recurring_idx` ON `expenses` (`clinic_id`,`is_recurring`);--> statement-breakpoint
CREATE TABLE `medication_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`dosage` text NOT NULL,
	`duration` text NOT NULL,
	`instructions` text,
	`category` text,
	`description` text,
	`source` text DEFAULT 'custom' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `med_templates_clinic_name_idx` ON `medication_templates` (`clinic_id`,`name`);--> statement-breakpoint
CREATE INDEX `med_templates_clinic_category_idx` ON `medication_templates` (`clinic_id`,`category`);--> statement-breakpoint
CREATE INDEX `med_templates_clinic_usage_idx` ON `medication_templates` (`clinic_id`,`usage_count`);--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`patient_snapshot` text NOT NULL,
	`diagnosis` text,
	`chief_complaints` text,
	`medications` text DEFAULT '[]' NOT NULL,
	`advice` text,
	`follow_up_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`finalized_at` text,
	`pdf_generated_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prescriptions_visit_id_unique` ON `prescriptions` (`visit_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `prescriptions_visit_id_idx` ON `prescriptions` (`visit_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_clinic_created_idx` ON `prescriptions` (`clinic_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`visit_id` text,
	`receipt_number` text NOT NULL,
	`patient_snapshot` text NOT NULL,
	`prescription_snapshot` text,
	`line_items` text DEFAULT '[]' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`discount_reason` text,
	`total_amount` real DEFAULT 0 NOT NULL,
	`payment_mode` text,
	`is_paid` integer DEFAULT false NOT NULL,
	`receipt_date` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`last_shared_at` text,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receipts_clinic_number_idx` ON `receipts` (`clinic_id`,`receipt_number`);--> statement-breakpoint
CREATE INDEX `receipts_clinic_date_idx` ON `receipts` (`clinic_id`,`receipt_date`);--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`default_amount` real,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `svc_categories_clinic_name_idx` ON `service_categories` (`clinic_id`,`name`);--> statement-breakpoint
CREATE INDEX `svc_categories_clinic_sort_idx` ON `service_categories` (`clinic_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`login_history` text DEFAULT '[]' NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_clinic_id_idx` ON `users` (`clinic_id`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`patient_name` text NOT NULL,
	`patient_phone` text NOT NULL,
	`patient_age` integer,
	`patient_gender` text,
	`visit_reason` text NOT NULL,
	`visit_date` text NOT NULL,
	`token_number` integer,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_by` text NOT NULL,
	`consulted_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `visits_clinic_date_status_idx` ON `visits` (`clinic_id`,`visit_date`,`status`);--> statement-breakpoint
CREATE INDEX `visits_clinic_patient_phone_idx` ON `visits` (`clinic_id`,`patient_phone`);