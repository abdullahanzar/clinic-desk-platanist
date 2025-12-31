import { Collection, IndexDescription } from "mongodb";
import { getDb } from "./mongodb";
import type {
  Clinic,
  User,
  Visit,
  Prescription,
  Receipt,
  CallbackRequest,
  MedicationTemplate,
  AdviceTemplate,
  DiagnosisTemplate,
  Expense,
  BudgetTarget,
  ServiceCategory,
} from "@/types";

// Collection accessors
export async function getClinicsCollection(): Promise<Collection<Clinic>> {
  const db = await getDb();
  return db.collection<Clinic>("clinics");
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>("users");
}

export async function getVisitsCollection(): Promise<Collection<Visit>> {
  const db = await getDb();
  return db.collection<Visit>("visits");
}

export async function getPrescriptionsCollection(): Promise<Collection<Prescription>> {
  const db = await getDb();
  return db.collection<Prescription>("prescriptions");
}

export async function getReceiptsCollection(): Promise<Collection<Receipt>> {
  const db = await getDb();
  return db.collection<Receipt>("receipts");
}

export async function getCallbackRequestsCollection(): Promise<Collection<CallbackRequest>> {
  const db = await getDb();
  return db.collection<CallbackRequest>("callbackRequests");
}

export async function getMedicationTemplatesCollection(): Promise<Collection<MedicationTemplate>> {
  const db = await getDb();
  return db.collection<MedicationTemplate>("medicationTemplates");
}

export async function getAdviceTemplatesCollection(): Promise<Collection<AdviceTemplate>> {
  const db = await getDb();
  return db.collection<AdviceTemplate>("adviceTemplates");
}

export async function getDiagnosisTemplatesCollection(): Promise<Collection<DiagnosisTemplate>> {
  const db = await getDb();
  return db.collection<DiagnosisTemplate>("diagnosisTemplates");
}

export async function getExpensesCollection(): Promise<Collection<Expense>> {
  const db = await getDb();
  return db.collection<Expense>("expenses");
}

export async function getBudgetTargetsCollection(): Promise<Collection<BudgetTarget>> {
  const db = await getDb();
  return db.collection<BudgetTarget>("budgetTargets");
}

export async function getServiceCategoriesCollection(): Promise<Collection<ServiceCategory>> {
  const db = await getDb();
  return db.collection<ServiceCategory>("serviceCategories");
}

// ============================================
// INDEX SETUP
// ============================================
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  // Clinics indexes
  const clinicsIndexes: IndexDescription[] = [
    { key: { slug: 1 }, unique: true },
  ];
  await db.collection("clinics").createIndexes(clinicsIndexes);

  // Users indexes
  const usersIndexes: IndexDescription[] = [
    { key: { email: 1 }, unique: true },
    { key: { clinicId: 1 } },
  ];
  await db.collection("users").createIndexes(usersIndexes);

  // Visits indexes
  const visitsIndexes: IndexDescription[] = [
    { key: { clinicId: 1, visitDate: 1, status: 1 } },
    { key: { clinicId: 1, "patient.phone": 1 } },
  ];
  await db.collection("visits").createIndexes(visitsIndexes);

  // Prescriptions indexes
  const prescriptionsIndexes: IndexDescription[] = [
    { key: { visitId: 1 }, unique: true },
    { key: { clinicId: 1, createdAt: -1 } },
  ];
  await db.collection("prescriptions").createIndexes(prescriptionsIndexes);

  // Receipts indexes
  const receiptsIndexes: IndexDescription[] = [
    { key: { clinicId: 1, receiptNumber: 1 }, unique: true },
    { key: { clinicId: 1, receiptDate: -1 } },
  ];
  await db.collection("receipts").createIndexes(receiptsIndexes);

  // Callback requests indexes
  const callbackRequestsIndexes: IndexDescription[] = [
    { key: { clinicId: 1, status: 1, createdAt: -1 } },
  ];
  await db.collection("callbackRequests").createIndexes(callbackRequestsIndexes);

  // Medication templates indexes
  const medicationTemplatesIndexes: IndexDescription[] = [
    { key: { clinicId: 1, name: 1 } },
    { key: { clinicId: 1, category: 1 } },
    { key: { clinicId: 1, usageCount: -1 } },
  ];
  await db.collection("medicationTemplates").createIndexes(medicationTemplatesIndexes);

  // Advice templates indexes
  const adviceTemplatesIndexes: IndexDescription[] = [
    { key: { clinicId: 1, title: 1 } },
    { key: { clinicId: 1, category: 1 } },
    { key: { clinicId: 1, usageCount: -1 } },
  ];
  await db.collection("adviceTemplates").createIndexes(adviceTemplatesIndexes);

  // Diagnosis templates indexes
  const diagnosisTemplatesIndexes: IndexDescription[] = [
    { key: { clinicId: 1, name: 1 } },
    { key: { clinicId: 1, usageCount: -1 } },
  ];
  await db.collection("diagnosisTemplates").createIndexes(diagnosisTemplatesIndexes);

  // Expenses indexes
  const expensesIndexes: IndexDescription[] = [
    { key: { clinicId: 1, expenseDate: -1 } },
    { key: { clinicId: 1, category: 1 } },
    { key: { clinicId: 1, isRecurring: 1 } },
  ];
  await db.collection("expenses").createIndexes(expensesIndexes);

  // Budget targets indexes
  const budgetTargetsIndexes: IndexDescription[] = [
    { key: { clinicId: 1, year: 1, month: 1 }, unique: true },
  ];
  await db.collection("budgetTargets").createIndexes(budgetTargetsIndexes);

  // Service categories indexes
  const serviceCategoriesIndexes: IndexDescription[] = [
    { key: { clinicId: 1, name: 1 } },
    { key: { clinicId: 1, sortOrder: 1 } },
  ];
  await db.collection("serviceCategories").createIndexes(serviceCategoriesIndexes);

  console.log("✅ Database indexes ensured");
}
