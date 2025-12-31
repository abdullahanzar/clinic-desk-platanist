import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getClinicsCollection } from "@/lib/db/collections";
import { requireRole, getSession } from "@/lib/auth/session";
import type { Address, PublicProfile, TaxInfo } from "@/types";

// GET /api/clinic - Get clinic details
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = new ObjectId(session.clinicId);
    const clinics = await getClinicsCollection();

    const clinic = await clinics.findOne({ _id: clinicId });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Return clinic details
    return NextResponse.json({
      clinic: {
        id: clinic._id.toString(),
        name: clinic.name,
        slug: clinic.slug,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email || "",
        website: clinic.website || "",
        logoUrl: clinic.logoUrl || "",
        headerText: clinic.headerText || "",
        footerText: clinic.footerText || "",
        taxInfo: clinic.taxInfo || {
          gstin: "",
          pan: "",
          registrationNumber: "",
          sacCode: "",
          showTaxOnReceipt: false,
        },
        publicProfile: clinic.publicProfile,
        receiptShareDurationMinutes: clinic.receiptShareDurationMinutes,
        createdAt: clinic.createdAt.toISOString(),
        updatedAt: clinic.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/clinic - Update clinic details (doctor only)
export async function PUT(request: Request) {
  try {
    const session = await requireRole(["doctor"]);
    const clinicId = new ObjectId(session.clinicId);

    const body = await request.json();
    const {
      name,
      address,
      phone,
      email,
      website,
      logoUrl,
      headerText,
      footerText,
      taxInfo,
      publicProfile,
      receiptShareDurationMinutes,
    } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Clinic name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { error: "Valid phone number is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      name: string;
      phone: string;
      email?: string;
      website?: string;
      logoUrl?: string;
      headerText?: string;
      footerText?: string;
      address?: Address;
      taxInfo?: TaxInfo;
      publicProfile?: PublicProfile;
      receiptShareDurationMinutes?: number;
      updatedAt: Date;
    } = {
      name: name.trim(),
      phone: phone.trim(),
      updatedAt: new Date(),
    };

    // Optional fields
    if (email !== undefined) updateData.email = email.trim() || undefined;
    if (website !== undefined) updateData.website = website.trim() || undefined;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim() || undefined;
    if (headerText !== undefined) updateData.headerText = headerText.trim() || undefined;
    if (footerText !== undefined) updateData.footerText = footerText.trim() || undefined;

    // Address
    if (address) {
      updateData.address = {
        line1: address.line1?.trim() || "",
        line2: address.line2?.trim() || undefined,
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        pincode: address.pincode?.trim() || "",
      };
    }

    // Tax Info
    if (taxInfo) {
      updateData.taxInfo = {
        gstin: taxInfo.gstin?.trim() || undefined,
        pan: taxInfo.pan?.trim() || undefined,
        registrationNumber: taxInfo.registrationNumber?.trim() || undefined,
        sacCode: taxInfo.sacCode?.trim() || undefined,
        showTaxOnReceipt: taxInfo.showTaxOnReceipt || false,
      };
    }

    // Public Profile
    if (publicProfile) {
      updateData.publicProfile = {
        enabled: publicProfile.enabled || false,
        doctorName: publicProfile.doctorName?.trim() || "",
        qualifications: publicProfile.qualifications?.trim() || "",
        specialization: publicProfile.specialization?.trim() || "",
        timings: publicProfile.timings?.trim() || "",
        aboutText: publicProfile.aboutText?.trim() || undefined,
      };
    }

    // Receipt share duration
    if (receiptShareDurationMinutes !== undefined) {
      updateData.receiptShareDurationMinutes = Math.max(1, Math.min(60, Number(receiptShareDurationMinutes) || 10));
    }

    const clinics = await getClinicsCollection();
    const result = await clinics.findOneAndUpdate(
      { _id: clinicId },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      clinic: {
        id: result._id.toString(),
        name: result.name,
        slug: result.slug,
        address: result.address,
        phone: result.phone,
        email: result.email || "",
        website: result.website || "",
        logoUrl: result.logoUrl || "",
        headerText: result.headerText || "",
        footerText: result.footerText || "",
        taxInfo: result.taxInfo || {
          gstin: "",
          pan: "",
          registrationNumber: "",
          sacCode: "",
          showTaxOnReceipt: false,
        },
        publicProfile: result.publicProfile,
        receiptShareDurationMinutes: result.receiptShareDurationMinutes,
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating clinic:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
