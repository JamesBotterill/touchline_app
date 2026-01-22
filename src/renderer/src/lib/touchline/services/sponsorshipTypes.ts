import type { TouchlineClient } from '../client';
import type { SponsorshipType } from '../types';

export class SponsorshipTypesService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, description?: string): Promise<{ type_id: number }> {
    return this.client.sendCommand('sponsorship_types.create', {
      name,
      description
    });
  }

  async get(typeId: number): Promise<{ type: SponsorshipType }> {
    return this.client.sendCommand('sponsorship_types.get', { type_id: typeId });
  }

  async getAll(): Promise<{ types: SponsorshipType[] }> {
    return this.client.sendCommand('sponsorship_types.get_all', {});
  }

  async update(typeId: number, updates: Partial<SponsorshipType>): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsorship_types.update', {
      type_id: typeId,
      ...updates
    });
  }

  async delete(typeId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsorship_types.delete', { type_id: typeId });
  }
}
