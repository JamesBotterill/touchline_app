# Touchline App Implementation Plan

## Project Overview

**Repository**: `touchline_app` (local: `/Users/jamesbotterill/Projects/touchline_app`)
**Stack**: Electron + React + TypeScript + shadcn/ui
**Backend**: Python CLI via stdin/stdout JSON protocol
**Python Package**: `touchline-0.1.0-py3-none-any.whl` from `touchline/dist/`
**Platforms**: macOS (Intel + Apple Silicon), Windows (x64 + ARM64), Linux (x64 + ARM64)

> **📖 Cross-Platform Guide**: See [CROSS_PLATFORM_GUIDE.md](./CROSS_PLATFORM_GUIDE.md) for detailed platform-specific implementation, Python detection, file paths, and distribution instructions.

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Project Structure

```
touchline_app/
├── electron/                   # Electron main process
│   ├── main.ts                # Main process entry
│   ├── preload.ts             # Preload script
│   └── cli/                   # CLI process management
│       ├── cliManager.ts      # Spawns/manages Python CLI
│       └── protocol.ts        # Message protocol handler
├── src/                       # React app
│   ├── lib/                   # TypeScript library
│   │   ├── touchline/         # Main library
│   │   │   ├── client.ts      # Base CLI client
│   │   │   ├── types.ts       # TypeScript types
│   │   │   ├── services/      # Service wrappers
│   │   │   │   ├── sponsors.ts
│   │   │   │   ├── teams.ts
│   │   │   │   ├── models.ts
│   │   │   │   ├── detection.ts
│   │   │   │   ├── training.ts
│   │   │   │   ├── metrics.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── socialMedia.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts       # Main export
│   │   └── utils/             # Utility functions
│   ├── components/            # React components (shadcn)
│   ├── hooks/                 # React hooks
│   ├── pages/                 # App pages
│   ├── stores/                # State management (Zustand)
│   ├── App.tsx
│   └── main.tsx
├── resources/                 # App resources
│   ├── python/                # Bundled Python CLI
│   │   └── touchline-0.1.0-py3-none-any.whl
│   └── icons/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
└── README.md
```

### 1.2 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron": "^28.0.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "zustand": "^4.4.7",
    "uuid": "^9.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/uuid": "^9.0.7",
    "@vitejs/plugin-react": "^4.2.0",
    "electron-builder": "^24.9.1",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-electron": "^0.28.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### 1.3 Build Commands

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "vite --mode electron-dev && electron .",
    "electron:build": "vite build && electron-builder",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Phase 2: TypeScript Library (`@touchline/client`)

### 2.1 Core Client Architecture

```typescript
// src/lib/touchline/client.ts
export interface CLIRequest {
  type: "request";
  request_id: string;
  command: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface CLIResponse {
  type: "response";
  request_id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  timestamp: string;
}

export interface CLIEvent {
  type: "event";
  request_id?: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

export class TouchlineClient {
  private pythonProcess: ChildProcess | null = null;
  private pendingRequests: Map<string, ResponseCallback> = new Map();
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  private buffer: string = '';
  private isReady: boolean = false;

  constructor(private options: ClientOptions) {}

  // Initialize Python CLI subprocess
  async initialize(): Promise<void>

  // Send command and get response
  async sendCommand<T = any>(
    command: string,
    data?: Record<string, any>
  ): Promise<T>

  // Subscribe to events (progress, status updates)
  on(event: string, callback: EventCallback): () => void

  // Cleanup
  async cleanup(): Promise<void>
}
```

### 2.2 Service Layer Design

Each service wraps a handler namespace with typed methods:

#### 2.2.1 Sponsors Service

