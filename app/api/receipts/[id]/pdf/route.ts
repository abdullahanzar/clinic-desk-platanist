import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts, clinics } from "@/lib/db/schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/lib/pdf/receipt-pdf";

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

    const receipt = db.select().from(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.clinicId, session.clinicId)))
      .get();

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const clinic = db.select().from(clinics).where(eq(clinics.id, session.clinicId)).get();

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const clinicAddress = clinic.address ?? undefined;
    const clinicPublicProfile = clinic.publicProfile ?? undefined;
    const clinicTaxInfo = clinic.taxInfo ?? undefined;

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ReceiptPDF({
        receipt: {
          receiptNumber: receipt.receiptNumber,
          receiptDate: receipt.receiptDate,
          patientSnapshot: receipt.patientSnapshot,
          prescriptionSnapshot: receipt.prescriptionSnapshot,
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
          address: clinicAddress,
          publicProfile: clinicPublicProfile,
          taxInfo: clinicTaxInfo,
        },
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate receipt PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
