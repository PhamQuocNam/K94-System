"""Test script to verify p-video API compatibility."""

import os
import asyncio


async def test_video_api():
    """Test the video generation API."""
    from app.video_generator import VideoGenerator
    
    # Check if API token is set
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        print("[FAIL] REPLICATE_API_TOKEN not set")
        return False
    
    print("[OK] REPLICATE_API_TOKEN is set")
    
    # Initialize video generator
    try:
        generator = VideoGenerator()
        print("[OK] VideoGenerator initialized")
    except Exception as e:
        print(f"[FAIL] Failed to initialize VideoGenerator: {e}")
        return False
    
    # Verify model ID
    expected_model = "prunaai/p-video"
    if generator.model_id == expected_model:
        print(f"[OK] Model ID correct: {expected_model}")
    else:
        print(f"[FAIL] Model ID mismatch: {generator.model_id} != {expected_model}")
        return False
    
    # Check client
    if generator.client:
        print("[OK] Replicate client initialized")
    else:
        print("[FAIL] Replicate client not initialized")
        return False
    
    print("\n[SUCCESS] All API compatibility checks passed!")
    print("\nNote: To test actual video generation, you need:")
    print("1. A valid REPLICATE_API_TOKEN")
    print("2. An existing image file")
    print("3. Run: await generator.generate_video_from_image(image_path, prompt)")
    
    return True


if __name__ == "__main__":
    asyncio.run(test_video_api())
