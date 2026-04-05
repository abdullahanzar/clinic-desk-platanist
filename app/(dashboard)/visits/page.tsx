import { getSession } from "@/lib/auth/session";
import { getDb, visits } from "@/lib/db/collections";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import VisitsHistory from "@/components/visits/visits-history";

const VISITS_PER_PAGE = 20;

export default async function VisitsPage() {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const clinicId = session.clinicId;
  const today = new Date();
  const todayStartISO = startOfDay(today).toISOString();
  const todayEndISO = endOfDay(today).toISOString();

  // Get total count for today
  const totalCount = db.select({ value: count() }).from(visits)
    .where(and(eq(visits.clinicId, clinicId), gte(visits.visitDate, todayStartISO), lte(visits.visitDate, todayEndISO)))
    .get()!.value;

  // Fetch first page of today's visits (most recent first)
  const todayVisits = db.select().from(visits)
    .where(and(eq(visits.clinicId, clinicId), gte(visits.visitDate, todayStartISO), lte(visits.visitDate, todayEndISO)))
    .orderBy(desc(visits.createdAt), desc(visits.tokenNumber))
    .limit(VISITS_PER_PAGE)
    .all();

  // Transform visits for the client component
  const initialVisits = todayVisits.map((v) => ({
    id: v.id,
    patient: { name: v.patientName, phone: v.patientPhone, age: v.patientAge ?? undefined, gender: v.patientGender ?? undefined },
    visitReason: v.visitReason,
    visitDate: v.visitDate,
    tokenNumber: v.tokenNumber ?? 0,
    status: v.status,
    createdAt: v.createdAt,
  }));

  const initialPagination = {
    page: 1,
    limit: VISITS_PER_PAGE,
    totalCount,
    totalPages: Math.ceil(totalCount / VISITS_PER_PAGE),
    hasNextPage: totalCount > VISITS_PER_PAGE,
    hasPrevPage: false,
  };

  return (
    <VisitsHistory 
      role={session.role} 
      initialVisits={initialVisits}
      initialPagination={initialPagination}
    />
  );
}
