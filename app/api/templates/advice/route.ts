import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAdviceTemplatesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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

    const templates = await getAdviceTemplatesCollection();

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
    };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Get total count for pagination
    const totalCount = await templates.countDocuments(query);

    const results = await templates
      .find(query)
      .sort({ usageCount: -1, title: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get unique categories for filtering
    const categoryQuery: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
      category: { $exists: true, $ne: "" },
    };
    const categories = await templates.distinct("category", categoryQuery);

    return NextResponse.json({
      templates: results.map((t) => ({
        _id: t._id.toString(),
        title: t.title,
        content: t.content,
        category: t.category,
        isDefault: t.isDefault || false,
        usageCount: t.usageCount,
      })),
      categories: categories.filter(Boolean),
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

    // Only doctors can create templates
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

    const templates = await getAdviceTemplatesCollection();

    // Check for duplicate
    const existing = await templates.findOne({
      clinicId: new ObjectId(session.clinicId),
      title: { $regex: `^${title.trim()}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An advice template with this title already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await templates.insertOne({
      clinicId: new ObjectId(session.clinicId),
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || undefined,
      isDefault: false,
      usageCount: 0,
      createdBy: new ObjectId(session.userId),
      createdAt: now,
      updatedAt: now,
    } as never);

    return NextResponse.json({
      success: true,
      template: {
        _id: result.insertedId.toString(),
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
