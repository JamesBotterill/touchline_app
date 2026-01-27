# Results Page Population Guide

Complete guide for populating the results/analytics page using CLI commands after running detections.

## Table of Contents

1. [Overview](#overview)
2. [Data Flow](#data-flow)
3. [Recording Detection Results](#recording-detection-results)
4. [Retrieving Results for Display](#retrieving-results-for-display)
5. [Sponsor-Specific Metrics](#sponsor-specific-metrics)
6. [Social Media Integration](#social-media-integration)
7. [Complete Workflow Examples](#complete-workflow-examples)
8. [Database Schema Reference](#database-schema-reference)

---

## Overview

The results page displays detection analytics including:
- Detection run history for teams
- Sponsor exposure metrics (time, screen area, media value)
- Social media value calculations
- Match/content breakdown by sponsor
- Historical trends and comparisons

All data is retrieved via CLI JSON commands from the database populated during detection runs.

---

## Data Flow

```
1. Run Detection
   └─> detections.detect_sync / detect_async
       └─> Produces: output video + detection data

2. Record Detection Run
   └─> metrics.record_detection
       └─> Stores: detection_runs record + sponsor_metrics

3. (Optional) Import CSV Metrics
   └─> metrics.import_metrics
       └─> Stores: detailed per-sponsor metrics from CSV report

4. (Optional) Calculate Social Value
   └─> metrics.calculate_social_value
       └─> Stores: social media value calculations

5. Retrieve for Results Page
   └─> metrics.get_team_runs (list recent runs)
   └─> metrics.get_run (get specific run details)
   └─> metrics.get_sponsor_metrics (get sponsor summary)
   └─> teams.get (get team with sponsors)
```

---

## Recording Detection Results

### Step 1: Run Detection

```json
{
  "request_id": "req_001",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/match_video.mp4",
    "model_path": "/path/to/model.pt",
    "team": "Manchester United",
    "content_type": "Match Footage",
    "confidence": 0.2,
    "output_path": "/path/to/output_video.mp4"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "output_path": "/path/to/output_video.mp4",
  "processing_time": 45.2,
  "metrics": {
    "total_detections": 156,
    "sponsors_detected": ["Nike", "Adidas"],
    "total_duration_seconds": 23.4,
    "...": "additional metrics"
  }
}
```

### Step 2: Record Detection Run

After detection completes, record it in the database:

```json
{
  "request_id": "req_002",
  "command": "metrics.record_detection",
  "data": {
    "team_id": 1,
    "model_id": 5,
    "season_id": 2,
    "input_file": "/path/to/match_video.mp4",
    "output_file": "/path/to/output_video.mp4",
    "model_path": "/path/to/model.pt",
    "processing_time": 45.2,
    "medium": "video",
    "metrics_data": "{\"total_detections\": 156, \"sponsors_detected\": [\"Nike\", \"Adidas\"]}",
    "sponsor_metrics": [
      {
        "sponsor_id": 1,
        "total_detections": 89,
        "total_duration_seconds": 15.2,
        "screen_percentage": 12.5,
        "confidence_avg": 0.87,
        "media_value": 1250.00
      },
      {
        "sponsor_id": 2,
        "total_detections": 67,
        "total_duration_seconds": 8.2,
        "screen_percentage": 8.3,
        "confidence_avg": 0.82,
        "media_value": 820.00
      }
    ]
  }
}
```

**Returns:**
```json
{
  "success": true,
  "detection_run_id": 42
}
```

**Important:** Save the `detection_run_id` - you'll need it for retrieving results and calculating social value.

---

## Retrieving Results for Display

### Get Recent Detection Runs for a Team

```json
{
  "request_id": "req_003",
  "command": "metrics.get_team_runs",
  "data": {
    "team_id": 1,
    "limit": 20
  }
}
```

**Returns:**
```json
{
  "success": true,
  "detection_runs": [
    {
      "id": 42,
      "team_id": 1,
      "team_name": "Manchester United",
      "model_id": 5,
      "season_id": 2,
      "input_file": "/path/to/match_video.mp4",
      "output_file": "/path/to/output_video.mp4",
      "processing_time": 45.2,
      "medium": "video",
      "created_at": "2024-01-24 10:30:00",
      "metrics_data": "{...}"
    },
    {
      "id": 41,
      "...": "previous run"
    }
  ]
}
```

**Use Case:** Populate the "Recent Detections" list on results page.

### Get Specific Detection Run Details

```json
{
  "request_id": "req_004",
  "command": "metrics.get_run",
  "data": {
    "run_id": 42
  }
}
```

**Returns:**
```json
{
  "success": true,
  "detection_run": {
    "id": 42,
    "team_id": 1,
    "team_name": "Manchester United",
    "model_id": 5,
    "season_id": 2,
    "input_file": "/path/to/match_video.mp4",
    "output_file": "/path/to/output_video.mp4",
    "processing_time": 45.2,
    "medium": "video",
    "created_at": "2024-01-24 10:30:00",
    "social_platform_id": null,
    "post_type_id": null,
    "metrics_data": "{...}",
    "sponsor_metrics": [
      {
        "sponsor_id": 1,
        "sponsor_name": "Nike",
        "total_detections": 89,
        "total_duration_seconds": 15.2,
        "screen_percentage": 12.5,
        "confidence_avg": 0.87,
        "media_value": 1250.00
      }
    ]
  }
}
```

**Use Case:** Display detailed breakdown when user clicks on a specific run.

---

## Sponsor-Specific Metrics

### Get Sponsor Metrics Summary

Get aggregated metrics for a sponsor across all detection runs:

```json
{
  "request_id": "req_005",
  "command": "metrics.get_sponsor_metrics",
  "data": {
    "sponsor_id": 1,
    "days": 30
  }
}
```

**Parameters:**
- `sponsor_id`: Sponsor ID (required)
- `days`: Limit to last N days (optional, null = all time)

**Returns:**
```json
{
  "success": true,
  "metrics": {
    "sponsor_id": 1,
    "sponsor_name": "Nike",
    "total_detections": 1247,
    "total_runs": 8,
    "total_duration_seconds": 145.6,
    "avg_screen_percentage": 11.2,
    "avg_confidence": 0.85,
    "total_media_value": 12450.00,
    "first_detection": "2024-01-01 10:00:00",
    "last_detection": "2024-01-24 10:30:00"
  }
}
```

**Use Case:**
- Display sponsor performance cards
- Show ROI calculations
- Compare sponsors over time periods

---

## Social Media Integration

### Recording Social Media Detections

For social media posts (Instagram, TikTok, etc.), include platform and post type:

```json
{
  "request_id": "req_006",
  "command": "metrics.record_detection",
  "data": {
    "team_id": 1,
    "model_id": 5,
    "season_id": 2,
    "input_file": "/path/to/social_post.jpg",
    "output_file": "/path/to/output.jpg",
    "model_path": "/path/to/model.pt",
    "processing_time": 2.1,
    "medium": "image",
    "social_platform_id": 2,
    "social_content_type_id": 1,
    "post_type_id": 3,
    "sponsor_metrics": [
      {
        "sponsor_id": 1,
        "total_detections": 1,
        "total_duration_seconds": 0,
        "screen_percentage": 15.2,
        "confidence_avg": 0.92,
        "media_value": 0
      }
    ]
  }
}
```

**Platform IDs:**
- Get available platforms: `social_media.get_platforms`
- Common: Instagram (2), TikTok (3), Twitter (1), Facebook (4)

**Content Type IDs:**
- Get available types: `social_media.get_content_types`
- Common: Story (1), Post (2), Reel (3)

**Post Type IDs:**
- Get available types: `post_types.get_all`
- Common: Team Lineups (1), Player of Game (2), Match Highlights (3)

### Calculate Social Media Value

After recording a social media detection, calculate its value:

```json
{
  "request_id": "req_007",
  "command": "metrics.calculate_social_value",
  "data": {
    "detection_run_id": 43,
    "sponsor_id": 1
  }
}
```

**Returns:**
```json
{
  "success": true,
  "value_result": {
    "total_value": 2450.50,
    "visibility_component": 1800.00,
    "engagement_component": 650.50,
    "detection_quality_score": 0.92,
    "platform": "Instagram",
    "content_type": "Story"
  },
  "total_value": 2450.50,
  "visibility_value": 1800.00,
  "engagement_value": 650.50
}
```

### Store Social Media Engagement Metrics

Store actual engagement data (views, likes, etc.) for a social post:

```json
{
  "request_id": "req_008",
  "command": "metrics.store_social_metrics",
  "data": {
    "detection_run_id": 43,
    "sponsor_id": 1,
    "views": 125000,
    "likes": 8500,
    "comments": 240,
    "shares": 320,
    "saves": 1100,
    "engagement_rate": 8.13,
    "engagement_value": 4050.00,
    "visibility_value": 2500.00,
    "brand_value": 6550.00,
    "cpm_rate": 20.00,
    "avg_engagement_rate": 6.5
  }
}
```

**Returns:**
```json
{
  "success": true,
  "message": "Social media metrics stored successfully"
}
```

---

## Complete Workflow Examples

### Example 1: Video Match Detection → Results Page

```bash
# 1. Run detection on match video
{
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/videos/match_2024_01_24.mp4",
    "model_path": "/models/premier_league.pt",
    "team": "Manchester United",
    "confidence": 0.2
  }
}
# Returns: detection_run_id = 42

# 2. Record the detection run
{
  "command": "metrics.record_detection",
  "data": {
    "team_id": 1,
    "model_id": 5,
    "season_id": 2,
    "input_file": "/videos/match_2024_01_24.mp4",
    "output_file": "/output/match_2024_01_24_detected.mp4",
    "model_path": "/models/premier_league.pt",
    "processing_time": 67.8,
    "medium": "video",
    "sponsor_metrics": [...]
  }
}
# Returns: detection_run_id = 42

# 3. Populate results page - get recent runs
{
  "command": "metrics.get_team_runs",
  "data": {"team_id": 1, "limit": 10}
}

# 4. User clicks on run → get detailed breakdown
{
  "command": "metrics.get_run",
  "data": {"run_id": 42}
}

# 5. Display sponsor performance cards
{
  "command": "metrics.get_sponsor_metrics",
  "data": {"sponsor_id": 1, "days": 30}
}
```

### Example 2: Social Media Post Detection → Value Calculation

```bash
# 1. Run detection on Instagram story
{
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/social/instagram_story_123.jpg",
    "model_path": "/models/social_media.pt",
    "confidence": 0.25
  }
}

# 2. Get platform and content type IDs
{
  "command": "social_media.get_platforms",
  "data": {}
}
# Returns: Instagram = platform_id 2

{
  "command": "social_media.get_content_types",
  "data": {}
}
# Returns: Story = content_type_id 1

{
  "command": "post_types.get_all",
  "data": {}
}
# Returns: Team Lineups = post_type_id 1

# 3. Record social media detection
{
  "command": "metrics.record_detection",
  "data": {
    "team_id": 1,
    "model_id": 6,
    "season_id": 2,
    "input_file": "/social/instagram_story_123.jpg",
    "output_file": "/output/instagram_story_123_detected.jpg",
    "model_path": "/models/social_media.pt",
    "processing_time": 1.2,
    "medium": "image",
    "social_platform_id": 2,
    "social_content_type_id": 1,
    "post_type_id": 1,
    "sponsor_metrics": [
      {
        "sponsor_id": 1,
        "total_detections": 1,
        "screen_percentage": 18.5,
        "confidence_avg": 0.94,
        "media_value": 0
      }
    ]
  }
}
# Returns: detection_run_id = 43

# 4. Calculate social media value
{
  "command": "metrics.calculate_social_value",
  "data": {
    "detection_run_id": 43,
    "sponsor_id": 1
  }
}
# Returns: total_value = 2450.50

# 5. Store actual engagement metrics (after 24 hours)
{
  "command": "metrics.store_social_metrics",
  "data": {
    "detection_run_id": 43,
    "sponsor_id": 1,
    "views": 125000,
    "likes": 8500,
    "comments": 240,
    "shares": 320,
    "saves": 1100
  }
}

# 6. Display results page with social value
{
  "command": "metrics.get_run",
  "data": {"run_id": 43}
}
```

### Example 3: Batch Processing → Dashboard Summary

```bash
# 1. Run batch detection on multiple matches
{
  "command": "detections.detect_batch",
  "data": {
    "input_paths": [
      "/videos/match1.mp4",
      "/videos/match2.mp4",
      "/videos/match3.mp4"
    ],
    "model_path": "/models/premier_league.pt",
    "max_concurrent": 3
  }
}

# 2. Record each detection run
# (Repeat for each completed detection)
{
  "command": "metrics.record_detection",
  "data": {...}
}

# 3. Dashboard - get all recent runs
{
  "command": "metrics.get_team_runs",
  "data": {"team_id": 1, "limit": 50}
}

# 4. Dashboard - get sponsor performance over last 7 days
{
  "command": "metrics.get_sponsor_metrics",
  "data": {"sponsor_id": 1, "days": 7}
}

{
  "command": "metrics.get_sponsor_metrics",
  "data": {"sponsor_id": 2, "days": 7}
}

# 5. Get team info with all sponsors
{
  "command": "teams.get",
  "data": {"team_id": 1}
}
```

---

## Database Schema Reference

### Key Tables for Results Page

**detection_runs**
- Primary table storing each detection operation
- Fields: id, team_id, model_id, season_id, input_file, output_file, processing_time, medium, social_platform_id, social_content_type_id, post_type_id, created_at

**sponsor_metrics**
- Per-sponsor metrics for each detection run
- Fields: id, detection_run_id, sponsor_id, total_detections, total_duration_seconds, screen_percentage, confidence_avg, media_value

**social_media_metrics**
- Social media engagement data and value calculations
- Fields: id, detection_run_id, sponsor_id, platform_id, content_type_id, views, likes, comments, shares, saves, engagement_rate, engagement_value, visibility_value, brand_value

**teams**
- Team information
- Fields: id, club_id, name, description, logo_path

**sponsors**
- Sponsor information
- Fields: id, club_id, name, logo_path, industry, website

**team_sponsors**
- Many-to-many relationship between teams and sponsors
- Fields: id, team_id, sponsor_id, sponsorship_type_id, season_id

---

## Results Page Components

### Component 1: Recent Detection Runs Table

**Data Source:** `metrics.get_team_runs`

**Display:**
- Date/Time
- Input File
- Processing Time
- Medium (video/image)
- Platform (if social)
- # Sponsors Detected
- Total Media Value
- Click → View Details

### Component 2: Detection Run Detail View

**Data Source:** `metrics.get_run`

**Display:**
- Run metadata (file paths, processing time, model used)
- Sponsor breakdown table:
  - Sponsor name + logo
  - Total detections
  - Duration/screen time
  - Average confidence
  - Media value
- Social metrics (if applicable):
  - Platform, content type, post type
  - Views, likes, comments, shares
  - Calculated value
- Link to output video/image

### Component 3: Sponsor Performance Cards

**Data Source:** `metrics.get_sponsor_metrics`

**Display:**
- Sponsor logo + name
- Total detections (time period)
- Total exposure time
- Average screen percentage
- Total media value
- Trend indicator (↑↓)

### Component 4: Team Overview

**Data Source:** `teams.get`

**Display:**
- Team name + logo
- Active sponsors (current season)
- Assigned models
- Recent detection count

---

## Common Queries for Results Page

### Get all data for team results dashboard:

```bash
# 1. Get team with sponsors
teams.get → {"team_id": 1}

# 2. Get recent detection runs
metrics.get_team_runs → {"team_id": 1, "limit": 20}

# 3. For each sponsor, get metrics summary
metrics.get_sponsor_metrics → {"sponsor_id": X, "days": 30}

# 4. When user clicks a run, get details
metrics.get_run → {"run_id": Y}
```

### Filter by season:

```bash
# Get detection runs for specific season
# (Filter client-side based on season_id in detection_runs)
metrics.get_team_runs → filter by season_id

# Or get team's models for a season
teams.get_models → {"team_id": 1, "season_id": 2}
```

### Filter by date range:

```bash
# Use days parameter
metrics.get_sponsor_metrics → {"sponsor_id": 1, "days": 7}  # Last 7 days
metrics.get_sponsor_metrics → {"sponsor_id": 1, "days": 30} # Last 30 days
metrics.get_sponsor_metrics → {"sponsor_id": 1}             # All time
```

---

## Best Practices

1. **Always record detection runs immediately** after detection completes
2. **Save detection_run_id** for future reference and value calculations
3. **Include sponsor_metrics array** when recording to populate sponsor breakdown table
4. **For social media**, get platform/content type IDs first, then record with those IDs
5. **Calculate social value** after recording social media detections
6. **Update engagement metrics** after 24-48 hours when data is available
7. **Use consistent team_id and season_id** for accurate filtering
8. **Cache sponsor metrics** on frontend to avoid repeated queries
9. **Paginate detection runs** for teams with many runs (use limit parameter)
10. **Handle missing data gracefully** - not all runs will have social metrics

---

## Troubleshooting

### No detection runs showing up
- Check `metrics.get_team_runs` with correct team_id
- Verify detection was recorded with `metrics.record_detection`
- Check database directly: `SELECT * FROM detection_runs WHERE team_id = X`

### Missing sponsor metrics
- Ensure `sponsor_metrics` array was included in `record_detection` call
- Verify sponsor_id exists and is assigned to team
- Check `SELECT * FROM sponsor_metrics WHERE detection_run_id = X`

### Social value not calculating
- Ensure detection run has `social_platform_id` and `social_content_type_id`
- Verify platform and content type exist in database
- Check calculation parameters in social_metrics configuration

### Incorrect sponsor totals
- Verify `days` parameter in `get_sponsor_metrics` matches desired time range
- Check for duplicate detection runs
- Ensure sponsor assignments are correct for the season
