import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { medicationTemplates, generateId } from "@/lib/db/schema";

// GET - Fetch all medication templates for the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = getDb();

    const conditions = [eq(medicationTemplates.clinicId, session.clinicId)];

    if (search) {
      conditions.push(
        or(
          like(medicationTemplates.name, `%${search}%`),
          like(medicationTemplates.category, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(medicationTemplates.category, category));
    }

    if (source) {
      conditions.push(eq(medicationTemplates.source, source as "allopathic" | "homeopathic" | "custom"));
    }

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(medicationTemplates)
      .where(and(...conditions))
      .get();
    const totalCount = countResult?.count ?? 0;

    const results = db
      .select()
      .from(medicationTemplates)
      .where(and(...conditions))
      .orderBy(desc(medicationTemplates.usageCount), asc(medicationTemplates.name))
      .limit(limit)
      .offset(skip)
      .all();

    // Get unique categories for filtering
    const catConditions = [eq(medicationTemplates.clinicId, session.clinicId)];
    if (source) {
      catConditions.push(eq(medicationTemplates.source, source as "allopathic" | "homeopathic" | "custom"));
    }
    const cats = db
      .select({ category: medicationTemplates.category })
      .from(medicationTemplates)
      .where(and(...catConditions))
      .groupBy(medicationTemplates.category)
      .all();
    const categories = cats.map((c) => c.category).filter(Boolean);

    return NextResponse.json({
      templates: results.map((t) => ({
        id: t.id,
        name: t.name,
        dosage: t.dosage,
        duration: t.duration,
        instructions: t.instructions,
        category: t.category,
        description: t.description,
        source: t.source || "custom",
        isDefault: t.isDefault || false,
        usageCount: t.usageCount,
      })),
      categories,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching medication templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new medication template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create medication templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, dosage, duration, instructions, category, description } = body;

    if (!name?.trim() || !dosage?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: "Name, dosage, and duration are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate (case-insensitive)
    const existing = db
      .select()
      .from(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.clinicId, session.clinicId),
          sql`lower(${medicationTemplates.name}) = lower(${name.trim()})`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "A medication with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const id = generateId();

    db.insert(medicationTemplates)
      .values({
        id,
        clinicId: session.clinicId,
        name: name.trim(),
        dosage: dosage.trim(),
        duration: duration.trim(),
        instructions: instructions?.trim() || null,
        category: category?.trim() || null,
        description: description?.trim() || null,
        source: "custom",
        isDefault: false,
        usageCount: 0,
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return NextResponse.json({
      success: true,
      template: {
        id,
        name: name.trim(),
        dosage: dosage.trim(),
        duration: duration.trim(),
        instructions: instructions?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        source: "custom",
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("Error creating medication template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
