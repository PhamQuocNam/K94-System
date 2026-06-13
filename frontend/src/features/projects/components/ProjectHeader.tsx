import { Wand2 } from "lucide-react"

import type { ProjectPublic, StoryBoard } from "@/client/types.gen"
import { LoadingButton } from "@/components/shared/loading-button"

interface ProjectHeaderProps {
  project: ProjectPublic | null
  storyboard: StoryBoard | null
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function ProjectHeader({
  project,
  storyboard,
  onAnalyze,
  isAnalyzing,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project?.title || "Untitled Project"}
        </h1>
        <p className="text-muted-foreground">{project?.description}</p>
      </div>
      {storyboard && (
        <LoadingButton onClick={onAnalyze} loading={isAnalyzing}>
          <Wand2 className="mr-2 h-4 w-4" />
          Analyze Story
        </LoadingButton>
      )}
    </div>
  )
}
