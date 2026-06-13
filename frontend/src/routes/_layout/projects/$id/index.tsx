import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

import { DefaultService } from "@/client"
import type {
  Character,
  Scene,
  Setting,
  StoryBoard,
  StoryBoardCreate,
} from "@/client/types.gen"
import { EditStoryboardDialog } from "@/features/storyboard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { PageSkeleton } from "./components"
import {
  CreateStoryboardForm,
  type StoryboardForm,
} from "@/features/projects/components/CreateStoryboardForm"
import { ProjectHeader } from "@/features/projects/components/ProjectHeader"
import { StoryboardContent } from "@/features/projects/components/StoryboardContent"
import {
  getApiErrorMessage,
  showApiError,
  useStoryboard,
  useStoryboardAnalysis,
} from "./hooks"

export const Route = createFileRoute("/_layout/projects/$id/")({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id: projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const {
    storyboardId,
    storyboard,
    setStoryboardId,
    invalidateStoryboard,
    storyboardQuery,
  } = useStoryboard(projectId)

  const {
    characters,
    charactersLoading,
    settings,
    settingsLoading,
    scenes,
    scenesLoading,
    invalidateAll,
  } = useStoryboardAnalysis(storyboardId)

  const createStoryboardMutation = useMutation({
    mutationFn: (data: StoryboardForm) =>
      DefaultService.createStoryboard({
        requestBody: { ...data, project_id: projectId } as StoryBoardCreate,
      }),
    onSuccess: (response) => {
      if (response.id) {
        setStoryboardId(response.id)
      }
    },
    onError: (error) => {
      let message = getApiErrorMessage(error)
      if (message.includes("already exists")) {
        invalidateStoryboard()
        message += ". Loading existing storyboard..."
      }
      showApiError(error, message)
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: (generateImages: boolean = true) => {
      if (!storyboardId) {
        throw new Error("Storyboard not found")
      }
      return DefaultService.analyzeStory({
        storyboardId,
        generateImages,
        style: storyboard?.style || "cinematic",
      })
    },
    onSuccess: () => {
      invalidateAll(queryClient)
    },
    onError: (error) => showApiError(error, "Analysis failed"),
  })

  const handleAnalyze = () => {
    if (!storyboard?.content || storyboard.content.length < 50) {
      showApiError("Story content must be at least 50 characters")
      return
    }
    analyzeMutation.mutate(true)
  }

  return (
    <ProjectDetailView
      projectId={projectId}
      storyboard={storyboard ?? null}
      characters={characters}
      charactersLoading={charactersLoading}
      settings={settings}
      settingsLoading={settingsLoading}
      scenes={scenes}
      scenesLoading={scenesLoading}
      onCreateStoryboard={(data) => createStoryboardMutation.mutate(data)}
      onAnalyze={handleAnalyze}
      isAnalyzing={analyzeMutation.isPending}
      isCreating={createStoryboardMutation.isPending}
      storyboardLoading={storyboardQuery.isLoading}
    />
  )
}

interface ProjectDetailViewProps {
  projectId: string
  storyboard: StoryBoard | null
  characters: Character[] | null
  charactersLoading: boolean
  settings: Setting[] | null
  settingsLoading: boolean
  scenes: Scene[] | null
  scenesLoading: boolean
  onCreateStoryboard: (data: StoryboardForm) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  isCreating: boolean
  storyboardLoading: boolean
}

function ProjectDetailView({
  projectId,
  storyboard,
  characters,
  charactersLoading,
  settings,
  settingsLoading,
  scenes,
  scenesLoading,
  onCreateStoryboard,
  onAnalyze,
  isAnalyzing,
  isCreating,
  storyboardLoading,
}: ProjectDetailViewProps) {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => DefaultService.getProject({ projectId }),
  })

  const [editStoryboardDialogOpen, setEditStoryboardDialogOpen] =
    useState(false)

  if (projectLoading) return <PageSkeleton />

  // Type-based routing: redirect or show appropriate view
  if (project?.type && project.type !== "storyboard") {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <a href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </a>
          </Button>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-lg font-medium">Unsupported Project Type</h3>
            <p className="text-sm text-muted-foreground">
              The project type "{project.type}" is not yet supported. 
              Currently, only "storyboard" projects are available.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const hasAnalysis =
    (characters?.length ?? 0) > 0 ||
    (settings?.length ?? 0) > 0 ||
    (scenes?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <a href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </a>
        </Button>
        <ProjectHeader
          project={project ?? null}
          storyboard={storyboard}
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {!storyboard ? (
        <CreateStoryboardForm
          onSubmit={onCreateStoryboard}
          isLoading={isCreating || storyboardLoading}
        />
      ) : (
        <StoryboardContent
          storyboard={storyboard}
          hasAnalysis={hasAnalysis}
          characters={characters}
          charactersLoading={charactersLoading}
          settings={settings}
          settingsLoading={settingsLoading}
          scenes={scenes}
          scenesLoading={scenesLoading}
          onEditOpen={() => setEditStoryboardDialogOpen(true)}
        />
      )}

      {storyboard?.id && (
        <EditStoryboardDialog
          storyboardId={storyboard.id}
          open={editStoryboardDialogOpen}
          onOpenChange={setEditStoryboardDialogOpen}
          currentContent={storyboard.content || ""}
          currentStyle={storyboard.style}
        />
      )}
    </div>
  )
}
