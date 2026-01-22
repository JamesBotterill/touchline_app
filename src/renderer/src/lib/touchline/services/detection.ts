import type { TouchlineClient } from '../client';
import type { DetectionOptions, DetectionTask, DetectionResult } from '../types';

export class DetectionService {
  constructor(private client: TouchlineClient) {}

  /**
   * Start asynchronous detection (returns immediately)
   */
  async startDetection(options: DetectionOptions): Promise<{ task_id: string }> {
    return this.client.sendCommand('detections.detect_async', options);
  }

  /**
   * Get status of a detection task
   */
  async getTaskStatus(taskId: string): Promise<DetectionTask> {
    return this.client.sendCommand('detections.get_task_status', {
      task_id: taskId
    });
  }

  /**
   * Cancel a running detection task
   */
  async cancelTask(taskId: string): Promise<{ success: boolean }> {
    return this.client.sendCommand('detections.cancel_task', {
      task_id: taskId
    });
  }

  /**
   * List all active detection tasks
   */
  async listTasks(): Promise<{ tasks: DetectionTask[] }> {
    return this.client.sendCommand('detections.list_tasks', {});
  }

  /**
   * Clean up completed tasks from memory
   */
  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }> {
    return this.client.sendCommand('detections.cleanup_tasks', {});
  }

  /**
   * Start batch detection
   */
  async startBatch(inputs: DetectionOptions[], maxConcurrent?: number): Promise<{ task_ids: string[] }> {
    return this.client.sendCommand('detections.detect_batch', {
      inputs,
      max_concurrent: maxConcurrent
    });
  }

  /**
   * Synchronous detection (blocks until complete)
   */
  async detectSync(options: DetectionOptions): Promise<DetectionResult> {
    return this.client.sendCommand('detections.detect_sync', options);
  }

  /**
   * Poll task status until completion with progress callback
   */
  async waitForCompletion(
    taskId: string,
    onProgress?: (task: DetectionTask) => void,
    pollInterval: number = 1000
  ): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const task = await this.getTaskStatus(taskId);

          // Call progress callback
          if (onProgress) {
            onProgress(task);
          }

          // Check if completed
          if (task.completed) {
            clearInterval(interval);
            if (task.result?.success) {
              resolve(task.result);
            } else {
              reject(new Error(task.result?.error_message || 'Detection failed'));
            }
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, pollInterval);
    });
  }
}