```typescript
// src/lib/touchline/services/sponsors.ts
export interface Sponsor {
  id: number;
  name: string;
  base_value: number;
  audience_match: number;
  brand_power: number;
  logo_paths?: string[];
}

export interface CreateSponsorInput {
  name: string;
  base_value?: number;
  audience_match?: number;
  brand_power?: number;
}

export class SponsorsService {
  constructor(private client: TouchlineClient) {}

  // sponsors.create
  async create(input: CreateSponsorInput): Promise<{ sponsor_id: number }>

  // sponsors.get
  async get(sponsorId: number): Promise<{ sponsor: Sponsor }>

  // sponsors.get_all
  async getAll(): Promise<{ sponsors: Sponsor[] }>

  // sponsors.get_standalone
  async getStandalone(): Promise<{ sponsors: Sponsor[] }>

  // sponsors.update
  async update(sponsorId: number, updates: Partial<Sponsor>): Promise<{ success: boolean }>

  // sponsors.delete
  async delete(sponsorId: number): Promise<{ success: boolean }>

  // sponsors.add_logo
  async addLogo(sponsorId: number, logoPath: string): Promise<{ logo_id: number }>

  // sponsors.set_logos
  async setLogos(sponsorId: number, logoPaths: string[]): Promise<{ success: boolean }>

  // sponsors.assign_type
  async assignType(
    sponsorId: number,
    typeId: number,
    teamId: number,
    seasonId: number
  ): Promise<{ success: boolean }>

  // sponsors.remove_type
  async removeType(assignmentId: number): Promise<{ success: boolean }>

  // sponsors.get_all_assignments
  async getAllAssignments(teamId: number, seasonId: number): Promise<{ assignments: any[] }>

  // sponsors.export_team_sponsors
  async exportTeamSponsors(teamId: number, seasonId: number): Promise<{ file_path: string }>
}
```

#### 2.2.2 Teams Service

```typescript
// src/lib/touchline/services/teams.ts
export interface Team {
  id: number;
  name: string;
  club_id: number;
}

export class TeamsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, clubId: number): Promise<{ team_id: number }>
  async get(teamId: number): Promise<{ team: Team }>
  async getAll(): Promise<{ teams: Team[] }>
  async update(teamId: number, updates: Partial<Team>): Promise<{ success: boolean }>
  async delete(teamId: number): Promise<{ success: boolean }>
  async getSponsors(teamId: number, seasonId: number): Promise<{ sponsors: Sponsor[] }>
  async assignSponsor(teamId: number, seasonId: number, sponsorId: number): Promise<{ success: boolean }>
  async removeSponsor(teamId: number, seasonId: number, sponsorId: number): Promise<{ success: boolean }>
  async getTeamModel(teamId: number, seasonId: number): Promise<{ model_id: number | null }>
  async setTeamModel(teamId: number, seasonId: number, modelId: number): Promise<{ success: boolean }>
}
```

#### 2.2.3 Models Service

```typescript
// src/lib/touchline/services/models.ts
export interface Model {
  id: number;
  name: string;
  path: string;
  created_at: string;
  team_id?: number;
  season_id?: number;
}

export class ModelsService {
  constructor(private client: TouchlineClient) {}

  async create(name: string, path: string): Promise<{ model_id: number }>
  async get(modelId: number): Promise<{ model: Model }>
  async getAll(): Promise<Model[]>  // Note: Returns array directly
  async delete(modelId: number): Promise<{ success: boolean }>
  async assignModel(teamId: number, seasonId: number, modelId: number): Promise<{ success: boolean }>
  async getModels(teamId?: number, seasonId?: number): Promise<{ models: Model[] }>
}
```

#### 2.2.4 Detection Service

