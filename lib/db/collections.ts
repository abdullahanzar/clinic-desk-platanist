import { Collection, IndexDescription } from "mongodb";
import { getDb } from "./mongodb";
import type {
  Clinic,
  User,
  Visit,
  Prescription,
  Receipt,
  CallbackRequest,
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

  console.log("✅ Database indexes ensured");
}
