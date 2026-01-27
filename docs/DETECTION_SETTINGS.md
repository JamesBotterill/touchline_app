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

### Multi-Resolution Test-Time Augmentation (TTA)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `multi_resolution_tta` | bool | `false` | Enable multi-resolution TTA for enhanced accuracy |
| `tta_scales` | list[float] | `[0.8, 1.0, 1.2]` | Scale factors for multi-resolution processing |
| `tta_scale_weights` | dict | `{1.0: 1.2}` | Per-scale confidence weights (higher weight for native resolution) |
| `tta_confidence_weight` | float | `1.0` | Confidence weight for native resolution (1.0 scale) |
| `adaptive_resolution` | bool | `false` | Dynamically adjust scales based on detection confidence |
| `early_termination_threshold` | float | `0.95` | Stop TTA processing if detection confidence exceeds this value |

### Performance Optimization

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `memory_limit` | float | `0.8` | Maximum memory usage ratio |
| `display_frequency` | int | `10` | Frame display frequency |
| `hide_display` | bool | `true` | Hide visual display window |
| `show_metrics` | bool | `false` | Show performance metrics |
| `optimization_cache_enabled` | bool | `true` | Enable caching for TTA and optimization results |
| `memory_optimization_enabled` | bool | `true` | Enable memory optimization strategies |

### TensorRT Optimization (GPU Acceleration)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tensorrt_enabled` | bool | `false` | Enable TensorRT inference optimization (requires NVIDIA GPU) |
| `tensorrt_precision` | string | `"fp32"` | TensorRT precision mode: "fp32", "fp16", or "int8" |
| `tensorrt_workspace_size` | int | `1073741824` | TensorRT workspace memory (1GB default) |
| `tensorrt_max_batch_size` | int | `1` | Maximum batch size for TensorRT engine |
| `tensorrt_cache_dir` | string | `"model_cache"` | Directory to cache optimized TensorRT engines |

### Motion Prediction & Tracking

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motion_prediction_enabled` | bool | `true` | Enable Kalman filter-based motion prediction |
| `motion_prediction_iou_threshold` | float | `0.1` | IoU threshold for associating predictions with detections |
| `motion_confidence_threshold` | float | `0.5` | Minimum confidence for creating motion trackers |
| `max_velocity_pixels_per_frame` | float | `100.0` | Maximum expected velocity for logo movement |
| `max_frames_without_update` | int | `5` | Frames before removing inactive tracker |
| `motion_process_noise` | float | `1.0` | Kalman filter process noise (prediction uncertainty) |
| `motion_measurement_noise` | float | `2.0` | Kalman filter measurement noise (detection uncertainty) |
| `prediction_lookahead_frames` | int | `1` | Number of frames to predict ahead |

## Example: High-Precision Detection with Multi-Resolution TTA

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
    "multi_resolution_tta": true,
    "tta_scales": [0.75, 0.9, 1.0, 1.1, 1.25],
    "early_termination_threshold": 0.92,
    "motion_prediction_enabled": true,
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
    "show_metrics": false,
    "motion_prediction_enabled": true,
    "optimization_cache_enabled": true
  }
}
```

## Example: TensorRT GPU-Accelerated Detection

```json
{
  "request_id": "req_007",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/4k_video.mp4",
    "model_path": "/path/to/model.pt",
    "confidence": 0.2,
    "tensorrt_enabled": true,
    "tensorrt_precision": "fp16",
    "tensorrt_workspace_size": 2147483648,
    "tensorrt_cache_dir": "/path/to/cache",
    "multi_resolution_tta": false,
    "motion_prediction_enabled": true,
    "hide_display": true,
    "show_metrics": true,
    "output_path": "/path/to/output.mp4"
  }
}
```

## Example: Maximum Accuracy (TTA + Motion Prediction + Validation)

```json
{
  "request_id": "req_008",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/critical_match.mp4",
    "model_path": "/path/to/best_model.pt",
    "confidence": 0.2,
    "iou_threshold": 0.5,
    "multi_resolution_tta": true,
    "tta_scales": [0.7, 0.85, 1.0, 1.15, 1.3],
    "tta_scale_weights": {
      "0.7": 0.8,
      "0.85": 0.9,
      "1.0": 1.2,
      "1.15": 0.9,
      "1.3": 0.8
    },
    "early_termination_threshold": 0.9,
    "motion_prediction_enabled": true,
    "motion_confidence_threshold": 0.4,
    "max_velocity_pixels_per_frame": 120.0,
    "enable_validation": true,
    "min_validation_checks": 5,
    "min_detection_frames": 25,
    "detection_persistence": 30,
    "min_duration_seconds": 1.5,
    "output_path": "/path/to/output.mp4"
  }
}
```

