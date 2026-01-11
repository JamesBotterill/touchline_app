# React/Electron Integration Guide

## Overview

This document describes how to integrate the React/Electron frontend with the Python CLI backend using the stdin/stdout JSON protocol.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  React/Electron     │         │  Python CLI Backend  │
│  Frontend           │         │                      │
│                     │ stdin/  │  ┌────────────────┐  │
│  ┌──────────────┐   │ stdout  │  │    Router      │  │
│  │ TypeScript   │◄──┼────────►│  │                │  │
│  │ API Client   │   │  JSON   │  │  ┌──────────┐  │  │
│  └──────────────┘   │         │  │  │ Handlers │  │  │
│                     │         │  │  └──────────┘  │  │
└─────────────────────┘         │  └────────────────┘  │
                                │                      │
                                │  Thread-safe with    │
                                │  concurrent tasks    │
                                └──────────────────────┘
```

## Message Protocol

### Request Format

```typescript
interface Request {
  request_id: string;      // Unique identifier (UUID recommended)
  command: string;         // Command name (e.g., "detections.detect_async")
  data: Record<string, any>; // Command parameters
}
```

### Response Format

```typescript
interface Response {
  request_id: string;      // Matches request
  success: boolean;        // true for success, false for error
  data?: Record<string, any>;  // Response data (success case)
  error?: string;          // Error message (error case)
}
```

### Example Messages

**Request:**
```json
{
  "request_id": "a3f4b2c1-1234-5678-9abc-def012345678",
  "command": "detections.detect_async",
  "data": {
    "input_path": "/path/to/video.mp4",
    "confidence": 0.3,
    "output_path": "/path/to/output.mp4"
  }
}
```

**Response (Success):**
```json
{
  "request_id": "a3f4b2c1-1234-5678-9abc-def012345678",
  "success": true,
  "data": {
    "success": true,
    "task_id": "detection_a3f4b2c1",
    "input_path": "/path/to/video.mp4",
    "message": "Detection task started"
  }
}
```

**Response (Error):**
```json
{
  "request_id": "a3f4b2c1-1234-5678-9abc-def012345678",
  "success": false,
  "error": "input_path is required"
}
```

## Available Commands

### Detection API

| Command | Description | Returns |
|---------|-------------|---------|
| `detections.detect_sync` | Run synchronous detection (blocks) | Detection result |
| `detections.detect_async` | Start async detection (returns immediately) | Task ID |
| `detections.detect_batch` | Start batch detection | Batch ID + task IDs |
| `detections.get_task_status` | Get status of async task | Task status |
| `detections.cancel_task` | Cancel running task | Cancellation status |
| `detections.list_tasks` | List all active tasks | Task list |
| `detections.cleanup_tasks` | Clean up completed tasks | Cleanup stats |

### Training API

| Command | Description | Returns |
|---------|-------------|---------|
| `training.train_sync` | Run synchronous training (blocks) | Training result |
| `training.train_async` | Start async training (returns immediately) | Task ID |
| `training.get_task_status` | Get status of async task | Task status |
| `training.cancel_task` | Cancel running task | Cancellation status |
| `training.list_tasks` | List all active tasks | Task list |
| `training.cleanup_tasks` | Clean up completed tasks | Cleanup stats |
| `training.list_models` | List available trained models | Model list |
| `training.export_model` | Export model to ONNX | Export path |

### Other APIs

- `clubs.*` - Club management
- `teams.*` - Team management
- `sponsors.*` - Sponsor management
- `seasons.*` - Season management
- `models.*` - Model management
- `configs.*` - Configuration management
- `social_media.*` - Social media management
- `sponsorship_types.*` - Sponsorship type management
- `post_types.*` - Post type management

## TypeScript/React Implementation

### 1. CLI Client Setup

```typescript
// src/services/cliClient.ts
import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export interface CLIRequest {
  request_id: string;
  command: string;
  data: Record<string, any>;
}

export interface CLIResponse {
  request_id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

type ResponseCallback = (response: CLIResponse) => void;

export class CLIClient {
  private pythonProcess: ChildProcess | null = null;
  private pendingRequests: Map<string, ResponseCallback> = new Map();
  private buffer: string = '';

