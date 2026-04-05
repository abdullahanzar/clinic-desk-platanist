import { getDb } from "@/lib/db/sqlite";
import { clinics, users, generateId } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";

/**
 * Seeds the database with initial clinic and user data.
 * Run this once to set up the system.
 */
export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  const db = getDb();

  // Check if already seeded
  const existingClinic = db
    .select()
    .from(clinics)
    .where(eq(clinics.slug, "demo-clinic"))
    .get();

  if (existingClinic) {
    console.log("⚠️  Database already seeded. Skipping...");
    return { clinicId: existingClinic.id };
  }

  const now = new Date().toISOString();
  const clinicId = generateId();

  // Create demo clinic
  db.insert(clinics)
    .values({
      id: clinicId,
      name: "Demo Clinic",
      slug: "demo-clinic",
      address: {
        line1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      phone: "9876543210",
      currentSharedReceiptId: null,
      currentSharedReceiptExpiresAt: null,
      receiptShareDurationMinutes: 10,
      footerText: "Thank you for visiting! Get well soon.",
      publicProfile: {
        enabled: true,
        doctorName: "Dr. Demo",
        qualifications: "MBBS, MD",
        specialization: "General Physician",
        timings: "Mon-Sat: 10:00 AM - 1:00 PM, 5:00 PM - 8:00 PM",
        aboutText: "Experienced general physician with 10+ years of practice.",
      },
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log("✅ Created clinic: Demo Clinic");

  // Create doctor user
  const doctorPassword = await hashPassword("doctor123");
  const doctorId = generateId();

  db.insert(users)
    .values({
      id: doctorId,
      clinicId,
      name: "Dr. Demo",
      email: "doctor@demo.com",
      passwordHash: doctorPassword,
      role: "doctor",
      isActive: true,
      loginHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log("✅ Created doctor user: doctor@demo.com / doctor123");

  // Create front desk user
  const frontdeskPassword = await hashPassword("frontdesk123");

  db.insert(users)
    .values({
      id: generateId(),
      clinicId,
      name: "Front Desk",
      email: "frontdesk@demo.com",
      passwordHash: frontdeskPassword,
      role: "frontdesk",
      isActive: true,
      loginHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log("✅ Created front desk user: frontdesk@demo.com / frontdesk123");

  console.log("🎉 Database seed complete!");
  console.log("");
  console.log("Login credentials:");
  console.log("  Doctor: doctor@demo.com / doctor123");
  console.log("  Front Desk: frontdesk@demo.com / frontdesk123");

  return { clinicId, doctorId };
}
