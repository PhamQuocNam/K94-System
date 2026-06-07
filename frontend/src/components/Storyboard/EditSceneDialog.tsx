import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

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
import { useToast } from "@/hooks/useToast"

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
  mood: string
  scene_type: string
  reference_image_url: string
}

export function EditSceneDialog({
  scene,
  open,
  onOpenChange,
  storyboardStyle = "cinematic",
}: EditSceneDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SceneFormData>({
    title: scene.title || "",
    narrative_description: scene.narrative_description || "",
    visual_description: scene.visual_description || "",
    mood: scene.mood || "",
    scene_type: scene.scene_type || "",
    reference_image_url: scene.reference_image_url || "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (data: SceneFormData) => {
      const payload: Record<string, unknown> = {}

      if (data.title) payload.title = data.title
      if (data.narrative_description)
        payload.narrative_description = data.narrative_description
      if (data.visual_description)
        payload.visual_description = data.visual_description
      if (data.mood) payload.mood = data.mood
      if (data.scene_type) payload.scene_type = data.scene_type
      if (data.reference_image_url)
        payload.reference_image_url = data.reference_image_url

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes", scene.storyboard_id],
      })
      toast({ title: "Scene updated successfully" })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update scene",
        description: error.message,
      })
    },
  })

  const regenerateMutation = useMutation({
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
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        reference_image_url: data.image_url || "",
      }))
      setImagePreview(data.image_url || null)
      queryClient.invalidateQueries({
        queryKey: ["storyboard-scenes", scene.storyboard_id],
      })
      toast({ title: "Image regenerated successfully" })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to regenerate image",
        description: error.message,
      })
    },
  })

  const handleImageUpload = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleUploadToUrl = async () => {
    if (!imageFile) return

    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const token = localStorage.getItem("access_token")
      const response = await fetch("/api/v1/utils/upload-image/", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        reference_image_url: data.url || "",
      }))
      toast({ title: "Image uploaded successfully" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to upload image",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scene_type">Scene Type</Label>
                <Input
                  id="scene_type"
                  value={formData.scene_type}
                  onChange={(e) =>
                    setFormData({ ...formData, scene_type: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mood">Mood</Label>
                <Input
                  id="mood"
                  value={formData.mood}
                  onChange={(e) =>
                    setFormData({ ...formData, mood: e.target.value })
                  }
                />
              </div>
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
                {(imagePreview || formData.reference_image_url) && (
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    <img
                      src={imagePreview || formData.reference_image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  {imageFile && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleUploadToUrl}
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
