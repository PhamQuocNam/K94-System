import { Loader2, Upload } from "lucide-react"
import { useState } from "react"

import type { Character } from "@/client/types.gen"
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

interface EditCharacterDialogProps {
  character: Character
  open: boolean
  onOpenChange: (open: boolean) => void
  storyboardStyle?: string
}

interface CharacterFormData {
  name: string
  gender: string
  age: string
  body_build: string
  face: string
  hair: string
  clothes: string
  nationality: string
  reference_image_url: string
}

export function EditCharacterDialog({
  character,
  open,
  onOpenChange,
  storyboardStyle = "cinematic",
}: EditCharacterDialogProps) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: character.name || "",
    gender: character.gender || "",
    age: character.age?.toString() || "",
    body_build: character.body_build || "",
    face: character.face || "",
    hair: character.hair || "",
    clothes: character.clothes || "",
    nationality: character.nationality || "",
    reference_image_url: character.reference_image_url || "",
  })

  const updateMutation = useEntityMutation({
    mutationFn: async (data: CharacterFormData) => {
      const payload: Record<string, unknown> = {}

      if (data.name) payload.name = data.name
      if (data.gender) payload.gender = data.gender
      if (data.age) payload.age = parseInt(data.age)
      if (data.body_build) payload.body_build = data.body_build
      if (data.face) payload.face = data.face
      if (data.hair) payload.hair = data.hair
      if (data.clothes) payload.clothes = data.clothes
      if (data.nationality) payload.nationality = data.nationality
      if (data.reference_image_url)
        payload.reference_image_url = data.reference_image_url

      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/characters/${character.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update character")
      }

      return response.json()
    },
    successMessage: "Character updated successfully",
    errorMessage: "Failed to update character",
    invalidateQueries: [["storyboard-characters", character.storyboard_id]],
    onSuccess: () => onOpenChange(false),
  })

  const regenerateMutation = useEntityMutation({
    mutationFn: async (style: string) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `/api/v1/characters/${character.id}/regenerate-image?style=${style}`,
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
    invalidateQueries: [["storyboard-characters", character.storyboard_id]],
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
          <DialogTitle>Edit Character</DialogTitle>
          <DialogDescription>
            Update character details and reference image
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body_build">Body Build</Label>
              <Textarea
                id="body_build"
                value={formData.body_build}
                onChange={(e) =>
                  setFormData({ ...formData, body_build: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="face">Face</Label>
              <Textarea
                id="face"
                value={formData.face}
                onChange={(e) =>
                  setFormData({ ...formData, face: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hair">Hair</Label>
              <Textarea
                id="hair"
                value={formData.hair}
                onChange={(e) =>
                  setFormData({ ...formData, hair: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clothes">Clothes</Label>
              <Textarea
                id="clothes"
                value={formData.clothes}
                onChange={(e) =>
                  setFormData({ ...formData, clothes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Reference Image</Label>
              <div className="space-y-3">
                {(imageUpload.preview || formData.reference_image_url) && (
                  <div className="aspect-[3/4] w-48 overflow-hidden rounded-md bg-muted">
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
