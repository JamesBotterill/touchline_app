# CLI Model Management Guide

This guide explains how to manage detection models using the Touchline CLI's JSON protocol.

## Overview

The Touchline CLI communicates via stdin/stdout using JSON messages. Each request must include:
- `id`: Unique request identifier
- `command`: The command to execute (namespace.method format)
- `data`: Command-specific parameters

## Table of Contents

1. [Creating a New Model for Training](#creating-a-new-model-for-training)
2. [Importing an Existing Model](#importing-an-existing-model)
3. [Assigning Sponsors to a Model](#assigning-sponsors-to-a-model)
4. [Training a Model](#training-a-model)
5. [Setting Team Models](#setting-team-models)

---

## Creating a New Model for Training

### Step 1: Create Sponsors

Before creating a model, you need sponsors to train it with. Each sponsor needs logos.

```json
{
  "id": "create-sponsor-1",
  "command": "sponsors.create",
  "data": {
    "name": "Acme Corp",
    "base_value": 50.0,
    "audience_match": 1.0,
    "brand_power": 1.0
  }
}
```

**Response:**
```json
{
  "id": "create-sponsor-1",
  "success": true,
  "sponsor_id": 1
}
```

### Step 2: Add Logos to Sponsors

```json
{
  "id": "add-logo-1",
  "command": "sponsors.add_logo",
  "data": {
    "sponsor_id": 1,
    "logo_path": "/path/to/acme_logo.png"
  }
}
```

Or set multiple logos at once:

```json
{
  "id": "set-logos-1",
  "command": "sponsors.set_logos",
  "data": {
    "sponsor_id": 1,
    "logo_paths": [
      "/path/to/acme_logo_1.png",
      "/path/to/acme_logo_2.png",
      "/path/to/acme_logo_3.png"
    ]
  }
}
```

**Response:**
```json
{
  "id": "set-logos-1",
  "success": true
}
```

### Step 3: Create a New Model

Create a model that will be trained with your sponsors:

```json
{
  "id": "create-model-1",
  "command": "models.create",
  "data": {
    "name": "2024-25 Season Model",
    "model_path": "models/base.pt",
    "imported": false
  }
}
```

**Parameters:**
- `name`: Descriptive name for the model
- `model_path`: Path to base YOLO model to start training from
- `imported`: `false` for models you'll train, `true` for pre-trained imports

**Response:**
```json
{
  "id": "create-model-1",
  "success": true,
  "model_id": 1
}
```

### Step 4: Assign Sponsors to the Model

Assign the sponsors you want to train the model to detect:

```json
{
  "id": "set-model-sponsors-1",
  "command": "models.set_sponsors",
  "data": {
    "model_id": 1,
    "sponsor_ids": [1, 2, 3]
  }
}
```

**Response:**
```json
{
  "id": "set-model-sponsors-1",
  "success": true
}
```

You can also add sponsors one at a time:

```json
{
  "id": "add-sponsor-to-model-1",
  "command": "models.add_sponsor",
  "data": {
    "model_id": 1,
    "sponsor_id": 1
  }
}
```

---

## Importing an Existing Model

If you have a pre-trained YOLO model (.pt file), you can import it into Touchline.

### Step 1: Import the Model

```json
{
  "id": "import-model-1",
  "command": "models.create",
  "data": {
    "name": "Pre-trained Premier League Model",
    "model_path": "/path/to/trained_model.pt",
    "imported": true
  }
}
```

**Important:** Set `imported: true` to mark this as a pre-trained model.

**Response:**
```json
{
  "id": "import-model-1",
  "success": true,
  "model_id": 2
}
```

### Step 2: Assign Sponsors to the Imported Model

Tell Touchline which sponsors this model can detect:

```json
{
  "id": "set-imported-sponsors-1",
  "command": "models.set_sponsors",
  "data": {
    "model_id": 2,
    "sponsor_ids": [1, 2, 3, 4, 5]
  }
}
```

**Response:**
```json
{
  "id": "set-imported-sponsors-1",
  "success": true
}
```

**Note:** The sponsor IDs must correspond to sponsors already created in the database. If the model detects sponsors not yet in your database, create them first using `sponsors.create`.

---

## Assigning Sponsors to a Model

### Set All Sponsors at Once

Replace the entire sponsor list for a model:

```json
{
  "id": "update-sponsors-1",
  "command": "models.set_sponsors",
  "data": {
    "model_id": 1,
    "sponsor_ids": [1, 2, 3, 4]
  }
}
```

### Add a Single Sponsor

Add one sponsor to a model's existing list:

```json
{
  "id": "add-single-sponsor-1",
  "command": "models.add_sponsor",
  "data": {
    "model_id": 1,
    "sponsor_id": 5
  }
}
```

### Remove a Sponsor

Remove a sponsor from a model:

```json
{
  "id": "remove-sponsor-1",
  "command": "models.remove_sponsor",
  "data": {
    "model_id": 1,
    "sponsor_id": 3
  }
}
```

### Get Model's Current Sponsors

Check which sponsors are assigned to a model:

```json
{
  "id": "get-model-1",
  "command": "models.get",
  "data": {
    "model_id": 1
  }
}
```

**Response:**
```json
{
  "id": "get-model-1",
  "success": true,
  "model": {
    "id": 1,
    "name": "2024-25 Season Model",
    "model_path": "models/base.pt",
    "imported": false,
    "sponsors": [
      {"id": 1, "name": "Acme Corp"},
      {"id": 2, "name": "Tech Solutions"},
      {"id": 3, "name": "Energy Drinks Co"}
    ]
  }
}
```

---

## Training a Model

Training is handled through the training commands. The model must have sponsors assigned before training.

### Step 1: Configure Training Parameters (Optional)

Set custom training configuration:

```json
{
  "id": "set-training-config-1",
  "command": "configs.set_training_value",
  "data": {
    "section": "model",
    "key": "epochs",
    "value": 100
  }
}
```

Common training configuration options:
- `model.epochs`: Number of training epochs (default: 50)
- `model.batch`: Batch size (default: 16)
- `model.img_size`: Image size for training (default: 640)
- `dataset.num_transforms`: Number of augmentation transforms (default: 100)

### Step 2: Initiate Training

```json
{
  "id": "start-training-1",
  "command": "training.start",
  "data": {
    "model_id": 1,
    "epochs": 100,
    "batch": 16
  }
}
```

**Note:** Training runs asynchronously. The CLI will return immediately with a job ID.

**Response:**
```json
{
  "id": "start-training-1",
  "success": true,
  "job_id": "training-abc123",
  "message": "Training started"
}
```

### Step 3: Monitor Training Progress

Check training status:

```json
{
  "id": "check-training-1",
  "command": "training.status",
  "data": {
    "job_id": "training-abc123"
  }
}
```

**Response (in progress):**
```json
{
  "id": "check-training-1",
  "success": true,
  "status": "running",
  "progress": {
    "current_epoch": 25,
    "total_epochs": 100,
    "current_loss": 0.245
  }
}
```

**Response (completed):**
```json
{
  "id": "check-training-1",
  "success": true,
  "status": "completed",
  "result": {
    "model_path": "runs/detect/train/weights/best.pt",
    "metrics": {
      "map50": 0.89,
      "map50_95": 0.76
    }
  }
}
```

### Step 4: Record Training Results

After training completes, record the training run:

```json
{
  "id": "record-training-1",
  "command": "models.record_training",
  "data": {
    "model_id": 1,
    "epochs": 100,
    "start_time": "2024-01-15T10:00:00",
    "end_time": "2024-01-15T14:30:00",
    "map50": 0.89,
    "map50_95": 0.76,
    "success": true
  }
}
```

**Response:**
```json
{
  "id": "record-training-1",
  "success": true,
  "run_id": 1
}
```

### Step 5: Update Model Path

After training, update the model to point to the new trained weights:

```json
{
  "id": "update-model-path-1",
  "command": "models.update",
  "data": {
    "model_id": 1,
    "model_path": "runs/detect/train/weights/best.pt"
  }
}
```

---

## Setting Team Models

Once a model is trained or imported, assign it to a team for a specific season.

### Step 1: Get Current Season

```json
{
  "id": "get-current-season-1",
  "command": "seasons.get_current",
  "data": {}
}
```

**Response:**
```json
{
  "id": "get-current-season-1",
  "success": true,
  "season": {
    "id": 1,
    "name": "2024-25",
    "is_current": true
  }
}
```

### Step 2: Set Active Model for Team

Assign the model to a team for the current season:

```json
{
  "id": "set-team-model-1",
  "command": "models.set_team_model",
  "data": {
    "team_id": 1,
    "model_id": 1,
    "season_id": 1
  }
}
```

**Response:**
```json
{
  "id": "set-team-model-1",
  "success": true
}
```

### Alternative: Set via Teams Command

```json
{
  "id": "set-active-model-1",
  "command": "teams.set_active_model",
  "data": {
    "team_id": 1,
    "season_id": 1,
    "model_id": 1
  }
}
```

### Get Team's Active Model

Check which model is active for a team in a season:

```json
{
  "id": "get-team-model-1",
  "command": "models.get_team_model",
  "data": {
    "team_id": 1,
    "season_id": 1
  }
}
```

**Response:**
```json
{
  "id": "get-team-model-1",
  "success": true,
  "model": {
    "id": 1,
    "name": "2024-25 Season Model",
    "model_path": "runs/detect/train/weights/best.pt",
    "sponsors": [...]
  }
}
```

---

## Complete Workflow Examples

### Example 1: Create and Train a New Model

```json
// 1. Create sponsors (repeat for each sponsor)
{"id": "1", "command": "sponsors.create", "data": {"name": "Nike", "base_value": 50.0}}
{"id": "2", "command": "sponsors.set_logos", "data": {"sponsor_id": 1, "logo_paths": ["/logos/nike_1.png", "/logos/nike_2.png"]}}

// 2. Create model
{"id": "3", "command": "models.create", "data": {"name": "Season 2024", "model_path": "models/base.pt", "imported": false}}

// 3. Assign sponsors to model
{"id": "4", "command": "models.set_sponsors", "data": {"model_id": 1, "sponsor_ids": [1, 2, 3]}}

// 4. Start training
{"id": "5", "command": "training.start", "data": {"model_id": 1, "epochs": 100}}

// 5. After training, update model path
{"id": "6", "command": "models.update", "data": {"model_id": 1, "model_path": "runs/detect/train/weights/best.pt"}}

// 6. Assign to team
{"id": "7", "command": "models.set_team_model", "data": {"team_id": 1, "model_id": 1, "season_id": 1}}
```

### Example 2: Import Existing Model

```json
// 1. Ensure sponsors exist in database
{"id": "1", "command": "sponsors.get_all", "data": {}}

// 2. Import the model
{"id": "2", "command": "models.create", "data": {"name": "External Model", "model_path": "/models/pretrained.pt", "imported": true}}

// 3. Assign sponsors that the model can detect
{"id": "3", "command": "models.set_sponsors", "data": {"model_id": 2, "sponsor_ids": [1, 2, 3, 4, 5]}}

// 4. Set as team's active model
{"id": "4", "command": "models.set_team_model", "data": {"team_id": 1, "model_id": 2, "season_id": 1}}
```

---

## Error Handling

All commands return a response with `success: true` or `success: false`. On failure, an `error` field provides details:

```json
{
  "id": "request-123",
  "success": false,
  "error": "Model not found"
}
```

Common errors:
- `"Model not found"` - Invalid model_id
- `"Sponsor not found"` - Invalid sponsor_id
- `"Failed to create model"` - Database error or invalid path
- `"season_id is required"` - Missing required parameter

---

## Related Commands

### List All Models

```json
{"id": "1", "command": "models.get_all", "data": {}}
```

### Delete a Model

```json
{"id": "1", "command": "models.delete", "data": {"model_id": 1}}
```

### Get Model Details

```json
{"id": "1", "command": "models.get", "data": {"model_id": 1}}
```

### Update Model Name

```json
{"id": "1", "command": "models.update", "data": {"model_id": 1, "name": "New Name"}}
```

---

## Notes

- **User ID**: All service operations use `user_id=1` for CLI/system operations
- **Paths**: File paths should be absolute or relative to the CLI's working directory
- **Logos**: Logo files must exist at the specified paths before assignment
- **Training**: Training is resource-intensive and may take hours depending on dataset size and epochs
- **Base Models**: The default base model is `models/base.pt` (YOLO11n)
