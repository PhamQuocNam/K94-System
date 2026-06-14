import { Film, Loader2, Settings, Wand2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSceneGeneration } from "@/features/storyboard/hooks/useSceneGeneration"
import { useToast } from "@/hooks/useToast"

interface SceneGenerationPanelProps {
  storyboardId: string
  totalScenes: number
  storyboardStyle?: string
}

export function SceneGenerationPanel({
  storyboardId,
  totalScenes,
}: SceneGenerationPanelProps) {
  const { toast } = useToast()
  const {
    generateSceneImages,
    generateSceneVideos,
    isGeneratingImages,
    isGeneratingVideos,
    imageGenerationError,
    videoGenerationError,
    resetProgress,
  } = useSceneGeneration()

  const [startScene, setStartScene] = useState<number>(1)
  const [endScene, setEndScene] = useState<number | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(3.0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleGenerateImages = () => {
    if (totalScenes === 0) {
      toast({
        variant: "destructive",
        title: "No scenes found",
        description: "Please analyze the story first to create scenes.",
      })
      return
    }

    generateSceneImages({
      storyboardId,
      startScene,
      endScene,
    })

    toast({
      title: "Scene image generation started",
      description: `Generating images for scenes ${startScene}${endScene ? ` to ${endScene}` : " to end"}`,
    })
  }

  const handleGenerateVideos = () => {
    if (totalScenes === 0) {
      toast({
        variant: "destructive",
        title: "No scenes found",
        description: "Please generate scene images first.",
      })
      return
    }

    generateSceneVideos({
      storyboardId,
      startScene,
      endScene,
      duration: videoDuration,
    })

    toast({
      title: "Scene video generation started",
      description: `Generating videos for scenes ${startScene}${endScene ? ` to ${endScene}` : " to end"}`,
    })
  }

  const isProcessing = isGeneratingImages || isGeneratingVideos
  const hasErrors = imageGenerationError || videoGenerationError

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scene Generation</h3>
          <p className="text-sm text-muted-foreground">
            Generate images and videos for storyboard scenes
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Advanced
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid gap-4 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-scene">Start Scene</Label>
              <Input
                id="start-scene"
                type="number"
                min={1}
                max={totalScenes}
                value={startScene}
                onChange={(e) => setStartScene(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-scene">End Scene (Optional)</Label>
              <Input
                id="end-scene"
                type="number"
                min={1}
                max={totalScenes}
                placeholder="All scenes"
                value={endScene || ""}
                onChange={(e) =>
                  setEndScene(e.target.value ? parseInt(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-duration">Video Duration (seconds)</Label>
              <Input
                id="video-duration"
                type="number"
                step={0.5}
                min={1}
                max={30}
                value={videoDuration}
                onChange={(e) =>
                  setVideoDuration(parseFloat(e.target.value) || 3)
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateImages}
            disabled={isProcessing || totalScenes === 0}
            className="flex-1"
          >
            {isGeneratingImages ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Images
          </Button>
          <Button
            onClick={handleGenerateVideos}
            disabled={isProcessing || totalScenes === 0}
            variant="outline"
            className="flex-1"
          >
            {isGeneratingVideos ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Film className="mr-2 h-4 w-4" />
            )}
            Generate Videos
          </Button>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">
            {imageGenerationError?.message || videoGenerationError?.message}
          </p>
        </div>
      )}

      {isProcessing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetProgress}
          className="w-full"
        >
          Reset Progress
        </Button>
      )}
    </div>
  )
}
