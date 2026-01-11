import { TouchlineClient } from './client';
import type { ClientOptions } from './types';
import {
  SponsorsService,
  TeamsService,
  ModelsService,
  DetectionService,
  TrainingService,
  MetricsService,
  ConfigService,
  SocialMediaService,
  ClubsService,
  SeasonsService,
  SponsorshipTypesService,
  PostTypesService
} from './services';

export class Touchline {
  public client: TouchlineClient;
  public sponsors: SponsorsService;
  public teams: TeamsService;
  public models: ModelsService;
  public detection: DetectionService;
  public training: TrainingService;
  public metrics: MetricsService;
  public config: ConfigService;
  public socialMedia: SocialMediaService;
  public clubs: ClubsService;
  public seasons: SeasonsService;
  public sponsorshipTypes: SponsorshipTypesService;
  public postTypes: PostTypesService;

  constructor(options?: ClientOptions) {
    this.client = new TouchlineClient(options);

    // Initialize all services
    this.sponsors = new SponsorsService(this.client);
    this.teams = new TeamsService(this.client);
    this.models = new ModelsService(this.client);
    this.detection = new DetectionService(this.client);
    this.training = new TrainingService(this.client);
    this.metrics = new MetricsService(this.client);
    this.config = new ConfigService(this.client);
    this.socialMedia = new SocialMediaService(this.client);
    this.clubs = new ClubsService(this.client);
    this.seasons = new SeasonsService(this.client);
    this.sponsorshipTypes = new SponsorshipTypesService(this.client);
    this.postTypes = new PostTypesService(this.client);
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
  }

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}

// Export types
export * from './types';

// Export services
export * from './services';

// Export client
export { TouchlineClient } from './client';
