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

// Tax Information for Receipts
export interface TaxInfo {
  gstin?: string; // GST Identification Number
  pan?: string; // PAN Number
  registrationNumber?: string; // Clinic Registration Number
  sacCode?: string; // SAC Code for services
  showTaxOnReceipt: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string; // unique, for public URL
  address: Address;
  phone: string;
  email?: string;
  website?: string;

  // QR Receipt System
  currentSharedReceiptId: string | null;
  currentSharedReceiptExpiresAt: string | null;
  receiptShareDurationMinutes: number; // Default: 10

  // Branding
  logoUrl?: string;
  headerText?: string;
  footerText?: string;

  // Tax Information
  taxInfo?: TaxInfo;

  // Doctor Website (public profile)
  publicProfile: PublicProfile;

  createdAt: string;
  updatedAt: string;
}

export type ClinicInsert = Omit<Clinic, "id">;

// ============================================
// USER
// ============================================
export type UserRole = "doctor" | "frontdesk";

export interface LoginHistoryEntry {
  loginAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export type SuperAdminAuthSource = "database" | "environment";

export interface SuperAdminRecord {
  id: string;
  username: string;
  passwordHash: string;
  mustChangeCredentials: boolean;
  usedDefaultCredentials: boolean;
  lastLoginAt?: string | null;
  loginHistory: LoginHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  clinicId: string;
  name: string;
  email: string; // Login identifier
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  loginHistory: LoginHistoryEntry[]; // Last 50 login entries
  createdByUserId?: string; // Who created this user (for staff created by doctor)
  createdAt: string;
  updatedAt: string;
}

export type UserInsert = Omit<User, "id">;

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
  id: string;
  clinicId: string;

  // Patient Info (flattened in DB, presented as object in API)
  patient: PatientInfo;

  visitReason: string;
  visitDate: string; // ISO date string
  tokenNumber?: number;

  status: VisitStatus;

  // Metadata
  createdBy: string; // User who created (front desk)
  consultedBy?: string; // Doctor who consulted

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type VisitInsert = Omit<Visit, "id">;

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
  id: string;
  clinicId: string;
  visitId: string;

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
  followUpDate?: string;

  // State
  status: PrescriptionStatus;
  finalizedAt?: string;

  // PDF
  pdfGeneratedAt?: string;

  createdBy: string; // Doctor
  createdAt: string;
  updatedAt: string;
}

export type PrescriptionInsert = Omit<Prescription, "id">;

// ============================================
// RECEIPT
// ============================================
export interface LineItem {
  description: string;
  amount: number;
}

export type PaymentMode = "cash" | "upi" | "card" | "other";

export interface Receipt {
  id: string;
  clinicId: string;
  visitId?: string;

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
  receiptDate: string;
  createdBy: string;
  createdAt: string;

  // Sharing tracking
  lastSharedAt?: string;
}

export type ReceiptInsert = Omit<Receipt, "id">;

// ============================================
// CALLBACK REQUEST
// ============================================
export type CallbackStatus = "pending" | "contacted" | "converted" | "dismissed";

export interface CallbackRequest {
  id: string;
  clinicId: string;

  name: string;
  phone: string;
  message?: string;

  status: CallbackStatus;
  notes?: string;

  handledBy?: string;
  handledAt?: string;

  createdAt: string;
}

export type CallbackRequestInsert = Omit<CallbackRequest, "id">;

// ============================================
// SESSION / AUTH
// ============================================
export interface SessionPayload {
  userId: string;
  clinicId: string;
  role: UserRole;
  exp: number;
}

export interface SuperAdminSessionPayload {
  isSuperAdmin: true;
  superAdminId?: string;
  username: string;
  authSource: SuperAdminAuthSource;
  mustChangeCredentials: boolean;
  exp: number;
}

// ============================================
// CUSTOM MEDICATION TEMPLATES
// ============================================
export type MedicationSource = "allopathic" | "homeopathic" | "custom";

export interface MedicationTemplate {
  id: string;
  clinicId: string;
  
  // Medication details
  name: string;
  dosage: string;
  duration: string;
  instructions?: string;
  
  // Categorization
  category?: string;
  description?: string;
  
  // Source tracking
  source: MedicationSource;
  isDefault: boolean;
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicationTemplateInsert = Omit<MedicationTemplate, "id">;

// ============================================
// CUSTOM ADVICE TEMPLATES
// ============================================
export interface AdviceTemplate {
  id: string;
  clinicId: string;
  
  // Advice content
  title: string;
  content: string;
  
  // Categorization
  category?: string;
  
  // Source tracking
  isDefault: boolean;
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AdviceTemplateInsert = Omit<AdviceTemplate, "id">;

// ============================================
// CUSTOM DIAGNOSIS TEMPLATES
// ============================================
export interface DiagnosisTemplate {
  id: string;
  clinicId: string;
  
  name: string;
  icdCode?: string;
  
  // Categorization
  category?: string;
  description?: string;
  
  // Source tracking
  isDefault: boolean;
  
  // Usage tracking
  usageCount: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DiagnosisTemplateInsert = Omit<DiagnosisTemplate, "id">;

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
  id: string;
  clinicId: string;
  
  description: string;
  amount: number;
  category: ExpenseCategory;
  
  expenseDate: string;
  
  // Recurring expense tracking
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  
  // Optional reference/notes
  vendor?: string;
  invoiceNumber?: string;
  notes?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInsert = Omit<Expense, "id">;

// ============================================
// BILLING - BUDGET TARGETS
// ============================================
export interface BudgetTarget {
  id: string;
  clinicId: string;
  
  month: number; // 1-12
  year: number;
  
  targetRevenue: number;
  targetExpenses?: number;
  
  notes?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BudgetTargetInsert = Omit<BudgetTarget, "id">;

// ============================================
// BILLING - SERVICE CATEGORIES
// ============================================
export interface ServiceCategory {
  id: string;
  clinicId: string;
  
  name: string;
  defaultAmount?: number;
  description?: string;
  
  isActive: boolean;
  sortOrder: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategoryInsert = Omit<ServiceCategory, "id">;

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
