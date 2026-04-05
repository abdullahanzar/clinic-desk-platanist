import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, like, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { visits, generateId } from "@/lib/db/schema";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils/date";

// GET /api/visits - List visits by date or date range
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const statusParam = searchParams.get("status");
    const searchQuery = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const db = getDb();

    // Build date range as ISO strings
    let dateStart: string | undefined;
    let dateEnd: string | undefined;

    if (monthParam && yearParam) {
      const monthDate = new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1);
      dateStart = startOfMonth(monthDate).toISOString();
      dateEnd = endOfMonth(monthDate).toISOString();
    } else if (startDateParam && endDateParam) {
      dateStart = startOfDay(new Date(startDateParam)).toISOString();
      dateEnd = endOfDay(new Date(endDateParam)).toISOString();
    } else if (dateParam) {
      const date = new Date(dateParam);
      dateStart = startOfDay(date).toISOString();
      dateEnd = endOfDay(date).toISOString();
    }
    if (!dateStart && !searchQuery) {
      const date = new Date();
      dateStart = startOfDay(date).toISOString();
      dateEnd = endOfDay(date).toISOString();
    }

    // Build WHERE conditions
    const conditions = [eq(visits.clinicId, session.clinicId)];

    if (dateStart && dateEnd) {
      conditions.push(gte(visits.visitDate, dateStart));
      conditions.push(lte(visits.visitDate, dateEnd));
    }

    if (statusParam) {
      conditions.push(eq(visits.status, statusParam as "waiting" | "in-consultation" | "completed" | "cancelled"));
    }

    if (searchQuery && searchQuery.trim()) {
      const pattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          like(visits.patientName, pattern),
          like(visits.patientPhone, pattern),
        )!
      );
    }

    const where = and(...conditions);

    // Count total
    const countResult = db.select({ count: sql<number>`count(*)` }).from(visits).where(where).get();
    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    const results = db.select().from(visits)
      .where(where)
      .orderBy(desc(visits.createdAt), desc(visits.tokenNumber))
      .limit(limit)
      .offset(offset)
      .all();

    return NextResponse.json({
      visits: results.map((v) => ({
        id: v.id,
        clinicId: v.clinicId,
        patient: {
          name: v.patientName,
          phone: v.patientPhone,
          age: v.patientAge ?? undefined,
          gender: v.patientGender ?? undefined,
        },
        visitReason: v.visitReason,
        visitDate: v.visitDate,
        tokenNumber: v.tokenNumber,
        status: v.status,
        createdBy: v.createdBy,
        consultedBy: v.consultedBy ?? undefined,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        completedAt: v.completedAt ?? undefined,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get visits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/visits - Create new visit
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientName, phone, age, gender, visitReason } = body;

    if (!patientName || !phone || !visitReason) {
      return NextResponse.json(
        { error: "Patient name, phone, and visit reason are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    // Get last token number for today
    const lastVisit = db.select({ tokenNumber: visits.tokenNumber })
      .from(visits)
      .where(and(
        eq(visits.clinicId, session.clinicId),
        gte(visits.visitDate, todayStart),
        lte(visits.visitDate, todayEnd),
      ))
      .orderBy(desc(visits.tokenNumber))
      .limit(1)
      .get();

    const tokenNumber = (lastVisit?.tokenNumber || 0) + 1;
    const id = generateId();
    const nowISO = now.toISOString();

    db.insert(visits).values({
      id,
      clinicId: session.clinicId,
      patientName: patientName.trim(),
      patientPhone: phone.trim(),
      patientAge: age ? parseInt(age, 10) : null,
      patientGender: gender || null,
      visitReason: visitReason.trim(),
      visitDate: nowISO,
      tokenNumber,
      status: "waiting",
      createdBy: session.userId,
      createdAt: nowISO,
      updatedAt: nowISO,
    }).run();

    return NextResponse.json({
      success: true,
      visit: {
        id,
        clinicId: session.clinicId,
        patient: {
          name: patientName.trim(),
          phone: phone.trim(),
          age: age ? parseInt(age, 10) : undefined,
          gender: gender || undefined,
        },
        visitReason: visitReason.trim(),
        visitDate: nowISO,
        tokenNumber,
        status: "waiting",
        createdBy: session.userId,
        createdAt: nowISO,
        updatedAt: nowISO,
      },
    });
  } catch (error) {
    console.error("Create visit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
