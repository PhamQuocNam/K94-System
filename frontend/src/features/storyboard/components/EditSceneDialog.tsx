import { Film, Loader2, Upload } from "lucide-react"
import { useState } from "react"

import type { Scene } from "@/client/types.gen"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { useEntityMutation } from "../hooks/useEntityMutation"
import { useImageUpload } from "../hooks/useImageUpload"
import { useVideoUpload } from "../hooks/useVideoUpload"

interface EditSceneDialogProps {
  scene: Scene
  open: boolean
  onOpenChange: (open: boolean) => void
  storyboardStyle?: string
}

interface SceneFormData {
  title: string
  narrative_description: string
  visual_description: string
  reference_image_url: string
  reference_video_url: string
}

export function EditSceneDialog({
  scene,
  open,
  onOpenChange,
  storyboardStyle = "cinematic",
}: EditSceneDialogProps) {
  const [formData, setFormData] = useState<SceneFormData>({
    title: scene.title || "",
    narrative_description: scene.narrative_description || "",
    visual_description: scene.visual_description || "",
    reference_image_url: scene.reference_image_url || "",
    reference_video_url: scene.reference_video_url || "",
  })

  const updateMutation = useEntityMutation({
    mutationFn: async (data: SceneFormData) => {
      const payload: Record<string, unknown> = {}

      if (data.title) payload.title = data.title
      if (data.narrative_description)
        payload.narrative_description = data.narrative_description
      if (data.visual_description)
        payload.visual_description = data.visual_description
      if (data.reference_image_url)
        payload.reference_image_url = data.reference_image_url
      if (data.reference_video_url)
        payload.reference_video_url = data.reference_video_url

      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${scene.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update scene")
      }

      return response.json()
    },
    successMessage: "Scene updated successfully",
    errorMessage: "Failed to update scene",
    invalidateQueries: [["storyboard-scenes", scene.storyboard_id]],
    onSuccess: () => onOpenChange(false),
  })

  const regenerateMutation = useEntityMutation({
    mutationFn: async (style: string) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/scenes/${scene.id}/regenerate-image?style=${style}`,
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to regenerate image")
      }

      return response.json()
    },
    successMessage: "Image regenerated successfully",
    errorMessage: "Failed to regenerate image",
    invalidateQueries: [["storyboard-scenes", scene.storyboard_id]],
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        reference_image_url: data.image_url || "",
      }))
    },
  })

  const imageUpload = useImageUpload({
    onUploadSuccess: (url) => {
      setFormData((prev) => ({ ...prev, reference_image_url: url }))
    },
  })

  const videoUpload = useVideoUpload({
    onUploadSuccess: (url) => {
      setFormData((prev) => ({ ...prev, reference_video_url: url }))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleRegenerate = () => {
    regenerateMutation.mutate(storyboardStyle)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Scene</DialogTitle>
          <DialogDescription>
            Update scene details and reference image
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="narrative_description">
                Narrative Description
              </Label>
              <Textarea
                id="narrative_description"
                value={formData.narrative_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    narrative_description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visual_description">Visual Description</Label>
              <Textarea
                id="visual_description"
                value={formData.visual_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visual_description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Reference Image</Label>
              <div className="space-y-3">
                {(imageUpload.preview || formData.reference_image_url) && (
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    <img
                      src={imageUpload.preview || formData.reference_image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={imageUpload.fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={imageUpload.handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={imageUpload.triggerFileInput}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  {imageUpload.file && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={imageUpload.handleUploadToServer}
                    >
                      Upload to Server
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerateMutation.isPending}
                  >
                    {regenerateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Regenerate with AI
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Reference Video</Label>
              <div className="space-y-3">
                {(videoUpload.preview || formData.reference_video_url) && (
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    <video
                      src={videoUpload.preview || formData.reference_video_url}
                      controls
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={videoUpload.fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={videoUpload.handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={videoUpload.triggerFileInput}
                  >
                    <Film className="mr-2 h-4 w-4" />
                    Choose Video
                  </Button>
                  {videoUpload.file && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={videoUpload.handleUploadToServer}
                    >
                      Upload to Server
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
