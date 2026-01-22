# MCP Server Setup Guide

## Overview
The Touchline MCP (Model Context Protocol) server provides Claude Desktop with access to your logo detection historical data and analytics.

## Prerequisites
- Touchline CLI built and installed
- Claude Desktop app installed

## Setup Steps

### 1. Build the CLI
```bash
./build_standalone.sh
```

### 2. Configure Claude Desktop / anythingLLM

Add to your MCP config file:

**Claude Desktop (macOS)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**anythingLLM**: Settings → MCP Configuration

```json
{
  "mcpServers": {
    "touchline": {
      "command": "/path/to/touchline/dist/touchline_cli/touchline_cli",
      "args": ["--mcp", "--db-path", "/path/to/your/admin.db"]
    }
  }
}
```

**Example configuration:**
```json
{
  "mcpServers": {
    "touchline": {
      "command": "/path/to/touchline_app/resources/python/touchline_cli/touchline_cli",
      "args": ["--mcp", "--db-path", "/path/to/database/admin.db"]
    }
  }
}
```

**Platform-specific database paths:**

The Electron app stores the database in the system's userData directory:

- **macOS**: `~/Library/Application Support/Touchline/admin.db`
- **Windows**: `%APPDATA%/Touchline/admin.db`
- **Linux**: `~/.config/Touchline/admin.db`

**Full example for macOS:**
```json
{
  "mcpServers": {
    "touchline": {
      "command": "/Applications/Touchline.app/Contents/Resources/python/touchline_cli/touchline_cli",
      "args": ["--mcp", "--db-path", "/Users/YOUR_USERNAME/Library/Application Support/Touchline/admin.db"]
    }
  }
}
```

### 3. Restart Claude Desktop

Completely quit and restart Claude Desktop for changes to take effect.

## Verify Setup

In Claude Desktop, ask:
> "What detection jobs do I have?"

Claude should be able to access your Touchline database and respond with your historical data.

## Database Location

**Development**: `admin.db` in project root
**Production**: See `CLAUDE.md` for platform-specific user data directories

## Troubleshooting

### Connection Issues

- **MCP not connecting**:
  - Verify the path to `touchline_cli` is correct and executable
  - Check MCP client logs for detailed error messages
  - Ensure you've restarted your MCP client after config changes

- **"Connection closed" errors**:
  - The CLI is working but closed unexpectedly
  - Check the `--db-path` argument points to a valid database file
  - Verify the database file exists and is readable

- **No data returned**:
  - Verify `--db-path` points to your database file
  - Ensure the database has been initialized with data

- **Permission errors**:
  - Ensure the MCP client has read access to the database file
  - Check file permissions: `ls -l /path/to/admin.db`

- **Database not found**:
  - Verify the database path exists at the specified location
  - Use absolute paths in the configuration
