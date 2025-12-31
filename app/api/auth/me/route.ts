import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getUsersCollection, getClinicsCollection } from "@/lib/db/collections";
import { seedDatabase } from "@/lib/db/seed";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(session.userId) });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clinics = await getClinicsCollection();
    const clinic = await clinics.findOne({ _id: new ObjectId(session.clinicId) });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      clinic: clinic
        ? {
            id: clinic._id.toString(),
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
