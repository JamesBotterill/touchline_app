import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import icon from '../../resources/icon.png?asset'
import { setupTouchlineIPC } from './touchline'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Open DevTools in development
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.touchline.analytics')
  }

  // Setup Touchline IPC handlers
  setupTouchlineIPC()

  // Setup file handling IPC handlers
  ipcMain.handle('files:select', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: options.filters || [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ]
    })
    return result.filePaths
  })

  ipcMain.handle('files:copyToAppData', async (_event, filePaths: string[]) => {
    try {
      const appDataPath = app.getPath('userData')
      const logosDir = join(appDataPath, 'logos')

      // Ensure logos directory exists
      await fs.mkdir(logosDir, { recursive: true })

      const copiedPaths: string[] = []

      for (const filePath of filePaths) {
        const fileName = filePath.split(/[\\/]/).pop() || 'logo.png'
        const timestamp = Date.now()
        const uniqueFileName = `${timestamp}_${fileName}`
        const destPath = join(logosDir, uniqueFileName)

        await fs.copyFile(filePath, destPath)
        copiedPaths.push(destPath)
      }

      return { success: true, paths: copiedPaths }
    } catch (error) {
      console.error('Failed to copy files:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('files:saveFiles', async (_event, files: Array<{ name: string; buffer: ArrayBuffer }>) => {
    try {
      const appDataPath = app.getPath('userData')
      const logosDir = join(appDataPath, 'logos')

      // Ensure logos directory exists
      await fs.mkdir(logosDir, { recursive: true })

      const savedPaths: string[] = []

      for (const file of files) {
        const timestamp = Date.now()
        const uniqueFileName = `${timestamp}_${file.name}`
        const destPath = join(logosDir, uniqueFileName)

        await fs.writeFile(destPath, Buffer.from(file.buffer))
        savedPaths.push(destPath)
      }

      return { success: true, paths: savedPaths }
    } catch (error) {
      console.error('Failed to save files:', error)
      return { success: false, error: String(error) }
    }
  })


  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
