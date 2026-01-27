import { app, ipcMain } from "electron";
import { ChildProcess, spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import * as fs from "fs";

interface CLIRequest {
  type: string;
  request_id: string;
  command: string;
  data: Record<string, any>;
}

interface CLIResponse {
  request_id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

class TouchlineMainProcess {
  private pythonProcess: ChildProcess | null = null;
  private pendingRequests: Map<string, (response: CLIResponse) => void> =
    new Map();
  private buffer: string = "";
  private isReady: boolean = false;
  private readyResolver: ((value: void) => void) | null = null;
  private readyRejecter: ((error: Error) => void) | null = null;

  private getDatabasePath(): string {
    // Use Electron's userData directory for the database
    // This is writable and persists across app updates
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "admin.db");

    // Ensure the directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    console.log(`[TouchlineMainProcess] Database path: ${dbPath}`);
    return dbPath;
  }

  public getActualDatabasePath(): string {
    return this.getDatabasePath();
  }

  public getActualCliPath(): string {
    return this.getCliPath().command;
  }

  private getCliPath(): { command: string; args: string[] } {
    const isDevelopment =
      process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

    let cliPath: string;

    if (isDevelopment) {
      cliPath = path.join(
        process.cwd(),
        "resources",
        "python",
        "touchline_cli",
        "touchline_cli"
      );
    } else {
      const platform = process.platform;
      const exeName = platform === "win32" ? "touchline_cli.exe" : "touchline_cli";

      if (typeof process.resourcesPath !== "undefined") {
        cliPath = path.join(
          process.resourcesPath,
          "python",
          "touchline_cli",
          exeName
        );
      } else {
        cliPath = path.join(
          process.cwd(),
          "resources",
          "python",
          "touchline_cli",
          exeName
        );
      }
    }

    console.log(`[TouchlineMainProcess] Using CLI path: ${cliPath}`);
    return { command: cliPath, args: [] };
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { command, args } = this.getCliPath();
        const fs = require("fs");

        // Check if CLI executable exists
        if (!fs.existsSync(command)) {
          const errorMsg = `Python CLI not found at: ${command}\n\nPlease ensure the Touchline CLI is installed in the resources/python/touchline_cli directory.`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        console.log(`[TouchlineMainProcess] Starting CLI process: ${command}`);

        // Get the database path and set it as the working directory
        // This ensures admin.db is created in the userData directory
        const dbPath = this.getDatabasePath();
        const workingDir = path.dirname(dbPath);

        console.log(`[TouchlineMainProcess] Working directory: ${workingDir}`);

        this.pythonProcess = spawn(command, args, {
          cwd: workingDir,
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            PYTHONUNBUFFERED: "1",
            TOUCHLINE_DB_PATH: dbPath,
          },
        });

        this.pythonProcess.stdout?.on("data", (data: Buffer) => {
          console.log("[TouchlineMainProcess] stdout:", data.toString());
          this.buffer += data.toString();
          this.processBuffer();
        });

        this.pythonProcess.stderr?.on("data", (data: Buffer) => {
          console.error("[TouchlineMainProcess] stderr:", data.toString());
        });

        this.pythonProcess.on("error", (error) => {
          console.error("[TouchlineMainProcess] Process error:", error);
          this.isReady = false;
          if (this.readyRejecter) {
            this.readyRejecter(error);
            this.readyResolver = null;
            this.readyRejecter = null;
          } else {
            reject(error);
          }
        });

        this.pythonProcess.on("exit", (code) => {
          console.log(`[TouchlineMainProcess] Process exited with code: ${code}`);
          this.isReady = false;
          if (code !== 0 && code !== null) {
            const error = new Error(`Python process exited with code ${code}`);
            if (this.readyRejecter) {
              this.readyRejecter(error);
              this.readyResolver = null;
              this.readyRejecter = null;
            } else {
              reject(error);
            }
          }
        });

        // Store the resolve/reject callbacks to be called when we receive the ready message
        this.readyResolver = resolve;
        this.readyRejecter = reject;

        console.log("[TouchlineMainProcess] Process started, waiting for ready message...");

        // Set a timeout for the ready message
        setTimeout(() => {
          if (!this.isReady && this.readyRejecter) {
            this.readyRejecter(new Error("Timeout waiting for CLI ready message"));
            this.readyResolver = null;
            this.readyRejecter = null;
          }
        }, 30000); // 30 second timeout
      } catch (error) {
        console.error("[TouchlineMainProcess] Initialization error:", error);
        reject(error);
      }
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.handleResponse(message as CLIResponse);
        } catch (error) {
          console.error("Failed to parse message:", line, error);
        }
      }
    }
  }

  private handleResponse(response: CLIResponse): void {
    // Handle system ready message
    if (response.request_id === "system" && response.data?.status === "ready") {
      console.log("[TouchlineMainProcess] CLI is ready:", response.data);
      this.isReady = true;
      if (this.readyResolver) {
        this.readyResolver();
        this.readyResolver = null;
        this.readyRejecter = null;
      }
      return;
    }

    const callback = this.pendingRequests.get(response.request_id);
    if (callback) {
      callback(response);
      this.pendingRequests.delete(response.request_id);
    }
  }

  async sendCommand<T = any>(
    command: string,
    data: Record<string, any> = {}
  ): Promise<T> {
    if (!this.isReady || !this.pythonProcess) {
      throw new Error("CLI client not initialized");
    }

    return new Promise((resolve, reject) => {
      const request_id = uuidv4();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`Command timeout: ${command}`));
      }, 30000);

      const request: CLIRequest = {
        type: "request",
        request_id,
        command,
        data,
      };

      this.pendingRequests.set(request_id, (response: CLIResponse) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response.data as T);
        } else {
          reject(new Error(response.error || "Unknown error"));
        }
      });

      const requestJson = JSON.stringify(request) + "\n";
      this.pythonProcess!.stdin!.write(requestJson);
    });
  }

  cleanup(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isReady = false;
      this.pendingRequests.clear();
    }
  }
}

// Singleton instance
let touchlineInstance: TouchlineMainProcess | null = null;

export function setupTouchlineIPC(): void {
  // Initialize Touchline
  ipcMain.handle("touchline:initialize", async () => {
    try {
      if (!touchlineInstance) {
        touchlineInstance = new TouchlineMainProcess();
        await touchlineInstance.initialize();
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to initialize Touchline:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Send command
  ipcMain.handle(
    "touchline:sendCommand",
    async (_event, command: string, data: Record<string, any>) => {
      try {
        if (!touchlineInstance) {
          throw new Error("Touchline not initialized");
        }
        console.log(`[TouchlineIPC] Sending command: ${command}`, data);
        const result = await touchlineInstance.sendCommand(command, data);
        console.log(`[TouchlineIPC] Command ${command} result:`, JSON.stringify(result, null, 2));
        return { success: true, data: result };
      } catch (error) {
        console.error("Touchline command error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Cleanup on app quit
  ipcMain.on("touchline:cleanup", () => {
    if (touchlineInstance) {
      touchlineInstance.cleanup();
      touchlineInstance = null;
    }
  });

  // Get MCP configuration paths
  ipcMain.handle("touchline:getMcpPaths", async () => {
    try {
      if (!touchlineInstance) {
        touchlineInstance = new TouchlineMainProcess();
      }
      return {
        success: true,
        data: {
          cliPath: touchlineInstance.getActualCliPath(),
          dbPath: touchlineInstance.getActualDatabasePath()
        }
      };
    } catch (error) {
      console.error("Failed to get MCP paths:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
