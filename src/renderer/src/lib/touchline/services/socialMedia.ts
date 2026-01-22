import type { TouchlineClient } from '../client';
import type { Platform, ContentType, SocialParameter } from '../types';

export class SocialMediaService {
  constructor(private client: TouchlineClient) {}

  // Platforms
  async getPlatforms(): Promise<{ platforms: Platform[] }> {
    return this.client.sendCommand('social_media.get_platforms', {});
  }

  async getPlatform(platformId: number): Promise<{ platform: Platform }> {
    return this.client.sendCommand('social_media.get_platform', {
      platform_id: platformId
    });
  }

  async createPlatform(name: string): Promise<{ platform_id: number }> {
    return this.client.sendCommand('social_media.create_platform', { name });
  }

  async updatePlatform(platformId: number, updates: Partial<Platform>): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.update_platform', {
      platform_id: platformId,
      ...updates
    });
  }

  async deletePlatform(platformId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.delete_platform', {
      platform_id: platformId
    });
  }

  // Content Types
  async getContentTypes(platformId: number): Promise<{ content_types: ContentType[] }> {
    return this.client.sendCommand('social_media.get_content_types', {
      platform_id: platformId
    });
  }

  async createContentType(platformId: number, name: string): Promise<{ content_type_id: number }> {
    return this.client.sendCommand('social_media.create_content_type', {
      platform_id: platformId,
      name
    });
  }

  async updateContentType(contentTypeId: number, updates: Partial<ContentType>): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.update_content_type', {
      content_type_id: contentTypeId,
      ...updates
    });
  }

  async deleteContentType(contentTypeId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.delete_content_type', {
      content_type_id: contentTypeId
    });
  }

  // Parameters
  async getParameters(platformId: number, contentTypeId?: number): Promise<{ parameters: SocialParameter[] }> {
    return this.client.sendCommand('social_media.get_parameters', {
      platform_id: platformId,
      content_type_id: contentTypeId
    });
  }

  async createParameter(param: Omit<SocialParameter, 'id'>): Promise<{ parameter_id: number }> {
    return this.client.sendCommand('social_media.create_parameter', param);
  }

  async updateParameter(parameterId: number, value: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.update_parameter', {
      parameter_id: parameterId,
      value
    });
  }

  async getSocialValueParameters(): Promise<{ parameters: any }> {
    return this.client.sendCommand('social_media.get_social_value_parameters', {});
  }

  async storeSocialMetrics(runId: number, metrics: any): Promise<{ success: boolean }> {
    return this.client.sendCommand('social_media.store_social_metrics', {
      run_id: runId,
      metrics
    });
  }
}
