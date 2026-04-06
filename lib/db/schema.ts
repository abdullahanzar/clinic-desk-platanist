import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export const generateId = () => crypto.randomUUID();

// ============================================
// CLINICS
// ============================================
export const clinics = sqliteTable("clinics", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address", { mode: "json" }).$type<{
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  }>().notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  website: text("website"),

  // QR Receipt System
  currentSharedReceiptId: text("current_shared_receipt_id"),
  currentSharedReceiptExpiresAt: text("current_shared_receipt_expires_at"),
  receiptShareDurationMinutes: integer("receipt_share_duration_minutes").notNull().default(10),

  // Branding
  logoUrl: text("logo_url"),
  headerText: text("header_text"),
  footerText: text("footer_text"),

  // Tax Information (JSON)
  taxInfo: text("tax_info", { mode: "json" }).$type<{
    gstin?: string;
    pan?: string;
    registrationNumber?: string;
    sacCode?: string;
    showTaxOnReceipt: boolean;
  }>(),

  // Public Profile (JSON)
  publicProfile: text("public_profile", { mode: "json" }).$type<{
    enabled: boolean;
    doctorName: string;
    qualifications: string;
    specialization: string;
    timings: string;
    aboutText?: string;
  }>().notNull(),

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// USERS
// ============================================
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["doctor", "frontdesk"] }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
  loginHistory: text("login_history", { mode: "json" }).$type<Array<{
    loginAt: string;
    ipAddress?: string;
    userAgent?: string;
  }>>().notNull().default(sql`'[]'`),
  createdByUserId: text("created_by_user_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("users_clinic_id_idx").on(table.clinicId),
]);

// ============================================
// SUPER ADMINS
// ============================================
export const superAdmins = sqliteTable("super_admins", {
  id: text("id").primaryKey().$defaultFn(generateId),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  mustChangeCredentials: integer("must_change_credentials", { mode: "boolean" }).notNull().default(true),
  usedDefaultCredentials: integer("used_default_credentials", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
  loginHistory: text("login_history", { mode: "json" }).$type<Array<{
    loginAt: string;
    ipAddress?: string;
    userAgent?: string;
  }>>().notNull().default(sql`'[]'`),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("super_admins_username_idx").on(table.username),
]);

// ============================================
// VISITS
// ============================================
export const visits = sqliteTable("visits", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  // Patient Info (flattened)
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender", { enum: ["male", "female", "other"] }),

  visitReason: text("visit_reason").notNull(),
  visitDate: text("visit_date").notNull(), // ISO date string
  tokenNumber: integer("token_number"),
  status: text("status", { enum: ["waiting", "in-consultation", "completed", "cancelled"] }).notNull().default("waiting"),

  createdBy: text("created_by").notNull(),
  consultedBy: text("consulted_by"),

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
}, (table) => [
  index("visits_clinic_date_status_idx").on(table.clinicId, table.visitDate, table.status),
  index("visits_clinic_patient_phone_idx").on(table.clinicId, table.patientPhone),
]);

// ============================================
// PRESCRIPTIONS
// ============================================
export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  visitId: text("visit_id").notNull().unique(),

  // Patient snapshot (JSON)
  patientSnapshot: text("patient_snapshot", { mode: "json" }).$type<{
    name: string;
    age?: number;
    gender?: string;
  }>().notNull(),

  diagnosis: text("diagnosis"),
  chiefComplaints: text("chief_complaints"),
  // Medications stored as JSON array (simpler than a child table for this use case;
  // medications are never queried individually, only read/replaced as a whole)
  medications: text("medications", { mode: "json" }).$type<Array<{
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }>>().notNull().default(sql`'[]'`),

  advice: text("advice"),
  followUpDate: text("follow_up_date"),

  status: text("status", { enum: ["draft", "finalized"] }).notNull().default("draft"),
  finalizedAt: text("finalized_at"),
  pdfGeneratedAt: text("pdf_generated_at"),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("prescriptions_visit_id_idx").on(table.visitId),
  index("prescriptions_clinic_created_idx").on(table.clinicId, table.createdAt),
]);

