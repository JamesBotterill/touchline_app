import type { TouchlineClient } from '../client';
import type { Season } from '../types';

export class SeasonsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, startDate: string, endDate: string): Promise<{ season_id: number }> {
    return this.client.sendCommand('seasons.create', {
      name,
      start_date: startDate,
      end_date: endDate
    });
  }

  async get(seasonId: number): Promise<{ season: Season }> {
    return this.client.sendCommand('seasons.get', { season_id: seasonId });
  }

  async getAll(): Promise<{ seasons: Season[] }> {
    return this.client.sendCommand('seasons.get_all', {});
  }

  async update(seasonId: number, updates: Partial<Season>): Promise<{ success: boolean }> {
    return this.client.sendCommand('seasons.update', {
      season_id: seasonId,
      ...updates
    });
  }

  async delete(seasonId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('seasons.delete', { season_id: seasonId });
  }
}
