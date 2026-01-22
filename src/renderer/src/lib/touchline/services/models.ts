import type { TouchlineClient } from '../client';
import type { Model } from '../types';

export class ModelsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, path: string): Promise<{ model_id: number }> {
    return this.client.sendCommand('models.create', { name, path });
  }

  async get(modelId: number): Promise<{ model: Model }> {
    return this.client.sendCommand('models.get', { model_id: modelId });
  }

  async getAll(): Promise<Model[]> {
    const response = await this.client.sendCommand<{ models: Model[] }>('models.get_all', {});
    return response.models;
  }

  async delete(modelId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('models.delete', { model_id: modelId });
  }

  async assignModel(teamId: number, seasonId: number, modelId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('models.assign_model', {
      team_id: teamId,
      season_id: seasonId,
      model_id: modelId
    });
  }

  async getModels(teamId?: number, seasonId?: number): Promise<{ models: Model[] }> {
    return this.client.sendCommand('models.get_models', {
      team_id: teamId,
      season_id: seasonId
    });
  }
}