// ============================================
// RECEIPTS
// ============================================
export const receipts = sqliteTable("receipts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  visitId: text("visit_id"),

  receiptNumber: text("receipt_number").notNull(),

  // Patient snapshot (JSON)
  patientSnapshot: text("patient_snapshot", { mode: "json" }).$type<{
    name: string;
    phone?: string;
  }>().notNull(),

  // Prescription snapshot (JSON)
  prescriptionSnapshot: text("prescription_snapshot", { mode: "json" }).$type<{
    diagnosis?: string;
    advice?: string;
  }>(),

  // Line items (JSON array — never queried individually)
  lineItems: text("line_items", { mode: "json" }).$type<Array<{
    description: string;
    amount: number;
  }>>().notNull().default(sql`'[]'`),

  subtotal: real("subtotal").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  discountReason: text("discount_reason"),
  totalAmount: real("total_amount").notNull().default(0),

  paymentMode: text("payment_mode", { enum: ["cash", "upi", "card", "other"] }),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),

  receiptDate: text("receipt_date").notNull(), // ISO date string
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),

  lastSharedAt: text("last_shared_at"),
}, (table) => [
  uniqueIndex("receipts_clinic_number_idx").on(table.clinicId, table.receiptNumber),
  index("receipts_clinic_date_idx").on(table.clinicId, table.receiptDate),
]);

// ============================================
// CALLBACK REQUESTS
// ============================================
export const callbackRequests = sqliteTable("callback_requests", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  name: text("name").notNull(),
  phone: text("phone").notNull(),
  message: text("message"),

  status: text("status", { enum: ["pending", "contacted", "converted", "dismissed"] }).notNull().default("pending"),
  notes: text("notes"),

  handledBy: text("handled_by"),
  handledAt: text("handled_at"),

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("callback_clinic_status_idx").on(table.clinicId, table.status, table.createdAt),
]);

// ============================================
// MEDICATION TEMPLATES
// ============================================
export const medicationTemplates = sqliteTable("medication_templates", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),

  category: text("category"),
  description: text("description"),

  source: text("source", { enum: ["allopathic", "homeopathic", "custom"] }).notNull().default("custom"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("med_templates_clinic_name_idx").on(table.clinicId, table.name),
  index("med_templates_clinic_category_idx").on(table.clinicId, table.category),
  index("med_templates_clinic_usage_idx").on(table.clinicId, table.usageCount),
]);

// ============================================
// ADVICE TEMPLATES
// ============================================
export const adviceTemplates = sqliteTable("advice_templates", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  title: text("title").notNull(),
  content: text("content").notNull(),

  category: text("category"),

  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("advice_templates_clinic_title_idx").on(table.clinicId, table.title),
  index("advice_templates_clinic_category_idx").on(table.clinicId, table.category),
  index("advice_templates_clinic_usage_idx").on(table.clinicId, table.usageCount),
]);

// ============================================
// DIAGNOSIS TEMPLATES
// ============================================
export const diagnosisTemplates = sqliteTable("diagnosis_templates", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  name: text("name").notNull(),
  icdCode: text("icd_code"),

  category: text("category"),
  description: text("description"),

  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("diag_templates_clinic_name_idx").on(table.clinicId, table.name),
  index("diag_templates_clinic_usage_idx").on(table.clinicId, table.usageCount),
]);

// ============================================
// EXPENSES
// ============================================
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  description: text("description").notNull(),
  amount: real("amount").notNull(),
  category: text("category", {
    enum: ["rent", "salary", "supplies", "utilities", "equipment", "maintenance", "marketing", "insurance", "taxes", "other"],
  }).notNull(),

  expenseDate: text("expense_date").notNull(), // ISO date string

  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  recurringFrequency: text("recurring_frequency", { enum: ["monthly", "quarterly", "yearly"] }),

  vendor: text("vendor"),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("expenses_clinic_date_idx").on(table.clinicId, table.expenseDate),
  index("expenses_clinic_category_idx").on(table.clinicId, table.category),
  index("expenses_clinic_recurring_idx").on(table.clinicId, table.isRecurring),
]);

// ============================================
// BUDGET TARGETS
// ============================================
export const budgetTargets = sqliteTable("budget_targets", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  month: integer("month").notNull(),
  year: integer("year").notNull(),

  targetRevenue: real("target_revenue").notNull(),
  targetExpenses: real("target_expenses"),

  notes: text("notes"),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("budget_clinic_year_month_idx").on(table.clinicId, table.year, table.month),
]);

// ============================================
// SERVICE CATEGORIES
// ============================================
export const serviceCategories = sqliteTable("service_categories", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),

  name: text("name").notNull(),
  defaultAmount: real("default_amount"),
  description: text("description"),

  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),

  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("svc_categories_clinic_name_idx").on(table.clinicId, table.name),
  index("svc_categories_clinic_sort_idx").on(table.clinicId, table.sortOrder),
]);
