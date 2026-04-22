import { RouteLoadingScreen } from "@/components/layout/route-loading-screen";

export default function AuthLoading() {
  return (
    <RouteLoadingScreen
      compact
      title="Loading secure access"
      message="Preparing authentication and getting the next sign-in screen ready."
    />
  );
}