```typescript
// src/lib/touchline/services/detection.ts
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

export class DetectionService {
  constructor(private client: TouchlineClient) {}

  // Async detection (recommended)
  async startDetection(options: DetectionOptions): Promise<{ task_id: string }>

  // Get task status
  async getTaskStatus(taskId: string): Promise<DetectionTask>

  // Cancel task
  async cancelTask(taskId: string): Promise<{ success: boolean }>

  // List all tasks
  async listTasks(): Promise<{ tasks: DetectionTask[] }>

  // Cleanup completed tasks
  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }>

  // Batch detection
  async startBatch(inputs: DetectionOptions[], maxConcurrent?: number): Promise<{ task_ids: string[] }>

  // Synchronous detection (blocks until complete)
  async detectSync(options: DetectionOptions): Promise<DetectionResult>

  // Helper: Wait for completion with progress
  async waitForCompletion(
    taskId: string,
    onProgress?: (task: DetectionTask) => void,
    pollInterval?: number
  ): Promise<DetectionResult>
}
```

#### 2.2.5 Training Service

```typescript
// src/lib/touchline/services/training.ts
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

export class TrainingService {
  constructor(private client: TouchlineClient) {}

  async startTraining(options: TrainingOptions): Promise<{ task_id: string }>
  async getTaskStatus(taskId: string): Promise<TrainingTask>
  async cancelTask(taskId: string): Promise<{ success: boolean }>
  async listTasks(): Promise<{ tasks: TrainingTask[] }>
  async cleanupTasks(): Promise<{ cleaned_up: number; remaining: number }>
  async listModels(): Promise<{ models: Model[] }>
  async exportModel(modelPath: string, format?: string): Promise<{ exported_path: string }>
  async trainSync(options: TrainingOptions): Promise<TrainingResult>

  // Helper
  async waitForCompletion(
    taskId: string,
    onProgress?: (task: TrainingTask) => void,
    pollInterval?: number
  ): Promise<TrainingResult>
}
```

#### 2.2.6 Metrics Service

```typescript
// src/lib/touchline/services/metrics.ts
export interface SponsorMetrics {
  sponsor_id: number;
  sponsor_name: string;
  total_appearances: number;
  total_duration: number;
  avg_quality: number;
  total_value: number;
  social_value?: number;
}

export class MetricsService {
  constructor(private client: TouchlineClient) {}

  async getSponsorMetrics(
    teamId: number,
    seasonId: number,
    sponsorId?: number
  ): Promise<{ metrics: SponsorMetrics[] }>

  async getTeamRuns(teamId: number, seasonId: number): Promise<{ runs: DetectionRun[] }>

  async getRun(runId: number): Promise<{ run: DetectionRun }>

  async deleteRun(runId: number): Promise<{ success: boolean }>

  async recordDetection(runData: any): Promise<{ run_id: number }>

  async recordTraining(trainingData: any): Promise<{ success: boolean }>

  async importMetrics(filePath: string): Promise<{ success: boolean; imported: number }>

  async calculatePostBreakdownValue(
    sponsorId: number,
    platformId: number,
    contentTypeId: number,
    impressions: number,
    engagement: EngagementMetrics
  ): Promise<{ value: number; breakdown: any }>

  async calculateSocialValue(
    sponsorId: number,
    platformId: number,
    impressions: number,
    engagement: EngagementMetrics
  ): Promise<{ value: number }>
}
```

#### 2.2.7 Config Service

```typescript
// src/lib/touchline/services/config.ts
export interface ConfigParameter {
  id: number;
  category: string;
  key: string;
  value: any;
}

export class ConfigService {
  constructor(private client: TouchlineClient) {}

  async get(category: string, key: string): Promise<{ value: any }>
  async set(category: string, key: string, value: any): Promise<{ success: boolean }>
  async getCategory(category: string): Promise<{ parameters: ConfigParameter[] }>
  async getAll(): Promise<{ configurations: ConfigParameter[] }>
  async createDefaults(): Promise<{ success: boolean }>
  async getCurrencyConfig(): Promise<{ currency: string; symbol: string }>
  async setCurrencySymbol(currency: string): Promise<{ success: boolean }>
  async getCurrencySymbol(): Promise<{ symbol: string }>
  async getAvailableCurrencies(): Promise<{ currencies: string[] }>
}
```

#### 2.2.8 Social Media Service

