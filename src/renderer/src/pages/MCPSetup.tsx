import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function MCPSetup() {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<"claude" | "anythingllm">("claude");
  const [cliPath, setCliPath] = useState<string>("");
  const [dbPath, setDbPath] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const result = await window.api.touchline.getMcpPaths();
        if (result.success && result.data) {
          setCliPath(result.data.cliPath);
          setDbPath(result.data.dbPath);
        } else {
          setError(result.error || "Failed to fetch paths");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  // Production database paths (when Electron app is packaged)
  const productionDbPaths = {
    mac: "~/Library/Application Support/Touchline/admin.db",
    linux: "~/.config/Touchline/admin.db",
    windows: "C:\\Users\\<usr>\\AppData\\Roaming\\Touchline\\admin.db"
  };

  // Claude Desktop paths
  const claudeConfigPath = "~/Library/Application Support/Claude/claude_desktop_config.json";

  // AnythingLLM paths
  const anythingLLMPaths = {
    mac: "/Users/<usr>/Library/Application Support/anythingllm-desktop/storage/plugins/anythingllm_mcp_servers.json",
    linux: "~/.config/anythingllm-desktop/storage/plugins/anythingllm_mcp_servers.json",
    windows: "C:\\Users\\<usr>\\AppData\\Roaming\\anythingllm-desktop\\storage\\plugins\\anythingllm_mcp_servers.json"
  };

  const claudeConfigJson = {
    mcpServers: {
      touchline: {
        command: cliPath,
        args: ["--mcp", "--db-path", dbPath]
      }
    }
  };

  const anythingLLMConfigJson = {
    mcpServers: {
      touchline: {
        command: cliPath,
        args: ["--mcp", "--db-path", dbPath]
      }
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MCP Setup</h2>
          <p className="text-muted-foreground">
            Configure Claude Desktop or AnythingLLM to access Touchline Analytics data
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MCP Setup</h2>
          <p className="text-muted-foreground">
            Configure Claude Desktop or AnythingLLM to access Touchline Analytics data
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading paths: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">MCP Setup</h2>
        <p className="text-muted-foreground">
          Configure Claude Desktop or AnythingLLM to access Touchline Analytics data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Application</CardTitle>
          <CardDescription>
            Choose which application you want to configure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={selectedApp === "claude" ? "default" : "outline"}
              onClick={() => setSelectedApp("claude")}
            >
              Claude Desktop
            </Button>
            <Button
              variant={selectedApp === "anythingllm" ? "default" : "outline"}
              onClick={() => setSelectedApp("anythingllm")}
            >
              AnythingLLM
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            The Touchline MCP (Model Context Protocol) server provides {selectedApp === "claude" ? "Claude Desktop" : "AnythingLLM"} with access to your logo detection historical data and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Prerequisites</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Touchline CLI built and installed</li>
              <li>{selectedApp === "claude" ? "Claude Desktop" : "AnythingLLM"} app installed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: File Locations</CardTitle>
          <CardDescription>
            Current paths for your Touchline installation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CLI Command Path</label>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs break-all">
                {cliPath}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(cliPath, "cli")}
              >
                {copied === "cli" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Database Path</label>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs break-all">
                {dbPath}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(dbPath, "db")}
              >
                {copied === "db" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

{selectedApp === "claude" ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Claude Desktop</CardTitle>
            <CardDescription>
              Add this configuration to your Claude Desktop config file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Config File Location (macOS)</label>
              <div className="flex gap-2">
                <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs">
                  {claudeConfigPath}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(claudeConfigPath, "config")}
                >
                  {copied === "config" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration JSON</label>
              <div className="relative">
                <pre className="rounded-md border border-input bg-muted p-4 text-xs overflow-x-auto">
                  {JSON.stringify(claudeConfigJson, null, 2)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(JSON.stringify(claudeConfigJson, null, 2), "json")}
                >
                  {copied === "json" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> If you already have other MCP servers configured, add the "touchline" entry to your existing "mcpServers" object rather than replacing the entire file.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure AnythingLLM</CardTitle>
            <CardDescription>
              Add this configuration to your AnythingLLM MCP servers file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Config File Location</label>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">macOS:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs break-all">
                      {anythingLLMPaths.mac}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(anythingLLMPaths.mac, "config-mac")}
                    >
                      {copied === "config-mac" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Linux:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs break-all">
                      {anythingLLMPaths.linux}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(anythingLLMPaths.linux, "config-linux")}
                    >
                      {copied === "config-linux" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Windows:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs break-all">
                      {anythingLLMPaths.windows}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(anythingLLMPaths.windows, "config-windows")}
                    >
                      {copied === "config-windows" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Replace &lt;usr&gt; with your username
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration JSON</label>
              <div className="relative">
                <pre className="rounded-md border border-input bg-muted p-4 text-xs overflow-x-auto">
                  {JSON.stringify(anythingLLMConfigJson, null, 2)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(JSON.stringify(anythingLLMConfigJson, null, 2), "json")}
                >
                  {copied === "json" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The config file will be automatically created if you open the "Agent Skills" page in AnythingLLM. If you already have other MCP servers configured, add the "touchline" entry to your existing "mcpServers" object.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

{selectedApp === "claude" ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Restart Claude Desktop</CardTitle>
            <CardDescription>
              Apply the configuration changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Completely quit and restart Claude Desktop for the changes to take effect.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Use Cmd+Q to fully quit Claude Desktop</li>
              <li>Relaunch the application</li>
              <li>Wait a few seconds for the MCP server to initialize</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Activate MCP Server in AnythingLLM</CardTitle>
            <CardDescription>
              Enable the Touchline MCP server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              AnythingLLM will automatically detect and start MCP servers:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Open the "Agent Skills" page in AnythingLLM</li>
              <li>The MCP server will start automatically when you invoke @agent</li>
              <li>You can manually start/stop servers via the gear icon in Agent Skills</li>
              <li>Use the "Refresh" button to reload servers after config changes</li>
            </ul>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> MCP servers do not automatically start on application launch. They start when you open "Agent Skills" or use the @agent directive.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Verify Setup</CardTitle>
          <CardDescription>
            Test that {selectedApp === "claude" ? "Claude Desktop" : "AnythingLLM"} can access your Touchline data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">In {selectedApp === "claude" ? "Claude Desktop" : "AnythingLLM"}, try asking:</p>
            <code className="block rounded-md border border-input bg-muted px-3 py-2 text-sm">
              "What detection jobs do I have?"
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            The AI should be able to access your Touchline database and respond with your historical data.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-sm">MCP not connecting</dt>
              <dd className="text-sm text-muted-foreground ml-4">
                Check that the CLI command path is correct and the file exists. The file should be executable.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-sm">No data returned</dt>
              <dd className="text-sm text-muted-foreground ml-4">
                Verify the TOUCHLINE_DB path points to your database file and the file exists.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-sm">Permission errors</dt>
              <dd className="text-sm text-muted-foreground ml-4">
                Ensure {selectedApp === "claude" ? "Claude Desktop" : "AnythingLLM"} has read access to both the CLI executable and the database file.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-sm">Configuration not loading</dt>
              <dd className="text-sm text-muted-foreground ml-4">
                {selectedApp === "claude"
                  ? "Check that the JSON syntax is valid. Use a JSON validator if needed. Ensure you've fully quit and restarted Claude Desktop."
                  : "Check that the JSON syntax is valid. Open the Agent Skills page to verify the server appears. Use the Refresh button to reload configuration changes."
                }
              </dd>
            </div>
            {selectedApp === "anythingllm" && (
              <>
                <div>
                  <dt className="font-semibold text-sm">Server not starting</dt>
                  <dd className="text-sm text-muted-foreground ml-4">
                    Check the Desktop application logs for debugging. Ensure the command (CLI) is installed and accessible on your host machine.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm">Tools not available</dt>
                  <dd className="text-sm text-muted-foreground ml-4">
                    Only MCP "Tools" are supported in AnythingLLM. Resources, Prompts, and Sampling are not currently supported.
                  </dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Location Notes</CardTitle>
          <CardDescription>
            Information about database locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong className="text-sm">Current Database Location:</strong>
            <p className="text-sm text-muted-foreground ml-4 mt-1">
              {dbPath}
            </p>
            <p className="text-xs text-muted-foreground ml-4 mt-1">
              This is the database path currently being used by the Electron app. The CLI will automatically connect to this location based on where it's launched from.
            </p>
          </div>
          <div>
            <strong className="text-sm">CLI Path (Current):</strong>
            <p className="text-sm text-muted-foreground ml-4 mt-1">
              {cliPath}
            </p>
            <p className="text-xs text-muted-foreground ml-4 mt-1">
              This is the current CLI path. Note: This path is for reference and may differ when using a bundled/packaged app.
            </p>
          </div>
          <div>
            <strong className="text-sm">CLI Path for Bundled App:</strong>
            <p className="text-sm text-muted-foreground ml-4 mt-1">
              When using a packaged Touchline app, the CLI path will be inside the app bundle:
            </p>
            <ul className="list-disc list-inside ml-8 mt-2 space-y-1 text-xs text-muted-foreground">
              <li><strong>macOS:</strong> /Applications/Touchline.app/Contents/Resources/python/touchline_cli/touchline_cli</li>
              <li><strong>Windows:</strong> C:\Program Files\Touchline\resources\python\touchline_cli\touchline_cli.exe</li>
              <li><strong>Linux:</strong> /opt/Touchline/resources/python/touchline_cli/touchline_cli</li>
            </ul>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important for MCP Configuration:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-xs text-yellow-800">
              <li>The CLI path shown above ({cliPath}) is used by the Electron app internally</li>
              <li>For external MCP clients (Claude Desktop/AnythingLLM), use the full path to the CLI executable</li>
              <li>Always use the <code>--db-path</code> argument to specify: {dbPath}</li>
              <li>In production, update both the CLI path and database path to match your installation location</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
