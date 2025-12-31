import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/lib/pdf/receipt-pdf";

// Public endpoint - no auth required, but validates receipt is currently shared
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 });
    }

    const receipts = await getReceiptsCollection();
    const clinics = await getClinicsCollection();

    const receipt = await receipts.findOne({
      _id: new ObjectId(id),
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Get the clinic and verify this receipt is currently being shared
    const clinic = await clinics.findOne({ _id: receipt.clinicId });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Verify the receipt is currently shared
    const isCurrentlyShared = 
      clinic.currentSharedReceiptId?.toString() === receipt._id.toString() &&
      clinic.currentSharedReceiptExpiresAt &&
      clinic.currentSharedReceiptExpiresAt > new Date();

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
    console.error("Generate public receipt PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
