import type { TouchlineClient } from '../client';
import type { SponsorMetrics, DetectionRun, EngagementMetrics } from '../types';

export class MetricsService {
  constructor(private client: TouchlineClient) {}

  async getSponsorMetrics(
    teamId: number,
    seasonId: number,
    sponsorId?: number
  ): Promise<{ metrics: SponsorMetrics[] }> {
    return this.client.sendCommand('metrics.get_sponsor_metrics', {
      team_id: teamId,
      season_id: seasonId,
      sponsor_id: sponsorId
    });
  }

  async getTeamRuns(teamId: number, seasonId: number): Promise<{ runs: DetectionRun[] }> {
    return this.client.sendCommand('metrics.get_team_runs', {
      team_id: teamId,
      season_id: seasonId
    });
  }

  async getRun(runId: number): Promise<{ run: DetectionRun }> {
    return this.client.sendCommand('metrics.get_run', { run_id: runId });
  }

  async deleteRun(runId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('metrics.delete_run', { run_id: runId });
  }

  async recordDetection(runData: any): Promise<{ run_id: number }> {
    return this.client.sendCommand('metrics.record_detection', runData);
  }

  async recordTraining(trainingData: any): Promise<{ success: boolean }> {
    return this.client.sendCommand('metrics.record_training', trainingData);
  }

  async importMetrics(filePath: string): Promise<{ success: boolean; imported: number }> {
    return this.client.sendCommand('metrics.import_metrics', {
      file_path: filePath
    });
  }

  async calculatePostBreakdownValue(
    sponsorId: number,
    platformId: number,
    contentTypeId: number,
    impressions: number,
    engagement: EngagementMetrics
  ): Promise<{ value: number; breakdown: any }> {
    return this.client.sendCommand('metrics.calculate_post_breakdown_value', {
      sponsor_id: sponsorId,
      platform_id: platformId,
      content_type_id: contentTypeId,
      impressions,
      engagement
    });
  }

  async calculateSocialValue(
    sponsorId: number,
    platformId: number,
    impressions: number,
    engagement: EngagementMetrics
  ): Promise<{ value: number }> {
    return this.client.sendCommand('metrics.calculate_social_value', {
      sponsor_id: sponsorId,
      platform_id: platformId,
      impressions,
      engagement
    });
  }
}
