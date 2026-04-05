import { NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import {
  diagnosisTemplates,
  medicationTemplates,
  adviceTemplates,
} from "@/lib/db/schema";

// GET - Fetch all templates for pre-caching (diagnoses, medications, advice)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const diagResults = db
      .select()
      .from(diagnosisTemplates)
      .where(eq(diagnosisTemplates.clinicId, session.clinicId))
      .orderBy(desc(diagnosisTemplates.usageCount), asc(diagnosisTemplates.name))
      .limit(200)
      .all();

    const medResults = db
      .select()
      .from(medicationTemplates)
      .where(eq(medicationTemplates.clinicId, session.clinicId))
      .orderBy(desc(medicationTemplates.usageCount), asc(medicationTemplates.name))
      .limit(500)
      .all();

    const advResults = db
      .select()
      .from(adviceTemplates)
      .where(eq(adviceTemplates.clinicId, session.clinicId))
      .orderBy(desc(adviceTemplates.usageCount), asc(adviceTemplates.title))
      .limit(100)
      .all();

    // Get unique categories
    const diagnosisCategories = [
      ...new Set(diagResults.map((t) => t.category).filter(Boolean)),
    ].sort();

    const medicationCategories = [
      ...new Set(medResults.map((t) => t.category).filter(Boolean)),
    ].sort();

    const adviceCategories = [
      ...new Set(advResults.map((t) => t.category).filter(Boolean)),
    ].sort();

    return NextResponse.json({
      diagnoses: {
        templates: diagResults.map((t) => ({
          id: t.id,
          name: t.name,
          icdCode: t.icdCode,
          category: t.category,
          description: t.description,
          isDefault: t.isDefault || false,
          usageCount: t.usageCount || 0,
        })),
        categories: diagnosisCategories,
      },
      medications: {
        templates: medResults.map((t) => ({
          id: t.id,
          name: t.name,
          dosage: t.dosage,
          duration: t.duration,
          instructions: t.instructions,
          category: t.category,
          description: t.description,
          source: t.source || "custom",
          isDefault: t.isDefault || false,
          usageCount: t.usageCount || 0,
        })),
        categories: medicationCategories,
      },
      advice: {
        templates: advResults.map((t) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          category: t.category,
          isDefault: t.isDefault || false,
          usageCount: t.usageCount || 0,
        })),
        categories: adviceCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching all templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
