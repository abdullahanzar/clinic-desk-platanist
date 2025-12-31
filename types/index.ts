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

export interface User {
  _id: ObjectId;
  clinicId: ObjectId;
  name: string;
  email: string; // Login identifier
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
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
