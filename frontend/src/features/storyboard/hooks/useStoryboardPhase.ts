import { useMemo } from "react"
import type { Character, Scene, Setting, StoryBoard } from "@/client/types.gen"

export type StoryboardPhase = "setup" | "phase1" | "phase2" | "complete"

interface PhaseStatus {
  canProceedToPhase1: boolean
  canProceedToPhase2: boolean
  currentPhase: StoryboardPhase
  phase1Progress: {
    hasStory: boolean
    hasCharacters: boolean
    hasSettings: boolean
    hasScenes: boolean
  }
  phase2Progress: {
    imagesGenerated: number
    videosGenerated: number
    totalScenes: number
  }
}

export function useStoryboardPhase(
  storyboard: StoryBoard | null | undefined,
  characters: Character[],
  settings: Setting[],
  scenes: Scene[],
): PhaseStatus {
  return useMemo(() => {
    const hasStory = !!storyboard?.content && storyboard.content.length > 0
    const hasCharacters = characters.length > 0
    const hasSettings = settings.length > 0
    const hasScenes = scenes.length > 0

    const canProceedToPhase1 = hasStory
    const canProceedToPhase2 = hasScenes && hasCharacters

    const imagesGenerated = scenes.filter((s) => s.reference_image_url).length
    const videosGenerated = scenes.filter((s) => s.reference_video_url).length

    let currentPhase: StoryboardPhase = "setup"
    if (!hasStory) {
      currentPhase = "setup"
    } else if (hasScenes && (imagesGenerated > 0 || videosGenerated > 0)) {
      currentPhase = "phase2"
    } else if (hasStory && (hasCharacters || hasSettings || hasScenes)) {
      currentPhase = "phase1"
    }

    return {
      canProceedToPhase1,
      canProceedToPhase2,
      currentPhase,
      phase1Progress: {
        hasStory,
        hasCharacters,
        hasSettings,
        hasScenes,
      },
      phase2Progress: {
        imagesGenerated,
        videosGenerated,
        totalScenes: scenes.length,
      },
    }
  }, [storyboard, characters, settings, scenes])
}
