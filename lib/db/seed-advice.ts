import { getDb } from "@/lib/db/sqlite";
import { adviceTemplates, generateId } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

export function seedDefaultAdvice(
  clinicId: string,
  createdBy: string
): { added: number; skipped: number } {
  const db = getDb();
  const now = new Date().toISOString();

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
    const existing = db
      .select({ id: adviceTemplates.id })
      .from(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.clinicId, clinicId),
          eq(adviceTemplates.title, advice.title),
          eq(adviceTemplates.isDefault, true)
        )
      )
      .get();

    if (existing) {
      skippedCount++;
      continue;
    }

    db.insert(adviceTemplates)
      .values({
        id: generateId(),
        clinicId,
        title: advice.title,
        content: advice.advice_text,
        category: advice.category || null,
        isDefault: true,
        usageCount: 0,
        createdBy,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    addedCount++;
  }

  return {
    added: addedCount,
    skipped: skippedCount,
  };
}

export function hasDefaultAdvice(clinicId: string): boolean {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(adviceTemplates)
    .where(
      and(
        eq(adviceTemplates.clinicId, clinicId),
        eq(adviceTemplates.isDefault, true)
      )
    )
    .get();
  return (row?.count ?? 0) > 0;
}

export function getDefaultAdviceStats(clinicId: string): {
  default: number;
  custom: number;
} {
  const db = getDb();

  const defaultCount = db
    .select({ count: sql<number>`count(*)` })
    .from(adviceTemplates)
    .where(
      and(
        eq(adviceTemplates.clinicId, clinicId),
        eq(adviceTemplates.isDefault, true)
      )
    )
    .get();

  const customCount = db
    .select({ count: sql<number>`count(*)` })
    .from(adviceTemplates)
    .where(
      and(
        eq(adviceTemplates.clinicId, clinicId),
        eq(adviceTemplates.isDefault, false)
      )
    )
    .get();

  return {
    default: defaultCount?.count ?? 0,
    custom: customCount?.count ?? 0,
  };
}
