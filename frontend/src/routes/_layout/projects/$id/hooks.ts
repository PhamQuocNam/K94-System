import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DefaultService } from "@/client"
import { toast } from "sonner"

const SESSION_STORAGE_KEY = (projectId: string) => `storyboard_${projectId}`

export function useStoryboard(projectId: string) {
  const queryClient = useQueryClient()
  const [storyboardId, setStoryboardId] = useState<string | null>(null)

  // Load storyboard ID from sessionStorage on mount
  useEffect(() => {
    const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY(projectId))
    if (storedId) {
      setStoryboardId(storedId)
    }
  }, [projectId])

  const storyboard = useQuery({
    queryKey: ["storyboard", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboard({ storyboardId: storyboardId! }),
    enabled: !!storyboardId,
  })

  const setStoryboardIdWithStorage = (id: string) => {
    setStoryboardId(id)
    sessionStorage.setItem(SESSION_STORAGE_KEY(projectId), id)
  }

  return {
    storyboardId,
    storyboard: storyboard.data,
    setStoryboardId: setStoryboardIdWithStorage,
    invalidateStoryboard: () =>
      queryClient.invalidateQueries({ queryKey: ["storyboard", storyboardId] }),
  }
}

export function useStoryboardAnalysis(storyboardId: string | null) {
  const characters = useQuery({
    queryKey: ["characters", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardCharacters({ storyboardId: storyboardId! }),
    enabled: !!storyboardId,
  })

  const settings = useQuery({
    queryKey: ["settings", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardSettings({ storyboardId: storyboardId! }),
    enabled: !!storyboardId,
  })

  const scenes = useQuery({
    queryKey: ["scenes", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardScenes({ storyboardId: storyboardId! }),
    enabled: !!storyboardId,
  })

  return {
    characters: characters.data,
    charactersLoading: characters.isLoading,
    settings: settings.data,
    settingsLoading: settings.isLoading,
    scenes: scenes.data,
    scenesLoading: scenes.isLoading,
    invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
      queryClient.invalidateQueries({ queryKey: ["characters", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["settings", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["scenes", storyboardId] })
    },
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorData = (error as any).cause?.response?.data
    if (errorData?.detail) {
      return errorData.detail
    }
    return error.message
  }
  return "An error occurred"
}

export function showApiError(error: unknown, context?: string) {
  const message = getApiErrorMessage(error)
  toast.error(context ? `${context}: ${message}` : message)
}
