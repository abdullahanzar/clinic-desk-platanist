import { getDb } from "./mongodb";
import { ensureIndexes, getClinicsCollection, getUsersCollection } from "./collections";
import { hashPassword } from "../auth/password";
import type { ClinicInsert, UserInsert } from "@/types";

/**
 * Seeds the database with initial clinic and user data.
 * Run this once to set up the system.
 */
export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  await ensureIndexes();

  const clinics = await getClinicsCollection();
  const users = await getUsersCollection();

  // Check if already seeded
  const existingClinic = await clinics.findOne({ slug: "demo-clinic" });
  if (existingClinic) {
    console.log("⚠️  Database already seeded. Skipping...");
    return { clinicId: existingClinic._id.toString() };
  }

  // Create demo clinic
  const clinic: ClinicInsert = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const clinicResult = await clinics.insertOne(clinic as never);
  const clinicId = clinicResult.insertedId;
  console.log("✅ Created clinic:", clinic.name);

  // Create doctor user
  const doctorPassword = await hashPassword("doctor123");
  const doctor: UserInsert = {
    clinicId,
    name: "Dr. Demo",
    email: "doctor@demo.com",
    passwordHash: doctorPassword,
    role: "doctor",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await users.insertOne(doctor as never);
  console.log("✅ Created doctor user: doctor@demo.com / doctor123");

  // Create front desk user
  const frontdeskPassword = await hashPassword("frontdesk123");
  const frontdesk: UserInsert = {
    clinicId,
    name: "Front Desk",
    email: "frontdesk@demo.com",
    passwordHash: frontdeskPassword,
    role: "frontdesk",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await users.insertOne(frontdesk as never);
  console.log("✅ Created front desk user: frontdesk@demo.com / frontdesk123");

  console.log("🎉 Database seed complete!");
  console.log("");
  console.log("Login credentials:");
  console.log("  Doctor: doctor@demo.com / doctor123");
  console.log("  Front Desk: frontdesk@demo.com / frontdesk123");

  return { clinicId: clinicId.toString() };
}
