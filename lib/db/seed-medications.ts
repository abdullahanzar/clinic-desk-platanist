import { ObjectId } from "mongodb";
import { getMedicationTemplatesCollection } from "./collections";
import { MedicationSource } from "@/types";
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
  const templates = await getMedicationTemplatesCollection();
  const clinicObjectId = new ObjectId(clinicId);
  const createdByObjectId = new ObjectId(createdBy);
  const now = new Date();

  let allopathicCount = 0;
  let homeopathicCount = 0;
  let skippedCount = 0;

  // Read CSV files from public folder
  const publicDir = path.join(process.cwd(), "public");

  const seedMedications = async (
    filename: string,
    source: MedicationSource
  ) => {
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
      const existing = await templates.findOne({
        clinicId: clinicObjectId,
        name: med.name,
        isDefault: true,
        source: source,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await templates.insertOne({
        clinicId: clinicObjectId,
        name: med.name,
        dosage: med.dosage,
        duration: med.duration,
        instructions: med.instructions || undefined,
        category: med.category || undefined,
        description: med.description || undefined,
        source: source,
        isDefault: true,
        usageCount: 0,
        createdBy: createdByObjectId,
        createdAt: now,
        updatedAt: now,
      } as never);

      count++;
    }

    return count;
  };

  // Seed allopathic medications
  allopathicCount = await seedMedications(
    "default_allopathic_medications.csv",
    "allopathic"
  );

  // Seed homeopathic medications
  homeopathicCount = await seedMedications(
    "default_homeopathic_medications.csv",
    "homeopathic"
  );

  return {
    allopathic: allopathicCount,
    homeopathic: homeopathicCount,
    skipped: skippedCount,
  };
}

export async function hasDefaultMedications(clinicId: string): Promise<boolean> {
  const templates = await getMedicationTemplatesCollection();
  const count = await templates.countDocuments({
    clinicId: new ObjectId(clinicId),
    isDefault: true,
  });
  return count > 0;
}

export async function getDefaultMedicationStats(clinicId: string): Promise<{
  allopathic: number;
  homeopathic: number;
  custom: number;
}> {
  const templates = await getMedicationTemplatesCollection();
  const clinicObjectId = new ObjectId(clinicId);

  const [allopathic, homeopathic, custom] = await Promise.all([
    templates.countDocuments({
      clinicId: clinicObjectId,
      source: "allopathic",
      isDefault: true,
    }),
    templates.countDocuments({
      clinicId: clinicObjectId,
      source: "homeopathic",
      isDefault: true,
    }),
    templates.countDocuments({
      clinicId: clinicObjectId,
      $or: [{ isDefault: { $ne: true } }, { source: "custom" }],
    }),
  ]);

  return { allopathic, homeopathic, custom };
}
