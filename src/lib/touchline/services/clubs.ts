import type { TouchlineClient } from '../client';
import type { Club } from '../types';

export class ClubsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string): Promise<{ club_id: number }> {
    return this.client.sendCommand('clubs.create', { name });
  }

  async get(clubId: number): Promise<{ club: Club }> {
    return this.client.sendCommand('clubs.get', { club_id: clubId });
  }

  async getAll(): Promise<{ clubs: Club[] }> {
    return this.client.sendCommand('clubs.get_all', {});
  }

  async update(clubId: number, updates: Partial<Club>): Promise<{ success: boolean }> {
    return this.client.sendCommand('clubs.update', {
      club_id: clubId,
      ...updates
    });
  }

  async delete(clubId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('clubs.delete', { club_id: clubId });
  }

  async createDefaults(): Promise<{ success: boolean }> {
    return this.client.sendCommand('clubs.create_defaults', {});
  }
}
