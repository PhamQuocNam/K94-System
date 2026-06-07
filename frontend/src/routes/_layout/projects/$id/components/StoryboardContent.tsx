import { Wand2 } from "lucide-react"

import type { Character, Scene, Setting, StoryBoard } from "@/client/types.gen"
import { EmptyState } from "../components"
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
  return (
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
  )
}
