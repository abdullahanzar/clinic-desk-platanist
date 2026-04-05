import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { budgetTargets, generateId } from "@/lib/db/schema";

// GET /api/billing/budget - List budget targets
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

    const db = getDb();

    const targets = db.select()
      .from(budgetTargets)
      .where(and(
        eq(budgetTargets.clinicId, session.clinicId),
        eq(budgetTargets.year, year),
      ))
      .orderBy(asc(budgetTargets.month))
      .all();

    return NextResponse.json({ targets });
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

    const db = getDb();
    const now = new Date().toISOString();

    // Upsert - check if target exists for this month/year
    const existing = db.select()
      .from(budgetTargets)
      .where(and(
        eq(budgetTargets.clinicId, session.clinicId),
        eq(budgetTargets.month, month),
        eq(budgetTargets.year, year),
      )).get();

    if (existing) {
      db.update(budgetTargets).set({
        targetRevenue: Number(targetRevenue),
        targetExpenses: targetExpenses ? Number(targetExpenses) : undefined,
        notes: notes?.trim(),
        updatedAt: now,
      }).where(eq(budgetTargets.id, existing.id)).run();

      const updated = db.select().from(budgetTargets).where(eq(budgetTargets.id, existing.id)).get();
      return NextResponse.json({ success: true, target: updated });
    } else {
      const id = generateId();
      db.insert(budgetTargets).values({
        id,
        clinicId: session.clinicId,
        month,
        year,
        targetRevenue: Number(targetRevenue),
        targetExpenses: targetExpenses ? Number(targetExpenses) : undefined,
        notes: notes?.trim(),
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      }).run();

      const created = db.select().from(budgetTargets).where(eq(budgetTargets.id, id)).get();
      return NextResponse.json({ success: true, target: created });
    }
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

    const db = getDb();
    const now = new Date().toISOString();

    // Process each target as an upsert
    for (const target of targets as Array<{ month: number; targetRevenue: number; targetExpenses?: number; notes?: string }>) {
      const existing = db.select()
        .from(budgetTargets)
        .where(and(
          eq(budgetTargets.clinicId, session.clinicId),
          eq(budgetTargets.month, target.month),
          eq(budgetTargets.year, year),
        )).get();

      if (existing) {
        db.update(budgetTargets).set({
          targetRevenue: Number(target.targetRevenue),
          targetExpenses: target.targetExpenses ? Number(target.targetExpenses) : undefined,
          notes: target.notes?.trim(),
          updatedAt: now,
        }).where(eq(budgetTargets.id, existing.id)).run();
      } else {
        db.insert(budgetTargets).values({
          id: generateId(),
          clinicId: session.clinicId,
          month: target.month,
          year,
          targetRevenue: Number(target.targetRevenue),
          targetExpenses: target.targetExpenses ? Number(target.targetExpenses) : undefined,
          notes: target.notes?.trim(),
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }).run();
      }
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
