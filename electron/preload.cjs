const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clinicDeskDesktop', {
  platform: process.platform,
  getNetworkStatus: () => ipcRenderer.invoke('clinic-desk:get-network-status'),
  getStartupTimings: () => ipcRenderer.invoke('clinic-desk:get-startup-timings'),
  reportRendererMetric: (metric) => ipcRenderer.send('clinic-desk:renderer-metric', metric),
});
