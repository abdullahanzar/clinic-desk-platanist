const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('clinicDeskDesktop', {
  platform: process.platform,
});
