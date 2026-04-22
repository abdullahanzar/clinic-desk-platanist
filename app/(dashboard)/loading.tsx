import { RouteLoadingScreen } from "@/components/layout/route-loading-screen";

export default function DashboardLoading() {
  return (
    <RouteLoadingScreen
      compact
      title="Loading your clinic workspace"
      message="Pulling the next dashboard view from the server so the page can swap in cleanly."
    />
  );
}
