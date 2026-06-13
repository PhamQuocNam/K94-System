import {
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react"
import React, { useState } from "react"
import type { Scene } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useImageUpload } from "../hooks/useImageUpload"
import { useVideoUpload } from "../hooks/useVideoUpload"
import { CreateSceneDialog } from "./CreateSceneDialog"
import { EditSceneDialog } from "./EditSceneDialog"

interface SceneGridProps {
  scenes: Scene[]
  storyboardId: string
  storyboardStyle?: string
}

interface SceneCardProps {
  scene: Scene
  index: number
  onEdit?: (scene: Scene) => void
  onDelete?: (sceneId: string) => void
}

function SceneCard({ scene, index, onEdit, onDelete }: SceneCardProps) {
  const hasImage = !!scene.reference_image_url
  const hasVideo = !!scene.reference_video_url
  const [displayMediaType, setDisplayMediaType] = useState<"image" | "video">(
    hasImage ? "image" : "video",
  )
  const [copied, setCopied] = useState(false)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const imageUpload = useImageUpload({
    onUploadSuccess: async (url) => {
      await updateSceneImage(scene.id || "", url)
      setShowUploadMenu(false)
    },
  })

  const videoUpload = useVideoUpload({
    onUploadSuccess: async (url) => {
      await updateSceneVideo(scene.id || "", url)
      setShowUploadMenu(false)
    },
  })

  const handleCopy = async () => {
    if (scene.visual_prompt) {
      await navigator.clipboard.writeText(scene.visual_prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updateSceneImage = async (sceneId: string, imageUrl: string) => {
    setIsUploading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ reference_image_url: imageUrl }),
      })
      if (!response.ok) throw new Error("Failed to update scene")
      window.location.reload()
    } catch {
      alert("Failed to update scene")
    } finally {
      setIsUploading(false)
    }
  }

  const updateSceneVideo = async (sceneId: string, videoUrl: string) => {
    setIsUploading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${sceneId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ reference_video_url: videoUrl }),
      })
      if (!response.ok) throw new Error("Failed to update scene")
      window.location.reload()
    } catch {
      alert("Failed to update scene")
    } finally {
      setIsUploading(false)
    }
  }

  const showImage = displayMediaType === "image" && hasImage
  const showVideo = displayMediaType === "video" && hasVideo

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-muted/50">
      <div className="aspect-video relative bg-gradient-to-br from-muted/30 to-muted/60">
        {showImage ? (
          <img
            src={scene.reference_image_url || undefined}
            alt={scene.title || `Scene ${scene.sequence_number}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : showVideo ? (
          <video
            src={scene.reference_video_url || undefined}
            className="h-full w-full object-cover"
            muted
            controls
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border shadow-sm"
        >
          #{index + 1}
        </Badge>

        {scene.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-3">
            <p className="text-sm font-medium line-clamp-1">{scene.title}</p>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-3">
        {scene.visual_prompt && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prompt
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all"
                onClick={handleCopy}
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {scene.visual_prompt}
            </p>
          </div>
        )}

        <div className="flex gap-1.5 pt-1">
          {hasImage && (
            <Button
              size="sm"
              variant={displayMediaType === "image" ? "default" : "outline"}
              className="h-7 flex-1 gap-1.5 transition-all"
              onClick={() => setDisplayMediaType("image")}
              title="Show Image"
            >
              <ImageIcon className="h-3 w-3" />
              <span className="text-xs">Image</span>
            </Button>
          )}
          {hasVideo && (
            <Button
              size="sm"
              variant={displayMediaType === "video" ? "default" : "outline"}
              className="h-7 flex-1 gap-1.5 transition-all"
              onClick={() => setDisplayMediaType("video")}
              title="Show Video"
            >
              <Video className="h-3 w-3" />
              <span className="text-xs">Video</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 transition-all"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            title="Upload Media"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            <span className="text-xs">Upload</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-muted transition-colors"
            onClick={() => onEdit?.(scene)}
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => onDelete?.(scene.id || "")}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {showUploadMenu && (
          <div className="space-y-2 pt-2 border-t border-muted/50">
            <div className="flex gap-2">
              <input
                ref={imageUpload.fileInputRef}
                type="file"
                accept="image/*"
                onChange={imageUpload.handleFileChange}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 gap-1.5"
                onClick={imageUpload.triggerFileInput}
                disabled={!!imageUpload.file}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-xs">Choose Image</span>
              </Button>
              {imageUpload.file && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3"
                    onClick={imageUpload.handleUploadToServer}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={imageUpload.reset}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={videoUpload.fileInputRef}
                type="file"
                accept="video/*"
                onChange={videoUpload.handleFileChange}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 gap-1.5"
                onClick={videoUpload.triggerFileInput}
                disabled={!!videoUpload.file}
              >
                <Video className="h-3.5 w-3.5" />
                <span className="text-xs">Choose Video</span>
              </Button>
              {videoUpload.file && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3"
                    onClick={videoUpload.handleUploadToServer}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={videoUpload.reset}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {imageUpload.preview && (
              <div className="aspect-video overflow-hidden rounded-md bg-muted">
                <img
                  src={imageUpload.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {videoUpload.preview && (
              <div className="aspect-video overflow-hidden rounded-md bg-muted">
                <video
                  src={videoUpload.preview}
                  controls
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SceneGrid({
  scenes,
  storyboardId,
  storyboardStyle = "cinematic",
}: SceneGridProps) {
  const [editScene, setEditScene] = useState<Scene | null>(null)
  const [insertAfter, setInsertAfter] = useState<number | null>(null)

  const handleDelete = async (sceneId: string) => {
    if (!confirm("Are you sure you want to delete this scene?")) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${sceneId}`, {
        method: "DELETE",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })
      if (!response.ok) throw new Error("Failed to delete scene")
      window.location.reload()
    } catch {
      alert("Failed to delete scene")
    }
  }

  const scenesWithImage = scenes.filter((s) => s.reference_image_url).length
  const scenesWithVideo = scenes.filter((s) => s.reference_video_url).length

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Scenes ({scenes.length})</h3>
            <p className="text-sm text-muted-foreground">
              {scenesWithImage} images • {scenesWithVideo} videos
            </p>
          </div>
        </div>

        {scenes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scenes.map((scene, index) => (
              <React.Fragment key={scene.id}>
                <div className="relative">
                  <SceneCard
                    scene={scene}
                    index={index}
                    onEdit={setEditScene}
                    onDelete={handleDelete}
                  />
                  {index < scenes.length - 1 && (
                    <button
                      onClick={() =>
                        setInsertAfter(scene.sequence_number ?? index + 1)
                      }
                      className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-muted-foreground/30 bg-background hover:border-primary hover:bg-primary/10 transition-colors group"
                      title="Add scene here"
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No scenes yet</p>
              <p className="text-sm text-muted-foreground/70">
                Analyze your story to create scenes
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={() => setInsertAfter(scenes.length)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary border border-dashed rounded-md hover:border-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {editScene && (
        <EditSceneDialog
          scene={editScene}
          open={!!editScene}
          onOpenChange={(open) => !open && setEditScene(null)}
          storyboardStyle={storyboardStyle}
        />
      )}

      <CreateSceneDialog
        storyboardId={storyboardId}
        open={insertAfter !== null}
        onOpenChange={(open) => !open && setInsertAfter(null)}
        insertAfterSequence={insertAfter ?? undefined}
      />
    </>
  )
}
