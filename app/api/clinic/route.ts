import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/sqlite";
import { clinics } from "@/lib/db/schema";
import { requireRole, getSession } from "@/lib/auth/session";
import type { Address, PublicProfile, TaxInfo } from "@/types";

// GET /api/clinic - Get clinic details
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const clinic = db.select().from(clinics).where(eq(clinics.id, session.clinicId)).get();

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const address = clinic.address ?? {};
    const taxInfo = clinic.taxInfo ?? {
      gstin: "", pan: "", registrationNumber: "", sacCode: "", showTaxOnReceipt: false,
    };
    const publicProfile = clinic.publicProfile ?? null;

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        address,
        phone: clinic.phone,
        email: clinic.email || "",
        website: clinic.website || "",
        logoUrl: clinic.logoUrl || "",
        headerText: clinic.headerText || "",
        footerText: clinic.footerText || "",
        taxInfo,
        publicProfile,
        receiptShareDurationMinutes: clinic.receiptShareDurationMinutes,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
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
    const updateData: Record<string, unknown> = {
      name: name.trim(),
      phone: phone.trim(),
      updatedAt: new Date().toISOString(),
    };

    // Optional fields
    if (email !== undefined) updateData.email = email.trim() || null;
    if (website !== undefined) updateData.website = website.trim() || null;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim() || null;
    if (headerText !== undefined) updateData.headerText = headerText.trim() || null;
    if (footerText !== undefined) updateData.footerText = footerText.trim() || null;

    // Address (stored as JSON)
    if (address) {
      const addr: Address = {
        line1: address.line1?.trim() || "",
        line2: address.line2?.trim() || undefined,
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        pincode: address.pincode?.trim() || "",
      };
      updateData.address = addr;
    }

    // Tax Info (stored as JSON)
    if (taxInfo) {
      const ti: TaxInfo = {
        gstin: taxInfo.gstin?.trim() || undefined,
        pan: taxInfo.pan?.trim() || undefined,
        registrationNumber: taxInfo.registrationNumber?.trim() || undefined,
        sacCode: taxInfo.sacCode?.trim() || undefined,
        showTaxOnReceipt: taxInfo.showTaxOnReceipt || false,
      };
      updateData.taxInfo = ti;
    }

    // Public Profile (stored as JSON)
    if (publicProfile) {
      const pp: PublicProfile = {
        enabled: publicProfile.enabled || false,
        doctorName: publicProfile.doctorName?.trim() || "",
        qualifications: publicProfile.qualifications?.trim() || "",
        specialization: publicProfile.specialization?.trim() || "",
        timings: publicProfile.timings?.trim() || "",
        aboutText: publicProfile.aboutText?.trim() || undefined,
      };
      updateData.publicProfile = pp;
    }

    // Receipt share duration
    if (receiptShareDurationMinutes !== undefined) {
      updateData.receiptShareDurationMinutes = Math.max(1, Math.min(60, Number(receiptShareDurationMinutes) || 10));
    }

    const db = getDb();
    db.update(clinics)
      .set(updateData)
      .where(eq(clinics.id, session.clinicId))
      .run();

    // Fetch updated clinic
    const result = db.select().from(clinics).where(eq(clinics.id, session.clinicId)).get();

    if (!result) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const resAddress = result.address ?? {};
    const resTaxInfo = result.taxInfo ?? {
      gstin: "", pan: "", registrationNumber: "", sacCode: "", showTaxOnReceipt: false,
    };
    const resPP = result.publicProfile ?? null;

    return NextResponse.json({
      success: true,
      clinic: {
        id: result.id,
        name: result.name,
        slug: result.slug,
        address: resAddress,
        phone: result.phone,
        email: result.email || "",
        website: result.website || "",
        logoUrl: result.logoUrl || "",
        headerText: result.headerText || "",
        footerText: result.footerText || "",
        taxInfo: resTaxInfo,
        publicProfile: resPP,
        receiptShareDurationMinutes: result.receiptShareDurationMinutes,
        updatedAt: result.updatedAt,
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
