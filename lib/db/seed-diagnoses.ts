import { getDb } from "@/lib/db/sqlite";
import { diagnosisTemplates, generateId } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface DiagnosisCSVRow {
  name: string;
  category: string;
  description: string;
  icd10_code: string;
}

function parseCSV(content: string): DiagnosisCSVRow[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const header = lines[0].split(",").map((h) => h.trim());

  const nameIdx = header.indexOf("name");
  const categoryIdx = header.indexOf("category");
  const descriptionIdx = header.indexOf("description");
  const icdCodeIdx = header.indexOf("icd10_code");

  const rows: DiagnosisCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with quoted fields containing commas
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
    values.push(current.trim());

    const name = values[nameIdx]?.replace(/^"|"$/g, "").trim();
    const category = values[categoryIdx]?.replace(/^"|"$/g, "").trim();
    const description = values[descriptionIdx]?.replace(/^"|"$/g, "").trim();
    const icd10_code = values[icdCodeIdx]?.replace(/^"|"$/g, "").trim();

    if (name) {
      rows.push({ name, category, description, icd10_code });
    }
  }

  return rows;
}

export function seedDefaultDiagnoses(
  clinicId: string,
  userId: string,
  force: boolean = false
): { inserted: number; skipped: number } {
  const db = getDb();

  // Check if default diagnoses already exist
  if (!force) {
    const existingDefault = db
      .select({ id: diagnosisTemplates.id })
      .from(diagnosisTemplates)
      .where(
        and(
          eq(diagnosisTemplates.clinicId, clinicId),
          eq(diagnosisTemplates.isDefault, true)
        )
      )
      .get();

    if (existingDefault) {
      return { inserted: 0, skipped: 0 };
    }
  }

  // Read and parse CSV file
  const csvPath = path.join(process.cwd(), "public", "default_diagnosis_library.csv");
  let csvContent: string;

  try {
    csvContent = fs.readFileSync(csvPath, "utf-8");
  } catch (error) {
    console.error("Error reading diagnosis CSV file:", error);
    throw new Error("Could not read default diagnoses CSV file");
  }

  const diagnoses = parseCSV(csvContent);

  let inserted = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const diagnosis of diagnoses) {
    // Check if diagnosis already exists (case-insensitive)
    const existing = db
      .select({ id: diagnosisTemplates.id })
      .from(diagnosisTemplates)
      .where(
        and(
          eq(diagnosisTemplates.clinicId, clinicId),
          sql`lower(${diagnosisTemplates.name}) = lower(${diagnosis.name})`
        )
      )
      .get();

    if (existing) {
      skipped++;
      continue;
    }

    db.insert(diagnosisTemplates)
      .values({
        id: generateId(),
        clinicId,
        name: diagnosis.name,
        icdCode: diagnosis.icd10_code || null,
        category: diagnosis.category || null,
        description: diagnosis.description || null,
        isDefault: true,
        usageCount: 0,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    inserted++;
  }

  return { inserted, skipped };
}

export function hasDefaultDiagnoses(clinicId: string): boolean {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(diagnosisTemplates)
    .where(
      and(
        eq(diagnosisTemplates.clinicId, clinicId),
        eq(diagnosisTemplates.isDefault, true)
      )
    )
    .get();
  return (row?.count ?? 0) > 0;
}

export function getDefaultDiagnosesStats(
  clinicId: string
): { default: number; custom: number } {
  const db = getDb();

  const defaultCount = db
    .select({ count: sql<number>`count(*)` })
    .from(diagnosisTemplates)
    .where(
      and(
        eq(diagnosisTemplates.clinicId, clinicId),
        eq(diagnosisTemplates.isDefault, true)
      )
    )
    .get();

  const customCount = db
    .select({ count: sql<number>`count(*)` })
    .from(diagnosisTemplates)
    .where(
      and(
        eq(diagnosisTemplates.clinicId, clinicId),
        eq(diagnosisTemplates.isDefault, false)
      )
    )
    .get();

  return {
    default: defaultCount?.count ?? 0,
    custom: customCount?.count ?? 0,
  };
}
