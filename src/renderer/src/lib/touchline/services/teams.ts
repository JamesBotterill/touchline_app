import type { TouchlineClient } from '../client';
import type { Team, Sponsor } from '../types';

export class TeamsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, clubId: number): Promise<{ team_id: number }> {
    return this.client.sendCommand('teams.create', {
      name,
      club_id: clubId
    });
  }

  async get(teamId: number): Promise<{ team: Team }> {
    return this.client.sendCommand('teams.get', { team_id: teamId });
  }

  async getAll(): Promise<{ teams: Team[] }> {
    return this.client.sendCommand('teams.get_all', {});
  }

  async update(teamId: number, updates: Partial<Team>): Promise<{ success: boolean }> {
    return this.client.sendCommand('teams.update', {
      team_id: teamId,
      ...updates
    });
  }

  async delete(teamId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('teams.delete', { team_id: teamId });
  }

  async getSponsors(teamId: number, seasonId: number): Promise<{ sponsors: Sponsor[] }> {
    return this.client.sendCommand('teams.get_sponsors', {
      team_id: teamId,
      season_id: seasonId
    });
  }

  async assignSponsor(teamId: number, seasonId: number, sponsorId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('teams.assign_sponsor', {
      team_id: teamId,
      season_id: seasonId,
      sponsor_id: sponsorId
    });
  }

  async removeSponsor(teamId: number, seasonId: number, sponsorId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('teams.remove_sponsor', {
      team_id: teamId,
      season_id: seasonId,
      sponsor_id: sponsorId
    });
  }

  async getTeamModel(teamId: number, seasonId: number): Promise<{ model_id: number | null }> {
    return this.client.sendCommand('teams.get_team_model', {
      team_id: teamId,
      season_id: seasonId
    });
  }

  async setTeamModel(teamId: number, seasonId: number, modelId: number): Promise<{ success: boolean }> {
    return this.client.sendCommand('teams.set_team_model', {
      team_id: teamId,
      season_id: seasonId,
      model_id: modelId
    });
  }
}
