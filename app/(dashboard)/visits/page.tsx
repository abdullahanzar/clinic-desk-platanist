import { getSession } from "@/lib/auth/session";
import { getVisitsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import VisitsHistory from "@/components/visits/visits-history";

export default async function VisitsPage() {
  const session = await getSession();
  if (!session) return null;

  const visits = await getVisitsCollection();
  const clinicId = new ObjectId(session.clinicId);
  const today = new Date();

  const todayVisits = await visits
    .find({
      clinicId,
      visitDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
    })
    .sort({ tokenNumber: 1, createdAt: 1 })
    .toArray();

  // Transform visits for the client component
  const initialVisits = todayVisits.map((v) => ({
    _id: v._id.toString(),
    patient: v.patient,
    visitReason: v.visitReason,
    visitDate: v.visitDate.toISOString(),
    tokenNumber: v.tokenNumber,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <VisitsHistory 
      role={session.role} 
      initialVisits={initialVisits} 
    />
  );
}
