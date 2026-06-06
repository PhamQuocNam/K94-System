import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Pencil, Wand2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
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

const storyboardSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  style: z.string().max(255).optional(),
})

type StoryboardForm = z.infer<typeof storyboardSchema>

export const Route = createFileRoute("/_layout/projects/$id")({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id: projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [storyboardId, setStoryboardId] = useState<string | null>(null)
  const [editStoryboardDialogOpen, setEditStoryboardDialogOpen] =
    useState(false)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => DefaultService.getProject({ projectId }),
  })

  const { data: storyboard } = useQuery({
    queryKey: ["storyboard", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboard({ storyboardId: storyboardId! }),
    enabled: !!storyboardId,
  })

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ["characters", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardCharacters({ storyboardId: storyboardId! }),
    enabled: !!storyboardId && !!storyboard,
  })

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardSettings({ storyboardId: storyboardId! }),
    enabled: !!storyboardId && !!storyboard,
  })

  const { data: scenes, isLoading: scenesLoading } = useQuery({
    queryKey: ["scenes", storyboardId],
    queryFn: () =>
      DefaultService.getStoryboardScenes({ storyboardId: storyboardId! }),
    enabled: !!storyboardId && !!storyboard,
  })

  // Load storyboard ID from sessionStorage on mount
  useEffect(() => {
    const storedId = sessionStorage.getItem(`storyboard_${projectId}`)
    if (storedId) {
      setStoryboardId(storedId)
    }
  }, [projectId])

  const createStoryboardMutation = useMutation({
    mutationFn: (data: StoryboardForm) =>
      DefaultService.createStoryboard({
        requestBody: {
          ...data,
          project_id: projectId,
        },
      }),
    onSuccess: (response) => {
      toast.success("Storyboard created!")
      if (response.id) {
        setStoryboardId(response.id)
        sessionStorage.setItem(`storyboard_${projectId}`, response.id)
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create storyboard"
      toast.error(message)
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: () =>
      DefaultService.analyzeStory({ storyboardId: storyboardId! }),
    onSuccess: () => {
      toast.success("Story analysis completed!")
      queryClient.invalidateQueries({ queryKey: ["characters", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["settings", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["scenes", storyboardId] })
      setIsAnalyzing(false)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Analysis failed"
      toast.error(message)
      setIsAnalyzing(false)
    },
  })

  const handleAnalyze = () => {
    if (!storyboard?.content || storyboard.content.length < 50) {
      toast.error("Story content must be at least 50 characters")
      return
    }
    setIsAnalyzing(true)
    analyzeMutation.mutate()
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  const hasAnalysis =
    (characters?.length ?? 0) > 0 ||
    (settings?.length ?? 0) > 0 ||
    (scenes?.length ?? 0) > 0

  return (
    <div className="space-y-6">
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
          <LoadingButton
            onClick={handleAnalyze}
            loading={isAnalyzing || analyzeMutation.isPending}
            disabled={!storyboard.content || storyboard.content.length < 50}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Analyze Story
          </LoadingButton>
        )}
      </div>

      {!storyboard ? (
        <CreateStoryboardForm
          projectId={projectId}
          onSubmit={(data) => createStoryboardMutation.mutate(data)}
          isLoading={createStoryboardMutation.isPending}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
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
                    onClick={() => setEditStoryboardDialogOpen(true)}
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
          </div>

          <div className="lg:col-span-2">
            {!hasAnalysis ? (
              <Card className="p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="text-muted-foreground">
                    <Wand2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No analysis yet</h3>
                    <p className="text-sm mt-2">
                      Click Analyze Story to extract characters, settings, and
                      scenes
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Tabs defaultValue="characters" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="characters">
                    Characters ({characters?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    Settings ({settings?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="scenes">
                    Scenes ({scenes?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="characters" className="space-y-4 mt-4">
                  {charactersLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <CharacterCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : characters && characters.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {characters.map((character) => (
                        <CharacterCard
                          key={character.id}
                          character={character}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                      No characters found
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  {settingsLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <SettingCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : settings && settings.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {settings.map((setting) => (
                        <SettingCard key={setting.id} setting={setting} />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                      No settings found
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="scenes" className="space-y-4 mt-4">
                  {scenesLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <SceneCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : scenes && scenes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {scenes.map((scene) => (
                        <SceneCard key={scene.id} scene={scene} />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                      No scenes found
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {storyboard && storyboard.id && (
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

interface CreateStoryboardFormProps {
  projectId: string
  onSubmit: (data: StoryboardForm) => void
  isLoading: boolean
}

function CreateStoryboardForm({
  projectId: _projectId,
  onSubmit,
  isLoading,
}: CreateStoryboardFormProps) {
  const form = useForm<StoryboardForm>({
    resolver: zodResolver(storyboardSchema),
    defaultValues: {
      title: "",
      content: "",
      style: "cinematic",
    },
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Story" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
