import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getExpensesCollection } from "@/lib/db/collections";

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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const expenses = await getExpensesCollection();
    const clinicId = new ObjectId(session.clinicId);

    const expense = await expenses.findOne({
      _id: new ObjectId(id),
      clinicId,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({
      expense: {
        ...expense,
        _id: expense._id.toString(),
        clinicId: expense.clinicId.toString(),
        createdBy: expense.createdBy.toString(),
      },
    });
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

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

    const expenses = await getExpensesCollection();
    const clinicId = new ObjectId(session.clinicId);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (description !== undefined) updateData.description = description.trim();
    if (amount !== undefined) updateData.amount = Number(amount);
    if (category !== undefined) updateData.category = category;
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate);
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) updateData.recurringFrequency = recurringFrequency;
    if (vendor !== undefined) updateData.vendor = vendor?.trim();
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber?.trim();
    if (notes !== undefined) updateData.notes = notes?.trim();

    const result = await expenses.findOneAndUpdate(
      { _id: new ObjectId(id), clinicId },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      expense: {
        ...result,
        _id: result._id.toString(),
        clinicId: result.clinicId.toString(),
        createdBy: result.createdBy.toString(),
      },
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const expenses = await getExpensesCollection();
    const clinicId = new ObjectId(session.clinicId);

    const result = await expenses.deleteOne({
      _id: new ObjectId(id),
      clinicId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