  constructor() {
    this.startPythonProcess();
  }

  private startPythonProcess(): void {
    // Spawn Python CLI process
    this.pythonProcess = spawn('python', ['-m', 'touchline_cli.main'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Handle stdout responses
    this.pythonProcess.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    // Handle process errors
    this.pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
    });

    // Handle process exit
    this.pythonProcess.on('exit', (code) => {
      console.log('Python process exited with code:', code);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: CLIResponse = JSON.parse(line);
          const callback = this.pendingRequests.get(response.request_id);
          if (callback) {
            callback(response);
            this.pendingRequests.delete(response.request_id);
          }
        } catch (error) {
          console.error('Failed to parse response:', line, error);
        }
      }
    }
  }

  public async sendCommand(
    command: string,
    data: Record<string, any> = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request_id = uuidv4();

      const request: CLIRequest = {
        request_id,
        command,
        data
      };

      // Store callback
      this.pendingRequests.set(request_id, (response: CLIResponse) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });

      // Send request
      const requestJson = JSON.stringify(request) + '\n';
      this.pythonProcess?.stdin?.write(requestJson);
    });
  }

  public cleanup(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}

// Singleton instance
export const cliClient = new CLIClient();
```

### 2. Detection Service

```typescript
// src/services/detectionService.ts
import { cliClient } from './cliClient';

export interface DetectionOptions {
  input_path: string;
  output_path?: string;
  confidence?: number;
  model_path?: string;
  // ... other options
}

export interface DetectionTask {
  task_id: string;
  input_path: string;
  is_running: boolean;
  completed: boolean;
  result?: DetectionResult;
}

export interface DetectionResult {
  success: boolean;
  input_path: string;
  output_path: string;
  processing_time: number;
  detection_count: number;
  detections: any[];
  error_message?: string;
}

export class DetectionService {
  /**
   * Start asynchronous detection (returns immediately)
   */
  async startDetection(options: DetectionOptions): Promise<string> {
    const response = await cliClient.sendCommand('detections.detect_async', options);
    return response.task_id;
  }

  /**
   * Get status of a detection task
   */
  async getTaskStatus(taskId: string): Promise<DetectionTask> {
    const response = await cliClient.sendCommand('detections.get_task_status', {
      task_id: taskId
    });
    return response;
  }

  /**
   * Cancel a running detection task
   */
  async cancelTask(taskId: string): Promise<void> {
    await cliClient.sendCommand('detections.cancel_task', {
      task_id: taskId
    });
  }

  /**
   * List all active detection tasks
   */
  async listTasks(): Promise<DetectionTask[]> {
    const response = await cliClient.sendCommand('detections.list_tasks', {});
    return response.tasks;
  }

  /**
   * Clean up completed tasks from memory
   */
  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }> {
    const response = await cliClient.sendCommand('detections.cleanup_tasks', {});
    return response;
  }

  /**
   * Poll task status until completion
   */
  async waitForCompletion(
    taskId: string,
    onProgress?: (task: DetectionTask) => void,
    pollInterval: number = 1000
  ): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const task = await this.getTaskStatus(taskId);

          // Call progress callback
          if (onProgress) {
            onProgress(task);
          }

          // Check if completed
          if (task.completed) {
            clearInterval(pollInterval);
            if (task.result?.success) {
              resolve(task.result);
            } else {
              reject(new Error(task.result?.error_message || 'Detection failed'));
            }
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, pollInterval);
    });
  }
}

export const detectionService = new DetectionService();
```

### 3. React Component Example

```typescript
// src/components/DetectionRunner.tsx
import React, { useState } from 'react';
import { detectionService, DetectionTask } from '../services/detectionService';

