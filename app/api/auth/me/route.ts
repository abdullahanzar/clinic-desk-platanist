import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { users, clinics } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDb();
    const user = db.select().from(users).where(eq(users.id, session.userId)).get();

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clinic = db.select().from(clinics).where(eq(clinics.id, session.clinicId)).get();

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      clinic: clinic
        ? {
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
          }
        : null,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
