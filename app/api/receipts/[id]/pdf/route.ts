import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 });
    }

    const receipts = await getReceiptsCollection();
    const clinics = await getClinicsCollection();

    const receipt = await receipts.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const clinic = await clinics.findOne({ _id: new ObjectId(session.clinicId) });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

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
    console.error("Generate receipt PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