export const DetectionRunner: React.FC = () => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<DetectionTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startDetection = async () => {
    try {
      setError(null);

      // Start detection
      const id = await detectionService.startDetection({
        input_path: '/path/to/video.mp4',
        output_path: '/path/to/output.mp4',
        confidence: 0.3
      });

      setTaskId(id);

      // Wait for completion with progress updates
      await detectionService.waitForCompletion(
        id,
        (task) => setStatus(task)
      );

      alert('Detection completed!');
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDetection = async () => {
    if (taskId) {
      try {
        await detectionService.cancelTask(taskId);
        alert('Detection cancelled');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div>
      <h2>Detection Runner</h2>

      <button onClick={startDetection}>Start Detection</button>

      {taskId && status && (
        <div>
          <p>Task ID: {taskId}</p>
          <p>Status: {status.is_running ? 'Running' : 'Completed'}</p>

          {status.is_running && (
            <button onClick={cancelDetection}>Cancel</button>
          )}

          {status.completed && status.result && (
            <div>
              <p>Detections: {status.result.detection_count}</p>
              <p>Processing Time: {status.result.processing_time}s</p>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
    </div>
  );
};
```

## Concurrency and Thread Safety

### Multiple Concurrent Tasks

The CLI handlers are **thread-safe** and support multiple concurrent operations:

```typescript
// Start multiple detections concurrently
const tasks = await Promise.all([
  detectionService.startDetection({ input_path: 'video1.mp4' }),
  detectionService.startDetection({ input_path: 'video2.mp4' }),
  detectionService.startDetection({ input_path: 'video3.mp4' })
]);

console.log('Started tasks:', tasks); // ['detection_a3f4b2c1', 'detection_7e8d9f0a', ...]

// All tasks run concurrently in the backend
```

### Task Management Best Practices

```typescript
// src/services/taskManager.ts
export class TaskManager {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic cleanup every 5 minutes
   */
  startAutoCleanup(intervalMs: number = 300000): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        const detectionStats = await detectionService.cleanupTasks();
        const trainingStats = await trainingService.cleanupTasks();

        console.log('Cleanup stats:', {
          detection: detectionStats,
          training: trainingStats
        });
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Manual cleanup - call after completing batch operations
   */
  async manualCleanup(): Promise<void> {
    await Promise.all([
      detectionService.cleanupTasks(),
      trainingService.cleanupTasks()
    ]);
  }
}

export const taskManager = new TaskManager();

// In your app initialization:
taskManager.startAutoCleanup(); // Auto-cleanup every 5 minutes
```

## Memory Management

### Preventing Memory Leaks

**IMPORTANT:** The backend stores all tasks indefinitely until `cleanup_tasks()` is called. To prevent memory leaks:

1. **Enable automatic cleanup:**
   ```typescript
   // In app initialization (main.ts or App.tsx)
   import { taskManager } from './services/taskManager';

   taskManager.startAutoCleanup(300000); // Every 5 minutes
   ```

2. **Manual cleanup after batch operations:**
   ```typescript
   // After processing multiple files
   const tasks = await Promise.all([
     detectionService.startDetection({ input_path: 'video1.mp4' }),
     detectionService.startDetection({ input_path: 'video2.mp4' }),
     // ... more tasks
   ]);

   // Wait for all to complete
   await Promise.all(tasks.map(taskId =>
     detectionService.waitForCompletion(taskId)
   ));

   // Clean up immediately
   await detectionService.cleanupTasks();
   ```

3. **UI cleanup button:**
   ```typescript
   <button onClick={async () => {
     const stats = await detectionService.cleanupTasks();
     alert(`Cleaned up ${stats.cleaned_up} tasks, ${stats.remaining} remaining`);
   }}>
     Clean Up Tasks
   </button>
   ```

## Training Integration

### Training Service Example

```typescript
// src/services/trainingService.ts
import { cliClient } from './cliClient';

export interface TrainingOptions {
  sponsor_ids: number[];
  epochs?: number;
  incremental?: boolean;
  initial_model_path?: string;
}

export interface TrainingTask {
  task_id: string;
  is_running: boolean;
  completed: boolean;
  result?: TrainingResult;
}

export interface TrainingResult {
  success: boolean;
  model_path: string;
  exported_model_path: string;
  training_time: number;
  metrics: Record<string, any>;
  error_message?: string;
}

export class TrainingService {
  async startTraining(options: TrainingOptions): Promise<string> {
    const response = await cliClient.sendCommand('training.train_async', options);
    return response.task_id;
  }

  async getTaskStatus(taskId: string): Promise<TrainingTask> {
    const response = await cliClient.sendCommand('training.get_task_status', {
      task_id: taskId
    });
    return response;
  }

  async cancelTask(taskId: string): Promise<void> {
    await cliClient.sendCommand('training.cancel_task', {
      task_id: taskId
    });
  }

  async listTasks(): Promise<TrainingTask[]> {
    const response = await cliClient.sendCommand('training.list_tasks', {});
    return response.tasks;
  }

  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }> {
    const response = await cliClient.sendCommand('training.cleanup_tasks', {});
    return response;
  }

  async listModels(): Promise<any[]> {
    const response = await cliClient.sendCommand('training.list_models', {});
    return response.models;
  }
}

export const trainingService = new TrainingService();
```

## Error Handling

### Recommended Error Handling Pattern

```typescript
async function handleDetection(inputPath: string): Promise<void> {
  try {
    // Start detection
    const taskId = await detectionService.startDetection({
      input_path: inputPath,
      confidence: 0.3
    });

    // Wait for completion
    const result = await detectionService.waitForCompletion(taskId, (task) => {
      console.log('Progress:', task.is_running ? 'Running' : 'Completed');
    });

    console.log('Detection completed:', result);

  } catch (error) {
    if (error.message.includes('required')) {
      // Validation error
      console.error('Invalid parameters:', error.message);
    } else if (error.message.includes('not found')) {
      // Task not found
      console.error('Task not found:', error.message);
    } else {
      // Generic error
      console.error('Detection failed:', error.message);
    }
  }
}
```

## Testing

### Mock CLI Client for Testing

```typescript
// src/services/__mocks__/cliClient.ts
export class MockCLIClient {
  async sendCommand(command: string, data: any): Promise<any> {
    // Mock responses for testing
    if (command === 'detections.detect_async') {
      return {
        success: true,
        task_id: 'mock_detection_123',
        message: 'Detection task started'
      };
    }

    if (command === 'detections.get_task_status') {
      return {
        success: true,
        task_id: data.task_id,
        is_running: false,
        completed: true,
        result: {
          success: true,
          detection_count: 10,
          processing_time: 5.5
        }
      };
    }

    return { success: true };
  }
}

export const cliClient = new MockCLIClient();
```

## Performance Considerations

### Batch Processing

For processing multiple files, use batch detection:

```typescript
const result = await cliClient.sendCommand('detections.detect_batch', {
  input_paths: [
    '/path/to/video1.mp4',
    '/path/to/video2.mp4',
    '/path/to/video3.mp4'
  ],
  max_concurrent: 4, // Process 4 at a time
  confidence: 0.3
});

console.log('Batch task IDs:', result.task_ids);

// Poll all tasks
for (const taskId of result.task_ids) {
  await detectionService.waitForCompletion(taskId);
}
```

### Polling vs. Events

The current implementation uses polling. For better UX, consider:

```typescript
// Poll with exponential backoff for long-running tasks
async function waitWithBackoff(taskId: string): Promise<DetectionResult> {
  let delay = 1000; // Start with 1 second
  const maxDelay = 10000; // Max 10 seconds

  while (true) {
    const task = await detectionService.getTaskStatus(taskId);

    if (task.completed) {
      return task.result!;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, maxDelay);
  }
}
```

## Shutdown and Cleanup

### Proper Cleanup on App Exit

```typescript
// In main Electron process or app cleanup
import { cliClient } from './services/cliClient';
import { taskManager } from './services/taskManager';

export async function cleanup(): Promise<void> {
  // Stop auto-cleanup
  taskManager.stopAutoCleanup();

  // Final cleanup
  await taskManager.manualCleanup();

  // Close Python process
  cliClient.cleanup();
}

// Register cleanup handler
process.on('exit', cleanup);
window.addEventListener('beforeunload', cleanup);
```

## Summary

- **Protocol**: JSON over stdin/stdout
- **Concurrency**: Thread-safe, supports multiple concurrent tasks
- **Memory Management**: Manual cleanup required via `cleanup_tasks()`
- **Error Handling**: Consistent error response format
- **Polling**: Use polling with backoff for task status
- **Cleanup**: Enable auto-cleanup every 5 minutes to prevent memory leaks

For more details on specific commands, see the handler documentation in `touchline_cli/handlers/`.
