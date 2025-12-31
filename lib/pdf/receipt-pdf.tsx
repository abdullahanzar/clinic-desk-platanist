import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Types for receipt PDF
interface LineItem {
  description: string;
  amount: number;
}

interface ReceiptData {
  receiptNumber: string;
  receiptDate: Date;
  patientSnapshot: {
    name: string;
    phone?: string;
  };
  prescriptionSnapshot?: {
    diagnosis?: string;
    advice?: string;
  };
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  paymentMode?: string;
  isPaid: boolean;
}

interface ClinicData {
  name: string;
  headerText?: string;
  footerText?: string;
  phone?: string;
  email?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  publicProfile?: {
    doctorName?: string;
    qualifications?: string;
  };
  taxInfo?: {
    gstin?: string;
    pan?: string;
    registrationNumber?: string;
    sacCode?: string;
    showTaxOnReceipt?: boolean;
  };
}

interface ReceiptPDFProps {
  receipt: ReceiptData;
  clinic: ClinicData;
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#0d9488",
    padding: 20,
    marginBottom: 20,
    marginHorizontal: -30,
    marginTop: -30,
    textAlign: "center",
  },
  headerText: {
    color: "white",
  },
  clinicName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  clinicSubtext: {
    fontSize: 9,
    color: "#ccfbf1",
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 10,
    color: "#475569",
  },
  prescriptionSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  prescriptionTitle: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prescriptionLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  prescriptionValue: {
    fontSize: 10,
    color: "#1e293b",
    marginBottom: 8,
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    fontSize: 10,
  },
  descriptionCol: {
    flex: 1,
  },
  amountCol: {
    width: 80,
    textAlign: "right",
  },
  totalsSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#475569",
  },
  totalValue: {
    fontSize: 10,
    color: "#475569",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  discountLabel: {
    fontSize: 10,
    color: "#059669",
  },
  discountValue: {
    fontSize: 10,
    color: "#059669",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  paymentMode: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  paymentModeText: {
    fontSize: 9,
    color: "#64748b",
  },
  paymentModeValue: {
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  taxInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  taxInfoText: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    textAlign: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
  },
});

// Helper function to format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Receipt PDF Component
export function ReceiptPDF({ receipt, clinic }: ReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Clinic Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, styles.clinicName]}>{clinic.name}</Text>
          {clinic.headerText && (
            <Text style={[styles.headerText, styles.clinicSubtext]}>{clinic.headerText}</Text>
          )}
          {clinic.publicProfile?.doctorName && (
            <Text style={[styles.headerText, styles.doctorName]}>
              {clinic.publicProfile.doctorName}
              {clinic.publicProfile.qualifications && ` (${clinic.publicProfile.qualifications})`}
            </Text>
          )}
          {clinic.address && (
            <Text style={[styles.headerText, styles.clinicSubtext]}>
              {clinic.address.line1}
              {clinic.address.line2 && `, ${clinic.address.line2}`}
              {`, ${clinic.address.city} - ${clinic.address.pincode}`}
            </Text>
          )}
          {clinic.phone && (
            <Text style={[styles.headerText, styles.clinicSubtext]}>
              Ph: {clinic.phone}
              {clinic.email && ` • ${clinic.email}`}
            </Text>
          )}
        </View>

        {/* Receipt Number & Date */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
          <View>
            <Text style={styles.sectionTitle}>Receipt No.</Text>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>{receipt.receiptNumber}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.sectionTitle}>Date</Text>
            <Text style={{ fontSize: 10 }}>{formatDate(receipt.receiptDate)}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <Text style={styles.patientName}>{receipt.patientSnapshot.name}</Text>
          {receipt.patientSnapshot.phone && (
            <Text style={styles.patientPhone}>{receipt.patientSnapshot.phone}</Text>
          )}
        </View>

        {/* Prescription Info */}
        {receipt.prescriptionSnapshot && 
          (receipt.prescriptionSnapshot.diagnosis || receipt.prescriptionSnapshot.advice) && (
          <View style={styles.prescriptionSection}>
            <View style={styles.prescriptionHeader}>
              <Text style={styles.prescriptionTitle}>Prescription</Text>
            </View>
            {receipt.prescriptionSnapshot.diagnosis && (
              <>
                <Text style={styles.prescriptionLabel}>Diagnosis</Text>
                <Text style={styles.prescriptionValue}>{receipt.prescriptionSnapshot.diagnosis}</Text>
              </>
            )}
            {receipt.prescriptionSnapshot.advice && (
              <>
                <Text style={styles.prescriptionLabel}>Advice</Text>
                <Text style={styles.prescriptionValue}>{receipt.prescriptionSnapshot.advice}</Text>
              </>
            )}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCol]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.amountCol]}>Amount</Text>
          </View>
          {receipt.lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCol]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.amountCol]}>₹{item.amount}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{receipt.subtotal}</Text>
          </View>
          {receipt.discountAmount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                Discount{receipt.discountReason && ` (${receipt.discountReason})`}
              </Text>
              <Text style={styles.discountValue}>-₹{receipt.discountAmount}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>₹{receipt.totalAmount}</Text>
          </View>
        </View>

        {/* Payment Mode */}
        {receipt.paymentMode && (
          <View style={styles.paymentMode}>
            <Text style={styles.paymentModeText}>
              Payment Mode: <Text style={styles.paymentModeValue}>{receipt.paymentMode}</Text>
            </Text>
          </View>
        )}

        {/* Tax Information */}
        {clinic.taxInfo?.showTaxOnReceipt && 
          (clinic.taxInfo.gstin || clinic.taxInfo.registrationNumber || clinic.taxInfo.pan) && (
          <View style={styles.taxInfo}>
            {clinic.taxInfo.gstin && <Text style={styles.taxInfoText}>GSTIN: {clinic.taxInfo.gstin}</Text>}
            {clinic.taxInfo.pan && <Text style={styles.taxInfoText}>PAN: {clinic.taxInfo.pan}</Text>}
            {clinic.taxInfo.registrationNumber && (
              <Text style={styles.taxInfoText}>Reg. No: {clinic.taxInfo.registrationNumber}</Text>
            )}
            {clinic.taxInfo.sacCode && <Text style={styles.taxInfoText}>SAC Code: {clinic.taxInfo.sacCode}</Text>}
          </View>
        )}

        {/* Footer */}
        {clinic.footerText && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{clinic.footerText}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
