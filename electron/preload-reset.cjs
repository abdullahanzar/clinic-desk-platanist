const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clinicDeskReset', {
  submitPasscode: (passcode) => ipcRenderer.invoke('clinic-desk:reset-submit', passcode),
  cancel: () => ipcRenderer.send('clinic-desk:reset-cancel'),
});