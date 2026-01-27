import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import icon from '../../resources/icon.png?asset'
import { setupTouchlineIPC } from './touchline'

// Register the custom protocol as a standard scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: false
    }
  }
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false  // Disable web security to allow custom protocols and local file access
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

  // Register custom protocol for serving local video files with range support
  protocol.handle('file', async (request) => {
    try {
      let filePath = request.url.slice('file://'.length)
      console.log('[Protocol Handler] Request URL:', request.url)

      // Decode the URI path
      filePath = decodeURI(filePath)

      // Fix the path: add leading slash if missing (browser lowercases and removes it)
      if (!filePath.startsWith('/')) {
        filePath = '/' + filePath
      }

      // Fix case sensitivity on macOS (Users vs users)
      if (filePath.toLowerCase().startsWith('/users/')) {
        filePath = '/Users' + filePath.slice(6)
      }

      console.log('[Protocol Handler] Final path:', filePath)

      // Check if file exists to avoid infinite loop
      try {
        await fs.access(filePath)
      } catch {
        console.error('[Protocol Handler] File not found:', filePath)
        return new Response('File not found', { status: 404 })
      }

      // Read file and return response with proper headers for range support
      const stat = await fs.stat(filePath)
      const fileSize = stat.size

      // Parse range header if present
      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = (end - start) + 1

        const file = await fs.readFile(filePath)
        const chunk = file.slice(start, end + 1)

        return new Response(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': 'video/mp4'
          }
        })
      } else {
        const file = await fs.readFile(filePath)
        return new Response(file, {
          status: 200,
          headers: {
            'Content-Length': fileSize.toString(),
            'Accept-Ranges': 'bytes',
            'Content-Type': 'video/mp4'
          }
        })
      }
    } catch (error) {
      console.error('[Protocol Handler] Error:', error)
      return new Response('Internal server error', { status: 500 })
    }
  })

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
      const mediaDir = join(appDataPath, 'media')

      // Ensure media directory exists
      await fs.mkdir(mediaDir, { recursive: true })

      const savedPaths: string[] = []

      for (const file of files) {
        const timestamp = Date.now()
        const uniqueFileName = `${timestamp}_${file.name}`
        const destPath = join(mediaDir, uniqueFileName)

        await fs.writeFile(destPath, Buffer.from(file.buffer))
        savedPaths.push(destPath)
      }

      return { success: true, paths: savedPaths }
    } catch (error) {
      console.error('Failed to save files:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('files:getLocalFile', async (_event, filePath: string) => {
    try {
      // Read the file into a buffer
      const buffer = await fs.readFile(filePath)

      // Detect MIME type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase()
      const isVideo = ext === 'mp4' || ext === 'webm' || ext === 'mov' || ext === 'avi'

      let mimeType = 'application/octet-stream'
      if (ext === 'mp4') mimeType = 'video/mp4'
      else if (ext === 'webm') mimeType = 'video/webm'
      else if (ext === 'mov') mimeType = 'video/quicktime'
      else if (ext === 'avi') mimeType = 'video/x-msvideo'
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'png') mimeType = 'image/png'
      else if (ext === 'gif') mimeType = 'image/gif'
      else if (ext === 'webp') mimeType = 'image/webp'

      // For all files, return the raw buffer data that can be converted to a Blob on the renderer side
      return {
        success: true,
        data: buffer.toString('base64'),
        mimeType: mimeType,
        isVideo: isVideo
      }
    } catch (error) {
      console.error('Failed to read local file:', error)
      return { success: false, error: String(error) }
    }
  })

  // New handler to simply return the file path for videos (to avoid base64 encoding)
  ipcMain.handle('files:getVideoPath', async (_event, filePath: string) => {
    try {
      // Verify the file exists
      await fs.access(filePath)
      // URL encode the path - remove leading slash to avoid triple slash
      const pathWithoutLeadingSlash = filePath.startsWith('/') ? filePath.slice(1) : filePath
      const encodedPath = encodeURI(pathWithoutLeadingSlash).replace(/#/g, '%23')
      return { success: true, path: `file://${encodedPath}` }
    } catch (error) {
      console.error('Failed to access video file:', error)
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
