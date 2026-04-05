import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { adviceTemplates, generateId } from "@/lib/db/schema";

// GET - Fetch all advice templates for the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = getDb();

    const conditions = [eq(adviceTemplates.clinicId, session.clinicId)];

    if (search) {
      conditions.push(
        or(
          like(adviceTemplates.title, `%${search}%`),
          like(adviceTemplates.content, `%${search}%`),
          like(adviceTemplates.category, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(adviceTemplates.category, category));
    }

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(adviceTemplates)
      .where(and(...conditions))
      .get();
    const totalCount = countResult?.count ?? 0;

    const results = db
      .select()
      .from(adviceTemplates)
      .where(and(...conditions))
      .orderBy(desc(adviceTemplates.usageCount), asc(adviceTemplates.title))
      .limit(limit)
      .offset(skip)
      .all();

    // Get unique categories for filtering
    const cats = db
      .select({ category: adviceTemplates.category })
      .from(adviceTemplates)
      .where(eq(adviceTemplates.clinicId, session.clinicId))
      .groupBy(adviceTemplates.category)
      .all();
    const categories = cats.map((c) => c.category).filter(Boolean);

    return NextResponse.json({
      templates: results.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        category: t.category,
        isDefault: t.isDefault || false,
        usageCount: t.usageCount,
      })),
      categories,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching advice templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new advice template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create advice templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate (case-insensitive)
    const existing = db
      .select()
      .from(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.clinicId, session.clinicId),
          sql`lower(${adviceTemplates.title}) = lower(${title.trim()})`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "An advice template with this title already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const id = generateId();

    db.insert(adviceTemplates)
      .values({
        id,
        clinicId: session.clinicId,
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
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
        title: title.trim(),
        content: content.trim(),
        category: category?.trim(),
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("Error creating advice template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
