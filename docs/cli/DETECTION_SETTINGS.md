# Detection Settings Guide

## Overview
The Touchline CLI provides extensive configuration options for logo detection. Settings can be passed with each detection command to control detection accuracy, validation, and performance.

## Current Limitations

⚠️ **Important**: Detection settings are currently **hardcoded defaults** in the CLI and are **not stored in the database**. You must specify all desired parameters with each detection command.

### What's in the Database
The `configurations` table only stores basic detection settings:
- `detection.confidence_threshold`: 0.4
- `detection.iou_threshold`: 0.45
- `detection.min_detection_area`: 100
- `detection.max_detections`: 50

You can read/update these via CLI:
```json
{"command": "configs.get", "data": {"category": "detection", "key": "confidence_threshold"}}
{"command": "configs.set", "data": {"category": "detection", "key": "confidence_threshold", "value": "0.5"}}
```

### What's NOT in the Database
All advanced detection parameters (43 total) including:
- Temporal settings (`min_detection_frames`, `detection_persistence`, etc.)
- Validation settings (size ratios, edge strength, contrast, etc.)
- Template matching settings
- Performance settings

**There are currently no CLI commands to save or load detection defaults.** You must pass all parameters explicitly with each detection request.

## Detection Commands

### Synchronous Detection
Blocks until complete:
```json
{
  "request_id": "req_001",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/video.mp4",
    "model_path": "/path/to/model.pt",
    "confidence": 0.15,
    "output_path": "/path/to/output.mp4"
  }
}
```

### Asynchronous Detection
Returns immediately with `task_id`:
```json
{
  "request_id": "req_002",
  "command": "detections.detect_async",
  "data": {
    "input_path": "/path/to/video.mp4",
    "model_path": "/path/to/model.pt"
  }
}
```

Check status with:
```json
{
  "request_id": "req_003",
  "command": "detections.get_task_status",
  "data": {
    "task_id": "detection_abc123"
  }
}
```

### Batch Detection
Process multiple files:
```json
{
  "request_id": "req_004",
  "command": "detections.detect_batch",
  "data": {
    "input_paths": ["/path/to/video1.mp4", "/path/to/video2.mp4"],
    "max_concurrent": 4,
    "model_path": "/path/to/model.pt"
  }
}
```

## Detection Parameters

### Basic Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model_path` | string | `"runs/detect/train3/weights/best.pt"` | Path to YOLO model |
| `confidence` | float | `0.15` | Base detection confidence threshold (0-1) |
| `output_path` | string | `null` | Path for output video (auto-generated if null) |
| `team` | string | `""` | Team name for database storage |
| `content_type` | string | `""` | Content type for categorization |

### Advanced Detection

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `iou_threshold` | float | `0.5` | IoU threshold for NMS |
| `quality_threshold` | float | `0.5` | Minimum quality score |
| `smoothing_alpha` | float | `0.5` | Temporal smoothing factor |
| `min_detection_frames` | int | `15` | Minimum frames to confirm detection |
| `detection_persistence` | int | `25` | Frames to persist detection after disappearing |
| `confidence_boost_per_frame` | float | `0.05` | Confidence boost for persistent detections |
| `max_confidence_boost` | float | `0.2` | Maximum total confidence boost |
| `min_duration_seconds` | float | `1.0` | Minimum detection duration to save |

### Validation Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enable_validation` | bool | `true` | Enable quality validation |
| `min_validation_checks` | int | `4` | Minimum validations to pass |
| `adjust_confidence_from_validation` | bool | `true` | Adjust confidence from validation results |
| `size_min_ratio` | float | `0.008` | Minimum logo size ratio |
| `size_max_ratio` | float | `0.3` | Maximum logo size ratio |
| `aspect_min_ratio` | float | `0.25` | Minimum aspect ratio |
| `aspect_max_ratio` | float | `4.0` | Maximum aspect ratio |
| `edge_min_strength` | float | `25.0` | Minimum edge strength |
| `contrast_min_value` | float | `25.0` | Minimum contrast |
| `color_min_dominance` | float | `0.65` | Minimum color dominance |
| `max_noise_level` | float | `12.0` | Maximum noise tolerance |
| `scene_change_threshold` | float | `25.0` | Scene change detection threshold |

### Template Matching

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `logo_templates_dir` | string | `null` | Directory with logo template images |
| `template_match_threshold` | float | `0.55` | Template matching threshold (0-1) |

### Performance

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `memory_limit` | float | `0.8` | Maximum memory usage ratio |
| `display_frequency` | int | `10` | Frame display frequency |
| `hide_display` | bool | `true` | Hide visual display window |
| `show_metrics` | bool | `false` | Show performance metrics |

## Example: High-Precision Detection

```json
{
  "request_id": "req_005",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/important_video.mp4",
    "model_path": "/path/to/model.pt",
    "confidence": 0.25,
    "min_detection_frames": 20,
    "min_duration_seconds": 2.0,
    "enable_validation": true,
    "min_validation_checks": 5,
    "size_min_ratio": 0.01,
    "edge_min_strength": 30.0,
    "contrast_min_value": 30.0,
    "output_path": "/path/to/output.mp4"
  }
}
```

## Example: Fast Batch Processing

```json
{
  "request_id": "req_006",
  "command": "detections.detect_batch",
  "data": {
    "input_paths": ["/videos/1.mp4", "/videos/2.mp4", "/videos/3.mp4"],
    "max_concurrent": 8,
    "confidence": 0.15,
    "min_detection_frames": 10,
    "enable_validation": false,
    "hide_display": true,
    "show_metrics": false
  }
}
```

## Task Management

List all tasks:
```json
{"command": "detections.list_tasks", "data": {}}
```

Cancel a task:
```json
{"command": "detections.cancel_task", "data": {"task_id": "detection_abc123"}}
```

Clean up completed tasks:
```json
{"command": "detections.cleanup_tasks", "data": {}}
```
