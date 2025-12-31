import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getVisitsCollection } from "@/lib/db/collections";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils/date";
import type { VisitInsert } from "@/types";

// GET /api/visits - List visits by date or date range
// Query params:
// - date: specific date (YYYY-MM-DD)
// - startDate, endDate: date range
// - month, year: month view (e.g., month=1&year=2026)
// - status: filter by status
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

    const visits = await getVisitsCollection();

    let dateFilter: { $gte: Date; $lte: Date };

    if (monthParam && yearParam) {
      // Month view: get all visits for a specific month
      const monthDate = new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1);
      dateFilter = {
        $gte: startOfMonth(monthDate),
        $lte: endOfMonth(monthDate),
      };
    } else if (startDateParam && endDateParam) {
      // Date range view
      dateFilter = {
        $gte: startOfDay(new Date(startDateParam)),
        $lte: endOfDay(new Date(endDateParam)),
      };
    } else {
      // Single date view (default to today)
      const date = dateParam ? new Date(dateParam) : new Date();
      dateFilter = {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      };
    }

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
      visitDate: dateFilter,
    };

    if (statusParam) {
      query.status = statusParam;
    }

    const results = await visits
      .find(query)
      .sort({ visitDate: -1, tokenNumber: 1, createdAt: 1 })
      .toArray();

    return NextResponse.json({
      visits: results.map((v) => ({
        ...v,
        _id: v._id.toString(),
        clinicId: v.clinicId.toString(),
        createdBy: v.createdBy.toString(),
        consultedBy: v.consultedBy?.toString(),
      })),
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

    const visits = await getVisitsCollection();
    const clinicId = new ObjectId(session.clinicId);
    const today = new Date();

    // Generate token number for today
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const lastVisit = await visits.findOne(
      {
        clinicId,
        visitDate: { $gte: todayStart, $lte: todayEnd },
      },
      { sort: { tokenNumber: -1 } }
    );

    const tokenNumber = (lastVisit?.tokenNumber || 0) + 1;

    const visit: VisitInsert = {
      clinicId,
      patient: {
        name: patientName.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
      },
      visitReason: visitReason.trim(),
      visitDate: today,
      tokenNumber,
      status: "waiting",
      createdBy: new ObjectId(session.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await visits.insertOne(visit as never);

    return NextResponse.json({
      success: true,
      visit: {
        _id: result.insertedId.toString(),
        ...visit,
        clinicId: visit.clinicId.toString(),
        createdBy: visit.createdBy.toString(),
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
