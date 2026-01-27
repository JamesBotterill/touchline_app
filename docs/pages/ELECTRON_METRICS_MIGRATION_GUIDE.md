# Electron App Team Metrics Implementation Guide

## Overview
The Electron app's TeamMetrics page is attempting to call three non-existent CLI commands. However, the same functionality can be achieved using **existing CLI methods** by processing the data client-side, just like the Flet app does.

## Current Situation

### What the Electron App is Trying to Do (❌ Wrong Approach)
```typescript
// These commands DON'T EXIST and should NOT be created
const runsResult = await window.api.touchline.sendCommand("metrics.get_runs_by_team_season", {
  team_id: parseInt(teamId),
  season_id: selectedSeasonId
});

const metricsResult = await window.api.touchline.sendCommand("metrics.get_sponsor_metrics_by_season", {
  team_id: parseInt(teamId),
  season_id: selectedSeasonId
});

const platformResult = await window.api.touchline.sendCommand("metrics.get_platform_metrics_by_season", {
  team_id: parseInt(teamId),
  season_id: selectedSeasonId
});
```

### What the Flet App Does (✅ Correct Approach)

The Flet app uses **ONE existing API call** and processes the data client-side:

**File:** `gui/pages/team_metrics.py`

```python
# Line 261-266: Load ALL detection runs for the team
self.app_state.admin_adapter.get_team_detection_runs(
    self.app_state.api_key,
    self.app_state.current_team_id,
    20,  # limit
    on_runs_loaded
)

# Line 248-250: Filter by season CLIENT-SIDE
if season_id:
    season_runs = [run for run in all_runs if run.get("season_id", None) == season_id]
```

## Existing CLI Commands to Use

### 1. Get Detection Runs (Already Exists)
**Command:** `metrics.get_team_runs`

**Location:** `touchline_cli/handlers/metrics_handler.py:95-110`

**Request:**
```typescript
const runsResult = await window.api.touchline.sendCommand("metrics.get_team_runs", {
  team_id: parseInt(teamId),
  limit: 50  // Get more runs, filter client-side by season
});
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "detection_runs": [
      {
        "id": 1,
        "team_id": 1,
        "season_id": 1,
        "input_file": "video.mp4",
        "created_at": "2026-01-25T10:00:00",
        "social_platform_id": 2,
        "social_content_type_id": 1,
        "post_type_id": 3,
        "metrics": [
          {
            "sponsor_name": "Nike",
            "appearances": 5,
            "total_seconds": 12.5,
            "avg_quality": 0.85,
            "total_value": 2500.00
          }
        ]
      }
    ]
  }
}
```

## Client-Side Processing (TypeScript/React)

### Step 1: Filter Detection Runs by Season

```typescript
// Get all detection runs for the team
const runsResult = await window.api.touchline.sendCommand("metrics.get_team_runs", {
  team_id: parseInt(teamId),
  limit: 100
});

if (!runsResult.success || !runsResult.data?.detection_runs) {
  throw new Error("Failed to fetch detection runs");
}

// Filter client-side by season
const allRuns = runsResult.data.detection_runs;
const seasonRuns = allRuns.filter(run => run.season_id === selectedSeasonId);

setDetectionRuns(seasonRuns);
```

### Step 2: Calculate Sponsor Metrics by Season (Client-Side)

**Reference:** `gui/components/team_detection_runs_table.py:48-200`

```typescript
interface SponsorMetrics {
  sponsor_id: number;
  sponsor_name: string;
  total_appearances: number;
  total_duration: number;
  avg_quality: number;
  total_value: number;
  social_value: number;
}

function calculateSponsorMetrics(seasonRuns: DetectionRun[]): SponsorMetrics[] {
  const sponsorMap = new Map<string, SponsorMetrics>();

  for (const run of seasonRuns) {
    // Parse metrics if they're stored as JSON string
    let runMetrics = run.metrics;
    if (typeof runMetrics === 'string') {
      runMetrics = JSON.parse(runMetrics);
    }

    if (!Array.isArray(runMetrics)) continue;

    for (const metric of runMetrics) {
      if (!metric || typeof metric !== 'object') continue;

      const sponsorName = metric.sponsor_name || metric.sponsor || metric.name || 'Unknown';

      if (!sponsorMap.has(sponsorName)) {
        sponsorMap.set(sponsorName, {
          sponsor_id: metric.sponsor_id || 0,
          sponsor_name: sponsorName,
          total_appearances: 0,
          total_duration: 0,
          avg_quality: 0,
          total_value: 0,
          social_value: 0
        });
      }

      const sponsor = sponsorMap.get(sponsorName)!;

      // Aggregate metrics
      sponsor.total_appearances += parseFloat(metric.appearances || 0);
      sponsor.total_duration += parseFloat(metric.total_seconds || metric.duration || 0);
      sponsor.total_value += parseFloat(metric.total_value || metric.value || 0);

      // Note: avg_quality needs to be calculated as weighted average at the end
    }
  }

  // Convert map to array and calculate averages
  const sponsors = Array.from(sponsorMap.values());

  // Calculate average quality (if needed, depends on how it's stored)
  // This would need to track quality sum and count separately

  return sponsors.sort((a, b) => b.total_value - a.total_value);
}

// Usage
const sponsorMetrics = calculateSponsorMetrics(seasonRuns);
setSponsorMetrics(sponsorMetrics);
```

