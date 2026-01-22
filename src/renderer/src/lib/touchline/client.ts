import { ChildProcess, spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import type { CLIRequest, CLIResponse, CLIEvent, ClientOptions, ResponseCallback, EventCallback } from './types';

export class TouchlineClient {
  private pythonProcess: ChildProcess | null = null;
  private pendingRequests: Map<string, ResponseCallback> = new Map();
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  private buffer: string = '';
  private isReady: boolean = false;
  private options: ClientOptions;

  constructor(options: ClientOptions = {}) {
    this.options = {
      pythonPath: options.pythonPath || 'python3',
      cliModule: options.cliModule || 'touchline_cli.main',
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Get path to standalone CLI executable
   */
  private getCliPath(): { command: string; args: string[] } {
    // Determine if we're in development or production
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    let cliPath: string;

    if (isDevelopment) {
      // Development: use local resources folder
      cliPath = path.join(process.cwd(), 'resources', 'python', 'touchline_cli', 'touchline_cli');
    } else {
      // Production: use bundled resources
      // Note: In Electron, process.resourcesPath points to the app's resources directory
      const platform = process.platform;
      const exeName = platform === 'win32' ? 'touchline_cli.exe' : 'touchline_cli';

      if (typeof (global as any).process?.resourcesPath !== 'undefined') {
        // Running in Electron
        cliPath = path.join((global as any).process.resourcesPath, 'python', 'touchline_cli', exeName);
      } else {
        // Fallback
        cliPath = path.join(process.cwd(), 'resources', 'python', 'touchline_cli', exeName);
      }
    }

    console.log(`[TouchlineClient] Using CLI path: ${cliPath}`);
    return { command: cliPath, args: [] };
  }

  /**
   * Initialize Python CLI subprocess
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { command, args } = this.getCliPath();

        // Spawn standalone CLI executable or Python process
        this.pythonProcess = spawn(command, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1'
          }
        });

        // Handle stdout responses
        this.pythonProcess.stdout?.on('data', (data: Buffer) => {
          this.buffer += data.toString();
          this.processBuffer();
        });

        // Handle stderr for debugging
        this.pythonProcess.stderr?.on('data', (data: Buffer) => {
          console.error('Python CLI stderr:', data.toString());
        });

        // Handle process errors
        this.pythonProcess.on('error', (error) => {
          console.error('Python process error:', error);
          reject(error);
        });

        // Handle process exit
        this.pythonProcess.on('exit', (code) => {
          console.log('Python process exited with code:', code);
          this.isReady = false;
          if (code !== 0 && code !== null) {
            reject(new Error(`Python process exited with code ${code}`));
          }
        });

        // Mark as ready
        this.isReady = true;
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process buffered data and parse JSON responses
   */
  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);

          // Check if it's an event or response
          if (message.type === 'event') {
            this.handleEvent(message as CLIEvent);
          } else {
            this.handleResponse(message as CLIResponse);
          }
        } catch (error) {
          console.error('Failed to parse message:', line, error);
        }
      }
    }
  }

  /**
   * Handle response messages
   */
  private handleResponse(response: CLIResponse): void {
    const callback = this.pendingRequests.get(response.request_id);
    if (callback) {
      callback(response);
      this.pendingRequests.delete(response.request_id);
    } else {
      console.warn('Received response for unknown request:', response.request_id);
    }
  }

  /**
   * Handle event messages
   */
  private handleEvent(event: CLIEvent): void {
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  /**
   * Send command and get response
   */
  async sendCommand<T = any>(
    command: string,
    data: Record<string, any> = {}
  ): Promise<T> {
    if (!this.isReady || !this.pythonProcess) {
      throw new Error('CLI client not initialized');
    }

    return new Promise((resolve, reject) => {
      const request_id = uuidv4();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`Command timeout: ${command}`));
      }, this.options.timeout);

      const request: CLIRequest = {
        request_id,
        command,
        data
      };

      // Store callback
      this.pendingRequests.set(request_id, (response: CLIResponse) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response.data as T);
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });

      // Send request
      const requestJson = JSON.stringify(request) + '\n';
      this.pythonProcess!.stdin!.write(requestJson);
    });
  }

  /**
   * Subscribe to events (progress, status updates)
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Cleanup and close Python process
   */
  async cleanup(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isReady = false;
      this.pendingRequests.clear();
      this.eventHandlers.clear();
    }
  }

  /**
   * Check if client is ready
   */
  ready(): boolean {
    return this.isReady;
  }
}
