import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

interface SceneGenerationParams {
  storyboardId: string
  startScene?: number
  endScene?: number | null
  duration?: number
}

interface SceneGenerationResult {
  generated: number
  skipped: number
  errors: string[]
}

interface SingleSceneGenerationResult {
  image_url?: string | null
  video_url?: string | null
  error?: string
}

export function useSceneGeneration() {
  const queryClient = useQueryClient()
  const [currentProgress, setCurrentProgress] = useState<{
    total: number
    completed: number
    currentScene: number | null
  } | null>(null)

  const generateSceneImagesMutation = useMutation({
    mutationFn: async (
      params: SceneGenerationParams,
    ): Promise<SceneGenerationResult> => {
      const token = localStorage.getItem("access_token")
      const queryParams = new URLSearchParams()
      if (params.startScene)
        queryParams.append("start_scene", params.startScene.toString())
      if (params.endScene)
        queryParams.append("end_scene", params.endScene.toString())

      const response = await fetch(
        `/api/v1/scenes/${params.storyboardId}/generate-scene-images?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to generate scene images")
      }

      return response.json()
    },
    onMutate: () => {
      setCurrentProgress({
        total: 0,
        completed: 0,
        currentScene: 1,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes"],
      })
      setCurrentProgress((prev) =>
        prev ? { ...prev, completed: data.generated + data.skipped } : null,
      )
    },
    onError: () => {
      setCurrentProgress(null)
    },
  })

  const generateSceneVideosMutation = useMutation({
    mutationFn: async (
      params: SceneGenerationParams,
    ): Promise<SceneGenerationResult> => {
      const token = localStorage.getItem("access_token")
      const queryParams = new URLSearchParams()
      if (params.startScene)
        queryParams.append("start_scene", params.startScene.toString())
      if (params.endScene)
        queryParams.append("end_scene", params.endScene.toString())
      if (params.duration)
        queryParams.append("duration", params.duration.toString())

      const response = await fetch(
        `/api/v1/scenes/${params.storyboardId}/generate-scene-videos?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to generate scene videos")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes"],
      })
    },
  })

  const generateSingleSceneImageMutation = useMutation({
    mutationFn: async ({
      sceneId,
      style,
    }: {
      sceneId: string
      style?: string | null
    }): Promise<SingleSceneGenerationResult> => {
      const token = localStorage.getItem("access_token")
      const queryParams = new URLSearchParams()
      if (style) queryParams.append("style", style)

      const response = await fetch(
        `/api/v1/scenes/${sceneId}/generate-image?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to generate scene image")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes"],
      })
    },
  })

  const generateSingleSceneVideoMutation = useMutation({
    mutationFn: async ({
      sceneId,
      duration,
    }: {
      sceneId: string
      duration?: number
    }): Promise<SingleSceneGenerationResult> => {
      const token = localStorage.getItem("access_token")
      const queryParams = new URLSearchParams()
      if (duration) queryParams.append("duration", duration.toString())

      const response = await fetch(
        `/api/v1/scenes/${sceneId}/generate-video?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to generate scene video")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes"],
      })
    },
  })

  return {
    currentProgress,
    generateSceneImages: generateSceneImagesMutation.mutate,
    generateSceneVideos: generateSceneVideosMutation.mutate,
    generateSingleSceneImage: generateSingleSceneImageMutation.mutate,
    generateSingleSceneVideo: generateSingleSceneVideoMutation.mutate,
    isGeneratingImages: generateSceneImagesMutation.isPending,
    isGeneratingVideos: generateSceneVideosMutation.isPending,
    isGeneratingSingleImage: generateSingleSceneImageMutation.isPending,
    isGeneratingSingleVideo: generateSingleSceneVideoMutation.isPending,
    imageGenerationError: generateSceneImagesMutation.error,
    videoGenerationError: generateSceneVideosMutation.error,
    resetProgress: () => setCurrentProgress(null),
  }
}
