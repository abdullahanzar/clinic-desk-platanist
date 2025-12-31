import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getDiagnosisTemplatesCollection,
  getMedicationTemplatesCollection,
  getAdviceTemplatesCollection,
} from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// GET - Fetch all templates for pre-caching (diagnoses, medications, advice)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = new ObjectId(session.clinicId);

    // Fetch all templates in parallel
    const [diagnosisTemplates, medicationTemplates, adviceTemplates] =
      await Promise.all([
        getDiagnosisTemplatesCollection().then((col) =>
          col
            .find({ clinicId })
            .sort({ usageCount: -1, name: 1 })
            .limit(200)
            .toArray()
        ),
        getMedicationTemplatesCollection().then((col) =>
          col
            .find({ clinicId })
            .sort({ usageCount: -1, name: 1 })
            .limit(500)
            .toArray()
        ),
        getAdviceTemplatesCollection().then((col) =>
          col
            .find({ clinicId })
            .sort({ usageCount: -1, title: 1 })
            .limit(100)
            .toArray()
        ),
      ]);

    // Get unique categories
    const diagnosisCategories = [
      ...new Set(
        diagnosisTemplates
          .map((t) => t.category)
          .filter(Boolean)
      ),
    ].sort();

    const medicationCategories = [
      ...new Set(
        medicationTemplates
          .map((t) => t.category)
          .filter(Boolean)
      ),
    ].sort();

    const adviceCategories = [
      ...new Set(
        adviceTemplates
          .map((t) => t.category)
          .filter(Boolean)
      ),
    ].sort();

    return NextResponse.json({
      diagnoses: {
        templates: diagnosisTemplates.map((t) => ({
          _id: t._id.toString(),
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
        templates: medicationTemplates.map((t) => ({
          _id: t._id.toString(),
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
        templates: adviceTemplates.map((t) => ({
          _id: t._id.toString(),
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
