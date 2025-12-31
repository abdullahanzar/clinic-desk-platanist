import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDiagnosisTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// PATCH - Update a diagnosis template
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
        { error: "Only doctors can update diagnosis templates" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, icdCode } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Diagnosis name is required" },
        { status: 400 }
      );
    }

    const templates = await getDiagnosisTemplatesCollection();

    // Check for duplicate (excluding current template)
    const existing = await templates.findOne({
      clinicId: new ObjectId(session.clinicId),
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      _id: { $ne: new ObjectId(id) },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A diagnosis with this name already exists" },
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
          icdCode: icdCode?.trim() || null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating diagnosis template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a diagnosis template
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
        { error: "Only doctors can delete diagnosis templates" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const templates = await getDiagnosisTemplatesCollection();

    // Check if it's a default diagnosis
    const template = await templates.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default diagnoses" },
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
    console.error("Error deleting diagnosis template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

// POST - Increment usage count
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

    const templates = await getDiagnosisTemplatesCollection();
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
