import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getBudgetTargetsCollection } from "@/lib/db/collections";
import type { BudgetTargetInsert } from "@/types";

// GET /api/billing/budget - List budget targets
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

    const budgetTargets = await getBudgetTargetsCollection();
    const clinicId = new ObjectId(session.clinicId);

    const targets = await budgetTargets
      .find({ clinicId, year })
      .sort({ month: 1 })
      .toArray();

    return NextResponse.json({
      targets: targets.map((t) => ({
        ...t,
        _id: t._id.toString(),
        clinicId: t.clinicId.toString(),
        createdBy: t.createdBy.toString(),
      })),
    });
  } catch (error) {
    console.error("Get budget targets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/billing/budget - Create or update budget target
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { month, year, targetRevenue, targetExpenses, notes } = body;

    if (!month || !year || targetRevenue === undefined) {
      return NextResponse.json(
        { error: "Month, year, and target revenue are required" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    const budgetTargets = await getBudgetTargetsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Upsert - create or update the target for this month/year
    const result = await budgetTargets.findOneAndUpdate(
      { clinicId, month, year },
      {
        $set: {
          targetRevenue: Number(targetRevenue),
          targetExpenses: targetExpenses ? Number(targetExpenses) : undefined,
          notes: notes?.trim(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          clinicId,
          month,
          year,
          createdBy: new ObjectId(session.userId),
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      target: result ? {
        ...result,
        _id: result._id.toString(),
        clinicId: result.clinicId.toString(),
        createdBy: result.createdBy.toString(),
      } : null,
    });
  } catch (error) {
    console.error("Create/update budget target error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/billing/budget - Bulk update budget targets for a year
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, targets } = body;

    if (!year || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: "Year and targets array are required" },
        { status: 400 }
      );
    }

    const budgetTargets = await getBudgetTargetsCollection();
    const clinicId = new ObjectId(session.clinicId);
    const userId = new ObjectId(session.userId);
    const now = new Date();

    // Process each target
    const operations = targets.map((target: { month: number; targetRevenue: number; targetExpenses?: number; notes?: string }) => ({
      updateOne: {
        filter: { clinicId, month: target.month, year },
        update: {
          $set: {
            targetRevenue: Number(target.targetRevenue),
            targetExpenses: target.targetExpenses ? Number(target.targetExpenses) : undefined,
            notes: target.notes?.trim(),
            updatedAt: now,
          },
          $setOnInsert: {
            clinicId,
            month: target.month,
            year,
            createdBy: userId,
            createdAt: now,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await budgetTargets.bulkWrite(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk update budget targets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
