import {
  Check,
  Copy,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import React, { useState } from "react"
import type { Scene } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const [_isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      alert("Please drop an image or video file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = localStorage.getItem("access_token")
      const uploadEndpoint = isVideo ? "/api/v1/utils/upload-video/" : "/api/v1/utils/upload-image/"
      const uploadResponse = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error("Upload failed")

      const uploadData = await uploadResponse.json()
      const url = uploadData.url

      if (isImage) {
        await updateSceneImage(scene.id || "", url)
      } else {
        await updateSceneVideo(scene.id || "", url)
      }
    } catch {
      alert("Failed to upload file")
      setIsUploading(false)
    }
  }

  const showImage = displayMediaType === "image" && hasImage
  const showVideo = displayMediaType === "video" && hasVideo

  return (
    <Card 
      className={`group overflow-hidden hover:shadow-lg transition-all duration-200 border-muted/50 h-full flex flex-col ${isDragging ? "border-primary border-2 bg-primary/5" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="aspect-[4/3] relative bg-gradient-to-br from-muted/30 to-muted/60 flex-shrink-0 w-full overflow-hidden">
        {showImage ? (
          <img
            src={scene.reference_image_url || undefined}
            alt={scene.title || `Scene ${scene.sequence_number}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 absolute inset-0"
          />
        ) : showVideo ? (
          <video
            src={scene.reference_video_url || undefined}
            className="h-full w-full object-cover absolute inset-0"
            muted
            controls
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-2 text-primary animate-bounce" />
              <p className="text-sm font-medium">Drop to upload</p>
            </div>
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

      <CardContent className="p-3 space-y-3 flex-1 flex flex-col min-h-0">
        {scene.visual_prompt && (
          <div className="space-y-1.5 flex-shrink-0">
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

        <div className="flex flex-wrap gap-1.5 pt-1 flex-shrink-0 mt-auto">
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
                        setInsertAfter(index + 1)
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
