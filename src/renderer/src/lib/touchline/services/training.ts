import type { TouchlineClient } from '../client';
import type { TrainingOptions, TrainingTask, TrainingResult, Model } from '../types';

export class TrainingService {
  constructor(private client: TouchlineClient) {}

  async startTraining(options: TrainingOptions): Promise<{ task_id: string }> {
    return this.client.sendCommand('training.train_async', options);
  }

  async getTaskStatus(taskId: string): Promise<TrainingTask> {
    return this.client.sendCommand('training.get_task_status', {
      task_id: taskId
    });
  }

  async cancelTask(taskId: string): Promise<{ success: boolean }> {
    return this.client.sendCommand('training.cancel_task', {
      task_id: taskId
    });
  }

  async listTasks(): Promise<{ tasks: TrainingTask[] }> {
    return this.client.sendCommand('training.list_tasks', {});
  }

  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }> {
    return this.client.sendCommand('training.cleanup_tasks', {});
  }

  async listModels(): Promise<{ models: Model[] }> {
    return this.client.sendCommand('training.list_models', {});
  }

  async exportModel(modelPath: string, format?: string): Promise<{ exported_path: string }> {
    return this.client.sendCommand('training.export_model', {
      model_path: modelPath,
      format
    });
  }

  async trainSync(options: TrainingOptions): Promise<TrainingResult> {
    return this.client.sendCommand('training.train_sync', options);
  }

  /**
   * Poll task status until completion with progress callback
   */
  async waitForCompletion(
    taskId: string,
    onProgress?: (task: TrainingTask) => void,
    pollInterval: number = 1000
  ): Promise<TrainingResult> {
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
              reject(new Error(task.result?.error_message || 'Training failed'));
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
