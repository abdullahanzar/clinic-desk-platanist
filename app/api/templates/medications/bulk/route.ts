import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMedicationTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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

    const templates = await getMedicationTemplatesCollection();
    const now = new Date();
    const clinicId = new ObjectId(session.clinicId);
    const userId = new ObjectId(session.userId);

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
    const existingNames = await templates
      .find(
        { clinicId },
        { projection: { name: 1 } }
      )
      .toArray();
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
    const documents = newMedications.map((med) => ({
      clinicId,
      name: med.name,
      dosage: med.dosage,
      duration: med.duration,
      instructions: med.instructions,
      category: med.category,
      source: "custom",
      isDefault: false,
      usageCount: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await templates.insertMany(documents as never);

    return NextResponse.json({
      success: true,
      imported: result.insertedCount,
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