```typescript
// src/lib/touchline/services/socialMedia.ts
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

export class SocialMediaService {
  constructor(private client: TouchlineClient) {}

  // Platforms
  async getPlatforms(): Promise<{ platforms: Platform[] }>
  async getPlatform(platformId: number): Promise<{ platform: Platform }>
  async createPlatform(name: string): Promise<{ platform_id: number }>
  async updatePlatform(platformId: number, updates: Partial<Platform>): Promise<{ success: boolean }>
  async deletePlatform(platformId: number): Promise<{ success: boolean }>

  // Content Types
  async getContentTypes(platformId: number): Promise<{ content_types: ContentType[] }>
  async createContentType(platformId: number, name: string): Promise<{ content_type_id: number }>
  async updateContentType(contentTypeId: number, updates: Partial<ContentType>): Promise<{ success: boolean }>
  async deleteContentType(contentTypeId: number): Promise<{ success: boolean }>

  // Parameters (CPM, engagement weights, etc.)
  async getParameters(platformId: number, contentTypeId?: number): Promise<{ parameters: SocialParameter[] }>
  async createParameter(param: Omit<SocialParameter, 'id'>): Promise<{ parameter_id: number }>
  async updateParameter(parameterId: number, value: number): Promise<{ success: boolean }>
  async getSocialValueParameters(): Promise<{ parameters: any }>
  async storeSocialMetrics(runId: number, metrics: any): Promise<{ success: boolean }>
}
```

#### 2.2.9 Additional Services

```typescript
// Clubs, Seasons, Sponsorship Types, Post Types
export class ClubsService { /* ... */ }
export class SeasonsService { /* ... */ }
export class SponsorshipTypesService { /* ... */ }
export class PostTypesService { /* ... */ }
```

### 2.3 Main Library Export

```typescript
// src/lib/touchline/index.ts
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

  constructor(options?: TouchlineOptions) {
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

// Default export
export const touchline = new Touchline();

// Also export for custom instances
export { Touchline };
```

---

## Phase 3: First-Time Initialization Flow

### 3.1 App Initialization Sequence

```typescript
// electron/cli/cliManager.ts
export class CLIManager {
  async initialize(): Promise<void> {
    // 1. Check if Python is installed
    const pythonPath = await this.findPython();

    // 2. Check if touchline package is installed
    const isInstalled = await this.checkTouchlineInstalled();

    if (!isInstalled) {
      // 3. Install touchline package from bundled wheel
      await this.installTouchline();
    }

    // 4. Initialize database (first time)
    await this.initializeDatabase();

    // 5. Spawn CLI process
    this.spawnCLIProcess();
  }

  private async findPython(): Promise<string> {
    // Check for Python 3.8+ in PATH
    // On macOS/Linux: python3
    // On Windows: python or py
  }

  private async checkTouchlineInstalled(): Promise<boolean> {
    // Run: python -c "import touchline_cli; print('installed')"
  }

  private async installTouchline(): Promise<void> {
    // Run: pip install resources/python/touchline-0.1.0-py3-none-any.whl
  }

  private async initializeDatabase(): Promise<void> {
    // Send initialization commands:
    // 1. clubs.create_defaults
    // 2. config.create_defaults
    // 3. Check if default club exists, create if not
  }
}
```

### 3.2 First Launch UI Flow

```
┌─────────────────────────────────────────────────┐
│  Welcome to Touchline Analytics                 │
│                                                  │
│  [■■■□□□] Checking Python installation...       │
│                                                  │
│  Step 1/5: Checking system requirements         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Setting up Touchline                           │
│                                                  │
│  [■■■■■□] Installing detection engine...        │
│                                                  │
│  Step 4/5: Installing backend components        │
│                                                  │
│  This may take a few minutes...                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Initial Setup                                  │
│                                                  │
│  Club Name: [_____________________________]    │
│                                                  │
│  Currency:  [USD ▼]                             │
│                                                  │
│  [ Continue ]                                   │
└─────────────────────────────────────────────────┘
```

