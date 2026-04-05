import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { adviceTemplates, generateId } from "@/lib/db/schema";

// POST - Bulk import advice templates from XLSX data
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can import advice templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { advice } = body;

    if (!Array.isArray(advice) || advice.length === 0) {
      return NextResponse.json(
        { error: "No advice templates provided for import" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Validate and prepare advice templates
    const validAdvice: {
      title: string;
      content: string;
      category?: string;
    }[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < advice.length; i++) {
      const item = advice[i];
      const row = i + 2; // Account for header row

      if (!item.title?.toString().trim()) {
        errors.push({ row, error: "Missing advice title" });
        continue;
      }
      if (!item.content?.toString().trim()) {
        errors.push({ row, error: "Missing advice content" });
        continue;
      }

      validAdvice.push({
        title: item.title.toString().trim(),
        content: item.content.toString().trim(),
        category: item.category?.toString().trim() || undefined,
      });
    }

    if (validAdvice.length === 0) {
      return NextResponse.json(
        { error: "No valid advice templates to import", errors },
        { status: 400 }
      );
    }

    // Get existing advice titles to check for duplicates
    const existingTitles = db
      .select({ title: adviceTemplates.title })
      .from(adviceTemplates)
      .where(eq(adviceTemplates.clinicId, session.clinicId))
      .all();
    const existingTitlesSet = new Set(
      existingTitles.map((a) => a.title.toLowerCase())
    );

    // Filter out duplicates
    const newAdvice = validAdvice.filter((item) => {
      const isDuplicate = existingTitlesSet.has(item.title.toLowerCase());
      if (isDuplicate) {
        errors.push({ row: 0, error: `Duplicate: ${item.title} already exists` });
      }
      return !isDuplicate;
    });

    if (newAdvice.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: validAdvice.length,
        errors,
        message: "All advice templates already exist",
      });
    }

    // Insert new advice templates
    let imported = 0;
    for (const item of newAdvice) {
      db.insert(adviceTemplates)
        .values({
          id: generateId(),
          clinicId: session.clinicId,
          title: item.title,
          content: item.content,
          category: item.category || null,
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
      skipped: validAdvice.length - newAdvice.length,
      totalProcessed: advice.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing advice templates:", error);
    return NextResponse.json(
      { error: "Failed to import advice templates" },
      { status: 500 }
    );
  }
}
