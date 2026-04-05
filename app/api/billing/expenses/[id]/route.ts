import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { expenses } from "@/lib/db/schema";

// GET /api/billing/expenses/[id] - Get single expense
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const expense = db.select()
      .from(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.clinicId, session.clinicId),
      )).get();

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Get expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/billing/expenses/[id] - Update expense
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      description,
      amount,
      category,
      expenseDate,
      isRecurring,
      recurringFrequency,
      vendor,
      invoiceNumber,
      notes,
    } = body;

    const db = getDb();

    // Check existence
    const existing = db.select({ id: expenses.id })
      .from(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.clinicId, session.clinicId),
      )).get();

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (description !== undefined) updateData.description = description.trim();
    if (amount !== undefined) updateData.amount = Number(amount);
    if (category !== undefined) updateData.category = category;
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate).toISOString();
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) updateData.recurringFrequency = recurringFrequency;
    if (vendor !== undefined) updateData.vendor = vendor?.trim();
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber?.trim();
    if (notes !== undefined) updateData.notes = notes?.trim();

    db.update(expenses)
      .set(updateData)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.clinicId, session.clinicId),
      )).run();

    const updated = db.select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    return NextResponse.json({
      success: true,
      expense: updated,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/billing/expenses/[id] - Delete expense
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const existing = db.select({ id: expenses.id })
      .from(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.clinicId, session.clinicId),
      )).get();

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    db.delete(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.clinicId, session.clinicId),
      )).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
