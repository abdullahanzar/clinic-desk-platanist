import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getDb } from "@/lib/db/sqlite";
import { clinics, users } from "@/lib/db/schema";

// GET /api/super-admin/clinics/[id] - Get clinic details with users
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    const db = getDb();

    const clinic = db.select().from(clinics).where(eq(clinics.id, id)).get();

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Get all users for this clinic (exclude passwordHash)
    const clinicUsers = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.clinicId, id))
      .orderBy(desc(users.createdAt))
      .all();

    return NextResponse.json({
      clinic: {
        id: clinic.id,
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
      users: clinicUsers,
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

    const db = getDb();

    const clinic = db.select().from(clinics).where(eq(clinics.id, id)).get();
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
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
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Handle address separately
    if (body.address) {
      updateFields.address = {
        ...(clinic.address as Record<string, unknown>),
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

      const existingClinic = db
        .select()
        .from(clinics)
        .where(eq(clinics.slug, body.slug))
        .get();
      if (existingClinic) {
        return NextResponse.json(
          { error: "Clinic slug already exists" },
          { status: 409 }
        );
      }
      updateFields.slug = body.slug;
    }

    db.update(clinics).set(updateFields).where(eq(clinics.id, id)).run();

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

    const db = getDb();

    const clinic = db.select().from(clinics).where(eq(clinics.id, id)).get();
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Delete all users for this clinic
    const deletedUsers = db
      .delete(users)
      .where(eq(users.clinicId, id))
      .run();

    // Delete the clinic
    db.delete(clinics).where(eq(clinics.id, id)).run();

    console.log(
      `[SUPER_ADMIN] Deleted clinic: ${clinic.name} (${id}) with ${deletedUsers.changes} users`
    );

    return NextResponse.json({
      success: true,
      deletedUsers: deletedUsers.changes,
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