### 3.3 Initialization Code

```typescript
// src/hooks/useInitialization.ts
export function useInitialization() {
  const [status, setStatus] = useState<InitStatus>({
    stage: 'checking_python',
    progress: 0,
    message: 'Checking Python installation...'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Stage 1: Check Python
      setStatus({ stage: 'checking_python', progress: 20, message: 'Checking Python...' });
      await touchline.initialize();

      // Stage 2: Check database
      setStatus({ stage: 'checking_db', progress: 40, message: 'Checking database...' });
      const dbExists = await checkDatabase();

      if (!dbExists) {
        // Stage 3: Initialize database
        setStatus({ stage: 'init_db', progress: 60, message: 'Initializing database...' });
        await touchline.config.createDefaults();
      }

      // Stage 4: Load initial data
      setStatus({ stage: 'loading_data', progress: 80, message: 'Loading data...' });
      await loadInitialData();

      // Stage 5: Complete
      setStatus({ stage: 'complete', progress: 100, message: 'Ready!' });

    } catch (error) {
      setStatus({
        stage: 'error',
        progress: 0,
        message: error.message,
        error
      });
    }
  }
}
```

---

## Phase 4: Electron Integration

### 4.1 Main Process Structure

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { CLIManager } from './cli/cliManager';

let mainWindow: BrowserWindow | null = null;
let cliManager: CLIManager | null = null;

app.on('ready', async () => {
  // Initialize CLI
  cliManager = new CLIManager();
  await cliManager.initialize();

  // Create window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('dist/index.html');
});

app.on('window-all-closed', async () => {
  if (cliManager) {
    await cliManager.cleanup();
  }
  app.quit();
});

// IPC handlers for file dialogs, etc.
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
    ]
  });
  return result.filePaths[0];
});
```

### 4.2 Preload Script

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (data: any) => ipcRenderer.invoke('save-file', data),
});
```

---

## Phase 5: React App Structure

### 5.1 State Management (Zustand)

```typescript
// src/stores/appStore.ts
interface AppState {
  isInitialized: boolean;
  currentClub: Club | null;
  currentSeason: Season | null;
  teams: Team[];
  sponsors: Sponsor[];

  // Actions
  setInitialized: (initialized: boolean) => void;
  setCurrentClub: (club: Club) => void;
  setCurrentSeason: (season: Season) => void;
  loadTeams: () => Promise<void>;
  loadSponsors: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  currentClub: null,
  currentSeason: null,
  teams: [],
  sponsors: [],

  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setCurrentClub: (club) => set({ currentClub: club }),
  setCurrentSeason: (season) => set({ currentSeason: season }),

  loadTeams: async () => {
    const { teams } = await touchline.teams.getAll();
    set({ teams });
  },

  loadSponsors: async () => {
    const { sponsors } = await touchline.sponsors.getAll();
    set({ sponsors });
  },
}));
```

### 5.2 Page Structure

```
src/pages/
├── Dashboard.tsx          # Main dashboard with metrics
├── Teams/
│   ├── TeamsList.tsx
│   ├── TeamDetail.tsx
│   └── TeamSettings.tsx
├── Sponsors/
│   ├── SponsorsList.tsx
│   ├── SponsorDetail.tsx
│   └── SponsorCreate.tsx
├── Detection/
│   ├── DetectionRunner.tsx
│   ├── DetectionHistory.tsx
│   └── DetectionResults.tsx
├── Training/
│   ├── TrainingSetup.tsx
│   ├── TrainingProgress.tsx
│   └── ModelManagement.tsx
├── Metrics/
│   ├── Overview.tsx
│   ├── SponsorMetrics.tsx
│   └── Reports.tsx
├── Settings/
│   ├── General.tsx
│   ├── SocialMedia.tsx
│   └── Configuration.tsx
└── Setup/
    └── FirstTimeSetup.tsx
```

### 5.3 Key Components (shadcn)

