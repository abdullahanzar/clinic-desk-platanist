interface ClinicDeskDesktopAccessUrl {
  interfaceName: string;
  address: string;
  isWifi: boolean;
  url: string;
}

interface ClinicDeskDesktopNetworkStatus {
  port: number | null;
  platform: NodeJS.Platform;
  connectionType: 'wifi' | 'wired-or-other' | 'offline';
  noticeLevel: 'success' | 'warning';
  message: string;
  wifiDetected: boolean;
  accessUrls: ClinicDeskDesktopAccessUrl[];
  primaryUrl: string | null;
  lastCheckedAt: string;
}

interface Window {
  clinicDeskDesktop?: {
    platform: NodeJS.Platform;
    getNetworkStatus: () => Promise<ClinicDeskDesktopNetworkStatus>;
  };
}