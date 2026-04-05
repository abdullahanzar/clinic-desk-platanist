import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { diagnosisTemplates, generateId } from "@/lib/db/schema";

// GET - Fetch all diagnosis templates for the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = getDb();

    const conditions = [eq(diagnosisTemplates.clinicId, session.clinicId)];

    if (search) {
      conditions.push(
        or(
          like(diagnosisTemplates.name, `%${search}%`),
          like(diagnosisTemplates.icdCode, `%${search}%`),
          like(diagnosisTemplates.description, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(diagnosisTemplates.category, category));
    }

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(diagnosisTemplates)
      .where(and(...conditions))
      .get();
    const totalCount = countResult?.count ?? 0;

    const results = db
      .select()
      .from(diagnosisTemplates)
      .where(and(...conditions))
      .orderBy(desc(diagnosisTemplates.usageCount), asc(diagnosisTemplates.name))
      .limit(limit)
      .offset(skip)
      .all();

    // Get all categories for filter dropdown
    const cats = db
      .select({ category: diagnosisTemplates.category })
      .from(diagnosisTemplates)
      .where(eq(diagnosisTemplates.clinicId, session.clinicId))
      .groupBy(diagnosisTemplates.category)
      .all();
    const categories = cats
      .map((c) => c.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      templates: results.map((t) => ({
        id: t.id,
        name: t.name,
        icdCode: t.icdCode,
        category: t.category,
        description: t.description,
        isDefault: t.isDefault || false,
        usageCount: t.usageCount,
      })),
      categories,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching diagnosis templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new diagnosis template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create diagnosis templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, icdCode, category, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Diagnosis name is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate (case-insensitive)
    const existing = db
      .select()
      .from(diagnosisTemplates)
      .where(
        and(
          eq(diagnosisTemplates.clinicId, session.clinicId),
          sql`lower(${diagnosisTemplates.name}) = lower(${name.trim()})`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "A diagnosis with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const id = generateId();

    db.insert(diagnosisTemplates)
      .values({
        id,
        clinicId: session.clinicId,
        name: name.trim(),
        icdCode: icdCode?.trim() || null,
        category: category?.trim() || null,
        description: description?.trim() || null,
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
        icdCode: icdCode?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("Error creating diagnosis template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
