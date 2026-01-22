import type { TouchlineClient } from '../client';
import type { PostType } from '../types';

export class PostTypesService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, description?: string): Promise<{ type_id: number }> {
    return this.client.sendCommand('post_types.create', {
      name,
      description
    });
  }

  async get(typeId: number): Promise<{ type: PostType }> {
    return this.client.sendCommand('post_types.get', { type_id: typeId });
  }

  async getAll(): Promise<{ types: PostType[] }> {
    return this.client.sendCommand('post_types.get_all', {});
  }

  async update(typeId: number, updates: Partial<PostType>): Promise<{ success: boolean }> {
    return this.client.sendCommand('post_types.update', {
      type_id: typeId,
      ...updates
    });
  }

  async delete(typeId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('post_types.delete', { type_id: typeId });
  }
}
