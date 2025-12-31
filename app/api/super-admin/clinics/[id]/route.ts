import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getClinicsCollection, getUsersCollection } from "@/lib/db/collections";

// GET /api/super-admin/clinics/[id] - Get clinic details with users
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    const clinic = await clinics.findOne({ _id: new ObjectId(id) });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Get all users for this clinic
    const clinicUsers = await users
      .find(
        { clinicId: clinic._id },
        { projection: { passwordHash: 0 } } // Exclude password
      )
      .sort({ createdAt: -1 })
      .toArray();

    const formattedUsers = clinicUsers.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      clinic: {
        _id: clinic._id.toString(),
        name: clinic.name,
        slug: clinic.slug,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        website: clinic.website,
        logoUrl: clinic.logoUrl,
        headerText: clinic.headerText,
        footerText: clinic.footerText,
        taxInfo: clinic.taxInfo,
        publicProfile: clinic.publicProfile,
        receiptShareDurationMinutes: clinic.receiptShareDurationMinutes,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      },
      users: formattedUsers,
    });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin get clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/clinics/[id] - Update clinic details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    const clinics = await getClinicsCollection();

    const clinic = await clinics.findOne({ _id: new ObjectId(id) });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "name",
      "phone",
      "email",
      "website",
      "logoUrl",
      "headerText",
      "footerText",
      "taxInfo",
      "publicProfile",
      "receiptShareDurationMinutes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Handle address separately
    if (body.address) {
      updateFields.address = {
        ...clinic.address,
        ...body.address,
      };
    }

    // Handle slug update with uniqueness check
    if (body.slug && body.slug !== clinic.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(body.slug)) {
        return NextResponse.json(
          { error: "Slug must be lowercase with hyphens only" },
          { status: 400 }
        );
      }

      const existingClinic = await clinics.findOne({ slug: body.slug });
      if (existingClinic) {
        return NextResponse.json(
          { error: "Clinic slug already exists" },
          { status: 409 }
        );
      }
      updateFields.slug = body.slug;
    }

    await clinics.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    console.log(`[SUPER_ADMIN] Updated clinic: ${clinic.name} (${id})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin update clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/clinics/[id] - Delete clinic and all associated data
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    const clinic = await clinics.findOne({ _id: new ObjectId(id) });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Delete all users for this clinic
    const userDeleteResult = await users.deleteMany({ clinicId: new ObjectId(id) });

    // Delete the clinic
    await clinics.deleteOne({ _id: new ObjectId(id) });

    console.log(
      `[SUPER_ADMIN] Deleted clinic: ${clinic.name} (${id}) with ${userDeleteResult.deletedCount} users`
    );

    return NextResponse.json({
      success: true,
      deletedUsers: userDeleteResult.deletedCount,
    });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin delete clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
