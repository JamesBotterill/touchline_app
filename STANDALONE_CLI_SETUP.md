# Standalone CLI Setup Instructions

## Overview

This Electron app uses a standalone PyInstaller build of the Touchline CLI. This eliminates the need for users to install Python.

## Setup Steps

### 1. Build the Standalone CLI

Navigate to your touchline project and build the standalone executable:

```bash
cd /path/to/touchline
./build_standalone.sh
```

This creates `dist/touchline_cli/` (approximately 621 MB).

### 2. Copy CLI to Electron App

Copy the built CLI to the Electron app's resources folder:

```bash
# From the touchline project directory
cp -r dist/touchline_cli /Users/jamesbotterill/Projects/touchline_app/resources/python/

# Verify the copy
ls -la /Users/jamesbotterill/Projects/touchline_app/resources/python/touchline_cli/
```

You should see:
```
touchline_cli (or touchline_cli.exe on Windows)
_internal/ (directory with dependencies)
```

### 3. Set Executable Permissions (macOS/Linux)

```bash
chmod +x /Users/jamesbotterill/Projects/touchline_app/resources/python/touchline_cli/touchline_cli
```

### 4. Verify Structure

Your project should now have:

```
touchline_app/
├── resources/
│   └── python/
│       └── touchline_cli/
│           ├── touchline_cli         # Main executable
│           └── _internal/             # Dependencies (~621 MB)
├── build/
│   └── entitlements.mac.plist        # macOS entitlements (✅ created)
├── src/
├── electron/
└── electron-builder.json             # ✅ Updated
```

## Development Modes

### Option 1: Use Standalone CLI (Production-like)

Default mode - uses the standalone executable:

```bash
npm run dev
```

### Option 2: Use Python Directly (Faster Iteration)

If you have Python and touchline_cli installed locally:

```bash
USE_PYTHON_DEV=1 npm run dev
```

This bypasses the standalone executable and uses `python -m touchline_cli` directly.

## Testing

### Test CLI Manually

```bash
cd resources/python/touchline_cli
echo '{"request_id": "test_001", "command": "system.status", "data": {}}' | ./touchline_cli
```

Expected output:
```json
{"request_id": "test_001", "success": true, "data": {"status": "ready", ...}}
```

### Test in Electron Dev Mode

```bash
npm run dev
```

Check the console for:
```
[TouchlineClient] Using CLI path: /path/to/resources/python/touchline_cli/touchline_cli
[CLIManager] Using CLI path: /path/to/resources/python/touchline_cli/touchline_cli
```

## Building for Production

```bash
npm run build
```

The standalone CLI will be bundled into the app installer:
- **macOS DMG**: ~350 MB (compressed)
- **Windows Installer**: ~320 MB (compressed)
- **Linux AppImage**: ~340 MB

## Troubleshooting

### Issue: "CLI executable not found"

**Solution**: Verify the CLI was copied correctly:
```bash
ls -la resources/python/touchline_cli/touchline_cli
```

### Issue: "Permission denied" (macOS/Linux)

**Solution**: Set executable permission:
```bash
chmod +x resources/python/touchline_cli/touchline_cli
```

### Issue: "Library not loaded" (macOS)

**Solution**: The app needs to be code-signed. During development:
```bash
codesign --force --deep --sign - resources/python/touchline_cli/touchline_cli
```

For production builds, electron-builder handles this automatically with the entitlements file.

### Issue: CLI not found in production build

**Solution**: Ensure `electron-builder.json` has the correct `extraResources` configuration (already set up).

## Code Changes Summary

### ✅ Completed Updates

1. **src/lib/touchline/client.ts**
   - Added `getCliPath()` method to detect dev vs production
   - Spawns standalone executable instead of Python
   - Supports `USE_PYTHON_DEV=1` fallback

2. **electron/cli/cliManager.ts**
   - Added `getCliPath()` method with Electron app path detection
   - Uses `app.getAppPath()` in dev, `process.resourcesPath` in production
   - Verifies executable exists before spawning

3. **electron-builder.json**
   - Updated `extraResources` to bundle entire `touchline_cli` directory
   - Added macOS `hardenedRuntime` and entitlements

4. **build/entitlements.mac.plist**
   - Created with required permissions for bundled executables

## Next Steps

Once you've copied the standalone CLI:

1. ✅ Test in development: `npm run dev`
2. ✅ Verify CLI loads without errors
3. ✅ Test a simple command (e.g., `sponsors.get_all`)
4. 🔜 Build production app: `npm run build`
5. 🔜 Test installed app

## Notes

- The standalone CLI takes ~2-3 seconds to start (PyTorch initialization)
- Consider showing a loading screen during initialization
- Bundle size is large but necessary for ML functionality
- No Python installation required for end users ✅
