import { ArrowRight, Wand2 } from "lucide-react"

import type { Character, Scene, Setting, StoryBoard } from "@/client/types.gen"
import { Button } from "@/components/ui/button"
import { useStoryboardPhase } from "@/features/storyboard/hooks/useStoryboardPhase"
import { EmptyState } from "@/routes/_layout/projects/$id/components"
import { AnalysisTabs } from "./AnalysisTabs"
import { StoryboardCard } from "./StoryboardCard"

interface StoryboardContentProps {
  storyboard: StoryBoard | null
  hasAnalysis: boolean
  characters: Character[] | null
  charactersLoading: boolean
  settings: Setting[] | null
  settingsLoading: boolean
  scenes: Scene[] | null
  scenesLoading: boolean
  onEditOpen: () => void
}

export function StoryboardContent({
  storyboard,
  hasAnalysis,
  characters,
  charactersLoading,
  settings,
  settingsLoading,
  scenes,
  scenesLoading,
  onEditOpen,
}: StoryboardContentProps) {
  const phaseStatus = useStoryboardPhase(
    storyboard,
    characters || [],
    settings || [],
    scenes || [],
  )

  const handleProceedToPhase2 = () => {
    window.location.href = `/projects/${storyboard?.project_id}/visual-generation`
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StoryboardCard storyboard={storyboard} onEditOpen={onEditOpen} />
        </div>

        <div className="lg:col-span-2">
          {!hasAnalysis ? (
            <EmptyState
              icon={<Wand2 className="mx-auto h-12 w-12 mb-4 opacity-50" />}
              title="No analysis yet"
              description="Click Analyze Story to extract characters, settings, and scenes"
            />
          ) : (
            <AnalysisTabs
              storyboard={storyboard}
              characters={characters}
              charactersLoading={charactersLoading}
              settings={settings}
              settingsLoading={settingsLoading}
              scenes={scenes}
              scenesLoading={scenesLoading}
            />
          )}
        </div>
      </div>

      {hasAnalysis && phaseStatus.canProceedToPhase2 && (
        <div className="flex items-center justify-end">
          <Button
            onClick={handleProceedToPhase2}
            size="lg"
            className="shadow-lg"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
