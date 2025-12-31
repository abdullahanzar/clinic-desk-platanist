import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getExpensesCollection } from "@/lib/db/collections";
import { startOfMonth, endOfMonth } from "@/lib/utils/date";
import type { ExpenseInsert, ExpenseCategory } from "@/types";

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

    const expenses = await getExpensesCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Build query
    const query: Record<string, unknown> = { clinicId };

    if (month) {
      const targetDate = new Date(year, month - 1, 1);
      query.expenseDate = {
        $gte: startOfMonth(targetDate),
        $lte: endOfMonth(targetDate),
      };
    } else {
      // Get all expenses for the year
      query.expenseDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    if (category) {
      query.category = category;
    }

    const results = await expenses
      .find(query)
      .sort({ expenseDate: -1 })
      .limit(limit)
      .toArray();

    // Get category breakdown
    const categoryStats = await expenses.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]).toArray();

    // Calculate totals
    const totalExpenses = results.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses: results.map((e) => ({
        ...e,
        _id: e._id.toString(),
        clinicId: e.clinicId.toString(),
        createdBy: e.createdBy.toString(),
      })),
      summary: {
        total: totalExpenses,
        count: results.length,
        byCategory: categoryStats.map((c) => ({
          category: c._id,
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

    const expenses = await getExpensesCollection();
    const clinicId = new ObjectId(session.clinicId);

    const expense: ExpenseInsert = {
      clinicId,
      description: description.trim(),
      amount: Number(amount),
      category,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      vendor: vendor?.trim(),
      invoiceNumber: invoiceNumber?.trim(),
      notes: notes?.trim(),
      createdBy: new ObjectId(session.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await expenses.insertOne(expense as never);

    return NextResponse.json({
      success: true,
      expense: {
        _id: result.insertedId.toString(),
        ...expense,
        clinicId: expense.clinicId.toString(),
        createdBy: expense.createdBy.toString(),
      },
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