- **DataTable** - Sponsors, Teams, Models lists
- **Dialog** - Create/Edit forms
- **Card** - Metrics display
- **Progress** - Detection/Training progress
- **Select** - Dropdowns for teams, seasons, etc.
- **Tabs** - Navigation
- **Toast** - Notifications
- **Form** - Form handling with validation

---

## Phase 6: Implementation Checklist

### Week 1: Foundation
- [ ] Initialize Electron + React + TypeScript project
- [ ] Set up Vite build configuration
- [ ] Install and configure shadcn/ui
- [ ] Set up Tailwind CSS
- [ ] Create project structure

### Week 2: TypeScript Library
- [ ] Implement `TouchlineClient` base class
- [ ] Implement message protocol
- [ ] Create type definitions
- [ ] Implement all service classes
- [ ] Write unit tests for services

### Week 3: Electron Integration
- [ ] Implement `CLIManager`
- [ ] Bundle Python wheel in resources
- [ ] Python installation detection
- [ ] CLI process spawning
- [ ] IPC communication setup

### Week 4: Initialization Flow
- [ ] First-time setup wizard UI
- [ ] Database initialization
- [ ] Default configuration setup
- [ ] Loading states and error handling
- [ ] Welcome screen

### Week 5: Core Pages (Part 1)
- [ ] Dashboard layout
- [ ] Teams management
- [ ] Sponsors management
- [ ] Navigation and routing

### Week 6: Core Pages (Part 2)
- [ ] Detection runner page
- [ ] Detection results display
- [ ] Model management
- [ ] Settings pages

### Week 7: Advanced Features
- [ ] Training wizard
- [ ] Metrics and reports
- [ ] Social media configuration
- [ ] Export functionality

### Week 8: Polish & Testing
- [ ] Error handling throughout
- [ ] Loading states
- [ ] Responsive design
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Build and packaging

---

## Phase 7: Documentation Requirements

### 7.1 API Documentation

Generate TypeDoc documentation for all services:

```bash
npm run docs
```

Output: `docs/api/` with full API reference

### 7.2 User Guide

- Installation guide
- First-time setup walkthrough
- Feature tutorials
- Troubleshooting

### 7.3 Developer Guide

- Architecture overview
- Adding new services
- Building and packaging
- Contributing guidelines

---

## Phase 8: Build and Distribution

### 8.1 Electron Builder Configuration

```json
{
  "appId": "com.touchline.analytics",
  "productName": "Touchline Analytics",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "resources/**/*"
  ],
  "extraResources": [
    {
      "from": "resources/python",
      "to": "python",
      "filter": ["*.whl"]
    }
  ],
  "mac": {
    "category": "public.app-category.sports",
    "target": ["dmg", "zip"]
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "linux": {
    "target": ["AppImage", "deb"]
  }
}
```

### 8.2 CI/CD

- GitHub Actions for automated builds
- Build for macOS, Windows, Linux
- Code signing
- Auto-update functionality

---

## Next Steps

1. **Review this plan** - Ensure all requirements are covered
2. **Set up repository** - Initialize `touchline_app` locally
3. **Start with Phase 1** - Project setup and dependencies
4. **Iterate** - Build incrementally, test frequently

---

## Notes

- **Python Dependency**: App requires Python 3.8+ installed on user's system
- **Alternative**: Bundle Python with Electron (increases app size significantly)
- **Database**: SQLite database location in user data directory
- **Updates**: Consider auto-update mechanism for Python package updates
- **Performance**: Monitor memory usage with long-running tasks
- **Security**: Validate all file paths from user input

---

## Questions / Decisions Needed

1. **Python bundling**: Bundle Python or require installation?
2. **Auto-updates**: Implement for both Electron app and Python package?
3. **Authentication**: Add user authentication system?
4. **Multi-tenant**: Support multiple clubs/organizations?
5. **Cloud sync**: Add cloud backup/sync functionality?
