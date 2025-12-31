import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMedicationTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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
    const limit = parseInt(searchParams.get("limit") || "50");

    const templates = await getMedicationTemplatesCollection();

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    const results = await templates
      .find(query)
      .sort({ usageCount: -1, name: 1 })
      .limit(limit)
      .toArray();

    // Get unique categories for filtering
    const categories = await templates.distinct("category", {
      clinicId: new ObjectId(session.clinicId),
      category: { $exists: true, $ne: "" },
    });

    return NextResponse.json({
      templates: results.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        dosage: t.dosage,
        duration: t.duration,
        instructions: t.instructions,
        category: t.category,
        usageCount: t.usageCount,
      })),
      categories: categories.filter(Boolean),
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

    // Only doctors can create templates
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create medication templates" },
        { status: 403 }
      );
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

    // Check for duplicate
    const existing = await templates.findOne({
      clinicId: new ObjectId(session.clinicId),
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A medication with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await templates.insertOne({
      clinicId: new ObjectId(session.clinicId),
      name: name.trim(),
      dosage: dosage.trim(),
      duration: duration.trim(),
      instructions: instructions?.trim() || undefined,
      category: category?.trim() || undefined,
      usageCount: 0,
      createdBy: new ObjectId(session.userId),
      createdAt: now,
      updatedAt: now,
    } as never);

    return NextResponse.json({
      success: true,
      template: {
        _id: result.insertedId.toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        duration: duration.trim(),
        instructions: instructions?.trim(),
        category: category?.trim(),
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
