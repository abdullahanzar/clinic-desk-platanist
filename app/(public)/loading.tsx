import { RouteLoadingScreen } from "@/components/layout/route-loading-screen";

export default function PublicLoading() {
  return (
    <RouteLoadingScreen
      compact
      title="Opening shared view"
      message="Fetching the public receipt and preparing the printable layout."
    />
  );
}
