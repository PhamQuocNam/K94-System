# ImageGenerator and Scene Generation Refactoring

## Issues Fixed

### 1. ImageGenerator Class (backend/app/image_generator/image_gen.py)

**Critical Bugs Fixed:**
- ✅ Fixed typo: `self.TYPE_MODEL` → `self.model_type`
- ✅ Fixed invalid syntax: `references = list = []` → `reference_paths: list[str] | None = None`
- ✅ Removed hardcoded `MODEL_ID` and `MODEL_TYPE` class variables
- ✅ Made model type configurable via constructor parameter
- ✅ Made model ID configurable via environment variable `REPLICATE_MODEL_ID`

**Improvements:**
- ✅ Added proper type hints for all parameters
- ✅ Unified input parameter building logic (no code duplication)
- ✅ Added error handling for individual reference file reads
- ✅ Added debug logging for reference image processing
- ✅ Renamed `references` to `reference_paths` for clarity

### 2. Storage Class (backend/app/core/storage.py)

**New Method Added:**
- ✅ `download_to_temp()` - Downloads URL references to temporary local files
  - Handles both remote URLs and local relative paths
  - Returns absolute path to downloaded file
  - Returns None on failure (graceful degradation)

### 3. Scene Generation Service (backend/app/services/scene_generation.py)

**Logic Fixed:**
- ✅ Removed redundant list comprehension: `[char for char in scene.characters]`
- ✅ Fixed reference handling: URLs are now downloaded to local files before passing to ImageGenerator
- ✅ Added proper error handling for reference downloads
- ✅ Consolidated reference collection logic
- ✅ Cleaned up variable names for clarity

## Changes Summary

### ImageGenerator.__init__()
```python
# Before:
def __init__(self, api_token: str | None = None):
    self.client = replicate.Client(api_token=self.api_token)

# After:
def __init__(self, api_token: str | None = None, model_type: str = "text2image"):
    self.client = replicate.Client(api_token=self.api_token)
    self.model_type = model_type
    self.model_id = os.getenv("REPLICATE_MODEL_ID", "prunaai/p-image")
```

### ImageGenerator._generate_image()
```python
# Before:
async def _generate_image(self, prompt: str, aspect_ratio: str = "1:1", references = list = []):
    if self.TYPE_MODEL == 'image2image':  # Would raise AttributeError
        # Process references as file paths (but receives URLs)
        
# After:
async def _generate_image(self, prompt: str, aspect_ratio: str = "1:1", reference_paths: list[str] | None = None):
    input_params = {"prompt": prompt, "aspect_ratio": aspect_ratio}
    if self.model_type == "image2image" and reference_paths:
        # Process local file paths with error handling
```

### Scene Generation
```python
# Before:
character_references = [char.reference_image_url for char in scene_characters if char.reference_image_url]
references = character_references.copy()
if scene_setting and scene_setting.reference_image_url:
    references.append(scene_setting.reference_image_url)
# Pass URLs directly (incompatible with file reading)

# After:
reference_urls = [char.reference_image_url for char in scene_characters if char.reference_image_url]
if scene_setting and scene_setting.reference_image_url:
    reference_urls.append(scene_setting.reference_image_url)

reference_paths = []
for url in reference_urls:
    local_path = await storage.download_to_temp(url)
    if local_path:
        reference_paths.append(local_path)
# Pass local file paths
```

## Configuration

New environment variable:
- `REPLICATE_MODEL_ID` - Override the default model (default: "prunaai/p-image")

## Backward Compatibility

- All existing code continues to work with default parameters
- `model_type` defaults to "text2image" (existing behavior)
- `reference_paths` defaults to None (graceful handling)

## Testing Recommendations

1. Test text2image mode (default behavior)
2. Test image2image mode with local reference files
3. Test reference download failure handling
4. Test with mix of local and remote reference URLs
5. Verify temp file cleanup
