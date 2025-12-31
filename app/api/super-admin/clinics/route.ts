import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getClinicsCollection, getUsersCollection, ensureIndexes } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";
import type { ClinicInsert, UserInsert } from "@/types";

// GET /api/super-admin/clinics - List all clinics
export async function GET() {
  try {
    await requireSuperAdminSession();

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    const clinicList = await clinics.find({}).sort({ createdAt: -1 }).toArray();

    // Get user counts for each clinic
    const clinicsWithStats = await Promise.all(
      clinicList.map(async (clinic) => {
        const userCount = await users.countDocuments({ clinicId: clinic._id });
        const activeUserCount = await users.countDocuments({
          clinicId: clinic._id,
          isActive: true,
        });

        return {
          _id: clinic._id.toString(),
          name: clinic.name,
          slug: clinic.slug,
          phone: clinic.phone,
          email: clinic.email,
          address: clinic.address,
          publicProfile: clinic.publicProfile,
          taxInfo: clinic.taxInfo,
          userCount,
          activeUserCount,
          createdAt: clinic.createdAt,
          updatedAt: clinic.updatedAt,
        };
      })
    );

    return NextResponse.json({ clinics: clinicsWithStats });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin clinics list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/clinics - Create a new clinic with doctor
export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();

    const body = await request.json();
    const {
      // Clinic info
      clinicName,
      clinicSlug,
      address,
      phone,
      email,
      website,
      logoUrl,
      headerText,
      footerText,
      taxInfo,
      publicProfile,
      receiptShareDurationMinutes = 10,
      // Doctor info
      doctorName,
      doctorEmail,
      doctorPassword,
    } = body;

    // Validate required fields
    if (!clinicName || !clinicSlug || !phone || !doctorName || !doctorEmail || !doctorPassword) {
      return NextResponse.json(
        {
          error:
            "Required fields: clinicName, clinicSlug, phone, doctorName, doctorEmail, doctorPassword",
        },
        { status: 400 }
      );
    }

    // Validate address
    if (!address || !address.line1 || !address.city || !address.state || !address.pincode) {
      return NextResponse.json(
        { error: "Address must include line1, city, state, and pincode" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(doctorEmail)) {
      return NextResponse.json(
        { error: "Invalid doctor email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (doctorPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric with hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(clinicSlug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase with hyphens only (e.g., 'my-clinic')" },
        { status: 400 }
      );
    }

    // Ensure indexes exist
    await ensureIndexes();

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    // Check if slug already exists
    const existingClinic = await clinics.findOne({ slug: clinicSlug });
    if (existingClinic) {
      return NextResponse.json(
        { error: "Clinic slug already exists" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingUser = await users.findOne({ email: doctorEmail.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create clinic
    const clinic: ClinicInsert = {
      name: clinicName,
      slug: clinicSlug,
      address: {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      phone,
      email: email || undefined,
      website: website || undefined,
      currentSharedReceiptId: null,
      currentSharedReceiptExpiresAt: null,
      receiptShareDurationMinutes,
      logoUrl: logoUrl || undefined,
      headerText: headerText || undefined,
      footerText: footerText || undefined,
      taxInfo: taxInfo || undefined,
      publicProfile: publicProfile || {
        enabled: false,
        doctorName,
        qualifications: "",
        specialization: "",
        timings: "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const clinicResult = await clinics.insertOne(clinic as never);
    const clinicId = clinicResult.insertedId;

    // Create doctor user
    const passwordHash = await hashPassword(doctorPassword);
    const doctor: UserInsert = {
      clinicId,
      name: doctorName,
      email: doctorEmail.toLowerCase(),
      passwordHash,
      role: "doctor",
      isActive: true,
      loginHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userResult = await users.insertOne(doctor as never);

    console.log(
      `[SUPER_ADMIN] Created clinic "${clinicName}" (${clinicSlug}) with doctor ${doctorEmail}`
    );

    return NextResponse.json({
      success: true,
      clinic: {
        _id: clinicId.toString(),
        name: clinicName,
        slug: clinicSlug,
      },
      doctor: {
        _id: userResult.insertedId.toString(),
        name: doctorName,
        email: doctorEmail.toLowerCase(),
      },
    });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin create clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
