import { ObjectId } from "mongodb";
import { getDiagnosisTemplatesCollection } from "./collections";
import { DiagnosisTemplateInsert } from "@/types";
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

export async function seedDefaultDiagnoses(
  clinicId: string,
  userId: string,
  force: boolean = false
): Promise<{ inserted: number; skipped: number }> {
  const collection = await getDiagnosisTemplatesCollection();
  const clinicOid = new ObjectId(clinicId);
  const userOid = new ObjectId(userId);

  // Check if default diagnoses already exist
  if (!force) {
    const existingDefault = await collection.findOne({
      clinicId: clinicOid,
      isDefault: true,
    });

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
  const now = new Date();

  for (const diagnosis of diagnoses) {
    // Check if diagnosis already exists
    const existing = await collection.findOne({
      clinicId: clinicOid,
      name: { $regex: `^${diagnosis.name}$`, $options: "i" },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const doc: DiagnosisTemplateInsert = {
      clinicId: clinicOid,
      name: diagnosis.name,
      icdCode: diagnosis.icd10_code || undefined,
      category: diagnosis.category || undefined,
      description: diagnosis.description || undefined,
      isDefault: true,
      usageCount: 0,
      createdBy: userOid,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(doc as never);
    inserted++;
  }

  return { inserted, skipped };
}

export async function hasDefaultDiagnoses(clinicId: string): Promise<boolean> {
  const collection = await getDiagnosisTemplatesCollection();
  const count = await collection.countDocuments({
    clinicId: new ObjectId(clinicId),
    isDefault: true,
  });
  return count > 0;
}

export async function getDefaultDiagnosesStats(
  clinicId: string
): Promise<{ default: number; custom: number }> {
  const collection = await getDiagnosisTemplatesCollection();
  const clinicOid = new ObjectId(clinicId);

  const [defaultCount, customCount] = await Promise.all([
    collection.countDocuments({ clinicId: clinicOid, isDefault: true }),
    collection.countDocuments({ clinicId: clinicOid, isDefault: { $ne: true } }),
  ]);

  return { default: defaultCount, custom: customCount };
}
