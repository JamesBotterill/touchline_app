import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  touchline: {
    initialize: () => ipcRenderer.invoke('touchline:initialize'),
    sendCommand: (command: string, data: Record<string, any> = {}) =>
      ipcRenderer.invoke('touchline:sendCommand', command, data),
    cleanup: () => ipcRenderer.send('touchline:cleanup'),
    getMcpPaths: () => ipcRenderer.invoke('touchline:getMcpPaths')
  },
  files: {
    selectFiles: (options: { multiple?: boolean; filters?: any[] }) =>
      ipcRenderer.invoke('files:select', options),
    copyToAppData: (filePaths: string[]) =>
      ipcRenderer.invoke('files:copyToAppData', filePaths),
    saveFiles: (files: Array<{ name: string; buffer: ArrayBuffer }>) =>
      ipcRenderer.invoke('files:saveFiles', files),
    getLocalFile: (filePath: string) =>
      ipcRenderer.invoke('files:getLocalFile', filePath),
    getVideoPath: (filePath: string) =>
      ipcRenderer.invoke('files:getVideoPath', filePath)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
