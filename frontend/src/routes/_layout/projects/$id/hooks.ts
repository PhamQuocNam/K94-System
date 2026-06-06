import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DefaultService } from "@/client"

const SESSION_STORAGE_KEY = (projectId: string) => `storyboard_${projectId}`

export function useStoryboard(projectId: string) {
  const queryClient = useQueryClient()
  const [storyboardId, setStoryboardId] = useState<string | null>(null)

  // Query to get storyboard by project ID from backend
  const storyboardQuery = useQuery({
    queryKey: ["storyboardByProject", projectId],
    queryFn: () => DefaultService.getStoryboardByProjectId({ projectId }),
    retry: false,
  })

  const storyboard = storyboardQuery.data

  // Update storyboardId when we get the storyboard from backend
  useEffect(() => {
    if (storyboard?.id) {
      setStoryboardId(storyboard.id)
      sessionStorage.setItem(SESSION_STORAGE_KEY(projectId), storyboard.id)
    }
  }, [storyboard, projectId])

  const setStoryboardIdWithStorage = (id: string) => {
    setStoryboardId(id)
    sessionStorage.setItem(SESSION_STORAGE_KEY(projectId), id)
  }

  return {
    storyboardId,
    storyboard,
    setStoryboardId: setStoryboardIdWithStorage,
    invalidateStoryboard: () =>
      queryClient.invalidateQueries({
        queryKey: ["storyboardByProject", projectId],
      }),
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
    characters: characters.data ?? null,
    charactersLoading: characters.isLoading,
    settings: settings.data ?? null,
    settingsLoading: settings.isLoading,
    scenes: scenes.data ?? null,
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
