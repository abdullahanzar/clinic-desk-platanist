import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { adviceTemplates } from "@/lib/db/schema";

// GET - Get a specific advice template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const template = db
      .select()
      .from(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.id, id),
          eq(adviceTemplates.clinicId, session.clinicId)
        )
      )
      .get();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        id: template.id,
        title: template.title,
        content: template.content,
        category: template.category,
        isDefault: template.isDefault || false,
        usageCount: template.usageCount,
      },
    });
  } catch (error) {
    console.error("Error fetching advice template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH - Update an advice template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can update advice templates" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { title, content, category } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate (excluding current template)
    const existing = db
      .select()
      .from(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.clinicId, session.clinicId),
          sql`lower(${adviceTemplates.title}) = lower(${title.trim()})`,
          sql`${adviceTemplates.id} != ${id}`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "An advice template with this title already exists" },
        { status: 409 }
      );
    }

    const result = db
      .update(adviceTemplates)
      .set({
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(adviceTemplates.id, id),
          eq(adviceTemplates.clinicId, session.clinicId)
        )
      )
      .run();

    if (result.changes === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating advice template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an advice template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can delete advice templates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getDb();

    // Check if it's a default advice
    const template = db
      .select()
      .from(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.id, id),
          eq(adviceTemplates.clinicId, session.clinicId)
        )
      )
      .get();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default advice templates. You can only delete custom advice." },
        { status: 403 }
      );
    }

    db.delete(adviceTemplates)
      .where(
        and(
          eq(adviceTemplates.id, id),
          eq(adviceTemplates.clinicId, session.clinicId)
        )
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting advice template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

// POST - Increment usage count (called when advice is used in prescription)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    db.update(adviceTemplates)
      .set({ usageCount: sql`${adviceTemplates.usageCount} + 1` })
      .where(
        and(
          eq(adviceTemplates.id, id),
          eq(adviceTemplates.clinicId, session.clinicId)
        )
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    return NextResponse.json(
      { error: "Failed to increment usage" },
      { status: 500 }
    );
  }
}
