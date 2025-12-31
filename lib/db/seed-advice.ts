import { ObjectId } from "mongodb";
import { getAdviceTemplatesCollection } from "./collections";
import * as fs from "fs";
import * as path from "path";

interface CSVAdvice {
  title: string;
  category: string;
  advice_text: string;
}

function parseCSV(csvContent: string): CSVAdvice[] {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const advices: CSVAdvice[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted values (especially advice_text with commas)
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

    const advice: CSVAdvice = {
      title: values[headers.indexOf("title")] || "",
      category: values[headers.indexOf("category")] || "",
      advice_text: values[headers.indexOf("advice_text")] || "",
    };

    if (advice.title && advice.advice_text) {
      advices.push(advice);
    }
  }

  return advices;
}

export async function seedDefaultAdvice(
  clinicId: string,
  createdBy: string
): Promise<{ added: number; skipped: number }> {
  const templates = await getAdviceTemplatesCollection();
  const clinicObjectId = new ObjectId(clinicId);
  const createdByObjectId = new ObjectId(createdBy);
  const now = new Date();

  let addedCount = 0;
  let skippedCount = 0;

  // Read CSV file from public folder
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, "default_advices_library.csv");

  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}`);
    return { added: 0, skipped: 0 };
  }

  const csvContent = fs.readFileSync(filePath, "utf-8");
  const advices = parseCSV(csvContent);

  for (const advice of advices) {
    // Check if this default advice already exists for this clinic
    const existing = await templates.findOne({
      clinicId: clinicObjectId,
      title: advice.title,
      isDefault: true,
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    await templates.insertOne({
      clinicId: clinicObjectId,
      title: advice.title,
      content: advice.advice_text,
      category: advice.category || undefined,
      isDefault: true,
      usageCount: 0,
      createdBy: createdByObjectId,
      createdAt: now,
      updatedAt: now,
    } as never);

    addedCount++;
  }

  return {
    added: addedCount,
    skipped: skippedCount,
  };
}

export async function hasDefaultAdvice(clinicId: string): Promise<boolean> {
  const templates = await getAdviceTemplatesCollection();
  const count = await templates.countDocuments({
    clinicId: new ObjectId(clinicId),
    isDefault: true,
  });
  return count > 0;
}

export async function getDefaultAdviceStats(clinicId: string): Promise<{
  default: number;
  custom: number;
}> {
  const templates = await getAdviceTemplatesCollection();
  const clinicObjectId = new ObjectId(clinicId);

  const [defaultCount, customCount] = await Promise.all([
    templates.countDocuments({
      clinicId: clinicObjectId,
      isDefault: true,
    }),
    templates.countDocuments({
      clinicId: clinicObjectId,
      $or: [{ isDefault: { $ne: true } }, { isDefault: { $exists: false } }],
    }),
  ]);

  return { default: defaultCount, custom: customCount };
}
