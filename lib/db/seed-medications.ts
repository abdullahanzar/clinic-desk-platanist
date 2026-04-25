import { getDb } from "@/lib/db/sqlite";
import { medicationTemplates, generateId } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { MedicationSource } from "@/types";
import * as fs from "fs";
import * as path from "path";

export type DefaultMedicationSource = Exclude<MedicationSource, "custom">;

const DEFAULT_MEDICATION_FILES: Record<DefaultMedicationSource, string> = {
  allopathic: "default_allopathic_medications.csv",
  homeopathic: "default_homeopathic_medications.csv",
};

const DEFAULT_MEDICATION_SOURCES = Object.keys(
  DEFAULT_MEDICATION_FILES
) as DefaultMedicationSource[];

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
  createdBy: string,
  sources: DefaultMedicationSource[] = DEFAULT_MEDICATION_SOURCES
): Promise<{ allopathic: number; homeopathic: number; skipped: number }> {
  const db = getDb();
  const now = new Date().toISOString();
  const selectedSources =
    sources.length > 0 ? Array.from(new Set(sources)) : DEFAULT_MEDICATION_SOURCES;

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

  if (selectedSources.includes("allopathic")) {
    allopathicCount = seedMedications(
      DEFAULT_MEDICATION_FILES.allopathic,
      "allopathic"
    );
  }

  if (selectedSources.includes("homeopathic")) {
    homeopathicCount = seedMedications(
      DEFAULT_MEDICATION_FILES.homeopathic,
      "homeopathic"
    );
  }

  return {
    allopathic: allopathicCount,
    homeopathic: homeopathicCount,
    skipped: skippedCount,
  };
}

export async function clearDefaultMedications(
  clinicId: string,
  sources: DefaultMedicationSource[] = DEFAULT_MEDICATION_SOURCES
): Promise<{ allopathic: number; homeopathic: number; total: number }> {
  const db = getDb();
  const selectedSources =
    sources.length > 0 ? Array.from(new Set(sources)) : DEFAULT_MEDICATION_SOURCES;

  let allopathic = 0;
  let homeopathic = 0;

  if (selectedSources.includes("allopathic")) {
    allopathic = db
      .delete(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.clinicId, clinicId),
          eq(medicationTemplates.isDefault, true),
          eq(medicationTemplates.source, "allopathic")
        )
      )
      .run().changes;
  }

  if (selectedSources.includes("homeopathic")) {
    homeopathic = db
      .delete(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.clinicId, clinicId),
          eq(medicationTemplates.isDefault, true),
          eq(medicationTemplates.source, "homeopathic")
        )
      )
      .run().changes;
  }

  return {
    allopathic,
    homeopathic,
    total: allopathic + homeopathic,
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
