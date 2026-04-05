import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/sqlite";
import { receipts, clinics } from "@/lib/db/schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/lib/pdf/receipt-pdf";

// Public endpoint - no auth required, but validates receipt is currently shared
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDb();

    const receipt = db.select().from(receipts).where(eq(receipts.id, id)).get();

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Get the clinic and verify this receipt is currently being shared
    const clinic = db.select().from(clinics).where(eq(clinics.id, receipt.clinicId)).get();

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Verify the receipt is currently shared
    const isCurrentlyShared =
      clinic.currentSharedReceiptId === receipt.id &&
      clinic.currentSharedReceiptExpiresAt &&
      new Date(clinic.currentSharedReceiptExpiresAt) > new Date();

    if (!isCurrentlyShared) {
      return NextResponse.json(
        { error: "This receipt is not currently shared" },
        { status: 403 }
      );
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ReceiptPDF({
        receipt: {
          receiptNumber: receipt.receiptNumber,
          receiptDate: receipt.receiptDate,
          patientSnapshot: receipt.patientSnapshot,
          prescriptionSnapshot: receipt.prescriptionSnapshot ?? undefined,
          lineItems: receipt.lineItems,
          subtotal: receipt.subtotal,
          discountAmount: receipt.discountAmount,
          discountReason: receipt.discountReason,
          totalAmount: receipt.totalAmount,
          paymentMode: receipt.paymentMode,
          isPaid: receipt.isPaid,
        },
        clinic: {
          name: clinic.name,
          headerText: clinic.headerText,
          footerText: clinic.footerText,
          phone: clinic.phone,
          email: clinic.email,
          address: clinic.address,
          publicProfile: clinic.publicProfile,
          taxInfo: clinic.taxInfo,
        },
      })
    );

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate public receipt PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
