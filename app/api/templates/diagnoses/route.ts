import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDiagnosisTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// GET - Fetch all diagnosis templates for the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const templates = await getDiagnosisTemplatesCollection();

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { icdCode: { $regex: search, $options: "i" } },
      ];
    }

    const results = await templates
      .find(query)
      .sort({ usageCount: -1, name: 1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      templates: results.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        icdCode: t.icdCode,
        usageCount: t.usageCount,
      })),
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

    // Only doctors can create templates
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create diagnosis templates" },
        { status: 403 }
      );
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

    // Check for duplicate
    const existing = await templates.findOne({
      clinicId: new ObjectId(session.clinicId),
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A diagnosis with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await templates.insertOne({
      clinicId: new ObjectId(session.clinicId),
      name: name.trim(),
      icdCode: icdCode?.trim() || undefined,
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
        icdCode: icdCode?.trim(),
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
