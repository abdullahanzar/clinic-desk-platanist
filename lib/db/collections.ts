/**
 * Re-exports the Drizzle db instance and all schema tables.
 * Replaces the old MongoDB collection accessors.
 *
 * Usage in API routes:
 *   import { db, clinics, users } from "@/lib/db/collections";
 *   const result = db.select().from(clinics).where(eq(clinics.id, id));
 */
export { getDb } from "./sqlite";
export {
  clinics,
  users,
  visits,
  prescriptions,
  receipts,
  callbackRequests,
  medicationTemplates,
  adviceTemplates,
  diagnosisTemplates,
  expenses,
  budgetTargets,
  serviceCategories,
  generateId,
} from "./schema";

// Indexes are defined in the Drizzle schema and applied via migrations.
// This function is kept for API compatibility but is a no-op.
export async function ensureIndexes(): Promise<void> {
  // Indexes are handled by Drizzle migrations — nothing to do at runtime.
  console.log("✅ Database indexes handled by migrations");
}
