import { NextResponse } from "next/server";
import { deleteSuperAdminSession } from "@/lib/auth/super-admin";

export async function POST() {
  try {
    await deleteSuperAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Super admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