## Example: Fast Processing (Minimal Overhead)

```json
{
  "request_id": "req_009",
  "command": "detections.detect_sync",
  "data": {
    "input_path": "/path/to/video.mp4",
    "model_path": "/path/to/model.pt",
    "confidence": 0.3,
    "multi_resolution_tta": false,
    "motion_prediction_enabled": false,
    "enable_validation": false,
    "min_detection_frames": 5,
    "hide_display": true,
    "show_metrics": false,
    "optimization_cache_enabled": false,
    "output_path": "/path/to/output.mp4"
  }
}
```

## Understanding Advanced Features

### Multi-Resolution Test-Time Augmentation (TTA)

TTA improves detection accuracy by processing frames at multiple resolutions and fusing results:

**When to Use:**
- High-value matches requiring maximum accuracy
- Small or distant logos that may be missed at native resolution
- Variable logo sizes throughout the video

**Performance Impact:**
- Processes frame at each scale in `tta_scales` (e.g., 3 scales = 3× processing time)
- Use `early_termination_threshold` to skip scales when high confidence is found
- Enable `optimization_cache_enabled` to cache scaled frame results

**Configuration Tips:**
- Start with 3 scales: `[0.8, 1.0, 1.2]`
- For small logos: `[0.9, 1.0, 1.2, 1.4]`
- For large logos: `[0.6, 0.8, 1.0, 1.2]`
- Adjust `tta_scale_weights` to prefer native resolution: `{1.0: 1.2}`

### TensorRT Optimization

Accelerates inference on NVIDIA GPUs using TensorRT:

**Requirements:**
- NVIDIA GPU (CUDA-capable)
- TensorRT installed
- First run builds and caches optimized engine (takes time)

**Precision Modes:**
- `fp32`: Highest accuracy, slowest (baseline)
- `fp16`: 2-3× faster, minimal accuracy loss (recommended)
- `int8`: 4-5× faster, requires calibration, slight accuracy loss

**Best Practices:**
- Set `tensorrt_cache_dir` to persist optimized engines between runs
- Increase `tensorrt_workspace_size` for larger models (2GB+)
- First detection will be slow (building engine), subsequent ones are fast

### Motion Prediction & Tracking

Uses Kalman filtering to predict logo positions and smooth detections:

**Benefits:**
- Reduces false positives by tracking logos across frames
- Fills in gaps when logos are temporarily occluded
- Smooths bounding boxes for better visual output

**Key Parameters:**
- `motion_prediction_iou_threshold`: Lower values (0.1) for fast horizontal movement
- `max_velocity_pixels_per_frame`: Set based on video resolution and camera movement
- `motion_process_noise`: Higher values allow more prediction uncertainty
- `motion_measurement_noise`: Higher values trust detections less

**Use Cases:**
- Static camera: Lower velocity (50-80 pixels/frame)
- Panning camera: Higher velocity (100-150 pixels/frame)
- Zooming: Disable motion prediction

### Performance vs Accuracy Trade-offs

| Configuration | Speed | Accuracy | Use Case |
|---------------|-------|----------|----------|
| Basic detection | Fastest | Good | Quick analysis, high-confidence logos |
| + Motion prediction | -5% | +10% | Standard processing (recommended) |
| + Validation | -10% | +15% | Quality assurance, reduce false positives |
| + TTA (3 scales) | -200% | +20% | High-value matches, small logos |
| + TTA (5 scales) | -400% | +25% | Maximum accuracy required |
| + TensorRT (fp16) | +150% | Same | GPU acceleration available |

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

## Best Practice Configurations

### Recommended: Balanced Accuracy & Speed
```json
{
  "confidence": 0.2,
  "motion_prediction_enabled": true,
  "enable_validation": true,
  "min_detection_frames": 15,
  "multi_resolution_tta": false,
  "optimization_cache_enabled": true
}
```

### High Accuracy: Critical Matches
```json
{
  "confidence": 0.15,
  "multi_resolution_tta": true,
  "tta_scales": [0.8, 1.0, 1.2],
  "motion_prediction_enabled": true,
  "enable_validation": true,
  "min_validation_checks": 5,
  "min_detection_frames": 20
}
```

### High Speed: Batch Processing
```json
{
  "confidence": 0.25,
  "multi_resolution_tta": false,
  "motion_prediction_enabled": true,
  "enable_validation": false,
  "min_detection_frames": 10,
  "tensorrt_enabled": true,
  "tensorrt_precision": "fp16"
}
```
