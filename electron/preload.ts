import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Electron APIs will be exposed here
});
