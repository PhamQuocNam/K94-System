import { Loader2, Upload } from "lucide-react"
import { useState } from "react"

import type { Setting } from "@/client/types.gen"
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

interface EditSettingDialogProps {
  setting: Setting
  open: boolean
  onOpenChange: (open: boolean) => void
  storyboardStyle?: string
}

interface SettingFormData {
  name: string
  description: string
  time_of_day: string
  weather: string
  art_style: string
  reference_image_url: string
}

export function EditSettingDialog({
  setting,
  open,
  onOpenChange,
  storyboardStyle = "cinematic",
}: EditSettingDialogProps) {
  const [formData, setFormData] = useState<SettingFormData>({
    name: setting.name || "",
    description: setting.description || "",
    time_of_day: setting.time_of_day || "",
    weather: setting.weather || "",
    art_style: setting.art_style || "",
    reference_image_url: setting.reference_image_url || "",
  })

  const updateMutation = useEntityMutation({
    mutationFn: async (data: SettingFormData) => {
      const payload: Record<string, unknown> = {}

      if (data.name) payload.name = data.name
      if (data.description) payload.description = data.description
      if (data.time_of_day) payload.time_of_day = data.time_of_day
      if (data.weather) payload.weather = data.weather
      if (data.art_style) payload.art_style = data.art_style
      if (data.reference_image_url)
        payload.reference_image_url = data.reference_image_url

      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/settings/${setting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update setting")
      }

      return response.json()
    },
    successMessage: "Setting updated successfully",
    errorMessage: "Failed to update setting",
    invalidateQueries: [["storyboard-settings", setting.storyboard_id]],
    onSuccess: () => onOpenChange(false),
  })

  const regenerateMutation = useEntityMutation({
    mutationFn: async (style: string) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/settings/${setting.id}/regenerate-image?style=${style}`,
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
    invalidateQueries: [["storyboard-settings", setting.storyboard_id]],
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
          <DialogTitle>Edit Setting</DialogTitle>
          <DialogDescription>
            Update setting details and reference image
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="time_of_day">Time of Day</Label>
                <Input
                  id="time_of_day"
                  value={formData.time_of_day}
                  onChange={(e) =>
                    setFormData({ ...formData, time_of_day: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weather">Weather</Label>
                <Input
                  id="weather"
                  value={formData.weather}
                  onChange={(e) =>
                    setFormData({ ...formData, weather: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="art_style">Art Style</Label>
              <Input
                id="art_style"
                value={formData.art_style}
                onChange={(e) =>
                  setFormData({ ...formData, art_style: e.target.value })
                }
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
