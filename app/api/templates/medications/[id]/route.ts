import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { medicationTemplates } from "@/lib/db/schema";

// GET - Get a specific medication template
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
      .from(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.id, id),
          eq(medicationTemplates.clinicId, session.clinicId)
        )
      )
      .get();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        dosage: template.dosage,
        duration: template.duration,
        instructions: template.instructions,
        category: template.category,
        description: template.description,
        source: template.source || "custom",
        isDefault: template.isDefault || false,
        usageCount: template.usageCount,
      },
    });
  } catch (error) {
    console.error("Error fetching medication template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH - Update a medication template
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
        { error: "Only doctors can update medication templates" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { name, dosage, duration, instructions, category } = body;

    if (!name?.trim() || !dosage?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: "Name, dosage, and duration are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate (excluding current template)
    const existing = db
      .select()
      .from(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.clinicId, session.clinicId),
          sql`lower(${medicationTemplates.name}) = lower(${name.trim()})`,
          sql`${medicationTemplates.id} != ${id}`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "A medication with this name already exists" },
        { status: 409 }
      );
    }

    const result = db
      .update(medicationTemplates)
      .set({
        name: name.trim(),
        dosage: dosage.trim(),
        duration: duration.trim(),
        instructions: instructions?.trim() || null,
        category: category?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(medicationTemplates.id, id),
          eq(medicationTemplates.clinicId, session.clinicId)
        )
      )
      .run();

    if (result.changes === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating medication template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a medication template
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
        { error: "Only doctors can delete medication templates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getDb();

    const template = db
      .select()
      .from(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.id, id),
          eq(medicationTemplates.clinicId, session.clinicId)
        )
      )
      .get();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    db.delete(medicationTemplates)
      .where(
        and(
          eq(medicationTemplates.id, id),
          eq(medicationTemplates.clinicId, session.clinicId)
        )
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medication template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

// POST - Increment usage count (called when medication is used in prescription)
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

    db.update(medicationTemplates)
      .set({ usageCount: sql`${medicationTemplates.usageCount} + 1` })
      .where(
        and(
          eq(medicationTemplates.id, id),
          eq(medicationTemplates.clinicId, session.clinicId)
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
