import { ObjectId } from "mongodb";

// ============================================
// CLINIC
// ============================================
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PublicProfile {
  enabled: boolean;
  doctorName: string;
  qualifications: string;
  specialization: string;
  timings: string;
  aboutText?: string;
}

export interface Clinic {
  _id: ObjectId;
  name: string;
  slug: string; // unique, for public URL
  address: Address;
  phone: string;
  email?: string;

  // QR Receipt System
  currentSharedReceiptId: ObjectId | null;
  currentSharedReceiptExpiresAt: Date | null;
  receiptShareDurationMinutes: number; // Default: 10

  // Branding
  logoUrl?: string;
  headerText?: string;
  footerText?: string;

  // Doctor Website (public profile)
  publicProfile: PublicProfile;

  createdAt: Date;
  updatedAt: Date;
}

export type ClinicInsert = Omit<Clinic, "_id">;

// ============================================
// USER
// ============================================
export type UserRole = "doctor" | "frontdesk";

export interface LoginHistoryEntry {
  loginAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface User {
  _id: ObjectId;
  clinicId: ObjectId;
  name: string;
  email: string; // Login identifier
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  loginHistory: LoginHistoryEntry[]; // Last 50 login entries
  createdByUserId?: ObjectId; // Who created this user (for staff created by doctor)
  createdAt: Date;
  updatedAt: Date;
}

export type UserInsert = Omit<User, "_id">;

// Safe user object without password
export type SafeUser = Omit<User, "passwordHash">;

// ============================================
// VISIT
// ============================================
export interface PatientInfo {
  name: string;
  phone: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

export type VisitStatus = "waiting" | "in-consultation" | "completed" | "cancelled";

export interface Visit {
  _id: ObjectId;
  clinicId: ObjectId;

  // Patient Info (denormalized per visit)
  patient: PatientInfo;

  visitReason: string;
  visitDate: Date; // Date of visit (for filtering "today")
  tokenNumber?: number;

  status: VisitStatus;

  // Metadata
  createdBy: ObjectId; // User who created (front desk)
  consultedBy?: ObjectId; // Doctor who consulted

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type VisitInsert = Omit<Visit, "_id">;

// ============================================
// PRESCRIPTION
// ============================================
export interface Medication {
  name: string; // "Tab. Paracetamol 500mg"
  dosage: string; // "1-0-1"
  duration: string; // "5 days"
  instructions?: string; // "After food"
}

export type PrescriptionStatus = "draft" | "finalized";

export interface Prescription {
  _id: ObjectId;
  clinicId: ObjectId;
  visitId: ObjectId;

  // Snapshot of patient (for PDF)
  patientSnapshot: {
    name: string;
    age?: number;
    gender?: string;
  };

  // Clinical
  diagnosis?: string;
  chiefComplaints?: string;

  medications: Medication[];

  advice?: string;
  followUpDate?: Date;

  // State
  status: PrescriptionStatus;
  finalizedAt?: Date;

  // PDF
  pdfGeneratedAt?: Date;

  createdBy: ObjectId; // Doctor
  createdAt: Date;
  updatedAt: Date;
}

export type PrescriptionInsert = Omit<Prescription, "_id">;

// ============================================
// RECEIPT
// ============================================
export interface LineItem {
  description: string;
  amount: number;
}

export type PaymentMode = "cash" | "upi" | "card" | "other";

export interface Receipt {
  _id: ObjectId;
  clinicId: ObjectId;
  visitId?: ObjectId;

  // Receipt Number (clinic-specific sequential)
  receiptNumber: string; // "RCP-2025-0001"

  // Patient info snapshot
  patientSnapshot: {
    name: string;
    phone?: string;
  };

  // Prescription snapshot (optional)
  prescriptionSnapshot?: {
    diagnosis?: string;
    advice?: string;
  };

  // Line Items
  lineItems: LineItem[];

  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;

  // Payment
  paymentMode?: PaymentMode;
  isPaid: boolean;

  // Timestamps
  receiptDate: Date;
  createdBy: ObjectId;
  createdAt: Date;

  // Sharing tracking
  lastSharedAt?: Date;
}

export type ReceiptInsert = Omit<Receipt, "_id">;

// ============================================
// CALLBACK REQUEST
// ============================================
export type CallbackStatus = "pending" | "contacted" | "converted" | "dismissed";

export interface CallbackRequest {
  _id: ObjectId;
  clinicId: ObjectId;

  name: string;
  phone: string;
  message?: string;

  status: CallbackStatus;
  notes?: string;

  handledBy?: ObjectId;
  handledAt?: Date;