### Step 3: Calculate Platform Metrics by Season (Client-Side)

**Reference:** `gui/components/social_platform_metrics.py:148-216`

```typescript
interface PlatformMetrics {
  platform_id: number;
  platform_name: string;
  total_posts: number;
  total_value: number;
  avg_engagement_rate: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
}

function calculatePlatformMetrics(seasonRuns: DetectionRun[]): PlatformMetrics[] {
  const platformMap = new Map<number, PlatformMetrics>();

  for (const run of seasonRuns) {
    // Skip runs without social platform data
    if (!run.social_platform_id) continue;

    const platformId = run.social_platform_id;

    if (!platformMap.has(platformId)) {
      platformMap.set(platformId, {
        platform_id: platformId,
        platform_name: run.platform_name || 'Unknown',
        total_posts: 0,
        total_value: 0,
        avg_engagement_rate: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0
      });
    }

    const platform = platformMap.get(platformId)!;
    platform.total_posts++;

    // Calculate total value from metrics
    let runMetrics = run.metrics;
    if (typeof runMetrics === 'string') {
      runMetrics = JSON.parse(runMetrics);
    }

    if (Array.isArray(runMetrics)) {
      for (const metric of runMetrics) {
        if (typeof metric === 'object') {
          platform.total_value += parseFloat(metric.total_value || metric.value || 0);
        }
      }
    }

    // Parse social metrics data
    if (run.social_metrics_data) {
      let socialMetrics = run.social_metrics_data;
      if (typeof socialMetrics === 'string') {
        socialMetrics = JSON.parse(socialMetrics);
      }

      platform.total_views += parseInt(socialMetrics.views || 0);
      platform.total_likes += parseInt(socialMetrics.likes || 0);
      platform.total_comments += parseInt(socialMetrics.comments || 0);
      platform.total_shares += parseInt(socialMetrics.shares || 0);
    }
  }

  // Calculate average engagement rates
  const platforms = Array.from(platformMap.values());
  for (const platform of platforms) {
    if (platform.total_views > 0) {
      const totalEngagements = platform.total_likes + platform.total_comments +
                               platform.total_shares;
      platform.avg_engagement_rate = totalEngagements / platform.total_views;
    }
  }

  return platforms.sort((a, b) => b.total_value - a.total_value);
}

// Usage
const platformMetrics = calculatePlatformMetrics(seasonRuns);
setPlatformMetrics(platformMetrics);
```

## Complete Implementation Example

```typescript
async function loadTeamMetrics(teamId: number, seasonId: number) {
  try {
    // 1. Fetch ALL detection runs for the team
    const runsResult = await window.api.touchline.sendCommand("metrics.get_team_runs", {
      team_id: teamId,
      limit: 100  // Adjust as needed
    });

    if (!runsResult.success || !runsResult.data?.detection_runs) {
      throw new Error("Failed to load detection runs");
    }

    // 2. Filter runs by season CLIENT-SIDE
    const allRuns = runsResult.data.detection_runs;
    const seasonRuns = allRuns.filter(run => run.season_id === seasonId);

    console.log(`Filtered ${allRuns.length} total runs to ${seasonRuns.length} for season ${seasonId}`);

    // 3. Calculate metrics CLIENT-SIDE
    setDetectionRuns(seasonRuns);
    setSponsorMetrics(calculateSponsorMetrics(seasonRuns));
    setPlatformMetrics(calculatePlatformMetrics(seasonRuns));

  } catch (error) {
    console.error("Error loading team metrics:", error);
    // Handle error
  }
}
```

## Benefits of This Approach

1. **✅ Uses existing, tested CLI commands** - No new backend code needed
2. **✅ Matches Flet app architecture** - Proven working implementation
3. **✅ Flexible filtering** - Can filter by multiple criteria client-side
4. **✅ Reduces server load** - One API call instead of three
5. **✅ Easier to maintain** - Less duplication between Flet and Electron
6. **✅ Better performance** - No round-trips for aggregation queries

## Migration Checklist

- [ ] Update `TeamMetrics.tsx` to use `metrics.get_team_runs`
- [ ] Implement `calculateSponsorMetrics()` utility function
- [ ] Implement `calculatePlatformMetrics()` utility function
- [ ] Add client-side season filtering
- [ ] Remove calls to non-existent commands
- [ ] Test with real database data
- [ ] Verify metrics match Flet app output

## Notes

- The database currently has **0 detection runs** so all queries will return empty results until actual detections are performed
- The `detection_metrics` table structure exists and is correct
- All sponsor/platform aggregation should happen **client-side** like the Flet app does
- This approach maintains consistency between Flet GUI and Electron app implementations
