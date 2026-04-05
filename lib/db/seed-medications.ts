import { getDb } from "@/lib/db/sqlite";
import { medicationTemplates, generateId } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { MedicationSource } from "@/types";
import * as fs from "fs";
import * as path from "path";

interface CSVMedication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
  category: string;
  description: string;
}

function parseCSV(csvContent: string): CSVMedication[] {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const medications: CSVMedication[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted values (especially descriptions with commas)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Push last value

    const medication: CSVMedication = {
      name: values[headers.indexOf("name")] || "",
      dosage: values[headers.indexOf("dosage")] || "",
      duration: values[headers.indexOf("duration")] || "",
      instructions: values[headers.indexOf("instructions")] || "",
      category: values[headers.indexOf("category")] || "",
      description: values[headers.indexOf("description")] || "",
    };

    if (medication.name) {
      medications.push(medication);
    }
  }

  return medications;
}

export async function seedDefaultMedications(
  clinicId: string,
  createdBy: string
): Promise<{ allopathic: number; homeopathic: number; skipped: number }> {
  const db = getDb();
  const now = new Date().toISOString();

  let allopathicCount = 0;
  let homeopathicCount = 0;
  let skippedCount = 0;

  // Read CSV files from public folder
  const publicDir = path.join(process.cwd(), "public");

  const seedMedications = (
    filename: string,
    source: MedicationSource
  ): number => {
    const filePath = path.join(publicDir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`CSV file not found: ${filePath}`);
      return 0;
    }

    const csvContent = fs.readFileSync(filePath, "utf-8");
    const medications = parseCSV(csvContent);

    let count = 0;

    for (const med of medications) {
      // Check if this default medication already exists for this clinic
      const existing = db
        .select({ id: medicationTemplates.id })
        .from(medicationTemplates)
        .where(
          and(
            eq(medicationTemplates.clinicId, clinicId),
            eq(medicationTemplates.name, med.name),
            eq(medicationTemplates.isDefault, true),
            eq(medicationTemplates.source, source)
          )
        )
        .get();

      if (existing) {
        skippedCount++;
        continue;
      }

      db.insert(medicationTemplates)
        .values({
          id: generateId(),
          clinicId,
          name: med.name,
          dosage: med.dosage,
          duration: med.duration,
          instructions: med.instructions || null,
          category: med.category || null,
          description: med.description || null,
          source,
          isDefault: true,
          usageCount: 0,
          createdBy,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      count++;
    }

    return count;
  };

  // Seed allopathic medications
  allopathicCount = seedMedications(
    "default_allopathic_medications.csv",
    "allopathic"
  );

  // Seed homeopathic medications
  homeopathicCount = seedMedications(
    "default_homeopathic_medications.csv",
    "homeopathic"
  );

  return {
    allopathic: allopathicCount,
    homeopathic: homeopathicCount,
    skipped: skippedCount,
  };
}

export function hasDefaultMedications(clinicId: string): boolean {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(medicationTemplates)
    .where(
      and(
        eq(medicationTemplates.clinicId, clinicId),
        eq(medicationTemplates.isDefault, true)
      )
    )
    .get();
  return (row?.count ?? 0) > 0;
}

export function getDefaultMedicationStats(clinicId: string): {
  allopathic: number;
  homeopathic: number;
  custom: number;
} {
  const db = getDb();

  const allopathic = db
    .select({ count: sql<number>`count(*)` })
    .from(medicationTemplates)
    .where(
      and(
        eq(medicationTemplates.clinicId, clinicId),
        eq(medicationTemplates.source, "allopathic"),
        eq(medicationTemplates.isDefault, true)
      )
    )
    .get();

  const homeopathic = db
    .select({ count: sql<number>`count(*)` })
    .from(medicationTemplates)
    .where(
      and(
        eq(medicationTemplates.clinicId, clinicId),
        eq(medicationTemplates.source, "homeopathic"),
        eq(medicationTemplates.isDefault, true)
      )
    )
    .get();

  const custom = db
    .select({ count: sql<number>`count(*)` })
    .from(medicationTemplates)
    .where(
      and(
        eq(medicationTemplates.clinicId, clinicId),
        eq(medicationTemplates.isDefault, false)
      )
    )
    .get();

  return {
    allopathic: allopathic?.count ?? 0,
    homeopathic: homeopathic?.count ?? 0,
    custom: custom?.count ?? 0,
  };
}
