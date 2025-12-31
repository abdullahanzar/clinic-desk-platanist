import { getSession } from "@/lib/auth/session";
import { getVisitsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import VisitsHistory from "@/components/visits/visits-history";

const VISITS_PER_PAGE = 20;

export default async function VisitsPage() {
  const session = await getSession();
  if (!session) return null;

  const visits = await getVisitsCollection();
  const clinicId = new ObjectId(session.clinicId);
  const today = new Date();

  // Get total count for today
  const totalCount = await visits.countDocuments({
    clinicId,
    visitDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
  });

  // Fetch first page of today's visits (most recent first)
  const todayVisits = await visits
    .find({
      clinicId,
      visitDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
    })
    .sort({ createdAt: -1, tokenNumber: -1 })
    .limit(VISITS_PER_PAGE)
    .toArray();

  // Transform visits for the client component
  const initialVisits = todayVisits.map((v) => ({
    _id: v._id.toString(),
    patient: v.patient,
    visitReason: v.visitReason,
    visitDate: v.visitDate.toISOString(),
    tokenNumber: v.tokenNumber ?? 0,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
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
