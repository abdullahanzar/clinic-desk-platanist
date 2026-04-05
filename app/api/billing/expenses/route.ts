import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { expenses, generateId } from "@/lib/db/schema";
import type { ExpenseCategory } from "@/types";

// GET /api/billing/expenses - List expenses
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : null;
    const category = searchParams.get("category") as ExpenseCategory | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const db = getDb();

    // Build conditions
    const conditions = [eq(expenses.clinicId, session.clinicId)];

    if (month) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      const lastDay = new Date(year, month, 0).getDate();
      conditions.push(gte(expenses.expenseDate, `${monthStr}-01T00:00:00.000Z`));
      conditions.push(lte(expenses.expenseDate, `${monthStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`));
    } else {
      conditions.push(gte(expenses.expenseDate, `${year}-01-01T00:00:00.000Z`));
      conditions.push(lte(expenses.expenseDate, `${year}-12-31T23:59:59.999Z`));
    }

    if (category) {
      conditions.push(eq(expenses.category, category));
    }

    const results = db.select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate))
      .limit(limit)
      .all();

    // Get category breakdown
    const categoryStats = db.select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      count: sql<number>`count(*)`,
    }).from(expenses)
      .where(and(...conditions))
      .groupBy(expenses.category)
      .orderBy(sql`sum(${expenses.amount}) desc`)
      .all();

    // Calculate totals
    const totalExpenses = results.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses: results,
      summary: {
        total: totalExpenses,
        count: results.length,
        byCategory: categoryStats.map((c) => ({
          category: c.category,
          total: c.total,
          count: c.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/billing/expenses - Create expense
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      description,
      amount,
      category,
      expenseDate,
      isRecurring = false,
      recurringFrequency,
      vendor,
      invoiceNumber,
      notes,
    } = body;

    if (!description || !amount || !category) {
      return NextResponse.json(
        { error: "Description, amount, and category are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const id = generateId();

    db.insert(expenses).values({
      id,
      clinicId: session.clinicId,
      description: description.trim(),
      amount: Number(amount),
      category,
      expenseDate: expenseDate ? new Date(expenseDate).toISOString() : now,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      vendor: vendor?.trim(),
      invoiceNumber: invoiceNumber?.trim(),
      notes: notes?.trim(),
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    }).run();

    const expense = db.select().from(expenses).where(eq(expenses.id, id)).get();

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
