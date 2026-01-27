import { ElectronAPI } from '@electron-toolkit/preload'

interface TouchlineAPI {
  initialize: () => Promise<{ success: boolean; error?: string }>;
  sendCommand: (command: string, data?: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  cleanup: () => void;
  getMcpPaths: () => Promise<any>;
}

interface FilesAPI {
  selectFiles: (options: { multiple?: boolean; filters?: any[] }) => Promise<string[]>;
  copyToAppData: (filePaths: string[]) => Promise<{ success: boolean; paths?: string[]; error?: string }>;
  saveFiles: (files: Array<{ name: string; buffer: ArrayBuffer }>) => Promise<{ success: boolean; paths?: string[]; error?: string }>;
  getLocalFile: (filePath: string) => Promise<{ success: boolean; data?: string; mimeType?: string; isVideo?: boolean; error?: string }>;
  getVideoPath: (filePath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      touchline: TouchlineAPI
      files: FilesAPI
    }
  }
}
