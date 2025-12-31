import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMedicationTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const templates = await getMedicationTemplatesCollection();
    const template = await templates.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        _id: template._id.toString(),
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, dosage, duration, instructions, category } = body;

    if (!name?.trim() || !dosage?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: "Name, dosage, and duration are required" },
        { status: 400 }
      );
    }

    const templates = await getMedicationTemplatesCollection();

    // Check for duplicate (excluding current template)
    const existing = await templates.findOne({
      clinicId: new ObjectId(session.clinicId),
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      _id: { $ne: new ObjectId(id) },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A medication with this name already exists" },
        { status: 409 }
      );
    }

    const result = await templates.updateOne(
      {
        _id: new ObjectId(id),
        clinicId: new ObjectId(session.clinicId),
      },
      {
        $set: {
          name: name.trim(),
          dosage: dosage.trim(),
          duration: duration.trim(),
          instructions: instructions?.trim() || null,
          category: category?.trim() || null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const templates = await getMedicationTemplatesCollection();
    
    // Check if it's a default medication
    const template = await templates.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default medications. You can only delete custom medications." },
        { status: 403 }
      );
    }

    const result = await templates.deleteOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const templates = await getMedicationTemplatesCollection();
    await templates.updateOne(
      {
        _id: new ObjectId(id),
        clinicId: new ObjectId(session.clinicId),
      },
      {
        $inc: { usageCount: 1 },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    return NextResponse.json(
      { error: "Failed to increment usage" },
      { status: 500 }
    );
  }
}
