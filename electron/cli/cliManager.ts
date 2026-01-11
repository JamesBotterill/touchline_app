import { ChildProcess, spawn } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ProtocolHandler } from './protocol';

export interface CLIManagerOptions {
  pythonPath?: string;
  cliModule?: string;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Manages the Python CLI process lifecycle
 */
export class CLIManager {
  private process: ChildProcess | null = null;
  private protocol: ProtocolHandler;
  private options: CLIManagerOptions;
  private isRunning: boolean = false;

  constructor(options: CLIManagerOptions = {}) {
    this.options = {
      pythonPath: options.pythonPath || 'python3',
      cliModule: options.cliModule || 'touchline_cli.main',
      ...options
    };
    this.protocol = new ProtocolHandler();
  }

  /**
   * Get path to standalone CLI executable
   */
  private getCliPath(): { command: string; args: string[] } {
    const isDevelopment = !app.isPackaged;
    let cliPath: string;

    if (isDevelopment) {
      // Development: use local resources folder
      cliPath = path.join(app.getAppPath(), 'resources', 'python', 'touchline_cli', 'touchline_cli');
    } else {
      // Production: use bundled resources
      const platform = process.platform;
      const exeName = platform === 'win32' ? 'touchline_cli.exe' : 'touchline_cli';
      cliPath = path.join(process.resourcesPath, 'python', 'touchline_cli', exeName);
    }

    console.log(`[CLIManager] Using CLI path: ${cliPath}`);

    // Verify the executable exists
    if (!fs.existsSync(cliPath)) {
      throw new Error(`CLI executable not found at: ${cliPath}`);
    }

    return { command: cliPath, args: [] };
  }

  /**
   * Initialize and start the CLI process
   */
  async initialize(): Promise<void> {
    if (this.isRunning) {
      throw new Error('CLI process already running');
    }

    return new Promise((resolve, reject) => {
      try {
        const { command, args } = this.getCliPath();

        // Spawn standalone CLI executable or Python process
        this.process = spawn(command, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1'
          }
        });

        // Handle stdout (responses)
        this.process.stdout?.on('data', (data: Buffer) => {
          const messages = this.protocol.processData(data.toString());
          messages.forEach(message => {
            if (this.options.onMessage) {
              this.options.onMessage(message);
            }
          });
        });

        // Handle stderr (errors/logs)
        this.process.stderr?.on('data', (data: Buffer) => {
          console.error('[Python CLI stderr]:', data.toString());
        });

        // Handle process errors
        this.process.on('error', (error) => {
          console.error('[Python CLI error]:', error);
          if (this.options.onError) {
            this.options.onError(error);
          }
          reject(error);
        });

        // Handle process exit
        this.process.on('exit', (code, signal) => {
          console.log(`[Python CLI] Exited with code ${code}, signal ${signal}`);
          this.isRunning = false;
          this.process = null;
        });

        this.isRunning = true;
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message to the CLI process
   */
  sendMessage(message: any): void {
    if (!this.isRunning || !this.process || !this.process.stdin) {
      throw new Error('CLI process not running');
    }

    const serialized = this.protocol.serializeMessage(message);
    this.process.stdin.write(serialized);
  }

  /**
   * Check if CLI process is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Cleanup and terminate the CLI process
   */
  async cleanup(): Promise<void> {
    if (this.process) {
      return new Promise((resolve) => {
        this.process!.once('exit', () => {
          this.isRunning = false;
          this.process = null;
          this.protocol.clearBuffer();
          resolve();
        });

        // Try graceful shutdown first
        this.process!.kill('SIGTERM');

        // Force kill after timeout
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }

  /**
   * Check if Python is installed
   */
  static async checkPython(pythonPath: string = 'python3'): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(pythonPath, ['--version'], { stdio: 'pipe' });

      proc.on('error', () => resolve(false));
      proc.on('exit', (code) => resolve(code === 0));
    });
  }

  /**
   * Check if touchline CLI is installed
   */
  static async checkTouchlineInstalled(pythonPath: string = 'python3'): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(
        pythonPath,
        ['-c', 'import touchline_cli; print("installed")'],
        { stdio: 'pipe' }
      );

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', () => resolve(false));
      proc.on('exit', (code) => {
        resolve(code === 0 && output.includes('installed'));
      });
    });
  }
}
