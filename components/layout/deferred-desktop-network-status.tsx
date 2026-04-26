"use client";

import dynamic from "next/dynamic";

export const DeferredDesktopNetworkStatus = dynamic(
  () => import("./desktop-network-status").then((mod) => mod.DesktopNetworkStatus),
  {
    ssr: false,
    loading: () => null,
  }
);
