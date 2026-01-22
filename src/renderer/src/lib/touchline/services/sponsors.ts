import type { TouchlineClient } from '../client';
import type { Sponsor, CreateSponsorInput } from '../types';

export class SponsorsService {
  constructor(private client: TouchlineClient) {}

  async create(input: CreateSponsorInput): Promise<{ sponsor_id: number }> {
    return this.client.sendCommand('sponsors.create', input);
  }

  async get(sponsorId: number): Promise<{ sponsor: Sponsor }> {
    return this.client.sendCommand('sponsors.get', { sponsor_id: sponsorId });
  }

  async getAll(): Promise<{ sponsors: Sponsor[] }> {
    return this.client.sendCommand('sponsors.get_all', {});
  }

  async getStandalone(): Promise<{ sponsors: Sponsor[] }> {
    return this.client.sendCommand('sponsors.get_standalone', {});
  }

  async update(sponsorId: number, updates: Partial<Sponsor>): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsors.update', {
      sponsor_id: sponsorId,
      ...updates
    });
  }

  async delete(sponsorId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsors.delete', { sponsor_id: sponsorId });
  }

  async addLogo(sponsorId: number, logoPath: string): Promise<{ logo_id: number }> {
    return this.client.sendCommand('sponsors.add_logo', {
      sponsor_id: sponsorId,
      logo_path: logoPath
    });
  }

  async setLogos(sponsorId: number, logoPaths: string[]): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsors.set_logos', {
      sponsor_id: sponsorId,
      logo_paths: logoPaths
    });
  }

  async assignType(
    sponsorId: number,
    typeId: number,
    teamId: number,
    seasonId: number
  ): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsors.assign_type', {
      sponsor_id: sponsorId,
      type_id: typeId,
      team_id: teamId,
      season_id: seasonId
    });
  }

  async removeType(assignmentId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('sponsors.remove_type', {
      assignment_id: assignmentId
    });
  }

  async getAllAssignments(teamId: number, seasonId: number): Promise<{ assignments: any[] }> {
    return this.client.sendCommand('sponsors.get_all_assignments', {
      team_id: teamId,
      season_id: seasonId
    });
  }

  async exportTeamSponsors(teamId: number, seasonId: number): Promise<{ file_path: string }> {
    return this.client.sendCommand('sponsors.export_team_sponsors', {
      team_id: teamId,
      season_id: seasonId
    });
  }
}
