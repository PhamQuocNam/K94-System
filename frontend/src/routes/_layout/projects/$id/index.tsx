import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Pencil, Wand2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DefaultService } from "@/client"
import {
  CharacterCard,
  CharacterCardSkeleton,
  EditStoryboardDialog,
  SceneCard,
  SceneCardSkeleton,
  SettingCard,
  SettingCardSkeleton,
} from "@/components/Storyboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  EmptyState,
  EntityList,
  PageSkeleton,
  SKELETON_COUNTS,
} from "./components"
import {
  getApiErrorMessage,
  showApiError,
  useStoryboard,
  useStoryboardAnalysis,
} from "./hooks"

const storyboardSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
  style: z.string().max(255).optional(),
})

type StoryboardForm = z.infer<typeof storyboardSchema>

export const Route = createFileRoute("/_layout/projects/$id/")({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id: projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const { storyboardId, storyboard, setStoryboardId } = useStoryboard(projectId)

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
        requestBody: { ...data, project_id: projectId },
      }),
    onSuccess: (response) => {
      if (response.id) {
        setStoryboardId(response.id)
      }
    },
    onError: (error) => {
      let message = getApiErrorMessage(error)
      if (message.includes("already exists")) {
        message += ". Please refresh the page to view the existing storyboard."
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
      storyboard={storyboard}
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
    />
  )
}

interface ProjectDetailViewProps {
  projectId: string
  storyboard: any
  characters: any[] | null
  charactersLoading: boolean
  settings: any[] | null
  settingsLoading: boolean
  scenes: any[] | null
  scenesLoading: boolean
  onCreateStoryboard: (data: StoryboardForm) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  isCreating: boolean
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
}: ProjectDetailViewProps) {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => DefaultService.getProject({ projectId }),
  })

  const [editStoryboardDialogOpen, setEditStoryboardDialogOpen] =
    useState(false)

  if (projectLoading) return <PageSkeleton />

  const hasAnalysis =
    (characters?.length ?? 0) > 0 ||
    (settings?.length ?? 0) > 0 ||
    (scenes?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        storyboard={storyboard}
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {!storyboard ? (
        <CreateStoryboardForm
          onSubmit={onCreateStoryboard}
          isLoading={isCreating}
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

interface ProjectHeaderProps {
  project: any
  storyboard: any
  onAnalyze: () => void
  isAnalyzing: boolean
}

function ProjectHeader({
  project,
  storyboard,
  onAnalyze,
  isAnalyzing,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <a href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </a>
        </Button>
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

interface StoryboardContentProps {
  storyboard: any
  hasAnalysis: boolean
  characters: any[] | null
  charactersLoading: boolean
  settings: any[] | null
  settingsLoading: boolean
  scenes: any[] | null
  scenesLoading: boolean
  onEditOpen: () => void
}

function StoryboardContent({
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

interface StoryboardCardProps {
  storyboard: any
  onEditOpen: () => void
}

function StoryboardCard({ storyboard, onEditOpen }: StoryboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Storyboard
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEditOpen}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {storyboard.style && (
          <CardDescription>
            <Badge variant="secondary">{storyboard.style}</Badge>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-[20]">
          {storyboard.content}
        </p>
      </CardContent>
    </Card>
  )
}

interface AnalysisTabsProps {
  characters: any[] | null
  charactersLoading: boolean
  settings: any[] | null
  settingsLoading: boolean
  scenes: any[] | null
  scenesLoading: boolean
}

function AnalysisTabs({
  characters,
  charactersLoading,
  settings,
  settingsLoading,
  scenes,
  scenesLoading,
}: AnalysisTabsProps) {
  const characterSkeletons = Array.from(
    { length: SKELETON_COUNTS.cards },
    (_, i) => <CharacterCardSkeleton key={i} />,
  )

  const settingSkeletons = Array.from(
    { length: SKELETON_COUNTS.cards },
    (_, i) => <SettingCardSkeleton key={i} />,
  )

  const sceneSkeletons = Array.from(
    { length: SKELETON_COUNTS.scenes },
    (_, i) => <SceneCardSkeleton key={i} />,
  )

  return (
    <Tabs defaultValue="characters" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="characters">
          Characters ({characters?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="settings">
          Settings ({settings?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="scenes">Scenes ({scenes?.length || 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="characters" className="space-y-4 mt-4">
        <EntityList
          items={characters || []}
          renderCard={(character) => (
            <CharacterCard key={character.id} character={character} />
          )}
          skeleton={characterSkeletons}
          isLoading={charactersLoading}
          empty={!characters?.length}
          emptyMessage="No characters found"
          gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4 mt-4">
        <EntityList
          items={settings || []}
          renderCard={(setting) => (
            <SettingCard key={setting.id} setting={setting} />
          )}
          skeleton={settingSkeletons}
          isLoading={settingsLoading}
          empty={!settings?.length}
          emptyMessage="No settings found"
          gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        />
      </TabsContent>

      <TabsContent value="scenes" className="space-y-4 mt-4">
        <EntityList
          items={scenes || []}
          renderCard={(scene) => <SceneCard key={scene.id} scene={scene} />}
          skeleton={sceneSkeletons}
          isLoading={scenesLoading}
          empty={!scenes?.length}
          emptyMessage="No scenes found"
          gridClassName="grid gap-4 md:grid-cols-2"
        />
      </TabsContent>
    </Tabs>
  )
}

interface CreateStoryboardFormProps {
  onSubmit: (data: StoryboardForm) => void
  isLoading: boolean
}

function CreateStoryboardForm({
  onSubmit,
  isLoading,
}: CreateStoryboardFormProps) {
  const form = useForm<StoryboardForm>({
    resolver: zodResolver(storyboardSchema),
    defaultValues: { content: "", style: "cinematic" },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Storyboard</CardTitle>
        <CardDescription>
          Enter your story content to begin the analysis process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Style (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Pixar, Anime, Cinematic, Realistic..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Once upon a time, in a land far away..."
                      rows={12}
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <LoadingButton type="submit" loading={isLoading}>
                Create & Continue
              </LoadingButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
