import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

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
import { useToast } from "@/hooks/useToast"

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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SettingFormData>({
    name: setting.name || "",
    description: setting.description || "",
    time_of_day: setting.time_of_day || "",
    weather: setting.weather || "",
    art_style: setting.art_style || "",
    reference_image_url: setting.reference_image_url || "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const updateMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-settings", setting.storyboard_id],
      })
      toast({ title: "Setting updated successfully" })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update setting",
        description: error.message,
      })
    },
  })

  const regenerateMutation = useMutation({
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
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        reference_image_url: data.image_url || "",
      }))
      setImagePreview(data.image_url || null)
      queryClient.invalidateQueries({
        queryKey: ["storyboard-settings", setting.storyboard_id],
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
