const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clinicDeskDesktop', {
  platform: process.platform,
  getNetworkStatus: () => ipcRenderer.invoke('clinic-desk:get-network-status'),
});
