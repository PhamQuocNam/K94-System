import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { ChevronLeft, Plus, Settings, Wand2 } from "lucide-react"
import { useState } from "react"
import type { Character, Scene, Setting, StoryBoard } from "@/client/types.gen"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStoryboardPhase } from "@/features/storyboard/hooks/useStoryboardPhase"
import { CreateSceneDialog } from "./CreateSceneDialog"
import { SceneGenerationPanel } from "./SceneGenerationPanel"
import { SceneGrid } from "./SceneGrid"

export function VisualGenerationPage() {
  const { id: projectId } = useParams({ strict: false })
  const [createSceneOpen, setCreateSceneOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { data: storyboard } = useQuery<StoryBoard>({
    queryKey: ["storyboard-by-project", projectId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/storyboards/by-project/${projectId}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch storyboard")
      }

      return response.json()
    },
    enabled: !!projectId,
  })

  const { data: scenes = [] } = useQuery<Scene[]>({
    queryKey: ["storyboard-scenes", storyboard?.id],
    queryFn: async () => {
      if (!storyboard?.id) return []

      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${storyboard.id}/scenes`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch scenes")
      }

      return response.json()
    },
    enabled: !!storyboard?.id,
  })

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["storyboard-characters", storyboard?.id],
    queryFn: async () => {
      if (!storyboard?.id) return []

      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/storyboards/${storyboard.id}/characters`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch characters")
      }

      return response.json()
    },
    enabled: !!storyboard?.id,
  })

  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["storyboard-settings", storyboard?.id],
    queryFn: async () => {
      if (!storyboard?.id) return []

      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/storyboards/${storyboard.id}/settings`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      return response.json()
    },
    enabled: !!storyboard?.id,
  })

  const phaseStatus = useStoryboardPhase(
    storyboard,
    characters,
    settings,
    scenes,
  )

  const handleBackToPhase1 = () => {
    window.location.href = `/projects/${projectId}`
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={handleBackToPhase1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Story
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visual Generation</h1>
            <p className="text-muted-foreground">
              Generate images and videos for your storyboard scenes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={() => setCreateSceneOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Scene
            </Button>
          </div>
        </div>
      </div>

      {phaseStatus.currentPhase !== "phase2" && (
        <div className="rounded-lg border-amber-500 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Complete Phase 1 First
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You need to analyze your story and create scenes before
                generating visuals.
              </p>
            </div>
            <Button onClick={handleBackToPhase1} size="sm">
              Go to Phase 1
            </Button>
          </div>
        </div>
      )}

      {showAdvanced && (
        <SceneGenerationPanel
          storyboardId={storyboard?.id || ""}
          totalScenes={scenes.length}
        />
      )}

      <Tabs defaultValue="scenes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenes">Scenes</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="scenes" className="space-y-4">
          <SceneGrid
            scenes={scenes}
            storyboardId={storyboard?.id || ""}
            storyboardStyle={storyboard?.style || "cinematic"}
          />
        </TabsContent>

        <TabsContent value="generation">
          <SceneGenerationPanel
            storyboardId={storyboard?.id || ""}
            totalScenes={scenes.length}
          />
        </TabsContent>
      </Tabs>

      <CreateSceneDialog
        storyboardId={storyboard?.id || ""}
        open={createSceneOpen}
        onOpenChange={setCreateSceneOpen}
      />
    </div>
  )
}