  createdAt: Date;
}

export type CallbackRequestInsert = Omit<CallbackRequest, "_id">;

// ============================================
// SESSION / AUTH
// ============================================
export interface SessionPayload {
  userId: string;
  clinicId: string;
  role: UserRole;
  exp: number;
}

// ============================================
// CUSTOM MEDICATION TEMPLATES
// ============================================
export type MedicationSource = "allopathic" | "homeopathic" | "custom";

export interface MedicationTemplate {
  _id: ObjectId;
  clinicId: ObjectId;
  
  // Medication details
  name: string; // "Tab. Paracetamol 500mg"
  dosage: string; // "1-0-1"
  duration: string; // "5 days"
  instructions?: string; // "After food"
  
  // Categorization
  category?: string; // "Analgesic", "Antibiotic", etc.
  description?: string; // Detailed description of the medication
  
  // Source tracking
  source: MedicationSource; // "allopathic", "homeopathic", or "custom"
  isDefault: boolean; // true = system default, cannot be deleted
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type MedicationTemplateInsert = Omit<MedicationTemplate, "_id">;

// ============================================
// CUSTOM ADVICE TEMPLATES
// ============================================
export interface AdviceTemplate {
  _id: ObjectId;
  clinicId: ObjectId;
  
  // Advice content
  title: string; // Short identifier like "General Fever Care"
  content: string; // Full advice text
  
  // Categorization
  category?: string; // "Fever", "Diet", "Post-op", etc.
  
  // Source tracking
  isDefault: boolean; // true = system default, cannot be deleted
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type AdviceTemplateInsert = Omit<AdviceTemplate, "_id">;

// ============================================
// CUSTOM DIAGNOSIS TEMPLATES
// ============================================
export interface DiagnosisTemplate {
  _id: ObjectId;
  clinicId: ObjectId;
  
  name: string; // "Acute Upper Respiratory Infection"
  icdCode?: string; // Optional ICD-10 code
  
  // Categorization
  category?: string; // "Respiratory", "Cardiovascular", etc.
  description?: string; // Brief description of the diagnosis
  
  // Source tracking
  isDefault: boolean; // true = system default, cannot be deleted
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type DiagnosisTemplateInsert = Omit<DiagnosisTemplate, "_id">;

// ============================================
// BILLING - EXPENSE TRACKING
// ============================================
export type ExpenseCategory = 
  | "rent" 
  | "salary" 
  | "supplies" 
  | "utilities" 
  | "equipment" 
  | "maintenance"
  | "marketing"
  | "insurance"
  | "taxes"
  | "other";

export type RecurringFrequency = "monthly" | "quarterly" | "yearly";

export interface Expense {
  _id: ObjectId;
  clinicId: ObjectId;
  
  description: string;
  amount: number;
  category: ExpenseCategory;
  
  expenseDate: Date;
  
  // Recurring expense tracking
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  
  // Optional reference/notes
  vendor?: string;
  invoiceNumber?: string;
  notes?: string;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseInsert = Omit<Expense, "_id">;

// ============================================
// BILLING - BUDGET TARGETS
// ============================================
export interface BudgetTarget {
  _id: ObjectId;
  clinicId: ObjectId;
  
  month: number; // 1-12
  year: number;
  
  targetRevenue: number;
  targetExpenses?: number;
  
  notes?: string;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type BudgetTargetInsert = Omit<BudgetTarget, "_id">;

// ============================================
// BILLING - SERVICE CATEGORIES
// ============================================
export interface ServiceCategory {
  _id: ObjectId;
  clinicId: ObjectId;
  
  name: string; // "Consultation", "Lab Test", "Procedure", etc.
  defaultAmount?: number;
  description?: string;
  
  isActive: boolean;
  sortOrder: number;
  
  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategoryInsert = Omit<ServiceCategory, "_id">;

// ============================================
// BILLING - ANALYTICS TYPES (for API responses)
// ============================================
export interface MonthlyRevenue {
  month: number;
  year: number;
  totalRevenue: number;
  totalReceipts: number;
  paidAmount: number;
  unpaidAmount: number;
  totalDiscount: number;
  avgReceiptValue: number;
}

export interface PaymentModeBreakdown {
  mode: PaymentMode | "unpaid";
  count: number;
  amount: number;
  percentage: number;
}

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  revenue: number;
  receipts: number;
}

export interface BillingOverview {
  today: {
    revenue: number;
    receipts: number;
    pending: number;
  };
  thisMonth: {
    revenue: number;
    receipts: number;
    pending: number;
    target?: number;
  };
  lastMonth: {
    revenue: number;
    receipts: number;
  };
  allTime: {
    totalRevenue: number;
    totalReceipts: number;
    avgReceiptValue: number;
  };
}
