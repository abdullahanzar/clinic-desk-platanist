import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { medicationTemplates, generateId } from "@/lib/db/schema";

// POST - Bulk import medications from XLSX data
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can import medication templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { medications } = body;

    if (!Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: "No medications provided for import" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Validate and prepare medications
    const validMedications: {
      name: string;
      dosage: string;
      duration: string;
      instructions?: string;
      category?: string;
    }[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      const row = i + 2; // Account for header row

      if (!med.name?.toString().trim()) {
        errors.push({ row, error: "Missing medication name" });
        continue;
      }
      if (!med.dosage?.toString().trim()) {
        errors.push({ row, error: "Missing dosage" });
        continue;
      }
      if (!med.duration?.toString().trim()) {
        errors.push({ row, error: "Missing duration" });
        continue;
      }

      validMedications.push({
        name: med.name.toString().trim(),
        dosage: med.dosage.toString().trim(),
        duration: med.duration.toString().trim(),
        instructions: med.instructions?.toString().trim() || undefined,
        category: med.category?.toString().trim() || undefined,
      });
    }

    if (validMedications.length === 0) {
      return NextResponse.json(
        { error: "No valid medications to import", errors },
        { status: 400 }
      );
    }

    // Get existing medication names to check for duplicates
    const existingNames = db
      .select({ name: medicationTemplates.name })
      .from(medicationTemplates)
      .where(eq(medicationTemplates.clinicId, session.clinicId))
      .all();
    const existingNamesSet = new Set(
      existingNames.map((m) => m.name.toLowerCase())
    );

    // Filter out duplicates
    const newMedications = validMedications.filter((med) => {
      const isDuplicate = existingNamesSet.has(med.name.toLowerCase());
      if (isDuplicate) {
        errors.push({ row: 0, error: `Duplicate: ${med.name} already exists` });
      }
      return !isDuplicate;
    });

    if (newMedications.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: validMedications.length,
        errors,
        message: "All medications already exist",
      });
    }

    // Insert new medications
    let imported = 0;
    for (const med of newMedications) {
      db.insert(medicationTemplates)
        .values({
          id: generateId(),
          clinicId: session.clinicId,
          name: med.name,
          dosage: med.dosage,
          duration: med.duration,
          instructions: med.instructions || null,
          category: med.category || null,
          source: "custom",
          isDefault: false,
          usageCount: 0,
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped: validMedications.length - newMedications.length,
      totalProcessed: medications.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing medications:", error);
    return NextResponse.json(
      { error: "Failed to import medications" },
      { status: 500 }
    );
  }
}
