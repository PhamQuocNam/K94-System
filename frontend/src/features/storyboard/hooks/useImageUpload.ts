import { useRef, useState } from "react"
import { useToast } from "@/hooks/useToast"

interface UseImageUploadOptions {
  onUploadSuccess?: (url: string) => void
}

interface ImageUploadState {
  file: File | null
  preview: string | null
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
  })

  const setFile = (file: File | null) => {
    setState((prev) => ({ ...prev, file }))
  }

  const setPreview = (preview: string | null) => {
    setState((prev) => ({ ...prev, preview }))
  }

  const handleImageUpload = (file: File) => {
    setFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleUploadToServer = async () => {
    if (!state.file) return

    try {
      const formData = new FormData()
      formData.append("file", state.file)

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
      const url = data.url || ""
      setPreview(null)
      setFile(null)

      if (options.onUploadSuccess) {
        options.onUploadSuccess(url)
      }

      toast({ title: "Image uploaded successfully" })
      return url
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to upload image",
        description: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const reset = () => {
    setState({ file: null, preview: null })
  }

  return {
    file: state.file,
    preview: state.preview,
    fileInputRef,
    handleFileChange,
    handleUploadToServer,
    triggerFileInput,
    reset,
  }
}
