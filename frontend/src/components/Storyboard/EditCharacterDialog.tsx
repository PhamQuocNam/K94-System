import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

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
import { useToast } from "@/hooks/useToast"

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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const updateMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["storyboard-characters", character.storyboard_id],
      })
      toast({ title: "Character updated successfully" })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update character",
        description: error.message,
      })
    },
  })

  const regenerateMutation = useMutation({
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
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        reference_image_url: data.image_url || "",
      }))
      setImagePreview(data.image_url || null)
      queryClient.invalidateQueries({
        queryKey: ["storyboard-characters", character.storyboard_id],
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
                {(imagePreview || formData.reference_image_url) && (
                  <div className="aspect-[3/4] w-48 overflow-hidden rounded-md bg-muted">
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
