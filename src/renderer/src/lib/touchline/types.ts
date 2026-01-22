// Core protocol types
export interface CLIRequest {
  request_id: string;
  command: string;
  data: Record<string, any>;
}

export interface CLIResponse {
  request_id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

export interface CLIEvent {
  type: "event";
  request_id?: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

// Client options
export interface ClientOptions {
  pythonPath?: string;
  cliModule?: string;
  timeout?: number;
}

// Callbacks
export type ResponseCallback = (response: CLIResponse) => void;
export type EventCallback = (event: CLIEvent) => void;

// Sponsor types
export interface SponsorLogo {
  id: number;
  logo_path: string;
  active: number;
}

export interface Sponsor {
  id: number;
  name: string;
  base_value: number;
  audience_match: number;
  brand_power: number;
  logos?: SponsorLogo[];
  logo_paths?: string[];
}

export interface CreateSponsorInput {
  name: string;
  base_value?: number;
  audience_match?: number;
  brand_power?: number;
}

// Team types
export interface Team {
  id: number;
  name: string;
  club_id: number;
}

// Club types
export interface Club {
  id: number;
  name: string;
}

// Season types
export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current?: number;
  created_at?: string;
  updated_at?: string;
}

// Model types
export interface Model {
  id: number;
  name: string;
  path: string;
  created_at: string;
  team_id?: number;
  season_id?: number;
}

// Detection types
export interface DetectionOptions {
  input_path: string;
  output_path?: string;
  confidence?: number;
  model_id?: number;
  team_id?: number;
  season_id?: number;
  social_media?: SocialMediaContext;
}

export interface SocialMediaContext {
  platform_id: number;
  content_type_id: number;
  impressions: number;
  likes?: number;
  shares?: number;
  comments?: number;
}

export interface DetectionTask {
  task_id: string;
  input_path: string;
  is_running: boolean;
  completed: boolean;
  progress?: number;
  result?: DetectionResult;
}

export interface Detection {
  sponsor_id: number;
  sponsor_name: string;
  confidence: number;
  bbox: number[];
  frame_number?: number;
  timestamp?: number;
}

export interface DetectionResult {
  success: boolean;
  input_path: string;
  output_path?: string;
  processing_time: number;
  detection_count: number;
  detections: Detection[];
  metrics?: SponsorMetrics[];
  error_message?: string;
}

// Training types
export interface TrainingOptions {
  sponsor_ids: number[];
  epochs?: number;
  batch_size?: number;
  img_size?: number;
  incremental?: boolean;
  initial_model_path?: string;
}

export interface TrainingTask {
  task_id: string;
  is_running: boolean;
  completed: boolean;
  progress?: number;
  result?: TrainingResult;
}

export interface TrainingResult {
  success: boolean;
  model_path: string;
  exported_model_path?: string;
  training_time: number;
  metrics: Record<string, any>;
  error_message?: string;
}

// Metrics types
export interface SponsorMetrics {
  sponsor_id: number;
  sponsor_name: string;
  total_appearances: number;
  total_duration: number;
  avg_quality: number;
  total_value: number;
  social_value?: number;
}

export interface DetectionRun {
  id: number;
  team_id: number;
  season_id: number;
  input_path: string;
  output_path?: string;
  detection_count: number;
  processing_time: number;
  created_at: string;
}

export interface EngagementMetrics {
  likes?: number;
  shares?: number;
  comments?: number;
}

// Config types
export interface ConfigParameter {
  id: number;
  category: string;
  key: string;
  value: any;
}

// Social Media types
export interface Platform {
  id: number;
  name: string;
  enabled: boolean;
}

export interface ContentType {
  id: number;
  platform_id: number;
  name: string;
}

export interface SocialParameter {
  id: number;
  platform_id: number;
  content_type_id?: number;
  parameter_type: string;
  parameter_key: string;
  value: number;
}

// Social Media Platform
export interface SocialMediaPlatform {
  id: number;
  name: string;
  base_reach?: number;
  engagement_rate?: number;
}

// Sponsorship Type
export interface SponsorshipType {
  id: number;
  name: string;
  description?: string;
}

// Post Type
export interface PostType {
  id: number;
  name: string;
  description?: string;
}
